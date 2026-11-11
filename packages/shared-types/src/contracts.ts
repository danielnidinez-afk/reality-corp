import { z } from 'zod';

/** World identifiers prepared in architecture; only `'apex-syndicate'` is playable in MVP. */
export const WorldIdSchema = z.enum(['apex-syndicate', 'chrono-forge', 'sovereign-island']);
export type WorldId = z.infer<typeof WorldIdSchema>;

/** Normalized BigVal JSONB wire representation `{ m, e }`. */
export const BigValSnapshotSchema = z
  .object({
    m: z.number().finite(),
    e: z.number().int().min(-1_000_000_000).max(1_000_000_000)
  })
  .strict();

export type BigValDTO = z.infer<typeof BigValSnapshotSchema>;

export const GameCommandTypeSchema = z.enum([
  'TAP_COMPUTE',
  'BUY_BUILDING_UPGRADE',
  'UNLOCK_RESEARCH',
  'HIRE_MANAGER',
  'TOGGLE_MANAGER',
  'CLAIM_REWARD',
  'COMPLETE_LOCAL_FOCUS'
]);
export type GameCommandType = z.infer<typeof GameCommandTypeSchema>;

export const GameCommandSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    seq: z.number().int().nonnegative(),
    type: GameCommandTypeSchema,
    payload: z.record(z.string(), z.unknown()),
    clientTimestampMs: z.number().int().nonnegative()
  })
  .strict();
export type GameCommand = z.infer<typeof GameCommandSchema>;

export const SyncBatchRequestSchema = z
  .object({
    worldId: WorldIdSchema,
    baseStateVersion: z.number().int().nonnegative(),
    clientTimestampMs: z.number().int().nonnegative(),
    commands: z.array(GameCommandSchema).max(500)
  })
  .strict();
export type SyncBatchRequest = z.infer<typeof SyncBatchRequestSchema>;

export const PurchaseRequestSchema = z
  .object({
    worldId: WorldIdSchema,
    targetType: z.enum(['building', 'research', 'manager']),
    targetId: z.string().min(1).max(64),
    quantity: z.union([z.literal(1), z.literal(10), z.literal(100), z.literal('max')])
  })
  .strict();
export type PurchaseRequest = z.infer<typeof PurchaseRequestSchema>;

export const PrestigeRequestSchema = z
  .object({
    worldId: WorldIdSchema,
    expectedMinShares: BigValSnapshotSchema
  })
  .strict();
export type PrestigeRequest = z.infer<typeof PrestigeRequestSchema>;

export const RewardClaimRequestSchema = z
  .object({
    worldId: WorldIdSchema,
    claimType: z.enum(['mission', 'daily_challenge', 'achievement', 'event']),
    rewardId: z.string().min(1).max(128)
  })
  .strict();
export type RewardClaimRequest = z.infer<typeof RewardClaimRequestSchema>;

export const FocusStartRequestSchema = z
  .object({
    worldId: WorldIdSchema,
    targetDurationSec: z.number().int().min(300).max(7200)
  })
  .strict();
export type FocusStartRequest = z.infer<typeof FocusStartRequestSchema>;

export const FocusCompleteRequestSchema = z
  .object({
    sessionId: z.string().uuid()
  })
  .strict();
export type FocusCompleteRequest = z.infer<typeof FocusCompleteRequestSchema>;

export const ProfileUpdateSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(24)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .optional(),
    activeWorldId: WorldIdSchema.optional()
  })
  .strict();
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

export const AnalyticsEventSchema = z
  .object({
    anonSessionId: z.string().uuid(),
    worldId: WorldIdSchema,
    eventName: z.string().min(1).max(64),
    props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    clientTimestampMs: z.number().int().nonnegative()
  })
  .strict();

export const AnalyticsBatchRequestSchema = z
  .object({
    events: z.array(AnalyticsEventSchema).min(1).max(50)
  })
  .strict();
export type AnalyticsBatchRequest = z.infer<typeof AnalyticsBatchRequestSchema>;

export const ApiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'INSUFFICIENT_FUNDS',
  'CONFLICT_STATE_DIVERGENCE',
  'ALREADY_CLAIMED',
  'RATE_LIMITED',
  'INTERNAL_ERROR'
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const CanonicalWorldStateDTOSchema = z
  .object({
    worldId: WorldIdSchema,
    stateVersion: z.number().int().nonnegative(),
    lastSyncedSeq: z.number().int().nonnegative(),
    cash: BigValSnapshotSchema,
    compute: BigValSnapshotSchema,
    data: BigValSnapshotSchema,
    lifetimeEarnings: BigValSnapshotSchema,
    prestigeCount: z.number().int().nonnegative(),
    equityShares: BigValSnapshotSchema,
    buildings: z.record(z.string(), z.number().int().nonnegative()),
    unlockedResearch: z.array(z.string()),
    hiredManagers: z.array(z.string()),
    claimedRewards: z.array(z.string()),
    lastServerTickAtMs: z.number().int().nonnegative(),
    trustStatus: z.enum(['verified', 'shadow_flagged', 'suspended'])
  })
  .strict();
export type CanonicalWorldStateDTO = z.infer<typeof CanonicalWorldStateDTOSchema>;

export const ApiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: ApiErrorCodeSchema,
        message: z.string().min(1),
        retryable: z.boolean(),
        canonicalState: CanonicalWorldStateDTOSchema.optional()
      })
      .strict()
  })
  .strict();
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export const SyncBatchResponseSchema = z
  .object({
    canonicalState: CanonicalWorldStateDTOSchema,
    offlineGrant: z
      .object({
        elapsedSec: z.number().nonnegative(),
        cashEarned: BigValSnapshotSchema,
        dataEarned: BigValSnapshotSchema
      })
      .strict(),
    rejectedCommands: z.array(
      z
        .object({
          seq: z.number().int().nonnegative(),
          reason: z.string()
        })
        .strict()
    ),
    serverTimestampMs: z.number().int().nonnegative()
  })
  .strict();
export type SyncBatchResponse = z.infer<typeof SyncBatchResponseSchema>;

export const LocalSaveGameSchema = z
  .object({
    schemaVersion: z.literal(1),
    worldId: WorldIdSchema,
    checksum: z.string().min(8),
    savedAtMs: z.number().int().nonnegative(),
    state: CanonicalWorldStateDTOSchema,
    pendingCommands: z.array(GameCommandSchema).max(500)
  })
  .strict();
export type LocalSaveGame = z.infer<typeof LocalSaveGameSchema>;

