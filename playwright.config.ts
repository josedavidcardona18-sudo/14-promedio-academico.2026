import { defineConfig } from '@playwright/test';

const PUERTO = 3100;
// En esta máquina el navegador viene instalado aparte; en la suya basta con `npx playwright install chromium`.
const chromiumLocal = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: 'off',
    launchOptions: chromiumLocal ? { executablePath: chromiumLocal } : {},
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  // Los tres anchos que pide la hoja de calidad: móvil, tableta y escritorio.
  projects: [
    { name: 'movil-360', use: { viewport: { width: 360, height: 740 } } },
    { name: 'tableta-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'escritorio-1024', use: { viewport: { width: 1024, height: 768 } } },
  ],
});
