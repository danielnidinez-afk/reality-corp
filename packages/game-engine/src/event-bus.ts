import type { BigVal } from '@reality-corp/economy-engine';
import type { GameCommandType } from '@reality-corp/shared-types';

export type SimulationEvent =
  | {
      readonly type: 'tick';
      readonly dtSec: number;
      readonly cashPerSec: BigVal;
      readonly dataPerSec: BigVal;
      readonly energyLoadFactor: number;
    }
  | {
      readonly type: 'command_applied';
      readonly commandType: GameCommandType;
      readonly seq: number;
    }
  | {
      readonly type: 'manager_upgraded';
      readonly managerId: string;
      readonly buildingId: string;
      readonly newLevel: number;
    }
  | {
      readonly type: 'offline_applied';
      readonly elapsedSec: number;
      readonly cashEarned: BigVal;
      readonly dataEarned: BigVal;
      readonly clockTampered: boolean;
    }
  | {
      readonly type: 'prestige_completed';
      readonly prestigeCount: number;
      readonly gainedShares: BigVal;
    }
  | {
      readonly type: 'focus_expired';
    };

export type SimulationEventListener = (event: SimulationEvent) => void;

/** Lightweight zero-allocation typed event bus for decoupling engine ticks from UI/PixiJS. */
export class TypedEventBus<TEvent = SimulationEvent> {
  private readonly listeners = new Set<(event: TEvent) => void>();

  public subscribe(listener: (event: TEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit(event: TEvent): void {
    if (this.listeners.size === 0) {
      return;
    }
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

