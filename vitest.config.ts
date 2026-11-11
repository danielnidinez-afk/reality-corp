import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@reality-corp/shared-types': resolve(rootDir, 'packages/shared-types/src/index.ts'),
      '@reality-corp/economy-engine': resolve(rootDir, 'packages/economy-engine/src/index.ts'),
      '@reality-corp/game-config': resolve(rootDir, 'packages/game-config/src/index.ts'),
      '@reality-corp/game-engine': resolve(rootDir, 'packages/game-engine/src/index.ts'),
      '@reality-corp/progression-system': resolve(rootDir, 'packages/progression-system/src/index.ts'),
      '@reality-corp/reality-sync': resolve(rootDir, 'packages/reality-sync/src/index.ts'),
      '@reality-corp/ui-components': resolve(rootDir, 'packages/ui-components/src/index.ts')
    }
  },
  test: {
    include: [
      'packages/*/tests/**/*.test.ts',
      'apps/*/tests/**/*.test.ts',
      'tests/**/*.test.ts'
    ],
    environment: 'node',
    globals: false
  }
});
