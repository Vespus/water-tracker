import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4174',
    headless: true,
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'test-results/playwright-report' }]],
  outputDir: 'test-results/artifacts',
  webServer: {
    command: 'npx vite preview --port 4174',
    url: 'http://localhost:4174',
    reuseExistingServer: true,
    timeout: 15000,
  },
});
