import api from '@/api/client';
import {
  DataObjectResponse,
  DataObjectFormValues,
  PaginatedDataObjects,
  PaginatedApplicationsWithRole,
} from '@/types/data-object';

interface ListParams {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'type' | 'isSourceOfTruth' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  type?: string;
  isSourceOfTruth?: string;
}

export async function getDataObjects(params: ListParams = {}): Promise<PaginatedDataObjects> {
  const cleanParams: Record<string, unknown> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') cleanParams[k] = v;
  });
  const response = await api.get('/data-objects', { params: cleanParams });
  return response.data;
}

export async function getDataObject(id: string): Promise<DataObjectResponse> {
  const response = await api.get(`/data-objects/${id}`);
  return response.data;
}

export async function createDataObject(data: DataObjectFormValues): Promise<DataObjectResponse> {
  const response = await api.post('/data-objects', data);
  return response.data;
}

export async function updateDataObject(id: string, data: Partial<DataObjectFormValues>): Promise<DataObjectResponse> {
  const response = await api.patch(`/data-objects/${id}`, data);
  return response.data;
}

export async function deleteDataObject(id: string): Promise<void> {
  await api.delete(`/data-objects/${id}`);
}

export async function getDataObjectApplications(
  id: string,
  params: { page?: number; limit?: number } = {}
): Promise<PaginatedApplicationsWithRole> {
  const response = await api.get(`/data-objects/${id}/applications`, { params });
  return response.data;
}
