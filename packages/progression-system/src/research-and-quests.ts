import type { MissionConfig, ResearchNodeConfig, WorldConfig } from '@reality-corp/game-config';

export interface ResearchModifiers {
  readonly cashMultiplier: number;
  readonly dataMultiplier: number;
  readonly tapMultiplier: number;
  readonly bonusOfflineCapSec: number;
  readonly bonusOfflineEfficiency: number;
}

export interface ProgressionSnapshotView {
  readonly buildings: Readonly<Record<string, number>>;
  readonly lifetimeEarningsNumber: number;
  readonly unlockedResearch: readonly string[];
  readonly prestigeCount: number;
  readonly claimedRewards: readonly string[];
}

export interface DailyChallengeDefinition {
  readonly claimKey: string;
  readonly title: string;
  readonly rewardCash: number;
  readonly rewardDataShards: number;
  readonly condition: MissionConfig['condition'];
}

/** Validates whether every prerequisite of `node` has been unlocked. */
export function arePrerequisitesMet(
  node: ResearchNodeConfig,
  unlockedResearch: readonly string[]
): boolean {
  for (const prereq of node.prerequisites) {
    if (!unlockedResearch.includes(prereq)) {
      return false;
    }
  }
  return true;
}

/** Aggregates additive bonus groups from unlocked research nodes into multipliers. */
export function computeResearchModifiers(
  unlockedResearch: readonly string[],
  config: WorldConfig
): ResearchModifiers {
  let cashBonus = 0;
  let dataBonus = 0;
  let tapBonus = 0;
  let bonusOfflineCapSec = 0;
  let bonusOfflineEfficiency = 0;

  const unlockedSet = new Set(unlockedResearch);
  for (const node of config.research) {
    if (!unlockedSet.has(node.id)) continue;
    switch (node.effect.kind) {
      case 'cash_multiplier':
        cashBonus += node.effect.value;
        break;
      case 'data_multiplier':
        dataBonus += node.effect.value;
        break;
      case 'tap_multiplier':
        tapBonus += node.effect.value;
        break;
      case 'offline_cap_bonus_sec':
        bonusOfflineCapSec += node.effect.value;
        break;
      case 'offline_efficiency_bonus':
        bonusOfflineEfficiency += node.effect.value;
        break;
    }
  }

  return {
    cashMultiplier: 1 + cashBonus,
    dataMultiplier: 1 + dataBonus,
    tapMultiplier: 1 + tapBonus,
    bonusOfflineCapSec,
    bonusOfflineEfficiency
  };
}

/** Evaluates whether a mission or achievement condition is currently satisfied. */
export function isConditionSatisfied(
  condition: MissionConfig['condition'],
  view: ProgressionSnapshotView
): boolean {
  switch (condition.kind) {
    case 'building_level':
      return (view.buildings[condition.buildingId] ?? 0) >= condition.minLevel;
    case 'lifetime_cash':
      return view.lifetimeEarningsNumber >= condition.minCash;
    case 'research_count':
      return view.unlockedResearch.length >= condition.minCount;
    case 'prestige_count':
      return view.prestigeCount >= condition.minCount;
  }
}

/** Returns deterministic UTC daily challenges for `utcDateKey` (YYYY-MM-DD). */
export function getDailyChallengesForUtcDate(
  utcDateKey: string,
  config: WorldConfig
): readonly DailyChallengeDefinition[] {
  const pool = config.missions;
  if (pool.length === 0) return [];
  let hash = 2166136261;
  for (let i = 0; i < utcDateKey.length; i += 1) {
    hash ^= utcDateKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % pool.length;
  const chosen = pool[index];
  if (!chosen) return [];
  return [
    {
      claimKey: `daily:${utcDateKey}:${chosen.id}`,
      title: `Daily: ${chosen.title}`,
      rewardCash: Math.ceil(chosen.rewardCash * 1.5),
      rewardDataShards: Math.ceil(chosen.rewardDataShards * 1.5),
      condition: chosen.condition
    }
  ];
}

