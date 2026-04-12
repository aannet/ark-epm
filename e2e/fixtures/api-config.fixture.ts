import { test as baseTest, expect } from '@playwright/test';

export interface ApiConfigFixtures {
  apiBaseUrl: string;
  apiVersion: string;
  fullApiUrl: string;
}

export const test = baseTest.extend<ApiConfigFixtures>({
  // URL de base du backend (sans version)
  apiBaseUrl: [
    process.env.API_BASE_URL || 'http://localhost:3001',
    { option: true }
  ],
  
  // Version de l'API (/api/v1, /api/v2, etc.)
  apiVersion: [
    process.env.API_VERSION || '/api/v1',
    { option: true }
  ],
  
  // URL complète avec version (calculée automatiquement)
  fullApiUrl: async ({ apiBaseUrl, apiVersion }, use) => {
    await use(`${apiBaseUrl}${apiVersion}`);
  },
});

export { expect };
