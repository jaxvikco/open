import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/aspire/nx-aspire-e2e',
  test: {
    
    globalSetup: '../../../tools/scripts/vitest-global-setup.ts',name: '@jaxvik/nx-aspire-e2e',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default']
  },
}));
