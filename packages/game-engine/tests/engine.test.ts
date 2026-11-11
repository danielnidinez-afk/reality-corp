import { describe, expect, it, vi } from 'vitest';
import { APEX_SYNDICATE_CONFIG } from '@reality-corp/game-config';
import {
  applyOfflineCatchup,
  createInitialWorldState,
  DEFAULT_SIMULATION_MODIFIERS,
  dispatchGameCommand,
  fromCanonicalDTO,
  performPrestigeReset,
  stepSimulationTick,
  toCanonicalDTO,
  TypedEventBus
} from '@reality-corp/game-engine';
import { BigVal } from '@reality-corp/economy-engine';

describe('packages/game-engine simulation', () => {
  it('processes manual taps, building upgrades, and energy brownout throttling', () => {
    const bus = new TypedEventBus();
    const events: string[] = [];
    const unsubscribe = bus.subscribe((e) => events.push(e.type));

    const state = createInitialWorldState(APEX_SYNDICATE_CONFIG, 1_000);
    for (let i = 1; i <= 10; i += 1) {
      const tapRes = dispatchGameCommand(
        state,
        {
          idempotencyKey: `00000000-0000-4000-8000-0000000000${String(i).padStart(2, '0')}`,
          seq: i,
          type: 'TAP_COMPUTE',
          payload: { tapCount: 1 },
          clientTimestampMs: 1_000 + i
        },
        APEX_SYNDICATE_CONFIG,
        DEFAULT_SIMULATION_MODIFIERS,
        bus
      );
      expect(tapRes.accepted).toBe(true);
    }
    expect(state.cash.toNumber()).toBeCloseTo(10, 5);

    const buyGarage = dispatchGameCommand(
      state,
      {
        idempotencyKey: '00000000-0000-4000-8000-000000000101',
        seq: 11,
        type: 'BUY_BUILDING_UPGRADE',
        payload: { buildingId: 'garage_server', quantity: 1 },
        clientTimestampMs: 2_000
      },
      APEX_SYNDICATE_CONFIG,
      DEFAULT_SIMULATION_MODIFIERS,
      bus
    );
    expect(buyGarage.accepted).toBe(true);
    expect(state.buildings['garage_server']).toBe(1);
    expect(state.rates.cashPerSec.toNumber()).toBeCloseTo(1.5, 5);

    // Inject enough lifetime cash and force 4 GPU racks (-32 kW vs 20 kW base => eta = 20/32 = 0.625)
    state.cash = BigVal.from(5_000);
    state.lifetimeEarnings = BigVal.from(5_000);
    const buyGpus = dispatchGameCommand(
      state,
      {
        idempotencyKey: '00000000-0000-4000-8000-000000000102',
        seq: 12,
        type: 'BUY_BUILDING_UPGRADE',
        payload: { buildingId: 'gpu_rack', quantity: 1 },
        clientTimestampMs: 2_100
      },
      APEX_SYNDICATE_CONFIG
    );
    expect(buyGpus.accepted).toBe(true);
    expect(state.rates.energyLoadFactor).toBe(1);

    // Buy 3 more GPU racks to push demand to 32 kW (> 20 kW supply)
    for (let k = 0; k < 3; k += 1) {
      dispatchGameCommand(
        state,
        {
          idempotencyKey: `00000000-0000-4000-8000-00000000020${k}`,
          seq: 13 + k,
          type: 'BUY_BUILDING_UPGRADE',
          payload: { buildingId: 'gpu_rack', quantity: 1 },
          clientTimestampMs: 2_200 + k
        },
        APEX_SYNDICATE_CONFIG
      );
    }
    expect(state.rates.energyDemandKw).toBe(32);
    expect(state.rates.energyLoadFactor).toBeCloseTo(20 / 32, 6);
    expect(events).toContain('command_applied');
    unsubscribe();
  });

  it('executes AI manager automation on cooldown and supports pause toggle', () => {
    vi.useFakeTimers();
    const state = createInitialWorldState(APEX_SYNDICATE_CONFIG, 0);
    state.cash = BigVal.from(1_000);
    state.lifetimeEarnings = BigVal.from(1_000);

    const hire = dispatchGameCommand(
      state,
      {
        idempotencyKey: '00000000-0000-4000-8000-000000000301',
        seq: 1,
        type: 'HIRE_MANAGER',
        payload: { managerId: 'mgr_garage' },
        clientTimestampMs: 100
      },
      APEX_SYNDICATE_CONFIG
    );
    expect(hire.accepted).toBe(true);
    expect(state.cash.toNumber()).toBeCloseTo(500, 5);

    const bus = new TypedEventBus();
    let upgrades = 0;
    bus.subscribe((ev) => {
      if (ev.type === 'manager_upgraded') upgrades += 1;
    });

    for (let tick = 0; tick < 50; tick += 1) {
      stepSimulationTick(state, 0.1, APEX_SYNDICATE_CONFIG, DEFAULT_SIMULATION_MODIFIERS, bus);
    }
    expect(upgrades).toBe(1);
    expect(state.buildings['garage_server']).toBe(1);

    dispatchGameCommand(
      state,
      {
        idempotencyKey: '00000000-0000-4000-8000-000000000302',
        seq: 2,
        type: 'TOGGLE_MANAGER',
        payload: { managerId: 'mgr_garage', active: false },
        clientTimestampMs: 600
      },
      APEX_SYNDICATE_CONFIG
    );

    for (let tick = 0; tick < 60; tick += 1) {
      stepSimulationTick(state, 0.1, APEX_SYNDICATE_CONFIG, DEFAULT_SIMULATION_MODIFIERS, bus);
    }
    expect(state.buildings['garage_server']).toBe(1);
    vi.useRealTimers();
  });

  it('handles focus boost, offline catchup with tamper guard, DTO roundtrip, and prestige reset', () => {
    const state = createInitialWorldState(APEX_SYNDICATE_CONFIG, 0);
    state.cash = BigVal.from(500);
    state.lifetimeEarnings = BigVal.from(2_000_000);

    dispatchGameCommand(
      state,
      {
        idempotencyKey: '00000000-0000-4000-8000-000000000401',
        seq: 1,
        type: 'BUY_BUILDING_UPGRADE',
        payload: { buildingId: 'garage_server', quantity: 10 },
        clientTimestampMs: 10
      },
      APEX_SYNDICATE_CONFIG
    );
    const baseRate = state.rates.cashPerSec.toNumber();

    dispatchGameCommand(
      state,
      {
        idempotencyKey: '00000000-0000-4000-8000-000000000402',
        seq: 2,
        type: 'COMPLETE_LOCAL_FOCUS',
        payload: { boostDurationSec: 60 },
        clientTimestampMs: 20
      },
      APEX_SYNDICATE_CONFIG
    );
    expect(state.rates.cashPerSec.toNumber()).toBeCloseTo(baseRate * 2, 5);

    stepSimulationTick(state, 60, APEX_SYNDICATE_CONFIG);
    expect(state.focusBoostRemainingSec).toBe(0);
    expect(state.rates.cashPerSec.toNumber()).toBeCloseTo(baseRate, 5);

    const tamper = applyOfflineCatchup(state, -300, APEX_SYNDICATE_CONFIG);
    expect(tamper.clockTampered).toBe(true);
    expect(tamper.cashEarned.isZero()).toBe(true);

    const dto = toCanonicalDTO(state);
    const rehydrated = fromCanonicalDTO(dto, APEX_SYNDICATE_CONFIG);
    expect(rehydrated.buildings['garage_server']).toBe(10);

    const resetDone = performPrestigeReset(rehydrated, BigVal.from(14), APEX_SYNDICATE_CONFIG);
    expect(resetDone).toBe(true);
    expect(rehydrated.prestigeCount).toBe(1);
    expect(rehydrated.equityShares.toNumber()).toBe(14);
    expect(rehydrated.buildings['garage_server']).toBe(0);
  });
});

