import { useMutation, useQuery } from '@tanstack/react-query';
import client from './client';
import {
  Provider,
  ProviderFormValues,
  ProviderApplication,
  PaginatedResponse,
  ProviderFilters,
} from '@/types/provider';
import { queryClient } from '@/queryClient';

/**
 * LIST providers with pagination, search, sorting
 */
export function useProviders(filters?: ProviderFilters) {
  const { page = 1, limit = 20, search = '', sortBy = 'name', sortOrder = 'asc' } = filters || {};

  return useQuery({
    queryKey: ['providers', page, limit, search, sortBy, sortOrder],
    queryFn: async () => {
      const response = await client.get<PaginatedResponse<Provider>>('/providers', {
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
        },
      });
      return response.data;
    },
  });
}

/**
 * GET single provider by ID
 */
export function useProvider(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['providers', id],
    queryFn: async () => {
      const response = await client.get<Provider>(`/providers/${id}`);
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

/**
 * GET applications linked to a provider (paginated)
 */
export function useProviderApplications(
  id: string,
  filters?: { page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  const { page = 1, limit = 20 } = filters || {};

  return useQuery({
    queryKey: ['providers', id, 'applications', page, limit],
    queryFn: async () => {
      const response = await client.get<PaginatedResponse<ProviderApplication>>(
        `/providers/${id}/applications`,
        {
          params: { page, limit },
        },
      );
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

/**
 * CREATE provider
 */
export function useCreateProvider() {
  return useMutation({
    mutationFn: async (data: ProviderFormValues) => {
      const response = await client.post<Provider>('/providers', data);
      return response.data;
    },
  });
}

/**
 * UPDATE provider
 */
export function useUpdateProvider(id: string) {
  return useMutation({
    mutationFn: async (data: ProviderFormValues) => {
      const response = await client.patch<Provider>(`/providers/${id}`, data);
      return response.data;
    },
  });
}

/**
 * DELETE provider (invalidates list on success)
 */
export function useDeleteProvider() {
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });
}
