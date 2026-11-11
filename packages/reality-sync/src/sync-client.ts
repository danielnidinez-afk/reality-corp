import { BigVal, type BigValInput, type OfflineProgressResult } from '@reality-corp/economy-engine';
import type { WorldConfig } from '@reality-corp/game-config';
import {
  applyOfflineCatchup,
  createInitialWorldState,
  dispatchGameCommand,
  fromCanonicalDTO,
  performPrestigeReset,
  recalculateRates,
  stepSimulationTick,
  toCanonicalDTO,
  TypedEventBus,
  type CommandApplyResult,
  type SimulationEvent,
  type SimulationModifiers,
  type WorldSimulationState
} from '@reality-corp/game-engine';
import {
  computePrestigePreview,
  computeResearchModifiers,
  isConditionSatisfied,
  type PrestigePreview,
  type ProgressionSnapshotView
} from '@reality-corp/progression-system';
import type {
  CanonicalWorldStateDTO,
  GameCommand,
  GameCommandType,
  LocalSaveGame,
  SyncBatchResponse
} from '@reality-corp/shared-types';
import type { LocalSaveManager } from './storage.js';
import { generateUuidV4, type SyncTransport } from './transport.js';

export type SyncFlushOutcome =
  | { readonly status: 'saved_offline' }
  | { readonly status: 'synced'; readonly response: SyncBatchResponse }
  | { readonly status: 'conflict_reconciled'; readonly canonicalState: CanonicalWorldStateDTO }
  | { readonly status: 'deferred'; readonly reason: string };

export interface SessionInitResult {
  readonly loadedFromDisk: boolean;
  readonly recoveredFromBackup: boolean;
  readonly offlineCatchup: OfflineProgressResult | null;
}

const MAX_PENDING_COMMANDS = 500;

/**
 * Local-first session orchestrator unifying `game-engine`, `progression-system`,
 * checksummed `.bak` storage, offline progression catchup, and server sync reconciliation.
 */
export class RealitySyncSession {
  public state: WorldSimulationState;
  public readonly bus = new TypedEventBus<SimulationEvent>();
  private pendingCommands: GameCommand[] = [];
  private isOnline = true;
  private isFlushing = false;

  public constructor(
    public readonly config: WorldConfig,
    private readonly storage: LocalSaveManager,
    private readonly transport: SyncTransport | null = null
  ) {
    this.state = createInitialWorldState(config, Date.now());
  }

  public getPendingCommandCount(): number {
    return this.pendingCommands.length;
  }

  public getPendingCommands(): readonly GameCommand[] {
    return this.pendingCommands;
  }

  public setOnlineStatus(online: boolean): void {
    this.isOnline = online;
  }

  private computeModifiersFor(
    unlockedResearch: readonly string[],
    lifetimeEarnings: BigValInput,
    equityShares: BigValInput
  ): SimulationModifiers {
    const research = computeResearchModifiers(unlockedResearch, this.config);
    const prestige = computePrestigePreview(lifetimeEarnings, equityShares, this.config);
    return {
      cashMultiplier: research.cashMultiplier,
      dataMultiplier: research.dataMultiplier,
      tapMultiplier: research.tapMultiplier,
      prestigeMultiplier: prestige.currentBonusMultiplier,
      bonusOfflineCapSec: research.bonusOfflineCapSec,
      bonusOfflineEfficiency: research.bonusOfflineEfficiency
    };
  }

  public getModifiers(): SimulationModifiers {
    return this.computeModifiersFor(
      this.state.unlockedResearch,
      this.state.lifetimeEarnings,
      this.state.equityShares
    );
  }

  public getPrestigePreview(): PrestigePreview {
    return computePrestigePreview(this.state.lifetimeEarnings, this.state.equityShares, this.config);
  }

  public getProgressionView(): ProgressionSnapshotView {
    return {
      buildings: this.state.buildings,
      lifetimeEarningsNumber: this.state.lifetimeEarnings.toNumber(),
      unlockedResearch: this.state.unlockedResearch,
      prestigeCount: this.state.prestigeCount,
      claimedRewards: this.state.claimedRewards
    };
  }

  public async initialize(nowMs = Date.now()): Promise<SessionInitResult> {
    const { save, recoveredFromBackup } = await this.storage.loadWorldSave(this.config.worldId);
    if (!save) {
      this.state = createInitialWorldState(this.config, nowMs);
      this.pendingCommands = [];
      await this.persistLocal(nowMs);
      return { loadedFromDisk: false, recoveredFromBackup: false, offlineCatchup: null };
    }

    this.restoreCanonicalState(save.state);
    this.pendingCommands = [...save.pendingCommands];
    const elapsedSec = Math.max(0, (nowMs - save.savedAtMs) / 1000);
    const offlineCatchup =
      elapsedSec >= 5
        ? applyOfflineCatchup(this.state, elapsedSec, this.config, this.getModifiers(), this.bus)
        : null;

    await this.persistLocal(nowMs);
    return { loadedFromDisk: true, recoveredFromBackup, offlineCatchup };
  }

