/**
 * Test utilities for mocking Prisma and related services
 * Use these factories to create consistent mocks across test files
 */

import { PrismaService } from '../src/prisma/prisma.service';
import { TagsService } from '../src/tags/tags.service';

/**
 * Creates a mock PrismaService with all commonly used methods
 */
export const createMockPrisma = () => ({
  // Application
  application: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  
  // Domain
  domain: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  
  // Provider
  provider: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  
  // User
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  
  // Tags
  entityTag: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  
  tagValue: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  
  tagDimension: {
    findMany: jest.fn(),
  },
  
  // Raw queries
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
  
  // Transaction
  $transaction: jest.fn(),
});

/**
 * Creates a mock TagsService
 */
export const createMockTagsService = () => ({
  getEntityTags: jest.fn().mockResolvedValue([]),
  getEntitiesTags: jest.fn().mockResolvedValue([]),
  resolveOrCreate: jest.fn(),
  normalizePath: jest.fn(),
  labelFromPath: jest.fn(),
});

/**
 * Type for mocked PrismaService
 */
export type MockPrismaService = ReturnType<typeof createMockPrisma>;

/**
 * Type for mocked TagsService
 */
export type MockTagsService = ReturnType<typeof createMockTagsService>;

/**
 * Helper to create mock application data
 */
export const createMockApplication = (overrides: Partial<any> = {}) => ({
  id: 'app-' + Math.random().toString(36).substring(7),
  name: 'Test Application',
  description: 'Test description',
  comment: null,
  domainId: null,
  providerId: null,
  ownerId: null,
  criticality: 'medium',
  lifecycleStatus: 'production',
  createdAt: new Date(),
  updatedAt: new Date(),
  domain: null,
  provider: null,
  owner: null,
  ...overrides,
});

/**
 * Helper to create mock tag value
 */
export const createMockTagValue = (overrides: Partial<any> = {}) => ({
  id: 'tag-' + Math.random().toString(36).substring(7),
  dimensionId: 'dim-test',
  dimensionName: 'Test Dimension',
  dimensionColor: '#2196F3',
  path: 'path/to/tag',
  label: 'Test Label',
  depth: 0,
  parentId: null,
  ...overrides,
});

/**
 * Helper to create mock entity tag
 */
export const createMockEntityTag = (overrides: Partial<any> = {}) => ({
  entityType: 'application',
  entityId: 'app-test',
  tagValueId: 'tag-test',
  tagValue: createMockTagValue(),
  taggedAt: new Date(),
  ...overrides,
});
