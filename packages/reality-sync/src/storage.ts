import { openDB, type IDBPDatabase } from 'idb';
import type {
  CanonicalWorldStateDTO,
  GameCommand,
  LocalSaveGame,
  WorldId
} from '@reality-corp/shared-types';
import { computeSaveChecksum, verifySaveIntegrity, type UnsignedLocalSave } from './checksum.js';

export interface SaveStorageAdapter {
  readSlot(key: string): Promise<unknown>;
  writeSlot(key: string, value: unknown): Promise<void>;
  deleteSlot(key: string): Promise<void>;
}

export interface LoadSaveResult {
  readonly save: LocalSaveGame | null;
  readonly recoveredFromBackup: boolean;
}

const DB_NAME = 'reality-corp-local-v1';
const STORE_NAME = 'world_saves';

/** Deterministic in-memory storage adapter for unit tests and SSR environments. */
export class MemorySaveStorage implements SaveStorageAdapter {
  private readonly slots = new Map<string, unknown>();

  public async readSlot(key: string): Promise<unknown> {
    if (!this.slots.has(key)) return null;
    return structuredClone(this.slots.get(key));
  }

  public async writeSlot(key: string, value: unknown): Promise<void> {
    this.slots.set(key, structuredClone(value));
  }

  public async deleteSlot(key: string): Promise<void> {
    this.slots.delete(key);
  }

  /** Test helper for simulating storage corruption in the primary slot. */
  public corruptRawSlot(key: string, malformedValue: unknown): void {
    this.slots.set(key, malformedValue);
  }
}

/** IndexedDB storage adapter powered by `idb` for persistent local-first offline saves. */
export class IndexedDbSaveStorage implements SaveStorageAdapter {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private getDb(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        }
      });
    }
    return this.dbPromise;
  }

  public async readSlot(key: string): Promise<unknown> {
    const db = await this.getDb();
    return db.get(STORE_NAME, key);
  }

  public async writeSlot(key: string, value: unknown): Promise<void> {
    const db = await this.getDb();
    await db.put(STORE_NAME, value, key);
  }

  public async deleteSlot(key: string): Promise<void> {
    const db = await this.getDb();
    await db.delete(STORE_NAME, key);
  }
}

function primaryKey(worldId: WorldId): string {
  return `world:${worldId}:primary`;
}

function backupKey(worldId: WorldId): string {
  return `world:${worldId}:backup`;
}

/** Manages checksum-verified dual-slot (`.bak`) persistence to survive crash/write corruption. */
export class LocalSaveManager {
  public constructor(private readonly adapter: SaveStorageAdapter) {}

  public async loadWorldSave(worldId: WorldId): Promise<LoadSaveResult> {
    const rawPrimary = await this.adapter.readSlot(primaryKey(worldId));
    const verifiedPrimary = verifySaveIntegrity(rawPrimary);
    if (verifiedPrimary && verifiedPrimary.worldId === worldId) {
      return { save: verifiedPrimary, recoveredFromBackup: false };
    }

    const rawBackup = await this.adapter.readSlot(backupKey(worldId));
    const verifiedBackup = verifySaveIntegrity(rawBackup);
    if (verifiedBackup && verifiedBackup.worldId === worldId) {
      await this.adapter.writeSlot(primaryKey(worldId), verifiedBackup);
      return { save: verifiedBackup, recoveredFromBackup: true };
    }

    return { save: null, recoveredFromBackup: false };
  }

  public async saveWorldState(
    worldId: WorldId,
    state: CanonicalWorldStateDTO,
    pendingCommands: readonly GameCommand[],
    savedAtMs = Date.now()
  ): Promise<LocalSaveGame> {
    const existingPrimary = await this.adapter.readSlot(primaryKey(worldId));
    const verifiedExisting = verifySaveIntegrity(existingPrimary);
    if (verifiedExisting) {
      await this.adapter.writeSlot(backupKey(worldId), verifiedExisting);
    }

    const unsigned: UnsignedLocalSave = {
      schemaVersion: 1,
      worldId,
      savedAtMs: Math.max(0, Math.trunc(savedAtMs)),
      state,
      pendingCommands: [...pendingCommands]
    };

    const envelope: LocalSaveGame = {
      ...unsigned,
      checksum: computeSaveChecksum(unsigned)
    };

    await this.adapter.writeSlot(primaryKey(worldId), envelope);
    if (!verifiedExisting) {
      await this.adapter.writeSlot(backupKey(worldId), envelope);
    }
    return envelope;
  }

  public async clearWorldSave(worldId: WorldId): Promise<void> {
    await Promise.all([
      this.adapter.deleteSlot(primaryKey(worldId)),
      this.adapter.deleteSlot(backupKey(worldId))
    ]);
  }
}

