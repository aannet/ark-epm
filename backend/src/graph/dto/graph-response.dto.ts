export interface GraphNodeMeta {
  criticality?: string | null;
  lifecycleStatus?: string | null;
  domainId?: string | null;
  domainName?: string | null;
  level?: number | null;
}

export interface GraphNode {
  id: string;
  type: 'application' | 'bc' | 'provider' | 'it_component' | 'data_object';
  isFocal: boolean;
  label: string;
  meta?: GraphNodeMeta;
}

export interface GraphEdgeMeta {
  type: string;
  frequency?: string | null;
  criticality?: string | null;
  middlewareAppId?: string | null;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string | null;
  meta?: GraphEdgeMeta;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
