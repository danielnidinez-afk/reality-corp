import { describe, expect, it } from 'vitest';
import { APEX_SYNDICATE_CONFIG } from '@reality-corp/game-config';
import {
  arePrerequisitesMet,
  computePrestigePreview,
  computeResearchModifiers,
  getDailyChallengesForUtcDate,
  isConditionSatisfied
} from '@reality-corp/progression-system';

describe('progression-system DAG, dailies and prestige', () => {
  it('enforces research prerequisites and aggregates modifiers cleanly', () => {
    const first = APEX_SYNDICATE_CONFIG.research[0];
    const second = APEX_SYNDICATE_CONFIG.research[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) return;

    expect(arePrerequisitesMet(second, [])).toBe(false);
    expect(arePrerequisitesMet(second, [first.id])).toBe(true);

    const mods = computeResearchModifiers([first.id, second.id], APEX_SYNDICATE_CONFIG);
    expect(mods.tapMultiplier).toBeCloseTo(1.5, 5);
    expect(mods.cashMultiplier).toBeCloseTo(1.4, 5);
  });

  it('produces deterministic daily challenges per UTC date and evaluates mission conditions', () => {
    const dayA1 = getDailyChallengesForUtcDate('2026-11-11', APEX_SYNDICATE_CONFIG);
    const dayA2 = getDailyChallengesForUtcDate('2026-11-11', APEX_SYNDICATE_CONFIG);
    expect(dayA1).toEqual(dayA2);
    expect(dayA1[0]?.claimKey).toContain('daily:2026-11-11:');

    expect(
      isConditionSatisfied(
        { kind: 'building_level', buildingId: 'garage_server', minLevel: 5 },
        {
          buildings: { garage_server: 5 },
          lifetimeEarningsNumber: 100,
          unlockedResearch: [],
          prestigeCount: 0,
          claimedRewards: []
        }
      )
    ).toBe(true);
  });

  it('computes prestige preview >= 2.5x multiplier boost upon sufficient lifetime earnings', () => {
    const blocked = computePrestigePreview(500_000, 0, APEX_SYNDICATE_CONFIG);
    expect(blocked.canPrestige).toBe(false);

    const ready = computePrestigePreview(4_000_000, 0, APEX_SYNDICATE_CONFIG);
    expect(ready.canPrestige).toBe(true);
    expect(ready.claimableShares.toNumber()).toBe(20);
    expect(ready.nextBonusMultiplier).toBeCloseTo(2.0, 5);
  });
});

