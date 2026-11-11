import { LocalSaveGameSchema, type LocalSaveGame } from '@reality-corp/shared-types';

export type UnsignedLocalSave = Omit<LocalSaveGame, 'checksum'>;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const entries: string[] = [];
  for (const key of keys) {
    if (record[key] === undefined) continue;
    entries.push(`${JSON.stringify(key)}:${canonicalJson(record[key])}`);
  }
  return `{${entries.join(',')}}`;
}

/**
 * Deterministic 64-bit dual-lane FNV-1a integrity digest for synchronous
 * browser/IndexedDB pagehide persistence checks.
 */
export function computeSaveChecksum(payload: UnsignedLocalSave): string {
  const input = canonicalJson(payload);
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}`;
}

/** Parses an arbitrary saved record and rejects tampered or malformed saves. */
export function verifySaveIntegrity(raw: unknown): LocalSaveGame | null {
  const parsed = LocalSaveGameSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const { checksum, ...unsigned } = parsed.data;
  const expected = computeSaveChecksum(unsigned);
  return checksum === expected ? parsed.data : null;
}

