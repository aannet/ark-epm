import { APIResponse, expect } from '@playwright/test';

export async function expectSuccess<T>(
  response: APIResponse,
  expectedStatus: number = 200
): Promise<T> {
  expect(response.status()).toBe(expectedStatus);
  return await response.json() as T;
}

export async function expectError(
  response: APIResponse,
  expectedStatus: number,
  expectedCode?: string
) {
  expect(response.status()).toBe(expectedStatus);

  if (expectedCode) {
    const body = await response.json();
    expect(body).toHaveProperty('code');
    expect(body.code).toBe(expectedCode);
    return body;
  }

  return await response.json();
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function expectPaginationMeta(
  meta: PaginationMeta,
  expected: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  }
) {
  if (expected.page !== undefined) {
    expect(meta.page).toBe(expected.page);
  }
  if (expected.limit !== undefined) {
    expect(meta.limit).toBe(expected.limit);
  }
  if (expected.total !== undefined) {
    expect(meta.total).toBe(expected.total);
  }
  if (expected.totalPages !== undefined) {
    expect(meta.totalPages).toBe(expected.totalPages);
  }

  expect(meta.totalPages).toBe(Math.ceil(meta.total / meta.limit));
}

export interface DomainResponse {
  id: string;
  name: string;
  description: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: TagValueResponse[];
}

export interface ApplicationResponse {
  id: string;
  name: string;
  description: string | null;
  comment: string | null;
  domain: { id: string; name: string } | null;
  provider: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string; email: string } | null;
  criticality: string | null;
  lifecycleStatus: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: TagValueResponse[];
}

export interface TagValueResponse {
  id: string;
  dimensionId: string;
  dimensionName: string;
  dimensionColor: string | null;
  path: string;
  label: string;
  depth: number;
  parentId: string | null;
}

export interface DependencyCounts {
  capabilities: number;
  dataObjects: number;
  itComponents: number;
  sourceInterfaces: number;
  targetInterfaces: number;
}

export interface DependenciesResponse {
  hasDependencies: boolean;
  counts: DependencyCounts;
}
