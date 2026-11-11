import { createBackendApp } from '../src/app.js';
import type { TokenVerifier } from '../src/auth.js';
import { loadBackendConfig } from '../src/config.js';
import { InMemoryBackendRepository } from '../src/in-memory-repository.js';

export const PLAYER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const ADMIN_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const mockVerifier: TokenVerifier = {
  async verifyToken(token: string) {
    if (token === 'player-token') return PLAYER_ID;
    if (token === 'admin-token') return ADMIN_ID;
    return null;
  }
};

export async function createTestHarness(initialNowMs = 1_000_000) {
  let currentNowMs = initialNowMs;
  const repo = new InMemoryBackendRepository();
  await repo.updateProfile(PLAYER_ID, { username: 'apex_player', role: 'player' });
  await repo.updateProfile(ADMIN_ID, { username: 'apex_admin', role: 'admin' });

  const app = await createBackendApp({
    config: loadBackendConfig({ NODE_ENV: 'test' }),
    repository: repo,
    tokenVerifier: mockVerifier,
    nowProvider: () => currentNowMs
  });

  return {
    app,
    repo,
    advanceMs: (deltaMs: number) => {
      currentNowMs += deltaMs;
    },
    setNowMs: (ms: number) => {
      currentNowMs = ms;
    }
  };
}

