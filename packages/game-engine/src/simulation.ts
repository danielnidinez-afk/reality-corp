import {
  calculateOfflineProgress,
  calculateSingleCost,
  type OfflineProgressResult
} from '@reality-corp/economy-engine';
import type { WorldConfig } from '@reality-corp/game-config';
import type { SimulationEvent, TypedEventBus } from './event-bus.js';
import {
  DEFAULT_SIMULATION_MODIFIERS,
  recalculateRates,
  type SimulationModifiers,
  type WorldSimulationState
} from './state.js';

const TICK_EPSILON_SEC = 1e-6;

function stepManagers(
  state: WorldSimulationState,
  dtSec: number,
  config: WorldConfig,
  bus?: TypedEventBus<SimulationEvent>
): void {
  if (state.hiredManagers.length === 0) {
    return;
  }
  for (let i = 0; i < state.hiredManagers.length; i += 1) {
    const managerId = state.hiredManagers[i];
    if (!managerId) continue;
    const runtime = state.managerStates[managerId];
    if (!runtime || !runtime.active) continue;

    runtime.cooldownRemainingSec -= dtSec;
    if (runtime.cooldownRemainingSec > TICK_EPSILON_SEC) continue;

    const def = config.managers.find((m) => m.id === managerId);
    if (!def) continue;
    runtime.cooldownRemainingSec = def.cooldownSec;

    const building = config.buildings.find((b) => b.id === def.targetBuildingId);
    if (!building) continue;

    const currentLevel = state.buildings[building.id] ?? 0;
    const isUnlocked = currentLevel > 0 || state.lifetimeEarnings.gte(building.unlockLifetimeCash);
    if (!isUnlocked) continue;

    const singleCost = calculateSingleCost(building.baseCostCash, building.growthRate, currentLevel);
    if (state.cash.gte(singleCost)) {
      state.cash = state.cash.subClamped(singleCost);
      const nextLevel = currentLevel + 1;
      state.buildings[building.id] = nextLevel;
      state.ratesDirty = true;
      bus?.emit({
        type: 'manager_upgraded',
        managerId,
        buildingId: building.id,
        newLevel: nextLevel
      });
    }
  }
}

/**
 * Advances simulation by `dtSec` seconds, updating focus boost expiry, AI manager
 * automation, and accumulated Cash / Data Shards cleanly.
 */
export function stepSimulationTick(
  state: WorldSimulationState,
  dtSec: number,
  config: WorldConfig,
  modifiers: SimulationModifiers = DEFAULT_SIMULATION_MODIFIERS,
  bus?: TypedEventBus<SimulationEvent>
): void {
  if (!Number.isFinite(dtSec) || dtSec <= 0) {
    return;
  }

  if (state.focusBoostRemainingSec > 0) {
    state.focusBoostRemainingSec = Math.max(0, state.focusBoostRemainingSec - dtSec);
    if (state.focusBoostRemainingSec <= TICK_EPSILON_SEC) {
      state.focusBoostRemainingSec = 0;
      state.focusMultiplier = 1;
      state.ratesDirty = true;
      bus?.emit({ type: 'focus_expired' });
    }
  }

  stepManagers(state, dtSec, config, bus);

  if (state.ratesDirty) {
    recalculateRates(state, config, modifiers);
  }

  if (!state.rates.cashPerSec.isZero()) {
    const earnedCash = state.rates.cashPerSec.mul(dtSec);
    state.cash = state.cash.add(earnedCash);
    state.lifetimeEarnings = state.lifetimeEarnings.add(earnedCash);
  }

  if (!state.rates.dataPerSec.isZero()) {
    const earnedData = state.rates.dataPerSec.mul(dtSec);
    state.data = state.data.add(earnedData);
  }

  bus?.emit({
    type: 'tick',
    dtSec,
    cashPerSec: state.rates.cashPerSec,
    dataPerSec: state.rates.dataPerSec,
    energyLoadFactor: state.rates.energyLoadFactor
  });
}

/**
 * Computes and credits analytical offline progress using `WorldConfig` + research
 * cap/efficiency bonuses, rejecting negative elapsed clock differences.
 */
export function applyOfflineCatchup(
  state: WorldSimulationState,
  elapsedSec: number,
  config: WorldConfig,
  modifiers: SimulationModifiers = DEFAULT_SIMULATION_MODIFIERS,
  bus?: TypedEventBus<SimulationEvent>
): OfflineProgressResult {
  if (state.ratesDirty) {
    recalculateRates(state, config, modifiers);
  }

  const maxCapSec = config.maxBaseOfflineSec + modifiers.bonusOfflineCapSec;
  const offlineEfficiency = Math.min(1, config.baseOfflineEfficiency + modifiers.bonusOfflineEfficiency);

  const result = calculateOfflineProgress({
    elapsedSec,
    cashPerSec: state.rates.cashPerSec,
    dataPerSec: state.rates.dataPerSec,
    maxOfflineCapSec: maxCapSec,
    offlineEfficiency
  });

  if (!result.clockTampered && result.effectiveElapsedSec > 0) {
    state.cash = state.cash.add(result.cashEarned);
    state.lifetimeEarnings = state.lifetimeEarnings.add(result.cashEarned);
    state.data = state.data.add(result.dataEarned);
  }

  bus?.emit({
    type: 'offline_applied',
    elapsedSec: result.effectiveElapsedSec,
    cashEarned: result.cashEarned,
    dataEarned: result.dataEarned,
    clockTampered: result.clockTampered
  });

  return result;
}
