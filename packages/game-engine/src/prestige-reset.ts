import { BigVal } from '@reality-corp/economy-engine';
import type { WorldConfig } from '@reality-corp/game-config';
import type { SimulationEvent, TypedEventBus } from './event-bus.js';
import {
  DEFAULT_SIMULATION_MODIFIERS,
  recalculateRates,
  type SimulationModifiers,
  type WorldSimulationState
} from './state.js';

/** Performs an IPO / soft-reset prestige, granting permanent Equity Shares and resetting run assets. */
export function performPrestigeReset(
  state: WorldSimulationState,
  gainedShares: BigVal,
  config: WorldConfig,
  modifiers: SimulationModifiers = DEFAULT_SIMULATION_MODIFIERS,
  bus?: TypedEventBus<SimulationEvent>
): boolean {
  if (gainedShares.lte(0)) {
    return false;
  }
  state.equityShares = state.equityShares.add(gainedShares);
  state.prestigeCount += 1;
  state.cash = BigVal.zero();
  state.data = BigVal.zero();
  state.unlockedResearch = [];
  state.hiredManagers = [];
  state.managerStates = {};
  state.focusBoostRemainingSec = 0;
  state.focusMultiplier = 1;
  for (const building of config.buildings) {
    state.buildings[building.id] = 0;
  }
  recalculateRates(state, config, modifiers);
  bus?.emit({
    type: 'prestige_completed',
    prestigeCount: state.prestigeCount,
    gainedShares
  });
  return true;
}

