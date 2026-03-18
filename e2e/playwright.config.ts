import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { 
      outputFolder: 'reports/html',
      open: 'never'
    }]
  ],

  projects: [
    {
      name: 'ui',
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /.*\.api\.spec\.ts$/,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'http://frontend:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
    {
      name: 'api-backend',
      testMatch: /.*\.api\.spec\.ts$/,
      use: {
        baseURL: `${process.env.API_BASE_URL || 'http://localhost:3000'}${process.env.API_VERSION || '/api/v1'}`,
        trace: 'on-first-retry',
      },
    },
  ],

  expect: {
    timeout: 5000,
  },

  timeout: 30000,
});
