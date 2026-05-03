export type FocalType =
  | 'application'
  | 'business_capability'
  | 'domain'
  | 'provider'
  | 'it_component'
  | 'data_object';

export type GraphNodeType = 'application' | 'bc' | 'provider' | 'it_component' | 'data_object';

export type LayerKey =
  | 'applications'
  | 'interfaces'
  | 'business_capabilities'
  | 'providers'
  | 'it_components'
  | 'data_objects';

export type GraphCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface GraphNodeMeta {
  criticality?: GraphCriticality | null;
  lifecycleStatus?: string | null;
  domainId?: string | null;
  domainName?: string | null;
  level?: number | null;
}

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  isFocal: boolean;
  label: string;
  meta?: GraphNodeMeta | null;
}

export interface GraphEdgeMeta {
  type?: string;
  frequency?: string | null;
  criticality?: string | null;
  middlewareAppId?: string | null;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string | null;
  meta?: GraphEdgeMeta | null;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphQueryParams {
  focalType: FocalType;
  focalId: string;
  depth?: number;
  layers?: LayerKey[];
}
