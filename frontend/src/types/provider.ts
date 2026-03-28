import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';

export interface Provider {
  id: string;
  name: string;
  description: string | null;
  comment: string | null;
  contractType: string | null;
  expiryDate: string | null; // ISO date string
  createdAt: string;
  updatedAt: string;
  _count: {
    appProviderMaps: number;
  };
  tags: TagValueResponse[];
}

export interface ProviderFormValues {
  name: string;
  description: string;
  comment: string;
  contractType: string;
  expiryDate: string | null;
  tags: TagValueResponse[];
}

export interface ProviderApplication {
  id: string;
  name: string;
  description: string | null;
  comment: string | null;
  ownerId: string | null;
  domainId: string | null;
  criticality: string | null;
  lifecycleStatus: string | null;
  createdAt: string;
  updatedAt: string;
  domain: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  providerRole: string | null;
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

export interface ProviderFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'expiryDate';
  sortOrder?: 'asc' | 'desc';
}
