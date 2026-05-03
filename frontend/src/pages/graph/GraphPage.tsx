import { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dagre from '@dagrejs/dagre';
import {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  NodeMouseHandler,
  NodeTypes,
  ReactFlow,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Alert, Box } from '@mui/material';
import { PageContainer } from '@/components/layout';
import { LoadingSkeleton, PageHeader } from '@/components/shared';
import { useDomains } from '@/api/domains';
import { useGraph } from '@/api/graph';
import GraphAutocomplete from '@/components/graph/GraphAutocomplete';
import GraphEntityDrawer from '@/components/graph/GraphEntityDrawer';
import GraphToolbar from '@/components/graph/GraphToolbar';
import ApplicationNode from '@/components/graph/nodes/ApplicationNode';
import BusinessCapabilityNode from '@/components/graph/nodes/BusinessCapabilityNode';
import DataObjectNode from '@/components/graph/nodes/DataObjectNode';
import ItComponentNode from '@/components/graph/nodes/ItComponentNode';
import ProviderNode from '@/components/graph/nodes/ProviderNode';
import { hasPermission } from '@/store/auth';
import { FocalType, GraphCriticality, GraphEdge, LayerKey } from '@/types/graph';

type AlertState = {
  severity: 'warning' | 'error' | 'info';
  message: string;
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;

const DEFAULT_BASE_LAYERS: LayerKey[] = ['applications', 'interfaces'];
const VALID_LAYER_SET = new Set<LayerKey>([
  'applications',
  'interfaces',
  'business_capabilities',
  'providers',
  'it_components',
  'data_objects',
]);
const VALID_CRITICALITY_SET = new Set<GraphCriticality>(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const VALID_FOCAL_TYPE_SET = new Set<FocalType>([
  'application',
  'business_capability',
  'domain',
  'provider',
  'it_component',
  'data_object',
]);

function getDefaultLayers(focalType: FocalType | null): LayerKey[] {
  if (focalType === 'business_capability') {
    return ['applications', 'interfaces', 'business_capabilities'];
  }

  return DEFAULT_BASE_LAYERS;
}

function parseDepth(value: string | null): number {
  const parsed = Number(value || '1');
  if (!Number.isInteger(parsed)) {
    return 1;
  }

  return Math.max(1, Math.min(3, parsed));
}

function parseFocalType(value: string | null): FocalType | null {
  if (!value) {
    return null;
  }

  if (VALID_FOCAL_TYPE_SET.has(value as FocalType)) {
    return value as FocalType;
  }

  return null;
}

function parseLayers(value: string | null, focalType: FocalType | null): LayerKey[] {
  if (!value) {
    return getDefaultLayers(focalType);
  }

  const parsed = value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is LayerKey => VALID_LAYER_SET.has(item as LayerKey));

  if (parsed.length === 0) {
    return getDefaultLayers(focalType);
  }

  return Array.from(new Set(parsed));
}

function parseCriticalities(value: string | null): GraphCriticality[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is GraphCriticality => VALID_CRITICALITY_SET.has(item as GraphCriticality));
}

function parseDomainIds(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function expandMiddlewareEdges(edges: GraphEdge[], viaLabel: string): GraphEdge[] {
  return edges.flatMap((edge) => {
    const middlewareId = edge.meta?.middlewareAppId;
    if (!middlewareId) {
      return [edge];
    }

    return [
      {
        ...edge,
        id: `${edge.id}-source`,
        targetId: middlewareId,
        label: edge.meta?.type || edge.label,
      },
      {
        ...edge,
        id: `${edge.id}-target`,
        sourceId: middlewareId,
        label: viaLabel,
      },
    ];
  });
}

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: 'LR', nodesep: 64, ranksep: 120 });
  graph.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const position = graph.node(node.id);
    if (!position) {
      return node;
    }

    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    };
  });
}

const nodeTypes: NodeTypes = {
  application: ApplicationNode,
  bc: BusinessCapabilityNode,
  provider: ProviderNode,
  it_component: ItComponentNode,
  data_object: DataObjectNode,
};

