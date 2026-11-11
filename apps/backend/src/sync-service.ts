import { BigVal, calculateBulkCost, calculateMaxAffordable } from '@reality-corp/economy-engine';
import {
  applyOfflineCatchup,
  dispatchGameCommand,
  recalculateRates,
  stepSimulationTick,
  toCanonicalDTO
} from '@reality-corp/game-engine';
import type {
  GameCommand,
  SyncBatchRequest,
  SyncBatchResponse
} from '@reality-corp/shared-types';
import type { BackendRepository } from './repository.js';
import {
  buildModifiers,
  getOrInitWorldDTO,
  hydrateSimulation,
  resolvePlayableWorld,
  updateLeaderboardSnapshot,
  type ServiceOutcome
} from './world-state-helpers.js';

const CLOCK_BACKWARD_TOLERANCE_MS = 30_000;
const CLOCK_FUTURE_TOLERANCE_MS = 120_000;
const MAX_DIVERGENCE_CASH_RATIO = 0.95;

function estimatePurchaseCost(
  cmd: GameCommand,
  config: ReturnType<typeof resolvePlayableWorld>,
  currentBuildings: Record<string, number>,
  cash: BigVal
): BigVal | null {
  if (!config || cmd.type !== 'BUY_BUILDING_UPGRADE') return null;
  const buildingId = cmd.payload['buildingId'];
  const quantity = cmd.payload['quantity'];
  if (typeof buildingId !== 'string') return null;
  const def = config.buildings.find((b) => b.id === buildingId);
  if (!def) return null;
  const level = currentBuildings[def.id] ?? 0;
  if (quantity === 'max') {
    const count = calculateMaxAffordable(cash, def.baseCostCash, def.growthRate, level);
    return count > 0 ? calculateBulkCost(def.baseCostCash, def.growthRate, level, count) : null;
  }
  if (quantity === 1 || quantity === 10 || quantity === 100) {
    return calculateBulkCost(def.baseCostCash, def.growthRate, level, quantity);
  }
  return null;
}

/**
 * Replays pending client commands authoritatively on top of canonical DB state,
 * enforcing optimistic version locking, idempotency keys, and >5% divergence rejection.
 */
