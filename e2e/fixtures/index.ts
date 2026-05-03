import { APIRequestContext } from '@playwright/test';
import { test as baseTest, expect } from './auth.fixture';
import { AuthContext } from './auth.fixture';
import { TestDataFactory } from './test-data.fixture';

export interface TestDataFixtures {
  _auth: AuthContext;
  testData: TestDataFactory;
  authenticatedRequest: APIRequestContext;
  _authenticatedRequest: APIRequestContext;
  _testData: TestDataFactory;
}

export const test = baseTest.extend<TestDataFixtures>({
  _auth: async ({ auth }, use) => {
    await use(auth);
  },
  authenticatedRequest: async ({ auth }: { auth: AuthContext }, use) => {
    await use(auth.request);
  },
  _authenticatedRequest: async ({ authenticatedRequest }, use) => {
    await use(authenticatedRequest);
  },
  testData: async ({ auth }: { auth: AuthContext }, use) => {
    const testDataFactory = new TestDataFactory(auth.request);
    await use(testDataFactory);
    await testDataFactory.cleanup();
  },
  _testData: async ({ testData }, use) => {
    await use(testData);
  },
});

export { expect };
export { TestDataFactory } from './test-data.fixture';
