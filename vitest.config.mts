import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Lógica de negocio y todo lo que la usa. Las páginas de Next (src/app) se miden con Playwright.
      include: ['src/domain/**', 'src/storage/**', 'src/hooks/**', 'src/components/**'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/*-de-prueba.ts', 'src/domain/tipos.ts'],
      reporter: ['text', 'html', 'json-summary'],
      // Bajar estos números rompe `npm run check`: es a propósito.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        'src/domain/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  },
});
