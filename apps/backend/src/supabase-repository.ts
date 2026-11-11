import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  AnalyticsBatchRequest,
  CanonicalWorldStateDTO,
  RewardClaimRequest,
  SyncBatchResponse,
  WorldId
} from '@reality-corp/shared-types';
import type {
  AnomalyLogEntry,
  BackendRepository,
  FocusCompleteResult,
  FocusSessionRecord,
  LeaderboardEntryRecord,
  PlayerProfileRecord
} from './repository.js';
import {
  mapAnomalyRow,
  mapLeaderboardRow,
  mapProfileRow,
  mapWorldStateRow
} from './supabase-mappers.js';

export function createServiceSupabaseClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/** Supabase service-role repository backed by PostgreSQL + SQL RPC atomic locks. */
export class SupabaseBackendRepository implements BackendRepository {
  public constructor(private readonly db: SupabaseClient) {}

  public async getProfile(userId: string): Promise<PlayerProfileRecord | null> {
    const { data, error } = await this.db
      .from('player_profiles')
      .select('user_id, username, active_world_id, role, sound_enabled, haptics_enabled, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return mapProfileRow(data as Record<string, unknown>);
  }

  public async getOrCreateProfile(userId: string): Promise<PlayerProfileRecord> {
    const existing = await this.getProfile(userId);
    if (existing) return existing;

    const fallbackName = `founder_${userId.slice(0, 8)}`;
    const { data, error } = await this.db
      .from('player_profiles')
      .insert({ user_id: userId, username: fallbackName })
      .select('user_id, username, active_world_id, role, sound_enabled, haptics_enabled, created_at, updated_at')
      .single();
    if (error || !data) {
      throw new Error(`Failed to provision player profile: ${error?.message ?? 'unknown'}`);
    }
    return mapProfileRow(data as Record<string, unknown>);
  }

  public async updateProfile(
    userId: string,
    patch: Partial<Pick<PlayerProfileRecord, 'username' | 'activeWorldId' | 'role'>>
  ): Promise<PlayerProfileRecord> {
    const updateRow: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.username !== undefined) updateRow['username'] = patch.username;
    if (patch.activeWorldId !== undefined) updateRow['active_world_id'] = patch.activeWorldId;
    if (patch.role !== undefined) updateRow['role'] = patch.role;

    const { error } = await this.db.from('player_profiles').update(updateRow).eq('user_id', userId);
    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    return this.getOrCreateProfile(userId);
  }

  public async deleteProfileAndAllData(userId: string): Promise<boolean> {
    const { error } = await this.db.auth.admin.deleteUser(userId);
    return !error;
  }

  public async getWorldState(
    userId: string,
    worldId: WorldId
  ): Promise<CanonicalWorldStateDTO | null> {
    const { data, error } = await this.db
      .from('player_world_states')
      .select('*')
      .eq('user_id', userId)
      .eq('world_id', worldId)
      .maybeSingle();
    if (error || !data) return null;
    return mapWorldStateRow(data as Record<string, unknown>);
  }

