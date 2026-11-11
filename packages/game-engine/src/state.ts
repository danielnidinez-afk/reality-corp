import {
  BigVal,
  calculateEnergyLoadFactor,
  calculateMilestoneMultiplier,
  calculateProductionYield
} from '@reality-corp/economy-engine';
import type { WorldConfig } from '@reality-corp/game-config';
import type { CanonicalWorldStateDTO, WorldId } from '@reality-corp/shared-types';

export interface SimulationModifiers {
  readonly cashMultiplier: number;
  readonly dataMultiplier: number;
  readonly tapMultiplier: number;
  readonly prestigeMultiplier: number;
  readonly bonusOfflineCapSec: number;
  readonly bonusOfflineEfficiency: number;
}

export const DEFAULT_SIMULATION_MODIFIERS: SimulationModifiers = {
  cashMultiplier: 1,
  dataMultiplier: 1,
  tapMultiplier: 1,
  prestigeMultiplier: 1,
  bonusOfflineCapSec: 0,
  bonusOfflineEfficiency: 0
};

export interface ManagerRuntimeState {
  active: boolean;
  cooldownRemainingSec: number;
}

export interface GridRateSnapshot {
  energySupplyKw: number;
  energyDemandKw: number;
  energyLoadFactor: number;
  cashPerSec: BigVal;
  dataPerSec: BigVal;
  computeFlops: BigVal;
  tapCashPerClick: BigVal;
}

export interface WorldSimulationState {
  readonly worldId: WorldId;
  stateVersion: number;
  lastSyncedSeq: number;
  cash: BigVal;
  compute: BigVal;
  data: BigVal;
  lifetimeEarnings: BigVal;
  prestigeCount: number;
  equityShares: BigVal;
  buildings: Record<string, number>;
  unlockedResearch: string[];
  hiredManagers: string[];
  managerStates: Record<string, ManagerRuntimeState>;
  claimedRewards: string[];
  focusBoostRemainingSec: number;
  focusMultiplier: number;
  lastServerTickAtMs: number;
  trustStatus: CanonicalWorldStateDTO['trustStatus'];
  ratesDirty: boolean;
  readonly rates: GridRateSnapshot;
}

function buildInitialManagerStates(
  hiredManagers: readonly string[],
  config: WorldConfig
): Record<string, ManagerRuntimeState> {
  const states: Record<string, ManagerRuntimeState> = {};
  for (const mgrId of hiredManagers) {
    const def = config.managers.find((item) => item.id === mgrId);
    states[mgrId] = {
      active: true,
      cooldownRemainingSec: def ? def.cooldownSec : 5
    };
  }
  return states;
}

function createZeroRates(config: WorldConfig): GridRateSnapshot {
  return {
    energySupplyKw: config.baseEnergySupplyKw,
    energyDemandKw: 0,
    energyLoadFactor: 1,
    cashPerSec: BigVal.zero(),
    dataPerSec: BigVal.zero(),
    computeFlops: BigVal.zero(),
    tapCashPerClick: BigVal.from(config.baseTapCash)
  };
}

/** Creates a fresh initial runtime world state aligned with `config`. */
export function createInitialWorldState(
  config: WorldConfig,
  nowMs = Date.now(),
  modifiers: SimulationModifiers = DEFAULT_SIMULATION_MODIFIERS
): WorldSimulationState {
  const buildings: Record<string, number> = {};
  for (const building of config.buildings) {
    buildings[building.id] = 0;
  }

  const state: WorldSimulationState = {
    worldId: config.worldId,
    stateVersion: 1,
    lastSyncedSeq: 0,
    cash: BigVal.zero(),
    compute: BigVal.zero(),
    data: BigVal.zero(),
    lifetimeEarnings: BigVal.zero(),
    prestigeCount: 0,
    equityShares: BigVal.zero(),
    buildings,
    unlockedResearch: [],
    hiredManagers: [],
    managerStates: {},
    claimedRewards: [],
    focusBoostRemainingSec: 0,
    focusMultiplier: 1,
    lastServerTickAtMs: Math.max(0, Math.trunc(nowMs)),
    trustStatus: 'verified',
    ratesDirty: true,
    rates: createZeroRates(config)
  };

  recalculateRates(state, config, modifiers);
  return state;
}

