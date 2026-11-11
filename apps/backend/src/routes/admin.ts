import type { FastifyInstance, onRequestHookHandler } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { WorldIdSchema } from '@reality-corp/shared-types';
import { requireAdminPrincipal, sendApiError } from '../auth.js';
import type { BackendRepository } from '../repository.js';

const TrustPatchParamsSchema = z.object({
  userId: z.string().uuid()
});

const TrustPatchBodySchema = z.object({
  worldId: WorldIdSchema,
  trustStatus: z.enum(['verified', 'shadow_flagged', 'suspended'])
});

export function registerAdminRoutes(
  app: FastifyInstance,
  repo: BackendRepository,
  requireAuth: onRequestHookHandler
): void {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const adminChain: onRequestHookHandler[] = [
    requireAuth,
    requireAdminPrincipal as unknown as onRequestHookHandler
  ];

  typed.get('/v1/admin/anomalies', { onRequest: adminChain }, async () => {
    const anomalies = await repo.listRecentAnomalies(50);
    return { anomalies };
  });

  typed.post(
    '/v1/admin/players/:userId/trust',
    {
      onRequest: adminChain,
      schema: {
        params: TrustPatchParamsSchema,
        body: TrustPatchBodySchema
      }
    },
    async (request, reply) => {
      const state = await repo.getWorldState(request.params.userId, request.body.worldId);
      if (!state) {
        return sendApiError(reply, 404, 'VALIDATION_ERROR', 'Target world state not found', false);
      }
      state.trustStatus = request.body.trustStatus;
      state.stateVersion += 1;
      await repo.saveWorldState(request.params.userId, state);
      return {
        userId: request.params.userId,
        worldId: request.body.worldId,
        trustStatus: state.trustStatus
      };
    }
  );
}

