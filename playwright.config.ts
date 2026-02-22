import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true,
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'test-results/playwright-report' }]],
  outputDir: 'test-results/artifacts',
  webServer: {
    command: 'npx vite preview --port 4174 --host 127.0.0.1',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 15000,
  },
});
