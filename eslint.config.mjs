import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const reglasDeCalidad = {
  complexity: ['error', 10],
  'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
  'max-depth': ['error', 3],
  'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
  'no-console': 'error',
  eqeqeq: ['error', 'always'],
};

const reglasDeTypeScript = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/ban-ts-comment': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
  { files: ['**/*.{ts,tsx,js,mjs,mts}'], rules: reglasDeCalidad },
  { files: ['**/*.{ts,tsx,mts}'], rules: reglasDeTypeScript },
  {
    // Los scripts de Node (hook, utilidades) corren fuera del navegador.
    files: ['**/*.mjs'],
    languageOptions: { globals: { process: 'readonly' } },
  },
  {
    // Un `describe` agrupa muchos `it`: la regla de 50 líneas aplica al código de producción.
    files: ['**/*.test.{ts,tsx,mjs}', 'e2e/**'],
    rules: { 'max-lines-per-function': 'off', 'max-lines': 'off' },
  },
]);