  public tick(dtSec: number): void {
    stepSimulationTick(this.state, dtSec, this.config, this.getModifiers(), this.bus);
  }

  public issueCommand(
    type: GameCommandType,
    payload: Record<string, unknown>,
    nowMs = Date.now()
  ): CommandApplyResult {
    const seq = this.state.lastSyncedSeq + 1;
    const command: GameCommand = {
      idempotencyKey: generateUuidV4(),
      seq,
      type,
      payload,
      clientTimestampMs: Math.max(0, Math.trunc(nowMs))
    };

    const res = dispatchGameCommand(this.state, command, this.config, this.getModifiers(), this.bus);
    if (!res.accepted) {
      return res;
    }

    if (type === 'UNLOCK_RESEARCH') {
      recalculateRates(this.state, this.config, this.getModifiers());
    }

    this.enqueueCommand(command);
    return res;
  }

  public claimMissionOrAchievement(
    rewardId: string,
    claimType: 'mission' | 'achievement',
    nowMs = Date.now()
  ): CommandApplyResult {
    const list = claimType === 'mission' ? this.config.missions : this.config.achievements;
    const target = list.find((item) => item.id === rewardId);
    if (!target) {
      return { accepted: false, reason: `Unknown ${claimType} ${rewardId}` };
    }
    const claimKey = `${claimType}:${target.id}`;
    if (this.state.claimedRewards.includes(claimKey)) {
      return { accepted: false, reason: 'Reward already claimed' };
    }
    if (!isConditionSatisfied(target.condition, this.getProgressionView())) {
      return { accepted: false, reason: 'Condition not yet satisfied' };
    }
    return this.issueCommand(
      'CLAIM_REWARD',
      {
        claimKey,
        rewardCash: target.rewardCash,
        rewardDataShards: target.rewardDataShards
      },
      nowMs
    );
  }

  public triggerPrestige(): BigVal {
    const preview = this.getPrestigePreview();
    if (!preview.canPrestige) {
      return BigVal.zero();
    }
    const done = performPrestigeReset(
      this.state,
      preview.claimableShares,
      this.config,
      this.getModifiers(),
      this.bus
    );
    if (done) {
      recalculateRates(this.state, this.config, this.getModifiers());
      return preview.claimableShares;
    }
    return BigVal.zero();
  }

  public async persistLocal(nowMs = Date.now()): Promise<LocalSaveGame> {
    return this.storage.saveWorldState(
      this.config.worldId,
      toCanonicalDTO(this.state),
      this.pendingCommands,
      nowMs
    );
  }

  public async resetLocalSave(nowMs = Date.now()): Promise<void> {
    await this.storage.clearWorldSave(this.config.worldId);
    this.pendingCommands = [];
    this.state = createInitialWorldState(this.config, nowMs);
  }

  public async flushSync(nowMs = Date.now()): Promise<SyncFlushOutcome> {
    if (this.isFlushing) {
      return { status: 'deferred', reason: 'Sync already in progress' };
    }
    this.isFlushing = true;
    try {
      await this.persistLocal(nowMs);
      if (!this.transport || !this.isOnline) {
        return { status: 'saved_offline' };
      }

      const result = await this.transport.syncBatch({
        worldId: this.config.worldId,
        baseStateVersion: this.state.stateVersion,
        clientTimestampMs: Math.max(0, Math.trunc(nowMs)),
        commands: [...this.pendingCommands]
      });

      if (result.kind === 'conflict') {
        this.pendingCommands = [];
        this.restoreCanonicalState(result.canonicalState);
        await this.persistLocal(nowMs);
        return { status: 'conflict_reconciled', canonicalState: result.canonicalState };
      }

      if (result.kind === 'offline_error') {
        return { status: 'deferred', reason: result.message };
      }

      const { canonicalState } = result.response;
      this.pendingCommands = this.pendingCommands.filter(
        (cmd) => cmd.seq > canonicalState.lastSyncedSeq
      );
      this.restoreCanonicalState(canonicalState);
      await this.persistLocal(nowMs);
      return { status: 'synced', response: result.response };
    } finally {
      this.isFlushing = false;
    }
  }

  private restoreCanonicalState(canonical: CanonicalWorldStateDTO): void {
    const modifiers = this.computeModifiersFor(
      canonical.unlockedResearch,
      canonical.lifetimeEarnings,
      canonical.equityShares
    );
    this.state = fromCanonicalDTO(canonical, this.config, modifiers);
  }

  private enqueueCommand(command: GameCommand): void {
    if (this.pendingCommands.length >= MAX_PENDING_COMMANDS) {
      const oldestTapIndex = this.pendingCommands.findIndex((c) => c.type === 'TAP_COMPUTE');
      if (oldestTapIndex >= 0) {
        this.pendingCommands.splice(oldestTapIndex, 1);
      } else {
        this.pendingCommands.shift();
      }
    }
    this.pendingCommands.push(command);
  }
}
