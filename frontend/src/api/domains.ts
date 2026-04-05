import { useMutation, useQuery } from '@tanstack/react-query';
import client from './client';
import { Domain, DomainFormValues, DomainFilters } from '@/types/domain';
import { PaginatedResponse } from '@/types/provider';
import { queryClient } from '@/queryClient';

export function useDomains(filters?: DomainFilters) {
  return useQuery({
    queryKey: ['domains', filters],
    queryFn: async () => {
      const response = await client.get<PaginatedResponse<Domain>>('/domains', { params: filters });
      return response.data;
    },
  });
}

export function useDomain(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['domains', id],
    queryFn: async () => {
      const response = await client.get<Domain>(`/domains/${id}`);
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useCreateDomain() {
  return useMutation({
    mutationFn: async (data: DomainFormValues) => {
      const response = await client.post<Domain>('/domains', data);
      return response.data;
    },
  });
}

export function useUpdateDomain(id: string) {
  return useMutation({
    mutationFn: async (data: DomainFormValues) => {
      const response = await client.patch<Domain>(`/domains/${id}`, data);
      return response.data;
    },
  });
}

export function useDeleteDomain() {
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/domains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
  });
}
