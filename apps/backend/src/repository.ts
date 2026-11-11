import type {
  AnalyticsBatchRequest,
  BigValDTO,
  CanonicalWorldStateDTO,
  RewardClaimRequest,
  SyncBatchResponse,
  WorldId
} from '@reality-corp/shared-types';

export interface PlayerProfileRecord {
  userId: string;
  username: string;
  activeWorldId: WorldId;
  role: 'player' | 'moderator' | 'admin';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface FocusSessionRecord {
  id: string;
  userId: string;
  worldId: WorldId;
  status: 'active' | 'completed' | 'abandoned';
  targetDurationSec: number;
  startedAtMs: number;
  completedAtMs: number | null;
}

export type FocusCompleteResult =
  | { readonly kind: 'completed'; readonly session: FocusSessionRecord }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'already_completed' }
  | { readonly kind: 'too_early'; readonly remainingSec: number };

export interface LeaderboardEntryRecord {
  userId: string;
  worldId: WorldId;
  username: string;
  scoreLog10: number;
  equityShares: BigValDTO;
  isVerified: boolean;
}

export interface AnomalyLogEntry {
  id: number;
  userId: string | null;
  worldId: WorldId;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  createdAtMs: number;
}

export interface BackendRepository {
  getProfile(userId: string): Promise<PlayerProfileRecord | null>;
  getOrCreateProfile(userId: string): Promise<PlayerProfileRecord>;
  updateProfile(
    userId: string,
    patch: Partial<Pick<PlayerProfileRecord, 'username' | 'activeWorldId' | 'role'>>
  ): Promise<PlayerProfileRecord>;
  deleteProfileAndAllData(userId: string): Promise<boolean>;

  getWorldState(userId: string, worldId: WorldId): Promise<CanonicalWorldStateDTO | null>;
  saveWorldState(userId: string, state: CanonicalWorldStateDTO): Promise<void>;

  getCachedSyncResponse(userId: string, idempotencyKey: string): Promise<SyncBatchResponse | null>;
  saveCachedSyncResponse(
    userId: string,
    idempotencyKey: string,
    response: SyncBatchResponse
  ): Promise<void>;

  tryClaimReward(
    userId: string,
    worldId: WorldId,
    claimType: RewardClaimRequest['claimType'],
    rewardId: string,
    claimKey: string
  ): Promise<boolean>;

  createFocusSession(
    userId: string,
    worldId: WorldId,
    targetDurationSec: number,
    nowMs: number
  ): Promise<FocusSessionRecord>;
  completeFocusSessionAtomic(
    userId: string,
    sessionId: string,
    nowMs: number
  ): Promise<FocusCompleteResult>;

  updateLeaderboard(entry: LeaderboardEntryRecord): Promise<void>;
  listLeaderboard(worldId: WorldId, limit: number): Promise<readonly LeaderboardEntryRecord[]>;

  insertAnalyticsBatch(events: AnalyticsBatchRequest['events']): Promise<number>;
  recordAnomaly(entry: Omit<AnomalyLogEntry, 'id' | 'createdAtMs'>): Promise<void>;
  listRecentAnomalies(limit: number): Promise<readonly AnomalyLogEntry[]>;
}
