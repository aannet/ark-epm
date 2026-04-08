import { useMutation, useQuery } from '@tanstack/react-query';
import client from './client';
import {
  BusinessCapability,
  BusinessCapabilityFormValues,
  PaginatedBusinessCapabilities,
  BusinessCapabilityTreeNode,
  PaginatedApplicationMappings,
} from '@/types/businessCapability';
import { queryClient } from '@/queryClient';

interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  domainId?: string | null;
  tagValueIds?: string[];
}

export function useBusinessCapabilities(query: QueryParams = {}) {
  return useQuery({
    queryKey: ['businessCapabilities', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.search) params.append('search', query.search);
      if (query.domainId) params.append('domainId', query.domainId);
      if (query.tagValueIds?.length) {
        query.tagValueIds.forEach((id) => params.append('tagValueIds', id));
      }

      const response = await client.get<PaginatedBusinessCapabilities>(
        `/business-capabilities?${params.toString()}`
      );
      return response.data;
    },
  });
}

export function useBusinessCapabilitiesTree(query: QueryParams = {}) {
  return useQuery({
    queryKey: ['businessCapabilities', 'tree', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.search) params.append('search', query.search);
      if (query.domainId) params.append('domainId', query.domainId);
      if (query.tagValueIds?.length) {
        query.tagValueIds.forEach((id) => params.append('tagValueIds', id));
      }

      const response = await client.get<{ data: BusinessCapabilityTreeNode[] }>(
        `/business-capabilities/tree?${params.toString()}`
      );
      return response.data.data;
    },
  });
}

export function useBusinessCapability(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['businessCapabilities', id],
    queryFn: async () => {
      const response = await client.get<BusinessCapability>(`/business-capabilities/${id}`);
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useBusinessCapabilityChildren(
  id: string,
  query: QueryParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['businessCapabilities', id, 'children', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);

      const response = await client.get<PaginatedBusinessCapabilities>(
        `/business-capabilities/${id}/children?${params.toString()}`
      );
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useBusinessCapabilityApplications(
  id: string,
  query: QueryParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['businessCapabilities', id, 'applications', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);

      const response = await client.get<PaginatedApplicationMappings>(
        `/business-capabilities/${id}/applications?${params.toString()}`
      );
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useCreateBusinessCapability() {
  return useMutation({
    mutationFn: async (data: BusinessCapabilityFormValues) => {
      const response = await client.post<BusinessCapability>('/business-capabilities', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCapabilities'] });
    },
  });
}

export function useUpdateBusinessCapability(id: string) {
  return useMutation({
    mutationFn: async (data: Partial<BusinessCapabilityFormValues>) => {
      const response = await client.patch<BusinessCapability>(`/business-capabilities/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCapabilities'] });
      queryClient.invalidateQueries({ queryKey: ['businessCapabilities', id] });
    },
  });
}

export function useDeleteBusinessCapability() {
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/business-capabilities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCapabilities'] });
    },
  });
}
