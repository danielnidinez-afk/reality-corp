import { describe, expect, it } from 'vitest';
import { calculateSingleCost } from '@reality-corp/economy-engine';
import { APEX_SYNDICATE_CONFIG } from '@reality-corp/game-config';
import {
  createInitialWorldState,
  dispatchGameCommand,
  performPrestigeReset,
  recalculateRates,
  stepSimulationTick,
  type SimulationModifiers
} from '@reality-corp/game-engine';
import {
  arePrerequisitesMet,
  computePrestigePreview,
  computeResearchModifiers
} from '@reality-corp/progression-system';

function buildModifiers(
  unlockedResearch: readonly string[],
  prestigeBonusMultiplier: number
): SimulationModifiers {
  const res = computeResearchModifiers(unlockedResearch, APEX_SYNDICATE_CONFIG);
  return {
    cashMultiplier: res.cashMultiplier,
    dataMultiplier: res.dataMultiplier,
    tapMultiplier: res.tapMultiplier,
    prestigeMultiplier: prestigeBonusMultiplier,
    bonusOfflineCapSec: res.bonusOfflineCapSec,
    bonusOfflineEfficiency: res.bonusOfflineEfficiency
  };
}

describe('Apex Syndicate 7-day greedy bot economy simulation', () => {
  it('progresses cleanly across 7 simulated days without NaN, infinity, or brownout deadlock', () => {
    const state = createInitialWorldState(APEX_SYNDICATE_CONFIG, 0);
    let seq = 1;
    let timeMs = 1_000;
    const uuidFor = (n: number): string =>
      `11111111-1111-4111-8111-${String(n).padStart(12, '0')}`;

    const prestigePreviewInit = computePrestigePreview(
      state.lifetimeEarnings,
      state.equityShares,
      APEX_SYNDICATE_CONFIG
    );
    let modifiers = buildModifiers(state.unlockedResearch, prestigePreviewInit.currentBonusMultiplier);

    // Bootstrap manual taps for first rig
    for (let t = 0; t < 15; t += 1) {
      dispatchGameCommand(
        state,
        {
          idempotencyKey: uuidFor(seq),
          seq: seq++,
          type: 'TAP_COMPUTE',
          payload: { tapCount: 1 },
          clientTimestampMs: (timeMs += 100)
        },
        APEX_SYNDICATE_CONFIG,
        modifiers
      );
    }

    // Simulate 7 days in 60s macro steps (10,080 steps) with greedy buy + energy protection
    const totalSteps = 7 * 24 * 60;
    let reachedPrestige = false;

    for (let step = 0; step < totalSteps; step += 1) {
      stepSimulationTick(state, 60, APEX_SYNDICATE_CONFIG, modifiers);
      timeMs += 60_000;

      // Unlock any affordable research first
      for (const node of APEX_SYNDICATE_CONFIG.research) {
        if (state.unlockedResearch.includes(node.id)) continue;
        if (!arePrerequisitesMet(node, state.unlockedResearch)) continue;
        if (state.data.gte(node.costDataShards)) {
          const unlocked = dispatchGameCommand(
            state,
            {
              idempotencyKey: uuidFor(seq),
              seq: seq++,
              type: 'UNLOCK_RESEARCH',
              payload: { researchId: node.id },
              clientTimestampMs: timeMs
            },
            APEX_SYNDICATE_CONFIG,
            modifiers
          );
          if (unlocked.accepted) {
            const p = computePrestigePreview(
              state.lifetimeEarnings,
              state.equityShares,
              APEX_SYNDICATE_CONFIG
            );
            modifiers = buildModifiers(state.unlockedResearch, p.currentBonusMultiplier);
            recalculateRates(state, APEX_SYNDICATE_CONFIG, modifiers);
          }
        }
      }

      // If energy utilization > 90%, prioritize energy buildings to avoid severe brownout
      const needsPower = state.rates.energyDemandKw >= state.rates.energySupplyKw * 0.9;
      for (const building of APEX_SYNDICATE_CONFIG.buildings) {
        if (needsPower && building.energyKwDelta <= 0) continue;
        const level = state.buildings[building.id] ?? 0;
        if (level === 0 && state.lifetimeEarnings.lt(building.unlockLifetimeCash)) continue;
        const cost = calculateSingleCost(building.baseCostCash, building.growthRate, level);
        if (state.cash.gte(cost)) {
          dispatchGameCommand(
            state,
            {
              idempotencyKey: uuidFor(seq),
              seq: seq++,
              type: 'BUY_BUILDING_UPGRADE',
              payload: { buildingId: building.id, quantity: 1 },
              clientTimestampMs: timeMs
            },
            APEX_SYNDICATE_CONFIG,
            modifiers
          );
        }
      }

      // Soft reset once claimable shares >= 15 and not yet prestiged once
      const prestige = computePrestigePreview(
        state.lifetimeEarnings,
        state.equityShares,
        APEX_SYNDICATE_CONFIG
      );
      if (!reachedPrestige && prestige.claimableShares.gte(15)) {
        const didReset = performPrestigeReset(
          state,
          prestige.claimableShares,
          APEX_SYNDICATE_CONFIG,
          modifiers
        );
        expect(didReset).toBe(true);
        reachedPrestige = true;
        const nextPrestige = computePrestigePreview(
          state.lifetimeEarnings,
          state.equityShares,
          APEX_SYNDICATE_CONFIG
        );
        modifiers = buildModifiers(state.unlockedResearch, nextPrestige.currentBonusMultiplier);
        recalculateRates(state, APEX_SYNDICATE_CONFIG, modifiers);

        // Quick tap after soft reset to restart loop
        dispatchGameCommand(
          state,
          {
            idempotencyKey: uuidFor(seq),
            seq: seq++,
            type: 'TAP_COMPUTE',
            payload: { tapCount: 15 },
            clientTimestampMs: timeMs
          },
          APEX_SYNDICATE_CONFIG,
          modifiers
        );
      }

      expect(Number.isFinite(state.cash.mantissa)).toBe(true);
      expect(Number.isFinite(state.data.mantissa)).toBe(true);
      expect(state.cash.isNegative()).toBe(false);
    }

    expect(reachedPrestige).toBe(true);
    expect(state.prestigeCount).toBeGreaterThanOrEqual(1);
    expect(state.equityShares.toNumber()).toBeGreaterThanOrEqual(15);
    expect(state.rates.energyLoadFactor).toBeGreaterThan(0.8);
    expect(state.lifetimeEarnings.gt(1_000_000)).toBe(true);
  });
});

