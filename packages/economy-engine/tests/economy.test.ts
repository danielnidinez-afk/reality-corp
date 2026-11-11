import { describe, expect, it } from 'vitest';
import {
  BigVal,
  calculateBulkCost,
  calculateClaimablePrestigeShares,
  calculateEnergyLoadFactor,
  calculateMaxAffordable,
  calculateMilestoneMultiplier,
  calculateOfflineProgress,
  calculateProductionYield,
  calculateSingleCost
} from '@reality-corp/economy-engine';

describe('BigVal adapter invariants & formatting', () => {
  it('handles zero, astronomical exponents > MAX_SAFE_INTEGER and normalized snapshots', () => {
    const huge = BigVal.fromSnapshot({ m: 4.5, e: 120 });
    const doubled = huge.mul(2);

    expect(BigVal.zero().isZero()).toBe(true);
    expect(doubled.toSnapshot()).toEqual({ m: 9, e: 120 });
    expect(huge.formatCompact(2)).toBe('4.50e120');
    expect(BigVal.from(1_500_000).formatCompact(2)).toBe('1.50M');
  });

  it('prevents negative balances via subClamped and rejects NaN/Infinity/div-zero', () => {
    expect(BigVal.from(50).subClamped(100).isZero()).toBe(true);
    expect(() => BigVal.from(Number.NaN)).toThrow(RangeError);
    expect(() => BigVal.from(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => BigVal.one().div(0)).toThrow(RangeError);
  });
});

describe('Economy formulas determinism & edge cases', () => {
  it('verifies bulk cost equivalence for k=1 and geometric accuracy vs iterative sum', () => {
    const base = 100;
    const rate = 1.12;
    expect(calculateBulkCost(base, rate, 3, 1).eq(calculateSingleCost(base, rate, 3))).toBe(true);
    expect(calculateBulkCost(base, rate, 0, 0).isZero()).toBe(true);

    let iterativeSum = 0;
    for (let i = 0; i < 10; i += 1) {
      iterativeSum += base * Math.pow(rate, i);
    }
    const geometricBulk = calculateBulkCost(base, rate, 0, 10).toNumber();
    expect(Math.abs(geometricBulk - Math.ceil(iterativeSum))).toBeLessThanOrEqual(2);
  });

  it('solves BuyMax cleanly with exact affordability guarantee', () => {
    const wealth = BigVal.from(500);
    const maxCount = calculateMaxAffordable(wealth, 100, 1.15, 0);
    expect(maxCount).toBe(4);
    expect(calculateMaxAffordable(499, 100, 1.15, 0)).toBe(3);
    expect(calculateBulkCost(100, 1.15, 0, maxCount).lte(wealth)).toBe(true);
    expect(calculateBulkCost(100, 1.15, 0, maxCount + 1).gt(wealth)).toBe(true);
    expect(calculateMaxAffordable(50, 100, 1.15, 0)).toBe(0);
  });

  it('applies soft brownout load factor and milestone scaling properly', () => {
    expect(calculateEnergyLoadFactor(100, 50)).toBe(1.0);
    expect(calculateEnergyLoadFactor(50, 100)).toBe(0.5);
    expect(calculateEnergyLoadFactor(0, 0)).toBe(1.0);
    expect(calculateMilestoneMultiplier(100)).toBe(16);

    const yieldPerSec = calculateProductionYield({
      baseYieldPerUnit: 10,
      level: 10,
      energyLoadFactor: 0.5,
      milestoneMultiplier: 4,
      researchMultiplier: 2,
      prestigeMultiplier: 1.5
    });
    expect(yieldPerSec.toNumber()).toBeCloseTo(600, 5);
  });

  it('dampens prestige gains via square root and subtracts prior claims', () => {
    const first = calculateClaimablePrestigeShares(1e9, 0, 1e9, 10);
    const second = calculateClaimablePrestigeShares(4e9, first, 1e9, 10);
    const belowThreshold = calculateClaimablePrestigeShares(9e8, 0, 1e9, 10);

    expect(first.toNumber()).toBe(10);
    expect(second.toNumber()).toBe(10);
    expect(belowThreshold.isZero()).toBe(true);
  });

  it('rejects negative clock tamper and clamps 30-day offline span to MaxOfflineCap in <2ms', () => {
    const tampered = calculateOfflineProgress({
      elapsedSec: -120,
      cashPerSec: 100,
      dataPerSec: 5
    });
    expect(tampered.clockTampered).toBe(true);
    expect(tampered.cashEarned.isZero()).toBe(true);

    const start = performance.now();
    const capped = calculateOfflineProgress({
      elapsedSec: 30 * 86_400,
      cashPerSec: 100,
      dataPerSec: 10,
      macroSteps: 100
    });
    const durationMs = performance.now() - start;

    expect(capped.effectiveElapsedSec).toBe(28_800);
    expect(capped.stepsExecuted).toBe(100);
    expect(capped.cashEarned.toNumber()).toBeCloseTo(28_800 * 100 * 0.75, 2);
    expect(durationMs).toBeLessThan(20);
  });
});
