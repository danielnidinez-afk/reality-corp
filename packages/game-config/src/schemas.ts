import { z } from 'zod';
import { WorldIdSchema } from '@reality-corp/shared-types';

export const BuildingCategorySchema = z.enum(['compute', 'energy', 'data']);
export type BuildingCategory = z.infer<typeof BuildingCategorySchema>;

export const BuildingConfigSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    category: BuildingCategorySchema,
    baseCostCash: z.number().positive(),
    growthRate: z.number().min(1.07).max(1.15),
    baseCashPerSec: z.number().nonnegative(),
    baseComputeFlops: z.number().nonnegative(),
    baseDataPerSec: z.number().nonnegative(),
    energyKwDelta: z.number().finite(),
    unlockLifetimeCash: z.number().nonnegative()
  })
  .strict();
export type BuildingConfig = z.infer<typeof BuildingConfigSchema>;

export const ResearchEffectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('cash_multiplier'), value: z.number().positive() }).strict(),
  z.object({ kind: z.literal('data_multiplier'), value: z.number().positive() }).strict(),
  z.object({ kind: z.literal('tap_multiplier'), value: z.number().positive() }).strict(),
  z.object({ kind: z.literal('offline_cap_bonus_sec'), value: z.number().positive() }).strict(),
  z.object({ kind: z.literal('offline_efficiency_bonus'), value: z.number().positive() }).strict()
]);
export type ResearchEffect = z.infer<typeof ResearchEffectSchema>;

export const ResearchNodeConfigSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    costDataShards: z.number().positive(),
    prerequisites: z.array(z.string()),
    effect: ResearchEffectSchema
  })
  .strict();
export type ResearchNodeConfig = z.infer<typeof ResearchNodeConfigSchema>;

export const ManagerConfigSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    targetBuildingId: z.string().min(1),
    hireCostCash: z.number().positive(),
    cooldownSec: z.number().positive()
  })
  .strict();
export type ManagerConfig = z.infer<typeof ManagerConfigSchema>;

export const MissionConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('building_level'), buildingId: z.string().min(1), minLevel: z.number().int().positive() }).strict(),
  z.object({ kind: z.literal('lifetime_cash'), minCash: z.number().positive() }).strict(),
  z.object({ kind: z.literal('research_count'), minCount: z.number().int().positive() }).strict(),
  z.object({ kind: z.literal('prestige_count'), minCount: z.number().int().positive() }).strict()
]);

export const MissionConfigSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    condition: MissionConditionSchema,
    rewardCash: z.number().nonnegative(),
    rewardDataShards: z.number().nonnegative()
  })
  .strict();
export type MissionConfig = z.infer<typeof MissionConfigSchema>;

export const WorldConfigSchema = z
  .object({
    worldId: WorldIdSchema,
    displayName: z.string().min(1),
    isPlayableInMvp: z.boolean(),
    baseEnergySupplyKw: z.number().nonnegative(),
    baseTapCash: z.number().positive(),
    prestigeThresholdCash: z.number().positive(),
    prestigeScaleFactor: z.number().positive(),
    prestigeBonusPerShare: z.number().positive(),
    maxBaseOfflineSec: z.number().positive(),
    baseOfflineEfficiency: z.number().min(0.1).max(1.0),
    focusBoostMultiplier: z.number().min(1.0),
    buildings: z.array(BuildingConfigSchema),
    research: z.array(ResearchNodeConfigSchema),
    managers: z.array(ManagerConfigSchema),
    missions: z.array(MissionConfigSchema),
    achievements: z.array(MissionConfigSchema)
  })
  .strict();
export type WorldConfig = z.infer<typeof WorldConfigSchema>;

