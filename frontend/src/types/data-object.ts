import { PaginationMeta } from './it-component';
import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';

export type { TagValueResponse };

export interface DataObjectListItem {
  id: string;
  name: string;
  type: string | null;
  isSourceOfTruth: boolean;
  createdAt: string;
  _count: { appDataObjectMaps: number };
  tags: TagValueResponse[];
}

export interface DataObjectResponse {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  comment: string | null;
  isSourceOfTruth: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { appDataObjectMaps: number };
  tags: TagValueResponse[];
}

export interface DataObjectFormValues {
  name: string;
  type: string | null;
  description: string | null;
  comment: string | null;
  isSourceOfTruth: boolean;
  tags?: TagValueResponse[];
}

export interface ApplicationWithRole {
  id: string;
  name: string;
  role: 'consumer' | 'producer' | 'owner';
  domain: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  criticality: string | null;
  lifecycleStatus: string | null;
  description: string | null;
}

export interface DataObjectFilters {
  search?: string;
  type?: string;
  isSourceOfTruth?: string; // 'true' | 'false' | ''
}

export interface PaginatedDataObjects {
  data: DataObjectListItem[];
  meta: PaginationMeta;
}

export interface PaginatedApplicationsWithRole {
  data: ApplicationWithRole[];
  meta: PaginationMeta;
}
