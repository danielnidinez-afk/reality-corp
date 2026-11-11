import {
  BigVal,
  calculateClaimablePrestigeShares,
  type BigValInput
} from '@reality-corp/economy-engine';
import type { WorldConfig } from '@reality-corp/game-config';

export interface PrestigePreview {
  readonly claimableShares: BigVal;
  readonly nextTotalShares: BigVal;
  readonly currentBonusMultiplier: number;
  readonly nextBonusMultiplier: number;
  readonly canPrestige: boolean;
}

/** Computes claimable Equity Shares and multiplier acceleration before performing a soft reset. */
export function computePrestigePreview(
  lifetimeEarnings: BigValInput,
  claimedShares: BigValInput,
  config: WorldConfig
): PrestigePreview {
  const alreadyClaimed = BigVal.from(claimedShares);
  const claimable = calculateClaimablePrestigeShares(
    lifetimeEarnings,
    alreadyClaimed,
    config.prestigeThresholdCash,
    config.prestigeScaleFactor
  );
  const nextTotal = alreadyClaimed.add(claimable);
  const currentBonusMultiplier = 1 + alreadyClaimed.toNumber() * config.prestigeBonusPerShare;
  const nextBonusMultiplier = 1 + nextTotal.toNumber() * config.prestigeBonusPerShare;

  return {
    claimableShares: claimable,
    nextTotalShares: nextTotal,
    currentBonusMultiplier,
    nextBonusMultiplier,
    canPrestige: claimable.gt(0)
  };
}

