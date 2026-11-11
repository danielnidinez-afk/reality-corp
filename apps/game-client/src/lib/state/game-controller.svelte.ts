import { BigVal } from '@reality-corp/economy-engine';
import {
  APEX_SYNDICATE_CONFIG,
  WORLD_CATALOG,
  type WorldConfig
} from '@reality-corp/game-config';
import type { GameCommandType, WorldId } from '@reality-corp/shared-types';
import { isConditionSatisfied, type DailyChallengeDefinition } from '@reality-corp/progression-system';
import {
  IndexedDbSaveStorage,
  LocalSaveManager,
  MemorySaveStorage,
  RealitySyncSession
} from '@reality-corp/reality-sync';
import { SynthAudioEngine } from '../audio/synth.js';
import {
  registerLifecycleHooks,
  triggerLightHaptic,
  triggerMediumHaptic
} from '../platform/native-bridge.js';
import {
  computeBuildingBuyQuote,
  createInitialProjection,
  isResearchNodeReady,
  projectSessionToHud,
  type BuyQuantity,
  type GameTab,
  type HudProjection,
  type OfflineModalState
} from './hud-types.js';

export type { BuyQuantity, GameTab, HudProjection, OfflineModalState };

export class GameController {
  public readonly config: WorldConfig = APEX_SYNDICATE_CONFIG;
  public readonly worlds: readonly WorldConfig[] = Object.values(WORLD_CATALOG);
  public activeTab = $state<GameTab>('ops');
  public buyQuantity = $state<BuyQuantity>(1);
  public soundEnabled = $state(true);
  public hapticsEnabled = $state(true);
  public tapPulse = $state(0);
  public initialized = $state(false);
  public offlineModal = $state<OfflineModalState | null>(null);
  public statusBanner = $state<string | null>(null);
  public focusTargetSec = $state(300);
  public focusEndsAtMs = $state<number | null>(null);
  public focusRemainingSec = $state(0);
  public focusReadyToClaim = $state(false);
  public hud = $state<HudProjection>(createInitialProjection(APEX_SYNDICATE_CONFIG));

  private readonly audio = new SynthAudioEngine();
  private session: RealitySyncSession | null = null;
  private tickTimerId: ReturnType<typeof setInterval> | null = null;
  private teardownLifecycle: (() => void) | null = null;
  private ticksSinceSave = 0;

  public async init(): Promise<void> {
    if (this.initialized) return;
    const adapter =
      typeof indexedDB !== 'undefined' ? new IndexedDbSaveStorage() : new MemorySaveStorage();
    const storage = new LocalSaveManager(adapter);
    this.session = new RealitySyncSession(this.config, storage);

    const initResult = await this.session.initialize(Date.now());
    if (
      initResult.offlineCatchup &&
      !initResult.offlineCatchup.clockTampered &&
      initResult.offlineCatchup.effectiveElapsedSec >= 5 &&
      (initResult.offlineCatchup.cashEarned.gt(0) || initResult.offlineCatchup.dataEarned.gt(0))
    ) {
      this.offlineModal = {
        elapsedSec: initResult.offlineCatchup.effectiveElapsedSec,
        cashEarned: initResult.offlineCatchup.cashEarned.toSnapshot(),
        dataEarned: initResult.offlineCatchup.dataEarned.toSnapshot(),
        recoveredFromBackup: initResult.recoveredFromBackup
      };
    } else if (initResult.recoveredFromBackup) {
      this.statusBanner = 'Savegame automatisch aus .bak-Slot wiederhergestellt.';
    }

    this.syncHudFromSession();
    this.initialized = true;

    this.tickTimerId = setInterval(() => this.onSimulationStep(), 100);
    if (typeof document !== 'undefined') {
      this.teardownLifecycle = registerLifecycleHooks(
        () => {
          void this.persistNow();
        },
        (visible) => {
          if (visible && this.focusEndsAtMs !== null) {
            this.updateFocusCountdown();
          }
        }
      );
    }
  }

  public destroy(): void {
    if (this.tickTimerId !== null) {
      clearInterval(this.tickTimerId);
      this.tickTimerId = null;
    }
    this.teardownLifecycle?.();
    this.teardownLifecycle = null;
    void this.persistNow();
  }

  private onSimulationStep(): void {
    if (!this.session) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    this.session.tick(0.1);
    this.updateFocusCountdown();
    this.ticksSinceSave += 1;
    if (this.ticksSinceSave >= 100) {
      this.ticksSinceSave = 0;
      void this.session.persistLocal(Date.now());
    }
    this.syncHudFromSession();
  }

  private updateFocusCountdown(): void {
    if (this.focusEndsAtMs === null) return;
    const rem = Math.max(0, Math.ceil((this.focusEndsAtMs - Date.now()) / 1000));
    this.focusRemainingSec = rem;
    if (rem === 0) {
      this.focusEndsAtMs = null;
      this.focusReadyToClaim = true;
    }
  }

  private syncHudFromSession(): void {
    if (!this.session) return;
    this.hud = projectSessionToHud(this.session, this.config);
  }

