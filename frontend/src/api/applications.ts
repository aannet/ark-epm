import { useMutation, useQuery } from '@tanstack/react-query';
import client from './client';
import {
  Application,
  ApplicationFormValues,
  PaginatedApplications,
  ApplicationDependencies,
} from '@/types/application';
import { queryClient } from '@/queryClient';

interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  lifecycleStatus?: string | null;
  tagValueIds?: string[];
}

export function useApplications(query: QueryParams = {}) {
  return useQuery({
    queryKey: ['applications', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.lifecycleStatus) params.append('lifecycleStatus', query.lifecycleStatus);
      if (query.tagValueIds?.length) {
        query.tagValueIds.forEach((id) => params.append('tagValueIds', id));
      }

      const response = await client.get<PaginatedApplications>(`/applications?${params.toString()}`);
      return response.data;
    },
  });
}

export function useApplication(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      const response = await client.get<Application>(`/applications/${id}`);
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useApplicationDependencies(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['applications', id, 'dependencies'],
    queryFn: async () => {
      const response = await client.get<ApplicationDependencies>(`/applications/${id}/dependencies`);
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useCreateApplication() {
  return useMutation({
    mutationFn: async (data: ApplicationFormValues) => {
      const response = await client.post<Application>('/applications', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useUpdateApplication(id: string) {
  return useMutation({
    mutationFn: async (data: ApplicationFormValues) => {
      const response = await client.patch<Application>(`/applications/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
    },
  });
}

export function useDeleteApplication() {
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
