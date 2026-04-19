export type SearchableEntityType =
  | 'application'
  | 'domain'
  | 'businessCapability'
  | 'provider'
  | 'itComponent'
  | 'dataObject'
  | 'interface';

export interface SearchResultItem {
  id: string;
  type: SearchableEntityType;
  name: string;
  description: string | null;
  score: number;
  meta?: {
    domainName?: string;
    criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    lifecycleStatus?: string;
  };
}

export interface SearchMeta {
  total: number;
  query: string;
  types: SearchableEntityType[];
  limit: number;
}

export interface SearchResponse {
  data: SearchResultItem[];
  meta: SearchMeta;
}

export interface SearchQueryParams {
  q: string;
  types?: SearchableEntityType[];
  limit?: number;
}
