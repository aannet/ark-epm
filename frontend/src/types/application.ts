import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';

export interface Application {
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
  tags: TagValueResponse[];
}

export interface ApplicationListItem {
  id: string;
  name: string;
  description: string | null;
  domain: { id: string; name: string } | null;
  provider: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  criticality: string | null;
  lifecycleStatus: string | null;
  createdAt: string;
  tags: TagValueResponse[];
}

export interface ApplicationFormValues {
  name: string;
  description: string;
  comment: string;
  domainId: string | null;
  providerId: string | null;
  ownerId: string | null;
  criticality: string | null;
  lifecycleStatus: string | null;
  tags: TagValueResponse[];
}

export interface ApplicationFilters {
  lifecycleStatus: string | null;
  tagValueIds: string[];
}

export interface PaginatedApplications {
  data: ApplicationListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApplicationDependencies {
  hasDependencies: boolean;
  counts: {
    capabilities: number;
    dataObjects: number;
    itComponents: number;
    sourceInterfaces: number;
    targetInterfaces: number;
  };
}
