import { expect, APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { test as baseTest, ApiConfigFixtures } from './api-config.fixture';

export interface AuthContext {
  token: string;
  request: APIRequestContext;
}

interface AuthFixtures extends ApiConfigFixtures {
  auth: AuthContext;
}

export const test = baseTest.extend<AuthFixtures>({
  auth: async ({ apiBaseUrl, apiVersion }, use) => {
    const fullApiUrl = `${apiBaseUrl}${apiVersion}`.replace(/\/$/, '') + '/';
    const email = process.env.API_USER_EMAIL || 'admin@ark.io';
    const password = process.env.API_USER_PASSWORD || 'admin123456';

    // Create a temporary request context for login
    const tempRequestContext = await playwrightRequest.newContext({
      baseURL: fullApiUrl,
    });

    const loginResponse = await tempRequestContext.post('auth/login', {
      data: { email, password },
    });

    expect(loginResponse.status()).toBe(200);
    const { accessToken } = await loginResponse.json();
    expect(accessToken).toBeTruthy();

    // Create authenticated request context
    const authRequestContext = await playwrightRequest.newContext({
      baseURL: fullApiUrl,
      extraHTTPHeaders: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    await use({
      token: accessToken,
      request: authRequestContext,
    });

    await authRequestContext.dispose();
    await tempRequestContext.dispose();
  },
});

export { expect };
