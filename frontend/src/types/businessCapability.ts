import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';

export type CriticalityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TechnicalFitLevel = 'ADEQUATE' | 'PARTIAL' | 'INADEQUATE' | 'LEGACY';

export interface BusinessCapability {
  id: string;
  name: string;
  description: string | null;
  comment: string | null;
  level: number;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  domainId: string | null;
  domain: { id: string; name: string } | null;
  criticality: CriticalityLevel | null;
  technicalFit: TechnicalFitLevel | null;
  lifecycleStatus: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    applicationMappings: number;
    children: number;
  };
  tags: TagValueResponse[];
}

export interface BusinessCapabilityListItem {
  id: string;
  name: string;
  description: string | null;
  level: number;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  domainId: string | null;
  domain: { id: string; name: string } | null;
  criticality: CriticalityLevel | null;
  technicalFit: TechnicalFitLevel | null;
  createdAt: string;
  _count: {
    applicationMappings: number;
    children: number;
  };
  tags: TagValueResponse[];
}

export interface BusinessCapabilityTreeNode {
  id: string;
  name: string;
  level: number;
  domainId: string | null;
  domain: { id: string; name: string } | null;
  criticality: CriticalityLevel | null;
  technicalFit: TechnicalFitLevel | null;
  _count: {
    applicationMappings: number;
    children: number;
  };
  children: BusinessCapabilityTreeNode[];
}

export interface BusinessCapabilityFormValues {
  name: string;
  description: string;
  comment: string;
  parentId: string | null;
  domainId: string | null;
  criticality: CriticalityLevel | null;
  technicalFit: TechnicalFitLevel | null;
  lifecycleStatus?: string | null;
  tags: TagValueResponse[];
}

export interface BusinessCapabilityFilters {
  domainId: string | null;
  tagValueIds: string[];
}

export interface PaginatedBusinessCapabilities {
  data: BusinessCapabilityListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApplicationMapping {
  id: string;
  name: string;
  domain: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string; email: string } | null;
  criticality: string | null;
  lifecycleStatus: string | null;
}

export interface PaginatedApplicationMappings {
  data: ApplicationMapping[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ViewMode = 'list' | 'matrix';
