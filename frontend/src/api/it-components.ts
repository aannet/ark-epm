import { useQuery } from '@tanstack/react-query';
import client from './client';
import { ITComponentListItem, ITComponentResponse } from '@/types/it-component';

interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'type' | 'technology';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  type?: string;
  technology?: string;
}

interface PaginatedITComponents {
  data: ITComponentListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useITComponents(query: QueryParams = {}) {
  return useQuery({
    queryKey: ['it-components', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.search) params.append('search', query.search);
      if (query.type) params.append('type', query.type);
      if (query.technology) params.append('technology', query.technology);

      const response = await client.get<PaginatedITComponents>(`/it-components?${params.toString()}`);
      return response.data;
    },
  });
}

export function useITComponent(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['it-components', id],
    queryFn: async () => {
      const response = await client.get<ITComponentResponse>(`/it-components/${id}`);
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}
