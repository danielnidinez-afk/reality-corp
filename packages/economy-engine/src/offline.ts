import { BigVal, type BigValInput } from './big-val.js';

export interface OfflineProgressInput {
  readonly elapsedSec: number;
  readonly cashPerSec: BigValInput;
  readonly dataPerSec: BigValInput;
  readonly maxOfflineCapSec?: number;
  readonly offlineEfficiency?: number;
  /** Optional macro-step count (clamped between 1 and 100) for coupled simulations. */
  readonly macroSteps?: number;
}

export interface OfflineProgressResult {
  readonly effectiveElapsedSec: number;
  readonly clockTampered: boolean;
  readonly cashEarned: BigVal;
  readonly dataEarned: BigVal;
  readonly stepsExecuted: number;
}

const DEFAULT_MAX_OFFLINE_SEC = 28_800; // 8 hours
const DEFAULT_OFFLINE_EFFICIENCY = 0.75;
const MAX_OFFLINE_MACRO_STEPS = 100;

/**
 * Computes analytical offline progress in $O(1)$ (or max 100 macro-steps) with
 * negative clock-tamper rejection and configurable cap/efficiency limits.
 */
export function calculateOfflineProgress(input: OfflineProgressInput): OfflineProgressResult {
  if (!Number.isFinite(input.elapsedSec)) {
    throw new RangeError(`elapsedSec must be finite, received ${input.elapsedSec}`);
  }
  if (input.elapsedSec <= 0) {
    return {
      effectiveElapsedSec: 0,
      clockTampered: input.elapsedSec < 0,
      cashEarned: BigVal.zero(),
      dataEarned: BigVal.zero(),
      stepsExecuted: 0
    };
  }

  const maxCap = input.maxOfflineCapSec ?? DEFAULT_MAX_OFFLINE_SEC;
  const efficiency = input.offlineEfficiency ?? DEFAULT_OFFLINE_EFFICIENCY;
  if (maxCap <= 0 || efficiency < 0 || efficiency > 1) {
    throw new RangeError('Invalid offline cap or efficiency parameter');
  }

  const effectiveElapsedSec = Math.min(input.elapsedSec, maxCap);
  const steps = Math.max(1, Math.min(MAX_OFFLINE_MACRO_STEPS, Math.trunc(input.macroSteps ?? 1)));

  const cashRate = BigVal.from(input.cashPerSec);
  const dataRate = BigVal.from(input.dataPerSec);

  if (steps === 1) {
    const scalar = effectiveElapsedSec * efficiency;
    return {
      effectiveElapsedSec,
      clockTampered: false,
      cashEarned: cashRate.mul(scalar),
      dataEarned: dataRate.mul(scalar),
      stepsExecuted: 1
    };
  }

  const dtStep = effectiveElapsedSec / steps;
  let cashAcc = BigVal.zero();
  let dataAcc = BigVal.zero();
  for (let i = 0; i < steps; i += 1) {
    cashAcc = cashAcc.add(cashRate.mul(dtStep * efficiency));
    dataAcc = dataAcc.add(dataRate.mul(dtStep * efficiency));
  }

  return {
    effectiveElapsedSec,
    clockTampered: false,
    cashEarned: cashAcc,
    dataEarned: dataAcc,
    stepsExecuted: steps
  };
}

