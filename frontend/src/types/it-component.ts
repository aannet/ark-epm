export interface ITComponentListItem {
  id: string;
  name: string;
  technology: string | null;
  type: string | null;
  createdAt: string;
  _count: { applications: number };
  tags: EntityTagResponse[];
}

export interface ITComponentResponse extends ITComponentListItem {
  description: string | null;
  comment: string | null;
  updatedAt: string;
}

export interface ITComponentFormValues {
  name: string;
  technology: string;
  type: string;
  description: string;
  comment: string;
  tags?: TagInput[];
}

export interface EntityTagResponse {
  entityType: string;
  entityId: string;
  tagValue: {
    id: string;
    dimensionId: string;
    dimensionName: string;
    dimensionColor: string | null;
    path: string;
    label: string;
    depth: number;
    parentId: string | null;
  };
  taggedAt: string;
}

export interface TagInput {
  dimensionId: string;
  valueId: string;
}

export interface ApplicationListItem {
  id: string;
  name: string;
  description: string | null;
  domain: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  criticality: string | null;
  lifecycleStatus: string | null;
  createdAt: string;
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

export interface ITComponentFilters {
  search?: string;
  type?: string;
  technology?: string;
}
