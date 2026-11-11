import { describe, expect, it } from 'vitest';
import { APEX_SYNDICATE_CONFIG } from '@reality-corp/game-config';
import { createInitialWorldState, toCanonicalDTO } from '@reality-corp/game-engine';
import {
  LocalSaveManager,
  MemorySaveStorage,
  RealitySyncSession,
  type SyncTransport
} from '@reality-corp/reality-sync';
import type { CanonicalWorldStateDTO, SyncBatchRequest } from '@reality-corp/shared-types';

describe('packages/reality-sync storage, backup recovery & sync reconciliation', () => {
  it('recovers valid state from .bak backup slot if primary save is corrupted', async () => {
    const storage = new MemorySaveStorage();
    const saveManager = new LocalSaveManager(storage);
    const session = new RealitySyncSession(APEX_SYNDICATE_CONFIG, saveManager);

    await session.initialize(10_000);
    for (let i = 0; i < 12; i += 1) {
      session.issueCommand('TAP_COMPUTE', { tapCount: 1 }, 10_100 + i);
    }
    session.issueCommand('BUY_BUILDING_UPGRADE', { buildingId: 'garage_server', quantity: 1 }, 10_200);
    await session.persistLocal(10_500);
    // Write second save so primary rotates previous valid save into backup slot
    session.tick(5);
    await session.persistLocal(15_500);

    // Corrupt primary slot
    storage.corruptRawSlot('world:apex-syndicate:primary', { broken: true });

    const recoveredSession = new RealitySyncSession(APEX_SYNDICATE_CONFIG, saveManager);
    const init = await recoveredSession.initialize(25_500);
    expect(init.loadedFromDisk).toBe(true);
    expect(init.recoveredFromBackup).toBe(true);
    expect(recoveredSession.state.buildings['garage_server']).toBe(1);
    expect(init.offlineCatchup).not.toBeNull();
  });

  it('queues commands with monotonic seq and reconciles 409 CONFLICT_STATE_DIVERGENCE', async () => {
    const storage = new MemorySaveStorage();
    const saveManager = new LocalSaveManager(storage);

    const canonicalServerState: CanonicalWorldStateDTO = toCanonicalDTO(
      createInitialWorldState(APEX_SYNDICATE_CONFIG, 90_000)
    );
    canonicalServerState.stateVersion = 7;
    canonicalServerState.lastSyncedSeq = 4;
    canonicalServerState.cash = { m: 9.9, e: 2 }; // $990 canonical

    const conflictTransport: SyncTransport = {
      async syncBatch(_req: SyncBatchRequest) {
        return { kind: 'conflict', canonicalState: canonicalServerState };
      }
    };

    const session = new RealitySyncSession(APEX_SYNDICATE_CONFIG, saveManager, conflictTransport);
    await session.initialize(1_000);
    session.issueCommand('TAP_COMPUTE', { tapCount: 5 }, 1_100);
    session.issueCommand('TAP_COMPUTE', { tapCount: 2 }, 1_200);

    expect(session.getPendingCommandCount()).toBe(2);
    expect(session.getPendingCommands()[0]?.seq).toBe(1);
    expect(session.getPendingCommands()[1]?.seq).toBe(2);

    const outcome = await session.flushSync(90_000);
    expect(outcome.status).toBe('conflict_reconciled');
    expect(session.getPendingCommandCount()).toBe(0);
    expect(session.state.stateVersion).toBe(7);
    expect(session.state.lastSyncedSeq).toBe(4);
    expect(session.state.cash.toNumber()).toBeCloseTo(990, 3);
  });
});

