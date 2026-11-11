import { WorldConfigSchema, type WorldConfig } from './schemas.js';

const RAW_APEX_SYNDICATE = {
  worldId: 'apex-syndicate' as const,
  displayName: 'Apex Syndicate',
  isPlayableInMvp: true,
  baseEnergySupplyKw: 20,
  baseTapCash: 1,
  prestigeThresholdCash: 1_000_000,
  prestigeScaleFactor: 10,
  prestigeBonusPerShare: 0.05,
  maxBaseOfflineSec: 28_800,
  baseOfflineEfficiency: 0.75,
  focusBoostMultiplier: 2.0,
  buildings: [
    {
      id: 'garage_server',
      name: 'Garage Inference Rig',
      description: 'Umgebaute Workstation für lokale API-Endpunkte.',
      category: 'compute' as const,
      baseCostCash: 10,
      growthRate: 1.07,
      baseCashPerSec: 1.5,
      baseComputeFlops: 10,
      baseDataPerSec: 0.25,
      energyKwDelta: 0,
      unlockLifetimeCash: 0
    },
    {
      id: 'solar_microgrid',
      name: 'Rooftop Solar Microgrid',
      description: 'Liefert sauberen Strom (+25 kW) für Server-Racks.',
      category: 'energy' as const,
      baseCostCash: 60,
      growthRate: 1.09,
      baseCashPerSec: 0,
      baseComputeFlops: 0,
      baseDataPerSec: 0,
      energyKwDelta: 25,
      unlockLifetimeCash: 25
    },
    {
      id: 'gpu_rack',
      name: 'Liquid-Cooled GPU Rack',
      description: '8x Tensor-GPUs für kommerzielles Cloud-Hosting (-8 kW).',
      category: 'compute' as const,
      baseCostCash: 120,
      growthRate: 1.1,
      baseCashPerSec: 14,
      baseComputeFlops: 120,
      baseDataPerSec: 1.2,
      energyKwDelta: -8,
      unlockLifetimeCash: 60
    },
    {
      id: 'scraper_array',
      name: 'Autonomous Data Harvester',
      description: 'Kuratierte Trainingspipeline zur Data-Shard-Gewinnung (-4 kW).',
      category: 'data' as const,
      baseCostCash: 450,
      growthRate: 1.11,
      baseCashPerSec: 22,
      baseComputeFlops: 80,
      baseDataPerSec: 8,
      energyKwDelta: -4,
      unlockLifetimeCash: 250
    },
    {
      id: 'training_pod',
      name: 'Frontier Model Pod',
      description: 'Multi-Node Training-Pod für Foundation Models (-40 kW).',
      category: 'compute' as const,
      baseCostCash: 3_200,
      growthRate: 1.12,
      baseCashPerSec: 185,
      baseComputeFlops: 1_800,
      baseDataPerSec: 18,
      energyKwDelta: -40,
      unlockLifetimeCash: 1_800
    },
    {
      id: 'modular_reactor',
      name: 'Small Modular Reactor (SMR)',
      description: 'Grundlastfähige Rechenzentrums-Versorgung (+200 kW).',
      category: 'energy' as const,
      baseCostCash: 9_500,
      growthRate: 1.13,
      baseCashPerSec: 0,
      baseComputeFlops: 0,
      baseDataPerSec: 0,
      energyKwDelta: 200,
      unlockLifetimeCash: 5_000
    },
    {
      id: 'sovereign_cluster',
      name: 'Sovereign Mega-Cluster',
      description: 'Planetares Inferenz-Rückgrat von Apex Syndicate (-180 kW).',
      category: 'compute' as const,
      baseCostCash: 48_000,
      growthRate: 1.14,
      baseCashPerSec: 2_400,
      baseComputeFlops: 30_000,
      baseDataPerSec: 150,
      energyKwDelta: -180,
      unlockLifetimeCash: 25_000
    }
  ],
  research: [
    {
      id: 'quantized_kernels',
      name: 'FP8 Quantized Kernels',
      description: '+50 % Tap-Leistung pro Klick.',
      costDataShards: 15,
      prerequisites: [],
      effect: { kind: 'tap_multiplier' as const, value: 0.5 }
    },
    {
      id: 'automated_caching',
      name: 'KV-Cache Compression',
      description: '+40 % weltweiter Cashflow.',
      costDataShards: 45,
      prerequisites: ['quantized_kernels'],
      effect: { kind: 'cash_multiplier' as const, value: 0.4 }
    },
    {
      id: 'synthetic_corpus',
      name: 'Synthetic Data Loop',
      description: '+60 % Data-Shard-Ertrag.',
      costDataShards: 90,
      prerequisites: ['quantized_kernels'],
      effect: { kind: 'data_multiplier' as const, value: 0.6 }
    },
    {
      id: 'overnight_checkpoints',
      name: 'Checkpointed Nightly Runs',
      description: '+4h Offline-Cap und +15 % Offline-Effizienz.',
      costDataShards: 180,
      prerequisites: ['automated_caching'],
      effect: { kind: 'offline_cap_bonus_sec' as const, value: 14_400 }
    },
    {
      id: 'neural_compilers',
      name: 'Autonomous Neural Compilers',
      description: '+15 % Offline-Effizienz.',
      costDataShards: 320,
      prerequisites: ['overnight_checkpoints', 'synthetic_corpus'],
      effect: { kind: 'offline_efficiency_bonus' as const, value: 0.15 }
    }
  ],
  managers: [
    {
      id: 'mgr_garage',
      name: 'AutoOps Junior Script',
      targetBuildingId: 'garage_server',
      hireCostCash: 500,
      cooldownSec: 5
    },
    {
      id: 'mgr_gpu',
      name: 'Cluster Orchestrator AI',
      targetBuildingId: 'gpu_rack',
      hireCostCash: 5_500,
      cooldownSec: 8
    },
    {
      id: 'mgr_harvester',
      name: 'Pipeline Curator Agent',
      targetBuildingId: 'scraper_array',
      hireCostCash: 18_000,
      cooldownSec: 10
    }
  ],
  missions: [
    {
      id: 'm_first_rig',
      title: 'Garage skalieren (Level 5 Garage Inference Rig)',
      condition: { kind: 'building_level' as const, buildingId: 'garage_server', minLevel: 5 },
      rewardCash: 40,
      rewardDataShards: 10
    },
    {
      id: 'm_first_rack',
      title: 'Erstes GPU Rack betreiben',
      condition: { kind: 'building_level' as const, buildingId: 'gpu_rack', minLevel: 1 },
      rewardCash: 250,
      rewardDataShards: 25
    },
    {
      id: 'm_first_research',
      title: 'Forschung freischalten',
      condition: { kind: 'research_count' as const, minCount: 1 },
      rewardCash: 500,
      rewardDataShards: 40
    },
    {
      id: 'm_millionaire',
      title: 'Series A: $100K Lifetime Revenue',
      condition: { kind: 'lifetime_cash' as const, minCash: 100_000 },
      rewardCash: 15_000,
      rewardDataShards: 200
    }
  ],
  achievements: [
    {
      id: 'ach_seed_founder',
      title: 'Seed Founder ($1K Lifetime Cash)',
      condition: { kind: 'lifetime_cash' as const, minCash: 1_000 },
      rewardCash: 150,
      rewardDataShards: 20
    },
    {
      id: 'ach_first_buyout',
      title: 'IPO Completed (Erster Prestige Reset)',
      condition: { kind: 'prestige_count' as const, minCount: 1 },
      rewardCash: 1_000,
      rewardDataShards: 100
    }
  ]
} as const;

export const APEX_SYNDICATE_CONFIG: WorldConfig = WorldConfigSchema.parse(RAW_APEX_SYNDICATE);

