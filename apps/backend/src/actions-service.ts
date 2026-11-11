import { BigVal } from '@reality-corp/economy-engine';
import {
  dispatchGameCommand,
  performPrestigeReset,
  toCanonicalDTO
} from '@reality-corp/game-engine';
import {
  computePrestigePreview,
  getDailyChallengesForUtcDate,
  isConditionSatisfied,
  type ProgressionSnapshotView
} from '@reality-corp/progression-system';
import type {
  CanonicalWorldStateDTO,
  GameCommand,
  PrestigeRequest,
  PurchaseRequest,
  RewardClaimRequest
} from '@reality-corp/shared-types';
import type { BackendRepository } from './repository.js';
import {
  getOrInitWorldDTO,
  hydrateSimulation,
  resolvePlayableWorld,
  updateLeaderboardSnapshot,
  type ServiceOutcome
} from './world-state-helpers.js';

export async function processPurchase(
  repo: BackendRepository,
  userId: string,
  req: PurchaseRequest,
  nowMs = Date.now()
): Promise<ServiceOutcome<{ canonicalState: CanonicalWorldStateDTO }>> {
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

  const canonical = await getOrInitWorldDTO(repo, userId, config, nowMs);
  const { state, modifiers } = hydrateSimulation(canonical, config);

  const cmdType: GameCommand['type'] =
    req.targetType === 'building'
      ? 'BUY_BUILDING_UPGRADE'
      : req.targetType === 'research'
        ? 'UNLOCK_RESEARCH'
        : 'HIRE_MANAGER';

  const payload: Record<string, unknown> =
    req.targetType === 'building'
      ? { buildingId: req.targetId, quantity: req.quantity }
      : req.targetType === 'research'
        ? { researchId: req.targetId }
        : { managerId: req.targetId };

  const res = dispatchGameCommand(
    state,
    {
      idempotencyKey: crypto.randomUUID(),
      seq: state.lastSyncedSeq + 1,
      type: cmdType,
      payload,
      clientTimestampMs: nowMs
    },
    config,
    modifiers
  );

  if (!res.accepted) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INSUFFICIENT_FUNDS',
      message: res.reason ?? 'Purchase rejected',
      retryable: false,
      canonicalState: canonical
    };
  }

  state.stateVersion += 1;
  state.lastServerTickAtMs = nowMs;
  const updated = toCanonicalDTO(state);
  await repo.saveWorldState(userId, updated);
  return { ok: true, statusCode: 200, data: { canonicalState: updated } };
}

export async function processPrestige(
  repo: BackendRepository,
  userId: string,
  req: PrestigeRequest,
  nowMs = Date.now()
): Promise<ServiceOutcome<{ canonicalState: CanonicalWorldStateDTO }>> {
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

  const canonical = await getOrInitWorldDTO(repo, userId, config, nowMs);
  const { state, modifiers } = hydrateSimulation(canonical, config);
  const preview = computePrestigePreview(state.lifetimeEarnings, state.equityShares, config);
  const minExpected = BigVal.fromSnapshot(req.expectedMinShares);

  if (!preview.canPrestige || preview.claimableShares.lt(minExpected)) {
    return {
      ok: false,
      statusCode: 400,
      code: 'INSUFFICIENT_FUNDS',
      message: 'Prestige threshold not yet reached for requested shares',
      retryable: false,
      canonicalState: canonical
    };
  }

  performPrestigeReset(state, preview.claimableShares, config, modifiers);
  state.stateVersion += 1;
  state.lastServerTickAtMs = nowMs;

  const updated = toCanonicalDTO(state);
  await repo.saveWorldState(userId, updated);
  await updateLeaderboardSnapshot(repo, userId, updated);
  return { ok: true, statusCode: 200, data: { canonicalState: updated } };
}

export async function processRewardClaim(
  repo: BackendRepository,
  userId: string,
  req: RewardClaimRequest,
  nowMs = Date.now()
): Promise<
  ServiceOutcome<{
    canonicalState: CanonicalWorldStateDTO;
    rewardCash: number;
    rewardDataShards: number;
  }>
> {
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

  const canonical = await getOrInitWorldDTO(repo, userId, config, nowMs);
  const { state } = hydrateSimulation(canonical, config);

  const utcDateKey = new Date(nowMs).toISOString().slice(0, 10);
  const view: ProgressionSnapshotView = {
    buildings: state.buildings,
    lifetimeEarningsNumber: state.lifetimeEarnings.toNumber(),
    unlockedResearch: state.unlockedResearch,
    prestigeCount: state.prestigeCount,
    claimedRewards: state.claimedRewards
  };

  let rewardCash: number;
  let rewardDataShards: number;
  let claimKey = `${req.claimType}:${req.rewardId}`;

  if (req.claimType === 'mission' || req.claimType === 'achievement') {
    const source = req.claimType === 'mission' ? config.missions : config.achievements;
    const item = source.find((entry) => entry.id === req.rewardId);
    if (!item || !isConditionSatisfied(item.condition, view)) {
      return {
        ok: false,
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: `Reward ${req.rewardId} is invalid or condition not met`,
        retryable: false
      };
    }
    rewardCash = item.rewardCash;
    rewardDataShards = item.rewardDataShards;
  } else if (req.claimType === 'daily_challenge') {
    const dailies = getDailyChallengesForUtcDate(utcDateKey, config);
    const daily = dailies.find((d) => d.claimKey === req.rewardId);
    if (!daily || !isConditionSatisfied(daily.condition, view)) {
      return {
        ok: false,
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: `Daily challenge ${req.rewardId} not found or incomplete`,
        retryable: false
      };
    }
    claimKey = daily.claimKey;
    rewardCash = daily.rewardCash;
    rewardDataShards = daily.rewardDataShards;
  } else {
    return {
      ok: false,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Event rewards are not yet claimable in MVP',
      retryable: false
    };
  }

  const claimedFirstTime = await repo.tryClaimReward(
    userId,
    req.worldId,
    req.claimType,
    req.rewardId,
    claimKey
  );
  if (!claimedFirstTime) {
    return {
      ok: false,
      statusCode: 409,
      code: 'ALREADY_CLAIMED',
      message: 'Reward already claimed',
      retryable: false
    };
  }

  state.claimedRewards.push(claimKey);
  if (rewardCash > 0) {
    state.cash = state.cash.add(rewardCash);
    state.lifetimeEarnings = state.lifetimeEarnings.add(rewardCash);
  }
  if (rewardDataShards > 0) {
    state.data = state.data.add(rewardDataShards);
  }
  state.stateVersion += 1;
  state.lastServerTickAtMs = nowMs;

  const updated = toCanonicalDTO(state);
  await repo.saveWorldState(userId, updated);
  return {
    ok: true,
    statusCode: 200,
    data: { canonicalState: updated, rewardCash, rewardDataShards }
  };
}
