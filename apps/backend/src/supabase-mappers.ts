import type { BigValDTO, CanonicalWorldStateDTO, WorldId } from '@reality-corp/shared-types';
import type {
  AnomalyLogEntry,
  LeaderboardEntryRecord,
  PlayerProfileRecord
} from './repository.js';

export function mapProfileRow(data: Record<string, unknown>): PlayerProfileRecord {
  return {
    userId: data['user_id'] as string,
    username: data['username'] as string,
    activeWorldId: data['active_world_id'] as WorldId,
    role: data['role'] as PlayerProfileRecord['role'],
    soundEnabled: Boolean(data['sound_enabled']),
    hapticsEnabled: Boolean(data['haptics_enabled']),
    createdAtMs: Date.parse(data['created_at'] as string),
    updatedAtMs: Date.parse(data['updated_at'] as string)
  };
}

export function mapWorldStateRow(data: Record<string, unknown>): CanonicalWorldStateDTO {
  return {
    worldId: data['world_id'] as WorldId,
    stateVersion: Number(data['state_version']),
    lastSyncedSeq: Number(data['last_synced_seq']),
    cash: data['cash'] as BigValDTO,
    compute: data['compute'] as BigValDTO,
    data: data['data_shards'] as BigValDTO,
    lifetimeEarnings: data['lifetime_earnings'] as BigValDTO,
    prestigeCount: Number(data['prestige_count']),
    equityShares: data['equity_shares'] as BigValDTO,
    buildings: data['buildings'] as Record<string, number>,
    unlockedResearch: data['unlocked_research'] as string[],
    hiredManagers: data['hired_managers'] as string[],
    claimedRewards: data['claimed_rewards'] as string[],
    lastServerTickAtMs: Date.parse(data['last_server_tick_at'] as string),
    trustStatus: data['trust_status'] as CanonicalWorldStateDTO['trustStatus']
  };
}

export function mapLeaderboardRow(row: Record<string, unknown>): LeaderboardEntryRecord {
  return {
    userId: row['user_id'] as string,
    worldId: row['world_id'] as WorldId,
    username: row['username'] as string,
    scoreLog10: Number(row['score_log10']),
    equityShares: row['equity_shares'] as BigValDTO,
    isVerified: Boolean(row['is_verified'])
  };
}

export function mapAnomalyRow(row: Record<string, unknown>): AnomalyLogEntry {
  return {
    id: Number(row['id']),
    userId: (row['user_id'] as string | null) ?? null,
    worldId: row['world_id'] as WorldId,
    anomalyType: row['anomaly_type'] as string,
    severity: row['severity'] as AnomalyLogEntry['severity'],
    details: (row['details'] as Record<string, unknown>) ?? {},
    createdAtMs: Date.parse(row['created_at'] as string)
  };
}

