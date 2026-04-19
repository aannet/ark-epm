import apiClient from './client';
import { SearchQueryParams, SearchResponse } from '@/types/search';

export async function search(params: SearchQueryParams): Promise<SearchResponse> {
  const response = await apiClient.get<SearchResponse>('/search', {
    params: {
      q: params.q,
      ...(params.types && params.types.length > 0 && { types: params.types }),
      ...(params.limit && { limit: params.limit }),
    },
    paramsSerializer: {
      indexes: null,
    },
  });
  return response.data;
}
