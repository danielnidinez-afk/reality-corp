import { describe, expect, it } from 'vitest';
import {
  AnalyticsBatchRequestSchema,
  FocusStartRequestSchema,
  SyncBatchRequestSchema,
  asGameTick,
  asTimestampMs
} from '@reality-corp/shared-types';

describe('shared-types contracts & branded primitives', () => {
  it('accepts valid SyncBatchRequest payloads (positive case)', () => {
    const valid = SyncBatchRequestSchema.safeParse({
      worldId: 'apex-syndicate',
      baseStateVersion: 12,
      clientTimestampMs: 1_794_356_400_000,
      commands: [
        {
          idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
          seq: 1,
          type: 'BUY_BUILDING_UPGRADE',
          payload: { buildingId: 'garage_server', count: 1 },
          clientTimestampMs: 1_794_356_399_000
        }
      ]
    });

    expect(valid.success).toBe(true);
  });

  it('rejects malformed SyncBatchRequest payloads (negative cases)', () => {
    const missingVersion = SyncBatchRequestSchema.safeParse({
      worldId: 'apex-syndicate',
      clientTimestampMs: 1_794_356_400_000,
      commands: []
    });
    const invalidWorld = SyncBatchRequestSchema.safeParse({
      worldId: 'unknown-world',
      baseStateVersion: 0,
      clientTimestampMs: 100,
      commands: []
    });
    const negativeSeq = SyncBatchRequestSchema.safeParse({
      worldId: 'apex-syndicate',
      baseStateVersion: 0,
      clientTimestampMs: 100,
      commands: [
        {
          idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
          seq: -1,
          type: 'TAP_COMPUTE',
          payload: {},
          clientTimestampMs: 100
        }
      ]
    });

    expect(missingVersion.success).toBe(false);
    expect(invalidWorld.success).toBe(false);
    expect(negativeSeq.success).toBe(false);
  });

  it('validates FocusStartRequest durations within 300s..7200s bounds', () => {
    expect(
      FocusStartRequestSchema.safeParse({ worldId: 'apex-syndicate', targetDurationSec: 1500 }).success
    ).toBe(true);
    expect(
      FocusStartRequestSchema.safeParse({ worldId: 'apex-syndicate', targetDurationSec: 299 }).success
    ).toBe(false);
    expect(
      FocusStartRequestSchema.safeParse({ worldId: 'apex-syndicate', targetDurationSec: 7201 }).success
    ).toBe(false);
  });

  it('caps AnalyticsBatchRequest at 50 events and validates UUIDs', () => {
    const validEvent = {
      anonSessionId: '550e8400-e29b-41d4-a716-446655440000',
      worldId: 'apex-syndicate' as const,
      eventName: 'upgrade_bought',
      props: { count: 1, online: true },
      clientTimestampMs: 1_000
    };
    const overLimit = Array.from({ length: 51 }, () => validEvent);

    expect(AnalyticsBatchRequestSchema.safeParse({ events: [validEvent] }).success).toBe(true);
    expect(AnalyticsBatchRequestSchema.safeParse({ events: [] }).success).toBe(false);
    expect(AnalyticsBatchRequestSchema.safeParse({ events: overLimit }).success).toBe(false);
  });

  it('enforces runtime invariants for GameTick and TimestampMs brands', () => {
    expect(asGameTick(0)).toBe(0);
    expect(asTimestampMs(1234)).toBe(1234);
    expect(() => asGameTick(-1)).toThrow(RangeError);
    expect(() => asGameTick(1.5)).toThrow(RangeError);
    expect(() => asTimestampMs(Number.NaN)).toThrow(RangeError);
    expect(() => asTimestampMs(-10)).toThrow(RangeError);
  });
});

