import {
  calculateBulkCost,
  calculateMaxAffordable
} from '@reality-corp/economy-engine';
import type { BuildingConfig, WorldConfig } from '@reality-corp/game-config';
import type { GameCommand } from '@reality-corp/shared-types';
import type { TypedEventBus, SimulationEvent } from './event-bus.js';
import {
  DEFAULT_SIMULATION_MODIFIERS,
  recalculateRates,
  type SimulationModifiers,
  type WorldSimulationState
} from './state.js';

export interface CommandApplyResult {
  readonly accepted: boolean;
  readonly reason?: string;
}

const MAX_TAP_BATCH = 50;
const MAX_LOCAL_FOCUS_BOOST_SEC = 1800;

function readStringProp(payload: Record<string, unknown>, key: string): string | null {
  const val = payload[key];
  return typeof val === 'string' && val.length > 0 ? val : null;
}

function readBooleanProp(payload: Record<string, unknown>, key: string): boolean | null {
  const val = payload[key];
  return typeof val === 'boolean' ? val : null;
}

function resolvePurchaseQuantity(raw: unknown): 1 | 10 | 100 | 'max' | null {
  if (raw === 1 || raw === 10 || raw === 100 || raw === 'max') {
    return raw;
  }
  return null;
}

function isBuildingUnlocked(building: BuildingConfig, state: WorldSimulationState): boolean {
  const currentLevel = state.buildings[building.id] ?? 0;
  return currentLevel > 0 || state.lifetimeEarnings.gte(building.unlockLifetimeCash);
}

function handleTapCompute(
  state: WorldSimulationState,
  payload: Record<string, unknown>,
  config: WorldConfig,
  modifiers: SimulationModifiers
): CommandApplyResult {
  const rawCount = typeof payload['tapCount'] === 'number' ? Math.trunc(payload['tapCount']) : 1;
  if (rawCount <= 0) {
    return { accepted: false, reason: 'tapCount must be positive' };
  }
  if (state.ratesDirty) {
    recalculateRates(state, config, modifiers);
  }
  const tapCount = Math.min(MAX_TAP_BATCH, rawCount);
  const earned = state.rates.tapCashPerClick.mul(tapCount);
  state.cash = state.cash.add(earned);
  state.lifetimeEarnings = state.lifetimeEarnings.add(earned);
  return { accepted: true };
}

function handleBuyBuilding(
  state: WorldSimulationState,
  payload: Record<string, unknown>,
  config: WorldConfig,
  modifiers: SimulationModifiers
): CommandApplyResult {
  const buildingId = readStringProp(payload, 'buildingId');
  const quantity = resolvePurchaseQuantity(payload['quantity']);
  if (!buildingId || quantity === null) {
    return { accepted: false, reason: 'Invalid buildingId or quantity' };
  }
  const building = config.buildings.find((b) => b.id === buildingId);
  if (!building) {
    return { accepted: false, reason: `Unknown building ${buildingId}` };
  }
  if (!isBuildingUnlocked(building, state)) {
    return { accepted: false, reason: `Building ${buildingId} is still locked` };
  }

  const currentLevel = state.buildings[building.id] ?? 0;
  const count =
    quantity === 'max'
      ? calculateMaxAffordable(state.cash, building.baseCostCash, building.growthRate, currentLevel)
      : quantity;

  if (count <= 0) {
    return { accepted: false, reason: 'Insufficient funds for building upgrade' };
  }

  const cost = calculateBulkCost(building.baseCostCash, building.growthRate, currentLevel, count);
  if (state.cash.lt(cost)) {
    return { accepted: false, reason: 'Insufficient funds for building upgrade' };
  }

  state.cash = state.cash.subClamped(cost);
  state.buildings[building.id] = currentLevel + count;
  recalculateRates(state, config, modifiers);
  return { accepted: true };
}

function handleUnlockResearch(
  state: WorldSimulationState,
  payload: Record<string, unknown>,
  config: WorldConfig
): CommandApplyResult {
  const researchId = readStringProp(payload, 'researchId');
  if (!researchId) {
    return { accepted: false, reason: 'Missing researchId' };
  }
  if (state.unlockedResearch.includes(researchId)) {
    return { accepted: false, reason: `Research ${researchId} already unlocked` };
  }
  const node = config.research.find((r) => r.id === researchId);
  if (!node) {
    return { accepted: false, reason: `Unknown research ${researchId}` };
  }
  for (const prereq of node.prerequisites) {
    if (!state.unlockedResearch.includes(prereq)) {
      return { accepted: false, reason: `Missing prerequisite ${prereq}` };
    }
  }
  if (state.data.lt(node.costDataShards)) {
    return { accepted: false, reason: 'Insufficient Data Shards' };
  }

  state.data = state.data.subClamped(node.costDataShards);
  state.unlockedResearch.push(researchId);
  state.ratesDirty = true;
  return { accepted: true };
}

