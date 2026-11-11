import type { FastifyInstance, onRequestHookHandler } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  AnalyticsBatchRequestSchema,
  ProfileUpdateSchema,
  WorldIdSchema
} from '@reality-corp/shared-types';
import type { BackendRepository } from '../repository.js';

const WorldParamsSchema = z.object({
  worldId: WorldIdSchema
});

const LeaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export function registerPlayerRoutes(
  app: FastifyInstance,
  repo: BackendRepository,
  requireAuth: onRequestHookHandler
): void {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get('/v1/profile/me', { onRequest: requireAuth }, async (request) => {
    const profile = await repo.getOrCreateProfile(request.principal!.userId);
    const activeWorldState = await repo.getWorldState(profile.userId, profile.activeWorldId);
    return {
      profile,
      activeWorldState
    };
  });

  typed.patch(
    '/v1/profile/me',
    {
      onRequest: requireAuth,
      schema: {
        body: ProfileUpdateSchema
      }
    },
    async (request) => {
      const patch: Partial<Pick<Awaited<ReturnType<BackendRepository['getOrCreateProfile']>>, 'username' | 'activeWorldId'>> =
        {};
      if (request.body.username !== undefined) patch.username = request.body.username;
      if (request.body.activeWorldId !== undefined) patch.activeWorldId = request.body.activeWorldId;
      const updated = await repo.updateProfile(request.principal!.userId, patch);
      return { profile: updated };
    }
  );

  typed.delete('/v1/profile/me', { onRequest: requireAuth }, async (request, reply) => {
    const deleted = await repo.deleteProfileAndAllData(request.principal!.userId);
    return reply.code(200).send({
      deleted,
      userId: request.principal!.userId
    });
  });

  typed.get(
    '/v1/leaderboard/:worldId',
    {
      schema: {
        params: WorldParamsSchema,
        querystring: LeaderboardQuerySchema
      }
    },
    async (request) => {
      const entries = await repo.listLeaderboard(request.params.worldId, request.query.limit);
      return {
        worldId: request.params.worldId,
        entries
      };
    }
  );

  typed.post(
    '/v1/analytics/batch',
    {
      onRequest: requireAuth,
      bodyLimit: 65_536,
      schema: {
        body: AnalyticsBatchRequestSchema
      },
      config: {
        rateLimit: { max: 30, timeWindow: '1 minute' }
      }
    },
    async (request, reply) => {
      const acceptedCount = await repo.insertAnalyticsBatch(request.body.events);
      return reply.code(202).send({ acceptedCount });
    }
  );
}