  public tapCompute(): void {
    if (!this.session) return;
    this.audio.unlock();
    const res = this.session.issueCommand('TAP_COMPUTE', { tapCount: 1 }, Date.now());
    if (res.accepted) {
      this.tapPulse += 1;
      this.audio.playTap();
      void triggerLightHaptic(this.hapticsEnabled);
      this.syncHudFromSession();
    }
  }

  private dispatchAndSync(
    type: GameCommandType,
    payload: Record<string, unknown>,
    cue: 'upgrade' | 'breakthrough' | 'none' = 'none'
  ): boolean {
    if (!this.session) return false;
    this.audio.unlock();
    const res = this.session.issueCommand(type, payload, Date.now());
    if (!res.accepted) return false;

    if (cue === 'upgrade') {
      this.audio.playUpgrade();
      void triggerMediumHaptic(this.hapticsEnabled);
    } else if (cue === 'breakthrough') {
      this.audio.playBreakthrough();
      void triggerMediumHaptic(this.hapticsEnabled);
    }
    this.syncHudFromSession();
    void this.persistNow();
    return true;
  }

  public getBuildingBuyQuote(buildingId: string): { count: number; cost: BigVal; affordable: boolean } {
    return computeBuildingBuyQuote(this.hud, this.config, buildingId, this.buyQuantity);
  }

  public buyBuilding(buildingId: string): void {
    this.dispatchAndSync('BUY_BUILDING_UPGRADE', { buildingId, quantity: this.buyQuantity }, 'upgrade');
  }

  public unlockResearch(researchId: string): void {
    this.dispatchAndSync('UNLOCK_RESEARCH', { researchId }, 'breakthrough');
  }

  public isResearchReady(researchId: string): boolean {
    return isResearchNodeReady(this.hud, this.config, researchId);
  }

  public hireManager(managerId: string): void {
    this.dispatchAndSync('HIRE_MANAGER', { managerId }, 'upgrade');
  }

  public toggleManager(managerId: string): void {
    const current = this.hud.managerActive[managerId] ?? true;
    this.dispatchAndSync('TOGGLE_MANAGER', { managerId, active: !current });
  }

  public isConditionComplete(condition: WorldConfig['missions'][number]['condition']): boolean {
    if (!this.session) return false;
    return isConditionSatisfied(condition, this.session.getProgressionView());
  }

  public claimMission(id: string, kind: 'mission' | 'achievement'): void {
    if (!this.session) return;
    const res = this.session.claimMissionOrAchievement(id, kind, Date.now());
    if (res.accepted) {
      this.audio.playBreakthrough();
      this.syncHudFromSession();
      void this.persistNow();
    }
  }

  public claimDailyChallenge(daily: DailyChallengeDefinition): void {
    if (!this.isConditionComplete(daily.condition)) return;
    this.dispatchAndSync(
      'CLAIM_REWARD',
      {
        claimKey: daily.claimKey,
        rewardCash: daily.rewardCash,
        rewardDataShards: daily.rewardDataShards
      },
      'breakthrough'
    );
  }

  public startFocusTimer(durationSec: number): void {
    this.focusTargetSec = durationSec;
    this.focusEndsAtMs = Date.now() + durationSec * 1000;
    this.focusRemainingSec = durationSec;
    this.focusReadyToClaim = false;
  }

  public claimFocusBoost(): void {
    if (!this.focusReadyToClaim) return;
    const boostDurationSec = Math.min(1800, this.focusTargetSec);
    if (this.dispatchAndSync('COMPLETE_LOCAL_FOCUS', { boostDurationSec }, 'breakthrough')) {
      this.focusReadyToClaim = false;
    }
  }

  public triggerPrestige(): void {
    if (!this.session) return;
    const gained = this.session.triggerPrestige();
    if (gained.gt(0)) {
      this.audio.playBreakthrough();
      this.statusBanner = `IPO durchgeführt: +${gained.formatCompact()} Equity Shares erhalten!`;
      this.syncHudFromSession();
      void this.persistNow();
    }
  }

  public selectWorld(worldId: WorldId): void {
    const target = this.worlds.find((w) => w.worldId === worldId);
    if (target && !target.isPlayableInMvp) {
      this.statusBanner = `${target.displayName} wird in Phase 2/3 freigeschaltet.`;
    }
  }

  public toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    this.audio.enabled = this.soundEnabled;
  }

  public toggleHaptics(): void {
    this.hapticsEnabled = !this.hapticsEnabled;
  }

  public dismissOfflineModal(): void {
    this.offlineModal = null;
  }

  public async persistNow(): Promise<void> {
    if (!this.session) return;
    await this.session.persistLocal(Date.now());
  }

  public async resetLocalProgress(): Promise<void> {
    if (!this.session) return;
    await this.session.resetLocalSave(Date.now());
    this.offlineModal = null;
    this.focusEndsAtMs = null;
    this.focusRemainingSec = 0;
    this.focusReadyToClaim = false;
    this.statusBanner = 'Lokaler Apex-Syndicate-Spielstand zurückgesetzt.';
    this.syncHudFromSession();
  }
}
