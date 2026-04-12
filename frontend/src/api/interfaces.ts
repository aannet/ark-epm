import { useMutation, useQuery } from '@tanstack/react-query';
import client from './client';
import {
  InterfaceResponse,
  InterfaceFormValues,
  PaginatedInterfaceList,
  InterfaceFilters,
} from '@/types/interface';
import { queryClient } from '@/queryClient';

export function useInterfaces(filters: InterfaceFilters = {}) {
  return useQuery({
    queryKey: ['interfaces', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.sourceAppId) params.append('sourceAppId', filters.sourceAppId);
      if (filters.middlewareAppId) params.append('middlewareAppId', filters.middlewareAppId);
      if (filters.targetAppId) params.append('targetAppId', filters.targetAppId);
      if (filters.type) params.append('type', filters.type);
      if (filters.criticality) params.append('criticality', filters.criticality);

      const response = await client.get<PaginatedInterfaceList>(
        `/interfaces?${params.toString()}`
      );
      return response.data;
    },
  });
}

export function useInterface(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['interfaces', id],
    queryFn: async () => {
      const response = await client.get<InterfaceResponse>(`/interfaces/${id}`);
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useCreateInterface() {
  return useMutation({
    mutationFn: async (data: InterfaceFormValues) => {
      const response = await client.post<InterfaceResponse>('/interfaces', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interfaces'] });
    },
  });
}

export function useUpdateInterface(id: string) {
  return useMutation({
    mutationFn: async (data: Partial<InterfaceFormValues>) => {
      const response = await client.patch<InterfaceResponse>(`/interfaces/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interfaces'] });
      queryClient.invalidateQueries({ queryKey: ['interfaces', id] });
    },
  });
}

export function useDeleteInterface() {
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/interfaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interfaces'] });
    },
  });
}