function handleHireManager(
  state: WorldSimulationState,
  payload: Record<string, unknown>,
  config: WorldConfig
): CommandApplyResult {
  const managerId = readStringProp(payload, 'managerId');
  if (!managerId) {
    return { accepted: false, reason: 'Missing managerId' };
  }
  if (state.hiredManagers.includes(managerId)) {
    return { accepted: false, reason: `Manager ${managerId} already hired` };
  }
  const manager = config.managers.find((m) => m.id === managerId);
  if (!manager) {
    return { accepted: false, reason: `Unknown manager ${managerId}` };
  }
  if (state.cash.lt(manager.hireCostCash)) {
    return { accepted: false, reason: 'Insufficient funds to hire manager' };
  }

  state.cash = state.cash.subClamped(manager.hireCostCash);
  state.hiredManagers.push(managerId);
  state.managerStates[managerId] = {
    active: true,
    cooldownRemainingSec: manager.cooldownSec
  };
  return { accepted: true };
}

function handleToggleManager(
  state: WorldSimulationState,
  payload: Record<string, unknown>,
  config: WorldConfig
): CommandApplyResult {
  const managerId = readStringProp(payload, 'managerId');
  const active = readBooleanProp(payload, 'active');
  if (!managerId || active === null) {
    return { accepted: false, reason: 'Invalid toggle payload' };
  }
  if (!state.hiredManagers.includes(managerId)) {
    return { accepted: false, reason: `Manager ${managerId} is not hired` };
  }
  const def = config.managers.find((m) => m.id === managerId);
  const existing = state.managerStates[managerId];
  state.managerStates[managerId] = {
    active,
    cooldownRemainingSec: existing ? existing.cooldownRemainingSec : (def?.cooldownSec ?? 5)
  };
  return { accepted: true };
}

function handleClaimReward(
  state: WorldSimulationState,
  payload: Record<string, unknown>
): CommandApplyResult {
  const claimKey = readStringProp(payload, 'claimKey');
  const rewardCash = typeof payload['rewardCash'] === 'number' ? payload['rewardCash'] : 0;
  const rewardData = typeof payload['rewardDataShards'] === 'number' ? payload['rewardDataShards'] : 0;
  if (!claimKey || rewardCash < 0 || rewardData < 0) {
    return { accepted: false, reason: 'Invalid claim payload' };
  }
  if (state.claimedRewards.includes(claimKey)) {
    return { accepted: false, reason: `Reward ${claimKey} already claimed` };
  }

  state.claimedRewards.push(claimKey);
  if (rewardCash > 0) {
    state.cash = state.cash.add(rewardCash);
    state.lifetimeEarnings = state.lifetimeEarnings.add(rewardCash);
  }
  if (rewardData > 0) {
    state.data = state.data.add(rewardData);
  }
  return { accepted: true };
}

function handleCompleteLocalFocus(
  state: WorldSimulationState,
  payload: Record<string, unknown>,
  config: WorldConfig,
  modifiers: SimulationModifiers
): CommandApplyResult {
  const rawBoost =
    typeof payload['boostDurationSec'] === 'number' ? Math.trunc(payload['boostDurationSec']) : 900;
  const clampedBoost = Math.max(60, Math.min(MAX_LOCAL_FOCUS_BOOST_SEC, rawBoost));
  state.focusBoostRemainingSec = clampedBoost;
  state.focusMultiplier = config.focusBoostMultiplier;
  recalculateRates(state, config, modifiers);
  return { accepted: true };
}

/**
 * Applies a deterministic player command to the simulation state and emits
 * `command_applied` upon acceptance.
 */
export function dispatchGameCommand(
  state: WorldSimulationState,
  command: GameCommand,
  config: WorldConfig,
  modifiers: SimulationModifiers = DEFAULT_SIMULATION_MODIFIERS,
  bus?: TypedEventBus<SimulationEvent>
): CommandApplyResult {
  let result: CommandApplyResult;

  switch (command.type) {
    case 'TAP_COMPUTE':
      result = handleTapCompute(state, command.payload, config, modifiers);
      break;
    case 'BUY_BUILDING_UPGRADE':
      result = handleBuyBuilding(state, command.payload, config, modifiers);
      break;
    case 'UNLOCK_RESEARCH':
      result = handleUnlockResearch(state, command.payload, config);
      break;
    case 'HIRE_MANAGER':
      result = handleHireManager(state, command.payload, config);
      break;
    case 'TOGGLE_MANAGER':
      result = handleToggleManager(state, command.payload, config);
      break;
    case 'CLAIM_REWARD':
      result = handleClaimReward(state, command.payload);
      break;
    case 'COMPLETE_LOCAL_FOCUS':
      result = handleCompleteLocalFocus(state, command.payload, config, modifiers);
      break;
  }

  if (result.accepted) {
    state.lastSyncedSeq = Math.max(state.lastSyncedSeq, command.seq);
    bus?.emit({
      type: 'command_applied',
      commandType: command.type,
      seq: command.seq
    });
  }
  return result;
}

