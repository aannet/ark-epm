import { useQuery } from '@tanstack/react-query';
import client from './client';
import { GraphQueryParams, GraphResponse } from '@/types/graph';

const MIN_DEPTH = 1;
const MAX_DEPTH = 3;

function clampDepth(depth?: number): number {
  if (!depth) {
    return MIN_DEPTH;
  }

  return Math.max(MIN_DEPTH, Math.min(MAX_DEPTH, depth));
}

export function useGraph(params: GraphQueryParams | null) {
  return useQuery({
    queryKey: ['graph', params],
    enabled: Boolean(params?.focalType && params?.focalId),
    queryFn: async () => {
      if (!params) {
        throw new Error('Graph query params are required');
      }

      const query = new URLSearchParams();
      query.set('focalType', params.focalType);
      query.set('focalId', params.focalId);
      query.set('depth', String(clampDepth(params.depth)));

      if (params.layers && params.layers.length > 0) {
        query.set('layers', params.layers.join(','));
      }

      const response = await client.get<GraphResponse>(`/graph?${query.toString()}`);
      return response.data;
    },
  });
}
