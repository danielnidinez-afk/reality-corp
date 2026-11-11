import { BigVal, type BigValInput } from './big-val.js';

export interface ProductionYieldParams {
  readonly baseYieldPerUnit: BigValInput;
  readonly level: number;
  readonly energyLoadFactor: number;
  readonly milestoneMultiplier: number;
  readonly researchMultiplier?: number;
  readonly prestigeMultiplier?: number;
  readonly focusMultiplier?: number;
  readonly eventMultiplier?: number;
}

function assertPositiveGrowthRate(growthRate: number): void {
  if (!Number.isFinite(growthRate) || growthRate <= 1.0) {
    throw new RangeError(`growthRate must be > 1.0, received ${growthRate}`);
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer, received ${value}`);
  }
}

/** Single-level upgrade cost: ceil(baseCost * growthRate^currentLevel). */
export function calculateSingleCost(
  baseCost: BigValInput,
  growthRate: number,
  currentLevel: number
): BigVal {
  assertPositiveGrowthRate(growthRate);
  assertNonNegativeInteger(currentLevel, 'currentLevel');
  const base = BigVal.from(baseCost);
  if (base.lt(0)) {
    throw new RangeError('baseCost cannot be negative');
  }
  const factor = BigVal.from(growthRate).pow(currentLevel);
  return base.mul(factor).ceil();
}

/** O(1) geometric series bulk cost for buying `count` consecutive upgrades. */
export function calculateBulkCost(
  baseCost: BigValInput,
  growthRate: number,
  currentLevel: number,
  count: number
): BigVal {
  assertPositiveGrowthRate(growthRate);
  assertNonNegativeInteger(currentLevel, 'currentLevel');
  assertNonNegativeInteger(count, 'count');
  if (count === 0) {
    return BigVal.zero();
  }
  if (count === 1) {
    return calculateSingleCost(baseCost, growthRate, currentLevel);
  }
  const firstCost = BigVal.from(baseCost).mul(BigVal.from(growthRate).pow(currentLevel));
  const numerator = BigVal.from(growthRate).pow(count).subClamped(1);
  const denominator = growthRate - 1;
  return firstCost.mul(numerator).div(denominator).ceil();
}

/** O(1) logarithmic "Buy Max" quantity solver verified against exact affordability. */
export function calculateMaxAffordable(
  wealth: BigValInput,
  baseCost: BigValInput,
  growthRate: number,
  currentLevel: number
): number {
  assertPositiveGrowthRate(growthRate);
  assertNonNegativeInteger(currentLevel, 'currentLevel');
  const available = BigVal.from(wealth);
  if (available.lte(0)) {
    return 0;
  }
  const singleCost = calculateSingleCost(baseCost, growthRate, currentLevel);
  if (available.lt(singleCost)) {
    return 0;
  }

  const nextTerm = BigVal.from(baseCost).mul(BigVal.from(growthRate).pow(currentLevel));
  if (nextTerm.lte(0)) {
    return 0;
  }

  const inner = available.mul(growthRate - 1).div(nextTerm).add(1);
  const maxRaw = Math.floor(inner.log10() / Math.log10(growthRate));
  let candidate = Math.max(1, maxRaw);

  // Guard against edge-case ceil discrepancy so returned count is always strictly affordable
  while (candidate > 0 && calculateBulkCost(baseCost, growthRate, currentLevel, candidate).gt(available)) {
    candidate -= 1;
  }
  return candidate;
}

/** Energy brownout load factor eta = min(1.0, supply / max(1, demand)). */
export function calculateEnergyLoadFactor(totalSupplyKw: number, totalDemandKw: number): number {
  if (!Number.isFinite(totalSupplyKw) || !Number.isFinite(totalDemandKw)) {
    throw new RangeError('Energy supply and demand must be finite numbers');
  }
  if (totalSupplyKw < 0 || totalDemandKw < 0) {
    throw new RangeError('Energy supply and demand cannot be negative');
  }
  if (totalDemandKw === 0) {
    return 1.0;
  }
  return Math.min(1.0, totalSupplyKw / Math.max(1, totalDemandKw));
}

/** Milestone multiplier: 2x at 25/50/250 and 4x at 100/500/1000. */
export function calculateMilestoneMultiplier(level: number): number {
  assertNonNegativeInteger(level, 'level');
  let multiplier = 1;
  if (level >= 25) multiplier *= 2;
  if (level >= 50) multiplier *= 2;
  if (level >= 100) multiplier *= 4;
  if (level >= 250) multiplier *= 2;
  if (level >= 500) multiplier *= 4;
  if (level >= 1000) multiplier *= 4;
  return multiplier;
}

/** Computes net per-second resource yield combining category multiplier groups. */
export function calculateProductionYield(params: ProductionYieldParams): BigVal {
  assertNonNegativeInteger(params.level, 'level');
  if (params.level === 0) {
    return BigVal.zero();
  }
  const base = BigVal.from(params.baseYieldPerUnit);
  const eta = Math.max(0, Math.min(1, params.energyLoadFactor));
  const combinedMultiplier =
    eta *
    params.milestoneMultiplier *
    (params.researchMultiplier ?? 1) *
    (params.prestigeMultiplier ?? 1) *
    (params.focusMultiplier ?? 1) *
    (params.eventMultiplier ?? 1);

  if (!Number.isFinite(combinedMultiplier) || combinedMultiplier < 0) {
    throw new RangeError(`Invalid combined multiplier: ${combinedMultiplier}`);
  }
  return base.mul(params.level).mul(combinedMultiplier);
}

/** Root-damped cumulative prestige token formula: floor(scaleFactor * sqrt(lifetime / threshold)). */
export function calculateTotalPrestigeShares(
  lifetimeEarnings: BigValInput,
  threshold: BigValInput,
  scaleFactor = 10
): BigVal {
  const earnings = BigVal.from(lifetimeEarnings);
  const minThreshold = BigVal.from(threshold);
  if (minThreshold.lte(0)) {
    throw new RangeError('Prestige threshold must be strictly positive');
  }
  if (earnings.lt(minThreshold)) {
    return BigVal.zero();
  }
  return earnings.div(minThreshold).sqrt().mul(scaleFactor).floor();
}

/** Net newly claimable shares upon soft reset after subtracting previously claimed shares. */
export function calculateClaimablePrestigeShares(
  lifetimeEarnings: BigValInput,
  alreadyClaimed: BigValInput,
  threshold: BigValInput,
  scaleFactor = 10
): BigVal {
  const total = calculateTotalPrestigeShares(lifetimeEarnings, threshold, scaleFactor);
  return total.subClamped(alreadyClaimed);
}

