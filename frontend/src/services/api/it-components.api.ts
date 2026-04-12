import api from '@/api/client';
import {
  ITComponentListItem,
  ITComponentResponse,
  ITComponentFormValues,
  ApplicationListItem,
  PaginatedResponse,
  ITComponentFilters,
} from '@/types/it-component';

interface ListParams extends ITComponentFilters {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'type' | 'technology';
  sortOrder?: 'asc' | 'desc';
}

export async function getITComponents(params: ListParams = {}): Promise<PaginatedResponse<ITComponentListItem>> {
  const response = await api.get('/it-components', { params });
  return response.data;
}

export async function getITComponent(id: string): Promise<ITComponentResponse> {
  const response = await api.get(`/it-components/${id}`);
  return response.data;
}

export async function createITComponent(data: ITComponentFormValues): Promise<ITComponentResponse> {
  const response = await api.post('/it-components', data);
  return response.data;
}

export async function updateITComponent(id: string, data: ITComponentFormValues): Promise<ITComponentResponse> {
  const response = await api.patch(`/it-components/${id}`, data);
  return response.data;
}

export async function deleteITComponent(id: string): Promise<void> {
  await api.delete(`/it-components/${id}`);
}

export async function getITComponentApplications(
  id: string,
  params: { page?: number; limit?: number } = {}
): Promise<PaginatedResponse<ApplicationListItem>> {
  const response = await api.get(`/it-components/${id}/applications`, { params });
  return response.data;
}
