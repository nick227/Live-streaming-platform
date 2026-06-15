import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: '.',
  test: {
    environment: 'node',
    setupFiles: ['./src/lib/env.ts', './src/__tests__/helpers/setup.ts'],
    testTimeout: 30000,
    fileParallelism: false,
    include: ['src/__tests__/**/*.test.ts']
  },
})
