import type { WorldId } from '@reality-corp/shared-types';
import { APEX_SYNDICATE_CONFIG } from './apex-syndicate.js';
import { WorldConfigSchema, type WorldConfig } from './schemas.js';

const CHRONO_FORGE_STUB: WorldConfig = WorldConfigSchema.parse({
  worldId: 'chrono-forge',
  displayName: 'Chrono Forge (Post-MVP)',
  isPlayableInMvp: false,
  baseEnergySupplyKw: 50,
  baseTapCash: 10,
  prestigeThresholdCash: 1_000_000_000,
  prestigeScaleFactor: 10,
  prestigeBonusPerShare: 0.05,
  maxBaseOfflineSec: 28_800,
  baseOfflineEfficiency: 0.75,
  focusBoostMultiplier: 2.0,
  buildings: [],
  research: [],
  managers: [],
  missions: [],
  achievements: []
});

const SOVEREIGN_ISLAND_STUB: WorldConfig = WorldConfigSchema.parse({
  worldId: 'sovereign-island',
  displayName: 'Sovereign Island (Post-MVP)',
  isPlayableInMvp: false,
  baseEnergySupplyKw: 100,
  baseTapCash: 25,
  prestigeThresholdCash: 1_000_000_000_000,
  prestigeScaleFactor: 10,
  prestigeBonusPerShare: 0.05,
  maxBaseOfflineSec: 28_800,
  baseOfflineEfficiency: 0.75,
  focusBoostMultiplier: 2.0,
  buildings: [],
  research: [],
  managers: [],
  missions: [],
  achievements: []
});

export const WORLD_CATALOG: Readonly<Record<WorldId, WorldConfig>> = {
  'apex-syndicate': APEX_SYNDICATE_CONFIG,
  'chrono-forge': CHRONO_FORGE_STUB,
  'sovereign-island': SOVEREIGN_ISLAND_STUB
};

/** Looks up validated configuration for `worldId`, throwing if playable MVP access is blocked. */
export function getWorldConfig(worldId: WorldId): WorldConfig {
  return WORLD_CATALOG[worldId];
}

