import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiErrorResponse } from '@reality-corp/shared-types';
import type { BackendRepository } from './repository.js';

export interface AuthPrincipal {
  readonly userId: string;
  readonly role: 'player' | 'moderator' | 'admin';
}

export interface TokenVerifier {
  verifyToken(token: string): Promise<string | null>;
}

/** Verifies Supabase JWTs server-side via Supabase Auth GoTrue endpoint. */
export class SupabaseTokenVerifier implements TokenVerifier {
  public constructor(private readonly serviceClient: SupabaseClient) {}

  public async verifyToken(token: string): Promise<string | null> {
    const { data, error } = await this.serviceClient.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  }
}

export function sendApiError(
  reply: FastifyReply,
  statusCode: number,
  code: ApiErrorResponse['error']['code'],
  message: string,
  retryable: boolean,
  canonicalState?: ApiErrorResponse['error']['canonicalState']
): FastifyReply {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      retryable,
      ...(canonicalState ? { canonicalState } : {})
    }
  };
  return reply.code(statusCode).send(body);
}

export function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

/** Authenticates request bearer token and attaches verified `principal` from repository profile. */
export function buildAuthPreHandler(verifier: TokenVerifier, repo: BackendRepository) {
  return async function authenticateRequest(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const token = extractBearerToken(request);
    if (!token) {
      await sendApiError(reply, 401, 'UNAUTHORIZED', 'Missing bearer token', false);
      return;
    }

    const userId = await verifier.verifyToken(token);
    if (!userId) {
      await sendApiError(reply, 401, 'UNAUTHORIZED', 'Invalid or expired bearer token', false);
      return;
    }

    const profile = await repo.getOrCreateProfile(userId);
    const worldState = await repo.getWorldState(userId, profile.activeWorldId);
    if (worldState?.trustStatus === 'suspended') {
      await sendApiError(reply, 403, 'FORBIDDEN', 'Account suspended for policy violation', false);
      return;
    }

    request.principal = {
      userId,
      role: profile.role
    };
  };
}

/** Rejects non-admin principals with HTTP 403 FORBIDDEN after verifying authoritative DB role. */
export async function requireAdminPrincipal(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.principal || request.principal.role !== 'admin') {
    await sendApiError(reply, 403, 'FORBIDDEN', 'Administrator role required', false);
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    principal?: AuthPrincipal;
  }
}

