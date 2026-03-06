import { useMutation, useQuery } from '@tanstack/react-query';
import client from './client';
import { Domain, DomainFormValues } from '@/types/domain';

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await client.get<Domain[]>('/domains');
      return response.data;
    },
  });
}

export function useDomain(id: string) {
  return useQuery({
    queryKey: ['domains', id],
    queryFn: async () => {
      const response = await client.get<Domain>(`/domains/${id}`);
      return response.data;
    },
    enabled: !!id,
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
  });
}
