import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    fileParallelism: false,
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