  public async saveWorldState(userId: string, state: CanonicalWorldStateDTO): Promise<void> {
    const { error } = await this.db.from('player_world_states').upsert(
      {
        user_id: userId,
        world_id: state.worldId,
        state_version: state.stateVersion,
        last_synced_seq: state.lastSyncedSeq,
        cash: state.cash,
        compute: state.compute,
        data_shards: state.data,
        lifetime_earnings: state.lifetimeEarnings,
        prestige_count: state.prestigeCount,
        equity_shares: state.equityShares,
        buildings: state.buildings,
        unlocked_research: state.unlockedResearch,
        hired_managers: state.hiredManagers,
        claimed_rewards: state.claimedRewards,
        trust_status: state.trustStatus,
        last_server_tick_at: new Date(state.lastServerTickAtMs).toISOString(),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,world_id' }
    );
    if (error) throw new Error(`saveWorldState failed: ${error.message}`);
  }

  public async getCachedSyncResponse(
    userId: string,
    idempotencyKey: string
  ): Promise<SyncBatchResponse | null> {
    const { data } = await this.db
      .from('economy_transactions')
      .select('payload')
      .eq('user_id', userId)
      .eq('idempotency_key', idempotencyKey)
      .eq('tx_type', 'SYNC_BATCH_RESPONSE')
      .maybeSingle();
    return data?.payload ? (data.payload as SyncBatchResponse) : null;
  }

  public async saveCachedSyncResponse(
    userId: string,
    idempotencyKey: string,
    response: SyncBatchResponse
  ): Promise<void> {
    await this.db.from('economy_transactions').upsert(
      {
        user_id: userId,
        world_id: response.canonicalState.worldId,
        idempotency_key: idempotencyKey,
        tx_type: 'SYNC_BATCH_RESPONSE',
        seq: response.canonicalState.lastSyncedSeq,
        payload: response
      },
      { onConflict: 'user_id,idempotency_key', ignoreDuplicates: true }
    );
  }

  public async tryClaimReward(
    userId: string,
    worldId: WorldId,
    claimType: RewardClaimRequest['claimType'],
    rewardId: string,
    claimKey: string
  ): Promise<boolean> {
    const { error } = await this.db.from('reward_claims').insert({
      user_id: userId,
      world_id: worldId,
      claim_type: claimType,
      reward_id: rewardId,
      claim_key: claimKey
    });
    return !error;
  }

  public async createFocusSession(
    userId: string,
    worldId: WorldId,
    targetDurationSec: number,
    nowMs: number
  ): Promise<FocusSessionRecord> {
    const { data, error } = await this.db
      .from('focus_sessions')
      .insert({
        user_id: userId,
        world_id: worldId,
        status: 'active',
        target_duration_sec: targetDurationSec,
        started_at: new Date(nowMs).toISOString()
      })
      .select('id, user_id, world_id, status, target_duration_sec, started_at, completed_at')
      .single();
    if (error || !data) throw new Error(`createFocusSession failed: ${error?.message ?? 'unknown'}`);
    return {
      id: data.id as string,
      userId: data.user_id as string,
      worldId: data.world_id as WorldId,
      status: 'active',
      targetDurationSec: Number(data.target_duration_sec),
      startedAtMs: Date.parse(data.started_at as string),
      completedAtMs: null
    };
  }

  public async completeFocusSessionAtomic(
    userId: string,
    sessionId: string,
    nowMs: number
  ): Promise<FocusCompleteResult> {
    const { data, error } = await this.db.rpc('complete_focus_session', {
      p_session_id: sessionId,
      p_user_id: userId
    });
    if (error) {
      return { kind: 'not_found' };
    }
    const rows = Array.isArray(data) ? data : [];
    const first = rows[0] as { completed_id: string; world_id: WorldId; target_duration_sec: number } | undefined;
    if (!first) {
      return { kind: 'already_completed' };
    }
    return {
      kind: 'completed',
      session: {
        id: first.completed_id,
        userId,
        worldId: first.world_id,
        status: 'completed',
        targetDurationSec: first.target_duration_sec,
        startedAtMs: nowMs - first.target_duration_sec * 1000,
        completedAtMs: nowMs
      }
    };
  }

  public async updateLeaderboard(entry: LeaderboardEntryRecord): Promise<void> {
    await this.db.from('leaderboard_entries').upsert(
      {
        user_id: entry.userId,
        world_id: entry.worldId,
        username: entry.username,
        score_log10: entry.scoreLog10,
        equity_shares: entry.equityShares,
        is_verified: entry.isVerified,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,world_id' }
    );
  }

  public async listLeaderboard(
    worldId: WorldId,
    limit: number
  ): Promise<readonly LeaderboardEntryRecord[]> {
    const { data } = await this.db
      .from('leaderboard_entries')
      .select('user_id, world_id, username, score_log10, equity_shares, is_verified')
      .eq('world_id', worldId)
      .eq('is_verified', true)
      .order('score_log10', { ascending: false })
      .limit(Math.max(1, Math.min(100, Math.trunc(limit))));
    return (data ?? []).map((row) => mapLeaderboardRow(row as Record<string, unknown>));
  }

  public async insertAnalyticsBatch(events: AnalyticsBatchRequest['events']): Promise<number> {
    const rows = events.map((ev) => ({
      anon_session_id: ev.anonSessionId,
      world_id: ev.worldId,
      event_name: ev.eventName,
      props: ev.props,
      created_at: new Date(ev.clientTimestampMs).toISOString()
    }));
    const { error } = await this.db.from('analytics_events').insert(rows);
    if (error) throw new Error(`insertAnalyticsBatch failed: ${error.message}`);
    return rows.length;
  }

  public async recordAnomaly(entry: Omit<AnomalyLogEntry, 'id' | 'createdAtMs'>): Promise<void> {
    await this.db.from('audit_anomaly_logs').insert({
      user_id: entry.userId,
      world_id: entry.worldId,
      anomaly_type: entry.anomalyType,
      severity: entry.severity,
      details: entry.details
    });
  }

  public async listRecentAnomalies(limit: number): Promise<readonly AnomalyLogEntry[]> {
    const { data } = await this.db
      .from('audit_anomaly_logs')
      .select('id, user_id, world_id, anomaly_type, severity, details, created_at')
      .order('id', { ascending: false })
      .limit(Math.max(1, Math.min(200, Math.trunc(limit))));
    return (data ?? []).map((row) => mapAnomalyRow(row as Record<string, unknown>));
  }
}