export default function GraphPage(): JSX.Element {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [focalType, setFocalType] = useState<FocalType | null>(() => parseFocalType(searchParams.get('focalType')));
  const [focalId, setFocalId] = useState<string | null>(() => searchParams.get('focalId'));
  const [depth, setDepth] = useState<number>(() => parseDepth(searchParams.get('depth')));
  const [activeLayers, setActiveLayers] = useState<LayerKey[]>(() =>
    parseLayers(searchParams.get('layers'), parseFocalType(searchParams.get('focalType')))
  );
  const [selectedCriticalities, setSelectedCriticalities] = useState<GraphCriticality[]>(() =>
    parseCriticalities(searchParams.get('criticality'))
  );
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>(() => parseDomainIds(searchParams.get('domainIds')));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pageAlert, setPageAlert] = useState<AlertState | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    const nextFocalType = parseFocalType(searchParams.get('focalType'));
    setFocalType(nextFocalType);
    setFocalId(searchParams.get('focalId'));
    setDepth(parseDepth(searchParams.get('depth')));
    setActiveLayers(parseLayers(searchParams.get('layers'), nextFocalType));
    setSelectedCriticalities(parseCriticalities(searchParams.get('criticality')));
    setSelectedDomainIds(parseDomainIds(searchParams.get('domainIds')));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (focalType) {
      params.set('focalType', focalType);
    }
    if (focalId) {
      params.set('focalId', focalId);
    }
    if (depth !== 1) {
      params.set('depth', String(depth));
    }
    if (activeLayers.length > 0) {
      params.set('layers', activeLayers.join(','));
    }
    if (selectedCriticalities.length > 0) {
      params.set('criticality', selectedCriticalities.join(','));
    }
    if (selectedDomainIds.length > 0) {
      params.set('domainIds', selectedDomainIds.join(','));
    }

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: false });
    }
  }, [
    activeLayers,
    depth,
    focalId,
    focalType,
    searchParams,
    selectedCriticalities,
    selectedDomainIds,
    setSearchParams,
  ]);

  const hasReadPermission = hasPermission('applications:read');
  const hasFocal = Boolean(focalType && focalId);
  const graphQuery = useGraph(
    hasFocal
      ? {
          focalType: focalType as FocalType,
          focalId: focalId as string,
          depth,
          layers: activeLayers,
        }
      : null
  );

  const domainsQuery = useDomains({ page: 1, limit: 200, sortBy: 'name', sortOrder: 'asc' });

  useEffect(() => {
    if (!graphQuery.error) {
      return;
    }

    const status = (graphQuery.error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      setPageAlert({ severity: 'warning', message: t('graph.alert.notFound') });
      setFocalType(null);
      setFocalId(null);
      setSelectedNodeId(null);
      return;
    }

    setPageAlert({ severity: 'error', message: t('graph.alert.loadError') });
  }, [graphQuery.error, t]);

  const rawNodes = graphQuery.data?.nodes || [];
  const rawEdges = graphQuery.data?.edges || [];

  const expandedEdges = useMemo(() => expandMiddlewareEdges(rawEdges, t('graph.edges.viaMiddleware')), [rawEdges, t]);

  const filteredNodes = useMemo(
    () =>
      rawNodes.filter((node) => {
        if (node.isFocal) {
          return true;
        }

        const criticality = node.meta?.criticality || null;
        if (selectedCriticalities.length > 0 && (!criticality || !selectedCriticalities.includes(criticality))) {
          return false;
        }

        const domainId = node.meta?.domainId || null;
        if (selectedDomainIds.length > 0 && (!domainId || !selectedDomainIds.includes(domainId))) {
          return false;
        }

        return true;
      }),
    [rawNodes, selectedCriticalities, selectedDomainIds]
  );

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((node) => node.id)), [filteredNodes]);

  const filteredEdges = useMemo(
    () =>
      expandedEdges.filter(
        (edge) => visibleNodeIds.has(edge.sourceId) && visibleNodeIds.has(edge.targetId)
      ),
    [expandedEdges, visibleNodeIds]
  );

  useEffect(() => {
    if (selectedNodeId && !visibleNodeIds.has(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, visibleNodeIds]);

  const reactFlowNodes = useMemo<Node[]>(
    () =>
      filteredNodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: { x: 0, y: 0 },
        selected: node.id === selectedNodeId,
        data: {
          label: node.label || t('graph.nodes.unnamed'),
          isFocal: node.isFocal,
          subtitle: node.meta?.domainName || undefined,
        },
      })),
    [filteredNodes, selectedNodeId, t]
  );

  const reactFlowEdges = useMemo<Edge[]>(
    () =>
      filteredEdges.map((edge) => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.label || edge.meta?.type || undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
      })),
    [filteredEdges]
  );

  const layoutedNodes = useMemo(() => applyDagreLayout(reactFlowNodes, reactFlowEdges), [reactFlowEdges, reactFlowNodes]);

  useEffect(() => {
    if (!reactFlowInstance || graphQuery.dataUpdatedAt === 0) {
      return;
    }

    reactFlowInstance.fitView({ padding: 0.2, duration: 280 });
  }, [graphQuery.dataUpdatedAt, reactFlowInstance]);

  const selectedNode = rawNodes.find((node) => node.id === selectedNodeId) || null;

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    setSelectedNodeId(node.id);
  };

  const handleFocalChange = (nextFocalType: FocalType, nextFocalId: string) => {
    setPageAlert(null);
    setFocalType(nextFocalType);
    setFocalId(nextFocalId);
    setDepth(1);
    setActiveLayers(getDefaultLayers(nextFocalType));
    setSelectedNodeId(null);
  };

  if (!hasReadPermission) {
    return <Navigate to="/403" replace />;
  }

  return (
    <PageContainer maxWidth={false}>
      <PageHeader title={t('graph.page.title')} />

      {pageAlert ? (
        <Alert sx={{ mb: 2 }} severity={pageAlert.severity} onClose={() => setPageAlert(null)}>
          {pageAlert.message}
        </Alert>
      ) : null}

      <GraphToolbar
        focalType={focalType}
        activeLayers={activeLayers}
        depth={depth}
        domains={domainsQuery.data?.data || []}
        selectedCriticalities={selectedCriticalities}
        selectedDomainIds={selectedDomainIds}
        onLayersChange={setActiveLayers}
        onDepthChange={setDepth}
        onCriticalitiesChange={setSelectedCriticalities}
        onDomainIdsChange={setSelectedDomainIds}
        onFitView={() => reactFlowInstance?.fitView({ padding: 0.2, duration: 200 })}
      />

      <Box
        sx={{
          mt: 2,
          height: 'calc(100vh - 220px)',
          minHeight: 520,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {!hasFocal ? (
          <Box sx={{ p: 3, height: '100%', display: 'grid', placeItems: 'center' }}>
            <GraphAutocomplete focalType={focalType} focalId={focalId} onSelect={handleFocalChange} />
          </Box>
        ) : graphQuery.isLoading ? (
          <Box sx={{ p: 3 }}>
            <LoadingSkeleton rows={8} columns={3} />
          </Box>
        ) : (
          <ReactFlow
            nodes={layoutedNodes}
            edges={reactFlowEdges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onInit={setReactFlowInstance}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Controls position="bottom-right" />
            <MiniMap pannable zoomable />
            <Background gap={20} size={1} />
          </ReactFlow>
        )}
      </Box>

      {hasFocal && rawNodes.length === 1 ? (
        <Alert sx={{ mt: 2 }} severity="info">
          {t('graph.emptyState.noRelations')}
        </Alert>
      ) : null}

      {hasFocal && rawNodes.length > 150 ? (
        <Alert sx={{ mt: 2 }} severity="warning">
          {t('graph.warning.tooManyNodes', { count: rawNodes.length })}
        </Alert>
      ) : null}

      <GraphEntityDrawer
        selectedNode={selectedNode}
        open={Boolean(selectedNode)}
        onClose={() => setSelectedNodeId(null)}
      />
    </PageContainer>
  );
}
