import type { FastifyInstance, onRequestHookHandler, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  FocusCompleteRequestSchema,
  FocusStartRequestSchema,
  PrestigeRequestSchema,
  PurchaseRequestSchema,
  RewardClaimRequestSchema,
  SyncBatchRequestSchema
} from '@reality-corp/shared-types';
import { sendApiError } from '../auth.js';
import type { BackendRepository } from '../repository.js';
import { processSyncBatch } from '../sync-service.js';
import {
  processPrestige,
  processPurchase,
  processRewardClaim
} from '../actions-service.js';
import { processFocusComplete, processFocusStart } from '../focus-service.js';
import type { ServiceOutcome } from '../world-state-helpers.js';

const IdempotencyHeaderSchema = z.object({
  'x-idempotency-key': z.string().uuid()
});

function replyFromOutcome<T>(reply: FastifyReply, outcome: ServiceOutcome<T>): FastifyReply {
  if (outcome.ok) {
    return reply.code(outcome.statusCode).send(outcome.data);
  }
  return sendApiError(
    reply,
    outcome.statusCode,
    outcome.code,
    outcome.message,
    outcome.retryable,
    outcome.canonicalState
  );
}

export function registerSyncRoutes(
  app: FastifyInstance,
  repo: BackendRepository,
  requireAuth: onRequestHookHandler,
  nowProvider: () => number
): void {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.post(
    '/v1/sync/batch',
    {
      onRequest: requireAuth,
      schema: {
        headers: IdempotencyHeaderSchema,
        body: SyncBatchRequestSchema
      },
      config: {
        rateLimit: { max: 40, timeWindow: '1 minute' }
      }
    },
    async (request, reply) => {
      const userId = request.principal!.userId;
      const idempotencyKey = request.headers['x-idempotency-key'];
      const outcome = await processSyncBatch(repo, userId, request.body, idempotencyKey, nowProvider());
      return replyFromOutcome(reply, outcome);
    }
  );

  typed.post(
    '/v1/economy/purchase',
    {
      onRequest: requireAuth,
      schema: { body: PurchaseRequestSchema }
    },
    async (request, reply) => {
      const outcome = await processPurchase(
        repo,
        request.principal!.userId,
        request.body,
        nowProvider()
      );
      return replyFromOutcome(reply, outcome);
    }
  );

  typed.post(
    '/v1/economy/prestige',
    {
      onRequest: requireAuth,
      schema: { body: PrestigeRequestSchema }
    },
    async (request, reply) => {
      const outcome = await processPrestige(
        repo,
        request.principal!.userId,
        request.body,
        nowProvider()
      );
      return replyFromOutcome(reply, outcome);
    }
  );

  typed.post(
    '/v1/rewards/claim',
    {
      onRequest: requireAuth,
      schema: { body: RewardClaimRequestSchema }
    },
    async (request, reply) => {
      const outcome = await processRewardClaim(
        repo,
        request.principal!.userId,
        request.body,
        nowProvider()
      );
      return replyFromOutcome(reply, outcome);
    }
  );

  typed.post(
    '/v1/focus/start',
    {
      onRequest: requireAuth,
      schema: { body: FocusStartRequestSchema }
    },
    async (request, reply) => {
      const outcome = await processFocusStart(
        repo,
        request.principal!.userId,
        request.body,
        nowProvider()
      );
      return replyFromOutcome(reply, outcome);
    }
  );

  typed.post(
    '/v1/focus/complete',
    {
      onRequest: requireAuth,
      schema: { body: FocusCompleteRequestSchema }
    },
    async (request, reply) => {
      const outcome = await processFocusComplete(
        repo,
        request.principal!.userId,
        request.body,
        nowProvider()
      );
      return replyFromOutcome(reply, outcome);
    }
  );
}
