import { recalculateRates, toCanonicalDTO } from '@reality-corp/game-engine';
import type {
  CanonicalWorldStateDTO,
  FocusCompleteRequest,
  FocusStartRequest
} from '@reality-corp/shared-types';
import type { BackendRepository } from './repository.js';
import {
  getOrInitWorldDTO,
  hydrateSimulation,
  resolvePlayableWorld,
  type ServiceOutcome
} from './world-state-helpers.js';

export async function processFocusStart(
  repo: BackendRepository,
  userId: string,
  req: FocusStartRequest,
  nowMs = Date.now()
): Promise<ServiceOutcome<{ sessionId: string; targetDurationSec: number; startedAtMs: number }>> {
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
  const session = await repo.createFocusSession(userId, req.worldId, req.targetDurationSec, nowMs);
  return {
    ok: true,
    statusCode: 201,
    data: {
      sessionId: session.id,
      targetDurationSec: session.targetDurationSec,
      startedAtMs: session.startedAtMs
    }
  };
}

export async function processFocusComplete(
  repo: BackendRepository,
  userId: string,
  req: FocusCompleteRequest,
  nowMs = Date.now()
): Promise<
  ServiceOutcome<{
    sessionId: string;
    boostMultiplier: number;
    boostDurationSec: number;
    canonicalState: CanonicalWorldStateDTO;
  }>
> {
  const result = await repo.completeFocusSessionAtomic(userId, req.sessionId, nowMs);
  if (result.kind === 'not_found') {
    return {
      ok: false,
      statusCode: 404,
      code: 'VALIDATION_ERROR',
      message: 'Focus session not found',
      retryable: false
    };
  }
  if (result.kind === 'already_completed') {
    return {
      ok: false,
      statusCode: 409,
      code: 'ALREADY_CLAIMED',
      message: 'Focus session was already completed',
      retryable: false
    };
  }
  if (result.kind === 'too_early') {
    return {
      ok: false,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: `Focus session still active (${result.remainingSec}s remaining)`,
      retryable: false
    };
  }

  const config = resolvePlayableWorld(result.session.worldId);
  if (!config) {
    return {
      ok: false,
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'World locked',
      retryable: false
    };
  }

  const canonical = await getOrInitWorldDTO(repo, userId, config, nowMs);
  const { state, modifiers } = hydrateSimulation(canonical, config);
  const boostDurationSec = Math.min(1800, result.session.targetDurationSec);

  state.focusBoostRemainingSec = boostDurationSec;
  state.focusMultiplier = config.focusBoostMultiplier;
  recalculateRates(state, config, modifiers);
  state.stateVersion += 1;
  state.lastServerTickAtMs = nowMs;

  const updated = toCanonicalDTO(state);
  await repo.saveWorldState(userId, updated);
  return {
    ok: true,
    statusCode: 200,
    data: {
      sessionId: result.session.id,
      boostMultiplier: config.focusBoostMultiplier,
      boostDurationSec,
      canonicalState: updated
    }
  };
}

