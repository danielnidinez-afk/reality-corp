import { describe, expect, it } from 'vitest';
import { createTestHarness, PLAYER_ID } from './harness.js';

describe('apps/backend zero-trust API & anti-cheat suite', () => {
  it('blocks unauthenticated callers with 401 and protects admin routes with 403', async () => {
    const { app } = await createTestHarness();

    const unauthSync = await app.inject({
      method: 'POST',
      url: '/v1/sync/batch',
      payload: {}
    });
    expect(unauthSync.statusCode).toBe(401);

    const unauthAnalytics = await app.inject({
      method: 'POST',
      url: '/v1/analytics/batch',
      payload: { events: [] }
    });
    expect(unauthAnalytics.statusCode).toBe(401);

    const playerAdminAccess = await app.inject({
      method: 'GET',
      url: '/v1/admin/anomalies',
      headers: { authorization: 'Bearer player-token' }
    });
    expect(playerAdminAccess.statusCode).toBe(403);

    const adminAccess = await app.inject({
      method: 'GET',
      url: '/v1/admin/anomalies',
      headers: { authorization: 'Bearer admin-token' }
    });
    expect(adminAccess.statusCode).toBe(200);
    await app.close();
  });

  it('enforces idempotent sync, version conflict 409, and >5% divergence shadow-flagging', async () => {
    const { app, repo, advanceMs } = await createTestHarness(1_000_000);

    // Initialize player world cleanly via profile read or sync
    const idempKey = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const syncPayload = {
      worldId: 'apex-syndicate',
      baseStateVersion: 1,
      clientTimestampMs: 1_000_000,
      commands: [
        {
          idempotencyKey: '11111111-1111-4111-8111-111111111111',
          seq: 1,
          type: 'TAP_COMPUTE',
          payload: { tapCount: 15 },
          clientTimestampMs: 1_000_000
        },
        {
          idempotencyKey: '11111111-1111-4111-8111-111111111112',
          seq: 2,
          type: 'BUY_BUILDING_UPGRADE',
          payload: { buildingId: 'garage_server', quantity: 1 },
          clientTimestampMs: 1_000_100
        }
      ]
    };

    const res1 = await app.inject({
      method: 'POST',
      url: '/v1/sync/batch',
      headers: {
        authorization: 'Bearer player-token',
        'x-idempotency-key': idempKey
      },
      payload: syncPayload
    });
    expect(res1.statusCode).toBe(200);
    const body1 = res1.json() as { canonicalState: { stateVersion: number; buildings: Record<string, number> } };
    expect(body1.canonicalState.stateVersion).toBe(2);
    expect(body1.canonicalState.buildings['garage_server']).toBe(1);

    // Replay same X-Idempotency-Key -> identical cached result, NO double upgrade!
    const resReplay = await app.inject({
      method: 'POST',
      url: '/v1/sync/batch',
      headers: {
        authorization: 'Bearer player-token',
        'x-idempotency-key': idempKey
      },
      payload: syncPayload
    });
    expect(resReplay.statusCode).toBe(200);
    expect(resReplay.json().canonicalState.stateVersion).toBe(2);

    // Stale baseStateVersion -> 409 CONFLICT_STATE_DIVERGENCE
    const staleRes = await app.inject({
      method: 'POST',
      url: '/v1/sync/batch',
      headers: {
        authorization: 'Bearer player-token',
        'x-idempotency-key': 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      },
      payload: syncPayload
    });
    expect(staleRes.statusCode).toBe(409);
    expect(staleRes.json().error.code).toBe('CONFLICT_STATE_DIVERGENCE');

    // Attempt tampered building purchase (>5% shortfall vs $48,000 cluster)
    advanceMs(10_000);
    const cheatRes = await app.inject({
      method: 'POST',
      url: '/v1/sync/batch',
      headers: {
        authorization: 'Bearer player-token',
        'x-idempotency-key': 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
      },
      payload: {
        worldId: 'apex-syndicate',
        baseStateVersion: 2,
        clientTimestampMs: 1_010_000,
        commands: [
          {
            idempotencyKey: '11111111-1111-4111-8111-111111111113',
            seq: 3,
            type: 'BUY_BUILDING_UPGRADE',
            payload: { buildingId: 'sovereign_cluster', quantity: 10 },
            clientTimestampMs: 1_010_000
          }
        ]
      }
    });
    expect(cheatRes.statusCode).toBe(409);
    expect(cheatRes.json().error.canonicalState.trustStatus).toBe('shadow_flagged');

    // Shadow-flagged account excluded from verified leaderboard
    const lb = await app.inject({
      method: 'GET',
      url: '/v1/leaderboard/apex-syndicate'
    });
    expect(lb.statusCode).toBe(200);
    expect(lb.json().entries).toHaveLength(0);

    const anomalies = await repo.listRecentAnomalies(10);
    expect(anomalies.some((a) => a.anomalyType === 'ECONOMY_DIVERGENCE_EXCEEDED')).toBe(true);
    await app.close();
  });

  it('prevents parallel double-completion of focus sessions and double reward claims', async () => {
    const { app, repo, advanceMs } = await createTestHarness(2_000_000);

    // Give player 5 garage servers to satisfy first mission
    const initState = await app.inject({
      method: 'POST',
      url: '/v1/sync/batch',
      headers: {
        authorization: 'Bearer player-token',
        'x-idempotency-key': '22222222-2222-4222-8222-222222222220'
      },
      payload: {
        worldId: 'apex-syndicate',
        baseStateVersion: 1,
        clientTimestampMs: 2_000_000,
        commands: Array.from({ length: 5 }, (_, i) => ({
          idempotencyKey: `22222222-2222-4222-8222-22222222220${i}`,
          seq: i + 1,
          type: 'TAP_COMPUTE',
          payload: { tapCount: 10 },
          clientTimestampMs: 2_000_000 + i
        }))
      }
    });
    expect(initState.statusCode).toBe(200);

    await repo.saveWorldState(PLAYER_ID, {
      ...initState.json().canonicalState,
      buildings: { garage_server: 5 }
    });

    const [claimA, claimB] = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/v1/rewards/claim',
        headers: { authorization: 'Bearer player-token' },
        payload: { worldId: 'apex-syndicate', claimType: 'mission', rewardId: 'm_first_rig' }
      }),
      app.inject({
        method: 'POST',
        url: '/v1/rewards/claim',
        headers: { authorization: 'Bearer player-token' },
        payload: { worldId: 'apex-syndicate', claimType: 'mission', rewardId: 'm_first_rig' }
      })
    ]);
    expect([claimA.statusCode, claimB.statusCode].sort()).toEqual([200, 409]);

    const startFocus = await app.inject({
      method: 'POST',
      url: '/v1/focus/start',
      headers: { authorization: 'Bearer player-token' },
      payload: { worldId: 'apex-syndicate', targetDurationSec: 300 }
    });
    expect(startFocus.statusCode).toBe(201);
    const { sessionId } = startFocus.json() as { sessionId: string };

    // Too early check
    const tooEarly = await app.inject({
      method: 'POST',
      url: '/v1/focus/complete',
      headers: { authorization: 'Bearer player-token' },
      payload: { sessionId }
    });
    expect(tooEarly.statusCode).toBe(400);

    // Advance 300s and send parallel completion requests -> exactly 1 succeeds, 1 gets 409 ALREADY_CLAIMED
    advanceMs(300_000);
    const [focusA, focusB] = await Promise.all([
      app.inject({
        method: 'POST',
        url: '/v1/focus/complete',
        headers: { authorization: 'Bearer player-token' },
        payload: { sessionId }
      }),
      app.inject({
        method: 'POST',
        url: '/v1/focus/complete',
        headers: { authorization: 'Bearer player-token' },
        payload: { sessionId }
      })
    ]);
    expect([focusA.statusCode, focusB.statusCode].sort()).toEqual([200, 409]);

    // Locked world check & GDPR deletion
    const lockedPurchase = await app.inject({
      method: 'POST',
      url: '/v1/economy/purchase',
      headers: { authorization: 'Bearer player-token' },
      payload: { worldId: 'chrono-forge', targetType: 'building', targetId: 'x', quantity: 1 }
    });
    expect(lockedPurchase.statusCode).toBe(403);

    const oversizedAnalytics = await app.inject({
      method: 'POST',
      url: '/v1/analytics/batch',
      headers: {
        authorization: 'Bearer player-token',
        'content-type': 'application/json'
      },
      payload: JSON.stringify({
        events: [
          {
            anonSessionId: PLAYER_ID,
            worldId: 'apex-syndicate',
            eventName: 'huge',
            props: { blob: 'x'.repeat(70_000) },
            clientTimestampMs: 2_300_000
          }
        ]
      })
    });
    expect(oversizedAnalytics.statusCode).toBe(413);

    const del = await app.inject({
      method: 'DELETE',
      url: '/v1/profile/me',
      headers: { authorization: 'Bearer player-token' }
    });
    expect(del.statusCode).toBe(200);
    expect(del.json().deleted).toBe(true);
    expect(await repo.getWorldState(PLAYER_ID, 'apex-syndicate')).toBeNull();
    await app.close();
  });
});

