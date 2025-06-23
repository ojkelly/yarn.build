import { defineConfig } from 'vitest/config';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    pool: 'vmThreads',
    poolOptions: {
      vmThreads: {
        warnOnUnhandledErrors: false
      }
    }
  }
});
