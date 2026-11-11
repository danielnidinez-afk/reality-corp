import type { CanonicalWorldStateDTO, WorldId } from '@reality-corp/shared-types';

/** Phase 2 minimal Admin Ops SDK stub (ADR DEC-13). */
export const ADMIN_DASHBOARD_STATUS = 'phase_2_minimal_stub' as const;

export interface AdminAnomalyItem {
  readonly id: number;
  readonly userId: string | null;
  readonly worldId: WorldId;
  readonly anomalyType: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly createdAtMs: number;
}

export async function fetchAnomalyFeed(
  baseUrl: string,
  adminBearerToken: string
): Promise<readonly AdminAnomalyItem[]> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/admin/anomalies`, {
    headers: {
      Authorization: `Bearer ${adminBearerToken}`
    }
  });
  if (!response.ok) {
    throw new Error(`Admin anomaly request failed with HTTP ${response.status}`);
  }
  const data = (await response.json()) as { anomalies: AdminAnomalyItem[] };
  return data.anomalies;
}

export async function updatePlayerTrustStatus(
  baseUrl: string,
  adminBearerToken: string,
  userId: string,
  worldId: WorldId,
  trustStatus: CanonicalWorldStateDTO['trustStatus']
): Promise<{ userId: string; worldId: WorldId; trustStatus: CanonicalWorldStateDTO['trustStatus'] }> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/admin/players/${userId}/trust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminBearerToken}`
    },
    body: JSON.stringify({ worldId, trustStatus })
  });
  if (!response.ok) {
    throw new Error(`Trust status update failed with HTTP ${response.status}`);
  }
  return (await response.json()) as {
    userId: string;
    worldId: WorldId;
    trustStatus: CanonicalWorldStateDTO['trustStatus'];
  };
}

