import { APIRequestContext } from '@playwright/test';
import { test as baseTest, expect } from './auth.fixture';
import { AuthContext } from './auth.fixture';
import { TestDataFactory } from './test-data.fixture';

export interface TestDataFixtures {
  testData: TestDataFactory;
  authenticatedRequest: APIRequestContext;
}

export const test = baseTest.extend<TestDataFixtures>({
  authenticatedRequest: async ({ auth }: { auth: AuthContext }, use) => {
    await use(auth.request);
  },
  testData: async ({ auth }: { auth: AuthContext }, use) => {
    const testDataFactory = new TestDataFactory(auth.request);
    await use(testDataFactory);
    await testDataFactory.cleanup();
  },
});

export { expect };
export { TestDataFactory } from './test-data.fixture';
