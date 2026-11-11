import { BigVal, calculateBulkCost, calculateMaxAffordable } from '@reality-corp/economy-engine';
import type { WorldConfig } from '@reality-corp/game-config';
import {
  arePrerequisitesMet,
  computePrestigePreview,
  getDailyChallengesForUtcDate,
  type DailyChallengeDefinition,
  type PrestigePreview
} from '@reality-corp/progression-system';
import type { RealitySyncSession } from '@reality-corp/reality-sync';
import type { BigValDTO } from '@reality-corp/shared-types';

export type GameTab = 'ops' | 'rnd' | 'missions' | 'worlds';
export type BuyQuantity = 1 | 10 | 100 | 'max';

export interface HudProjection {
  cash: BigValDTO;
  cashPerSec: BigValDTO;
  computeFlops: BigValDTO;
  data: BigValDTO;
  dataPerSec: BigValDTO;
  lifetimeEarnings: BigValDTO;
  tapCash: BigValDTO;
  energySupplyKw: number;
  energyDemandKw: number;
  energyLoadFactor: number;
  buildings: Record<string, number>;
  unlockedResearch: string[];
  hiredManagers: string[];
  managerActive: Record<string, boolean>;
  claimedRewards: string[];
  prestigeCount: number;
  equityShares: BigValDTO;
  focusBoostRemainingSec: number;
  prestigePreview: PrestigePreview;
  dailyChallenges: readonly DailyChallengeDefinition[];
}

export interface OfflineModalState {
  elapsedSec: number;
  cashEarned: BigValDTO;
  dataEarned: BigValDTO;
  recoveredFromBackup: boolean;
}

export function getUtcDateKey(): string {
  return new Date(Date.now()).toISOString().slice(0, 10);
}

export function createInitialProjection(config: WorldConfig): HudProjection {
  const zero = BigVal.zero().toSnapshot();
  return {
    cash: zero,
    cashPerSec: zero,
    computeFlops: zero,
    data: zero,
    dataPerSec: zero,
    lifetimeEarnings: zero,
    tapCash: BigVal.from(config.baseTapCash).toSnapshot(),
    energySupplyKw: config.baseEnergySupplyKw,
    energyDemandKw: 0,
    energyLoadFactor: 1,
    buildings: Object.fromEntries(config.buildings.map((b) => [b.id, 0])),
    unlockedResearch: [],
    hiredManagers: [],
    managerActive: {},
    claimedRewards: [],
    prestigeCount: 0,
    equityShares: zero,
    focusBoostRemainingSec: 0,
    prestigePreview: computePrestigePreview(0, 0, config),
    dailyChallenges: getDailyChallengesForUtcDate(getUtcDateKey(), config)
  };
}

export function projectSessionToHud(session: RealitySyncSession, config: WorldConfig): HudProjection {
  const s = session.state;
  const managerActive: Record<string, boolean> = {};
  for (const mgrId of s.hiredManagers) {
    managerActive[mgrId] = s.managerStates[mgrId]?.active ?? true;
  }

  return {
    cash: s.cash.toSnapshot(),
    cashPerSec: s.rates.cashPerSec.toSnapshot(),
    computeFlops: s.rates.computeFlops.toSnapshot(),
    data: s.data.toSnapshot(),
    dataPerSec: s.rates.dataPerSec.toSnapshot(),
    lifetimeEarnings: s.lifetimeEarnings.toSnapshot(),
    tapCash: s.rates.tapCashPerClick.toSnapshot(),
    energySupplyKw: s.rates.energySupplyKw,
    energyDemandKw: s.rates.energyDemandKw,
    energyLoadFactor: s.rates.energyLoadFactor,
    buildings: { ...s.buildings },
    unlockedResearch: [...s.unlockedResearch],
    hiredManagers: [...s.hiredManagers],
    managerActive,
    claimedRewards: [...s.claimedRewards],
    prestigeCount: s.prestigeCount,
    equityShares: s.equityShares.toSnapshot(),
    focusBoostRemainingSec: s.focusBoostRemainingSec,
    prestigePreview: session.getPrestigePreview(),
    dailyChallenges: getDailyChallengesForUtcDate(getUtcDateKey(), config)
  };
}

export function computeBuildingBuyQuote(
  hud: HudProjection,
  config: WorldConfig,
  buildingId: string,
  buyQuantity: BuyQuantity
): { count: number; cost: BigVal; affordable: boolean } {
  const def = config.buildings.find((b) => b.id === buildingId);
  if (!def) {
    return { count: 0, cost: BigVal.zero(), affordable: false };
  }
  const currentLevel = hud.buildings[buildingId] ?? 0;
  const wealth = BigVal.fromSnapshot(hud.cash);
  const count =
    buyQuantity === 'max'
      ? Math.max(1, calculateMaxAffordable(wealth, def.baseCostCash, def.growthRate, currentLevel))
      : buyQuantity;
  const cost = calculateBulkCost(def.baseCostCash, def.growthRate, currentLevel, count);
  return { count, cost, affordable: wealth.gte(cost) };
}

export function isResearchNodeReady(
  hud: HudProjection,
  config: WorldConfig,
  researchId: string
): boolean {
  const node = config.research.find((r) => r.id === researchId);
  if (!node) return false;
  return (
    !hud.unlockedResearch.includes(researchId) &&
    arePrerequisitesMet(node, hud.unlockedResearch) &&
    BigVal.fromSnapshot(hud.data).gte(node.costDataShards)
  );
}