export async function processSyncBatch(
  repo: BackendRepository,
  userId: string,
  req: SyncBatchRequest,
  idempotencyKey: string,
  nowMs = Date.now()
): Promise<ServiceOutcome<SyncBatchResponse>> {
  const config = resolvePlayableWorld(req.worldId);
  if (!config) {
    return {
      ok: false,
      statusCode: 403,
      code: 'FORBIDDEN',
      message: `World ${req.worldId} is locked in MVP`,
      retryable: false
    };
  }

  const cached = await repo.getCachedSyncResponse(userId, idempotencyKey);
  if (cached) {
    return { ok: true, statusCode: 200, data: cached };
  }

  const canonical = await getOrInitWorldDTO(repo, userId, config, nowMs);
  if (req.baseStateVersion !== canonical.stateVersion) {
    return {
      ok: false,
      statusCode: 409,
      code: 'CONFLICT_STATE_DIVERGENCE',
      message: 'State version conflict; client must reconcile to canonical state',
      retryable: true,
      canonicalState: canonical
    };
  }

  const clockTampered =
    req.clientTimestampMs + CLOCK_BACKWARD_TOLERANCE_MS < canonical.lastServerTickAtMs ||
    req.clientTimestampMs > nowMs + CLOCK_FUTURE_TOLERANCE_MS;

  if (clockTampered) {
    await repo.recordAnomaly({
      userId,
      worldId: req.worldId,
      anomalyType: 'CLOCK_TAMPER_ATTEMPT',
      severity: 'high',
      details: {
        clientTimestampMs: req.clientTimestampMs,
        lastServerTickAtMs: canonical.lastServerTickAtMs,
        serverNowMs: nowMs
      }
    });
    canonical.trustStatus = 'shadow_flagged';
  }

  const hydrated = hydrateSimulation(canonical, config);
  const simState = hydrated.state;
  let modifiers = hydrated.modifiers;

  const elapsedSec = Math.max(0, (nowMs - canonical.lastServerTickAtMs) / 1000);
  let offlineCash = BigVal.zero();
  let offlineData = BigVal.zero();

  if (elapsedSec > 120) {
    const catchup = applyOfflineCatchup(simState, elapsedSec, config, modifiers);
    offlineCash = catchup.cashEarned;
    offlineData = catchup.dataEarned;
  } else if (elapsedSec > 0) {
    stepSimulationTick(simState, elapsedSec, config, modifiers);
  }

  const rejectedCommands: Array<{ seq: number; reason: string }> = [];
  let tapCountTotal = 0;
  const maxAllowedTaps = Math.max(100, Math.ceil(elapsedSec * 25) + 100);

  for (const cmd of req.commands) {
    if (cmd.seq <= simState.lastSyncedSeq) {
      rejectedCommands.push({ seq: cmd.seq, reason: 'duplicate_seq' });
      continue;
    }
    if (cmd.type === 'CLAIM_REWARD') {
      rejectedCommands.push({ seq: cmd.seq, reason: 'use_dedicated_reward_endpoint' });
      continue;
    }
    if (cmd.type === 'TAP_COMPUTE') {
      const n = typeof cmd.payload['tapCount'] === 'number' ? Math.trunc(cmd.payload['tapCount']) : 1;
      tapCountTotal += Math.max(0, n);
      if (tapCountTotal > maxAllowedTaps) {
        await repo.recordAnomaly({
          userId,
          worldId: req.worldId,
          anomalyType: 'IMPOSSIBLE_TAP_RATE',
          severity: 'high',
          details: { tapCountTotal, maxAllowedTaps, elapsedSec }
        });
        canonical.trustStatus = 'shadow_flagged';
        await repo.saveWorldState(userId, canonical);
        await updateLeaderboardSnapshot(repo, userId, canonical);
        return {
          ok: false,
          statusCode: 409,
          code: 'CONFLICT_STATE_DIVERGENCE',
          message: 'Plausibility violation exceeded tolerance; resetting to canonical state',
          retryable: false,
          canonicalState: canonical
        };
      }
    }

    const expectedCost = estimatePurchaseCost(cmd, config, simState.buildings, simState.cash);
    if (expectedCost && simState.cash.lt(expectedCost.mul(MAX_DIVERGENCE_CASH_RATIO))) {
      await repo.recordAnomaly({
        userId,
        worldId: req.worldId,
        anomalyType: 'ECONOMY_DIVERGENCE_EXCEEDED',
        severity: 'high',
        details: {
          commandType: cmd.type,
          serverCash: simState.cash.toSnapshot(),
          requiredCost: expectedCost.toSnapshot()
        }
      });
      canonical.trustStatus = 'shadow_flagged';
      await repo.saveWorldState(userId, canonical);
      await updateLeaderboardSnapshot(repo, userId, canonical);
      return {
        ok: false,
        statusCode: 409,
        code: 'CONFLICT_STATE_DIVERGENCE',
        message: 'Economy divergence (>5%) detected; resetting to canonical state',
        retryable: false,
        canonicalState: canonical
      };
    }

    const res = dispatchGameCommand(simState, cmd, config, modifiers);
    if (!res.accepted) {
      rejectedCommands.push({ seq: cmd.seq, reason: res.reason ?? 'rejected' });
      continue;
    }
    if (cmd.type === 'UNLOCK_RESEARCH') {
      modifiers = buildModifiers(
        simState.unlockedResearch,
        simState.lifetimeEarnings,
        simState.equityShares,
        config
      );
      recalculateRates(simState, config, modifiers);
    }
  }

  simState.stateVersion += 1;
  simState.lastServerTickAtMs = Math.trunc(nowMs);
  simState.trustStatus = canonical.trustStatus;

  const updatedDto = toCanonicalDTO(simState);
  await repo.saveWorldState(userId, updatedDto);
  await updateLeaderboardSnapshot(repo, userId, updatedDto);

  const response: SyncBatchResponse = {
    canonicalState: updatedDto,
    offlineGrant: {
      elapsedSec,
      cashEarned: offlineCash.toSnapshot(),
      dataEarned: offlineData.toSnapshot()
    },
    rejectedCommands,
    serverTimestampMs: Math.trunc(nowMs)
  };
  await repo.saveCachedSyncResponse(userId, idempotencyKey, response);
  return { ok: true, statusCode: 200, data: response };
}

