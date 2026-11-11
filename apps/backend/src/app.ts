import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyError, type FastifyInstance, type onRequestHookHandler } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler
} from 'fastify-type-provider-zod';
import { buildAuthPreHandler, sendApiError, type TokenVerifier } from './auth.js';
import type { BackendConfig } from './config.js';
import type { BackendRepository } from './repository.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerPlayerRoutes } from './routes/player.js';
import { registerSyncRoutes } from './routes/sync.js';

export interface BackendAppOptions {
  readonly config: BackendConfig;
  readonly repository: BackendRepository;
  readonly tokenVerifier: TokenVerifier;
  readonly nowProvider?: () => number;
}

/** Builds configured Fastify v5 server instance ready for `app.inject()` or `app.listen()`. */
export async function createBackendApp(options: BackendAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.config.NODE_ENV !== 'test',
    bodyLimit: 65_536
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const allowedOrigins = options.config.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  await app.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
  });

  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded (retry after ${context.after})`,
        retryable: true
      }
    })
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error.statusCode === 413) {
      return sendApiError(reply, 413, 'VALIDATION_ERROR', 'Payload exceeds 64 KB cap', false);
    }
    if (error.validation || error.statusCode === 400) {
      return sendApiError(reply, 400, 'VALIDATION_ERROR', error.message, false);
    }
    if (error.statusCode === 429) {
      return sendApiError(reply, 429, 'RATE_LIMITED', error.message, true);
    }
    app.log.error(error);
    return sendApiError(reply, 500, 'INTERNAL_ERROR', 'Internal server error', true);
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'reality-corp-backend',
    timestampMs: (options.nowProvider ?? Date.now)()
  }));

  const requireAuth = buildAuthPreHandler(
    options.tokenVerifier,
    options.repository
  ) as onRequestHookHandler;
  const nowProvider = options.nowProvider ?? Date.now;

  registerSyncRoutes(app, options.repository, requireAuth, nowProvider);
  registerPlayerRoutes(app, options.repository, requireAuth);
  registerAdminRoutes(app, options.repository, requireAuth);

  return app;
}
