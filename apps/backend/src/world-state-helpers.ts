import { BigVal } from '@reality-corp/economy-engine';
import { getWorldConfig, type WorldConfig } from '@reality-corp/game-config';
import {
  createInitialWorldState,
  fromCanonicalDTO,
  toCanonicalDTO,
  type SimulationModifiers,
  type WorldSimulationState
} from '@reality-corp/game-engine';
import {
  computePrestigePreview,
  computeResearchModifiers
} from '@reality-corp/progression-system';
import type { ApiErrorCode, CanonicalWorldStateDTO, WorldId } from '@reality-corp/shared-types';
import type { BackendRepository } from './repository.js';

export type ServiceOutcome<T> =
  | { readonly ok: true; readonly statusCode: number; readonly data: T }
  | {
      readonly ok: false;
      readonly statusCode: number;
      readonly code: ApiErrorCode;
      readonly message: string;
      readonly retryable: boolean;
      readonly canonicalState?: CanonicalWorldStateDTO;
    };

export function resolvePlayableWorld(worldId: WorldId): WorldConfig | null {
  const config = getWorldConfig(worldId);
  return config && config.isPlayableInMvp ? config : null;
}

export function buildModifiers(
  unlockedResearch: readonly string[],
  lifetimeEarnings: BigVal | { m: number; e: number },
  equityShares: BigVal | { m: number; e: number },
  config: WorldConfig
): SimulationModifiers {
  const research = computeResearchModifiers(unlockedResearch, config);
  const prestige = computePrestigePreview(lifetimeEarnings, equityShares, config);
  return {
    cashMultiplier: research.cashMultiplier,
    dataMultiplier: research.dataMultiplier,
    tapMultiplier: research.tapMultiplier,
    prestigeMultiplier: prestige.currentBonusMultiplier,
    bonusOfflineCapSec: research.bonusOfflineCapSec,
    bonusOfflineEfficiency: research.bonusOfflineEfficiency
  };
}

export function hydrateSimulation(
  dto: CanonicalWorldStateDTO,
  config: WorldConfig
): { state: WorldSimulationState; modifiers: SimulationModifiers } {
  const modifiers = buildModifiers(
    dto.unlockedResearch,
    dto.lifetimeEarnings,
    dto.equityShares,
    config
  );
  return {
    state: fromCanonicalDTO(dto, config, modifiers),
    modifiers
  };
}

export async function getOrInitWorldDTO(
  repo: BackendRepository,
  userId: string,
  config: WorldConfig,
  nowMs: number
): Promise<CanonicalWorldStateDTO> {
  const existing = await repo.getWorldState(userId, config.worldId);
  if (existing) {
    return existing;
  }
  const initial = toCanonicalDTO(createInitialWorldState(config, nowMs));
  await repo.saveWorldState(userId, initial);
  return initial;
}

export async function updateLeaderboardSnapshot(
  repo: BackendRepository,
  userId: string,
  dto: CanonicalWorldStateDTO
): Promise<void> {
  const profile = await repo.getOrCreateProfile(userId);
  const lifetime = BigVal.fromSnapshot(dto.lifetimeEarnings);
  await repo.updateLeaderboard({
    userId,
    worldId: dto.worldId,
    username: profile.username,
    scoreLog10: lifetime.isZero() ? 0 : Math.max(0, lifetime.log10()),
    equityShares: dto.equityShares,
    isVerified: dto.trustStatus === 'verified'
  });
}

