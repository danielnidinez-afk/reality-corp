import type { CanonicalWorldStateDTO, SyncBatchRequest, SyncBatchResponse } from '@reality-corp/shared-types';

export type SyncTransportResult =
  | { readonly kind: 'ok'; readonly response: SyncBatchResponse }
  | { readonly kind: 'conflict'; readonly canonicalState: CanonicalWorldStateDTO }
  | { readonly kind: 'offline_error'; readonly message: string };

export interface SyncTransport {
  syncBatch(request: SyncBatchRequest): Promise<SyncTransportResult>;
}

export function generateUuidV4(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return '00000000-0000-4000-8000-000000000000';
}

/** HTTP transport calling the backend authoritative `/v1/sync/batch` endpoint. */
export class HttpSyncTransport implements SyncTransport {
  public constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken: () => string | null
  ) {}

  public async syncBatch(request: SyncBatchRequest): Promise<SyncTransportResult> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': generateUuidV4()
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/v1/sync/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });

      if (response.status === 409) {
        const errorJson = (await response.json()) as {
          error?: { canonicalState?: CanonicalWorldStateDTO };
        };
        if (errorJson.error?.canonicalState) {
          return { kind: 'conflict', canonicalState: errorJson.error.canonicalState };
        }
        return { kind: 'offline_error', message: 'Conflict response missing canonicalState' };
      }

      if (!response.ok) {
        return { kind: 'offline_error', message: `Sync HTTP ${response.status}` };
      }

      const data = (await response.json()) as SyncBatchResponse;
      return { kind: 'ok', response: data };
    } catch (err) {
      return {
        kind: 'offline_error',
        message: err instanceof Error ? err.message : 'Network error'
      };
    }
  }
}

