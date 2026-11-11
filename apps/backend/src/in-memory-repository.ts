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

const FOCUS_CLOCK_GRACE_MS = 5_000;

/**
 * Deterministic in-memory repository implementing atomic locks, idempotency caches,
 * reward deduplication, and zero-leak GDPR deletion for tests and local runs.
 */
export class InMemoryBackendRepository implements BackendRepository {
  private readonly profiles = new Map<string, PlayerProfileRecord>();
  private readonly worldStates = new Map<string, CanonicalWorldStateDTO>();
  private readonly idempotencyCache = new Map<string, SyncBatchResponse>();
  private readonly claimedRewards = new Set<string>();
  private readonly focusSessions = new Map<string, FocusSessionRecord>();
  private readonly leaderboard = new Map<string, LeaderboardEntryRecord>();
  public readonly analyticsEvents: AnalyticsBatchRequest['events'][number][] = [];
  private readonly anomalies: AnomalyLogEntry[] = [];
  private nextAnomalyId = 1;

  private worldKey(userId: string, worldId: WorldId): string {
    return `${userId}:${worldId}`;
  }

  public async getProfile(userId: string): Promise<PlayerProfileRecord | null> {
    const row = this.profiles.get(userId);
    return row ? { ...row } : null;
  }

  public async getOrCreateProfile(userId: string): Promise<PlayerProfileRecord> {
    const existing = this.profiles.get(userId);
    if (existing) {
      return { ...existing };
    }
    const now = Date.now();
    const created: PlayerProfileRecord = {
      userId,
      username: `founder_${userId.slice(0, 8)}`,
      activeWorldId: 'apex-syndicate',
      role: 'player',
      soundEnabled: true,
      hapticsEnabled: true,
      createdAtMs: now,
      updatedAtMs: now
    };
    this.profiles.set(userId, created);
    return { ...created };
  }

  public async updateProfile(
    userId: string,
    patch: Partial<Pick<PlayerProfileRecord, 'username' | 'activeWorldId' | 'role'>>
  ): Promise<PlayerProfileRecord> {
    const current = await this.getOrCreateProfile(userId);
    const updated: PlayerProfileRecord = {
      ...current,
      ...(patch.username !== undefined ? { username: patch.username } : {}),
      ...(patch.activeWorldId !== undefined ? { activeWorldId: patch.activeWorldId } : {}),
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      updatedAtMs: Date.now()
    };
    this.profiles.set(userId, updated);
    return { ...updated };
  }

  public async deleteProfileAndAllData(userId: string): Promise<boolean> {
    const existed = this.profiles.delete(userId);
    for (const key of this.worldStates.keys()) {
      if (key.startsWith(`${userId}:`)) this.worldStates.delete(key);
    }
    for (const key of this.idempotencyCache.keys()) {
      if (key.startsWith(`${userId}:`)) this.idempotencyCache.delete(key);
    }
    for (const key of this.claimedRewards.keys()) {
      if (key.startsWith(`${userId}:`)) this.claimedRewards.delete(key);
    }
    for (const [id, session] of this.focusSessions.entries()) {
      if (session.userId === userId) this.focusSessions.delete(id);
    }
    for (const key of this.leaderboard.keys()) {
      if (key.startsWith(`${userId}:`)) this.leaderboard.delete(key);
    }
    return existed;
  }

  public async getWorldState(
    userId: string,
    worldId: WorldId
  ): Promise<CanonicalWorldStateDTO | null> {
    const state = this.worldStates.get(this.worldKey(userId, worldId));
    return state ? structuredClone(state) : null;
  }

  public async saveWorldState(userId: string, state: CanonicalWorldStateDTO): Promise<void> {
    this.worldStates.set(this.worldKey(userId, state.worldId), structuredClone(state));
  }

  public async getCachedSyncResponse(
    userId: string,
    idempotencyKey: string
  ): Promise<SyncBatchResponse | null> {
    const hit = this.idempotencyCache.get(`${userId}:${idempotencyKey}`);
    return hit ? structuredClone(hit) : null;
  }

  public async saveCachedSyncResponse(
    userId: string,
    idempotencyKey: string,
    response: SyncBatchResponse
  ): Promise<void> {
    this.idempotencyCache.set(`${userId}:${idempotencyKey}`, structuredClone(response));
  }

  public async tryClaimReward(
    userId: string,
    _worldId: WorldId,
    _claimType: RewardClaimRequest['claimType'],
    _rewardId: string,
    claimKey: string
  ): Promise<boolean> {
    const scopedKey = `${userId}:${claimKey}`;
    if (this.claimedRewards.has(scopedKey)) {
      return false;
    }
    this.claimedRewards.add(scopedKey);
    return true;
  }

  public async createFocusSession(
    userId: string,
    worldId: WorldId,
    targetDurationSec: number,
    nowMs: number
  ): Promise<FocusSessionRecord> {
    const record: FocusSessionRecord = {
      id: crypto.randomUUID(),
      userId,
      worldId,
      status: 'active',
      targetDurationSec,
      startedAtMs: nowMs,
      completedAtMs: null
    };
    this.focusSessions.set(record.id, record);
    return { ...record };
  }

  public async completeFocusSessionAtomic(
    userId: string,
    sessionId: string,
    nowMs: number
  ): Promise<FocusCompleteResult> {
    const session = this.focusSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return { kind: 'not_found' };
    }
    if (session.status !== 'active') {
      return { kind: 'already_completed' };
    }
    const requiredFinishMs = session.startedAtMs + session.targetDurationSec * 1000;
    if (nowMs + FOCUS_CLOCK_GRACE_MS < requiredFinishMs) {
      const remainingSec = Math.ceil((requiredFinishMs - nowMs) / 1000);
      return { kind: 'too_early', remainingSec };
    }
    session.status = 'completed';
    session.completedAtMs = nowMs;
    return { kind: 'completed', session: { ...session } };
  }

  public async updateLeaderboard(entry: LeaderboardEntryRecord): Promise<void> {
    this.leaderboard.set(this.worldKey(entry.userId, entry.worldId), { ...entry });
  }

  public async listLeaderboard(
    worldId: WorldId,
    limit: number
  ): Promise<readonly LeaderboardEntryRecord[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    return [...this.leaderboard.values()]
      .filter((row) => row.worldId === worldId && row.isVerified)
      .sort((a, b) => b.scoreLog10 - a.scoreLog10)
      .slice(0, safeLimit);
  }

  public async insertAnalyticsBatch(events: AnalyticsBatchRequest['events']): Promise<number> {
    this.analyticsEvents.push(...events);
    return events.length;
  }

  public async recordAnomaly(entry: Omit<AnomalyLogEntry, 'id' | 'createdAtMs'>): Promise<void> {
    this.anomalies.push({
      ...entry,
      id: this.nextAnomalyId++,
      createdAtMs: Date.now()
    });
  }

  public async listRecentAnomalies(limit: number): Promise<readonly AnomalyLogEntry[]> {
    const safeLimit = Math.max(1, Math.min(200, Math.trunc(limit)));
    return [...this.anomalies].sort((a, b) => b.id - a.id).slice(0, safeLimit);
  }
}

