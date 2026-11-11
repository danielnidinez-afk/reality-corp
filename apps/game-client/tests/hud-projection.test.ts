import { describe, expect, it } from 'vitest';
import { APEX_SYNDICATE_CONFIG } from '@reality-corp/game-config';
import { LocalSaveManager, MemorySaveStorage, RealitySyncSession } from '@reality-corp/reality-sync';
import { createInitialProjection, projectSessionToHud } from '../src/lib/state/hud-types.js';

describe('apps/game-client HUD projection', () => {
  it('projects session rates, buildings, and daily challenges deterministically', async () => {
    const initial = createInitialProjection(APEX_SYNDICATE_CONFIG);
    expect(initial.energyLoadFactor).toBe(1);
    expect(initial.dailyChallenges.length).toBeGreaterThan(0);

    const session = new RealitySyncSession(
      APEX_SYNDICATE_CONFIG,
      new LocalSaveManager(new MemorySaveStorage())
    );
    await session.initialize(10_000);
    for (let i = 0; i < 10; i += 1) {
      session.issueCommand('TAP_COMPUTE', { tapCount: 1 }, 10_100 + i);
    }
    session.issueCommand('BUY_BUILDING_UPGRADE', { buildingId: 'garage_server', quantity: 1 }, 10_200);

    const projected = projectSessionToHud(session, APEX_SYNDICATE_CONFIG);
    expect(projected.buildings['garage_server']).toBe(1);
    expect(projected.cashPerSec.m).toBeCloseTo(1.5, 5);
  });
});

