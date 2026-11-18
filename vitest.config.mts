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
      // Lógica de negocio, API y todo lo que la usa. Las páginas de Next (src/app/**/page.tsx) se
      // miden con Playwright.
      include: [
        'src/schemas/**',
        'src/services/**',
        'src/repositories/**',
        'src/lib/**',
        'src/storage/**',
        'src/hooks/**',
        'src/components/**',
        'src/app/api/**',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        '**/pruebas-de-datos.ts',
        'src/repositories/index.ts',
      ],
      reporter: ['text', 'html', 'json-summary'],
      // Bajar estos números rompe `npm run check`: es a propósito.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        'src/schemas/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
        'src/services/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  },
});