/** Hydrates mutable simulation state from a validated canonical wire DTO. */
export function fromCanonicalDTO(
  dto: CanonicalWorldStateDTO,
  config: WorldConfig,
  modifiers: SimulationModifiers = DEFAULT_SIMULATION_MODIFIERS
): WorldSimulationState {
  const buildings: Record<string, number> = {};
  for (const building of config.buildings) {
    buildings[building.id] = dto.buildings[building.id] ?? 0;
  }

  const state: WorldSimulationState = {
    worldId: dto.worldId,
    stateVersion: dto.stateVersion,
    lastSyncedSeq: dto.lastSyncedSeq,
    cash: BigVal.fromSnapshot(dto.cash),
    compute: BigVal.fromSnapshot(dto.compute),
    data: BigVal.fromSnapshot(dto.data),
    lifetimeEarnings: BigVal.fromSnapshot(dto.lifetimeEarnings),
    prestigeCount: dto.prestigeCount,
    equityShares: BigVal.fromSnapshot(dto.equityShares),
    buildings,
    unlockedResearch: [...dto.unlockedResearch],
    hiredManagers: [...dto.hiredManagers],
    managerStates: buildInitialManagerStates(dto.hiredManagers, config),
    claimedRewards: [...dto.claimedRewards],
    focusBoostRemainingSec: 0,
    focusMultiplier: 1,
    lastServerTickAtMs: dto.lastServerTickAtMs,
    trustStatus: dto.trustStatus,
    ratesDirty: true,
    rates: createZeroRates(config)
  };

  recalculateRates(state, config, modifiers);
  return state;
}

/** Serializes the runtime state to a canonical DTO compatible with API and local save schemas. */
export function toCanonicalDTO(state: WorldSimulationState): CanonicalWorldStateDTO {
  return {
    worldId: state.worldId,
    stateVersion: state.stateVersion,
    lastSyncedSeq: state.lastSyncedSeq,
    cash: state.cash.toSnapshot(),
    compute: state.compute.toSnapshot(),
    data: state.data.toSnapshot(),
    lifetimeEarnings: state.lifetimeEarnings.toSnapshot(),
    prestigeCount: state.prestigeCount,
    equityShares: state.equityShares.toSnapshot(),
    buildings: { ...state.buildings },
    unlockedResearch: [...state.unlockedResearch],
    hiredManagers: [...state.hiredManagers],
    claimedRewards: [...state.claimedRewards],
    lastServerTickAtMs: state.lastServerTickAtMs,
    trustStatus: state.trustStatus
  };
}

/** Recomputes energy balance, brownout load factor, production rates, and tap output. */
export function recalculateRates(
  state: WorldSimulationState,
  config: WorldConfig,
  modifiers: SimulationModifiers = DEFAULT_SIMULATION_MODIFIERS
): GridRateSnapshot {
  let energySupplyKw = config.baseEnergySupplyKw;
  let energyDemandKw = 0;

  for (const building of config.buildings) {
    const level = state.buildings[building.id] ?? 0;
    if (level <= 0) continue;
    const totalDelta = building.energyKwDelta * level;
    if (totalDelta >= 0) {
      energySupplyKw += totalDelta;
    } else {
      energyDemandKw += -totalDelta;
    }
  }

  const eta = calculateEnergyLoadFactor(energySupplyKw, energyDemandKw);
  const focusMul = state.focusBoostRemainingSec > 0 ? state.focusMultiplier : 1;

  let cashPerSec = BigVal.zero();
  let dataPerSec = BigVal.zero();
  let computeFlops = BigVal.zero();

  for (const building of config.buildings) {
    const level = state.buildings[building.id] ?? 0;
    if (level <= 0) continue;
    const milestoneMul = calculateMilestoneMultiplier(level);

    if (building.baseCashPerSec > 0) {
      cashPerSec = cashPerSec.add(
        calculateProductionYield({
          baseYieldPerUnit: building.baseCashPerSec,
          level,
          energyLoadFactor: eta,
          milestoneMultiplier: milestoneMul,
          researchMultiplier: modifiers.cashMultiplier,
          prestigeMultiplier: modifiers.prestigeMultiplier,
          focusMultiplier: focusMul
        })
      );
    }

    if (building.baseDataPerSec > 0) {
      dataPerSec = dataPerSec.add(
        calculateProductionYield({
          baseYieldPerUnit: building.baseDataPerSec,
          level,
          energyLoadFactor: eta,
          milestoneMultiplier: milestoneMul,
          researchMultiplier: modifiers.dataMultiplier,
          prestigeMultiplier: modifiers.prestigeMultiplier,
          focusMultiplier: focusMul
        })
      );
    }

    if (building.baseComputeFlops > 0) {
      computeFlops = computeFlops.add(
        calculateProductionYield({
          baseYieldPerUnit: building.baseComputeFlops,
          level,
          energyLoadFactor: eta,
          milestoneMultiplier: milestoneMul,
          researchMultiplier: 1,
          prestigeMultiplier: modifiers.prestigeMultiplier,
          focusMultiplier: 1
        })
      );
    }
  }

  const tapCashPerClick = BigVal.from(config.baseTapCash).mul(
    modifiers.tapMultiplier * modifiers.prestigeMultiplier * focusMul
  );

  state.rates.energySupplyKw = energySupplyKw;
  state.rates.energyDemandKw = energyDemandKw;
  state.rates.energyLoadFactor = eta;
  state.rates.cashPerSec = cashPerSec;
  state.rates.dataPerSec = dataPerSec;
  state.rates.computeFlops = computeFlops;
  state.rates.tapCashPerClick = tapCashPerClick;
  state.compute = computeFlops;
  state.ratesDirty = false;

  return state.rates;
}

