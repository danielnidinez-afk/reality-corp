import { createBackendApp } from './app.js';
import { SupabaseTokenVerifier, type TokenVerifier } from './auth.js';
import { loadBackendConfig } from './config.js';
import { InMemoryBackendRepository } from './in-memory-repository.js';
import {
  createServiceSupabaseClient,
  SupabaseBackendRepository
} from './supabase-repository.js';

class DevStaticTokenVerifier implements TokenVerifier {
  public async verifyToken(token: string): Promise<string | null> {
    if (token.startsWith('dev-user:')) {
      return token.slice('dev-user:'.length) || null;
    }
    return null;
  }
}

async function startServer(): Promise<void> {
  const config = loadBackendConfig();
  const useSupabase = Boolean(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY);

  const serviceClient = useSupabase
    ? createServiceSupabaseClient(config.SUPABASE_URL!, config.SUPABASE_SERVICE_ROLE_KEY!)
    : null;

  const repository = serviceClient
    ? new SupabaseBackendRepository(serviceClient)
    : new InMemoryBackendRepository();

  const tokenVerifier: TokenVerifier = serviceClient
    ? new SupabaseTokenVerifier(serviceClient)
    : new DevStaticTokenVerifier();

  const app = await createBackendApp({
    config,
    repository,
    tokenVerifier
  });

  await app.listen({
    port: config.PORT,
    host: config.HOST
  });
}

startServer().catch((err) => {
  console.error('Failed to start Reality Corp backend:', err);
  process.exit(1);
});

