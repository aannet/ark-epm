import apiClient from './client';
import { TagValueResponse } from '../components/tags/DimensionTagInput.types';

export interface TagDimensionResponse {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  multiValue: boolean;
  entityScope: string[];
  sortOrder: number;
  createdAt: string;
}

export const tagsApi = {
  getDimensions: () =>
    apiClient.get<TagDimensionResponse[]>('/tag-dimensions').then((r) => r.data),

  autocomplete: (dimensionId: string, query?: string, limit = 20) =>
    apiClient
      .get<TagValueResponse[]>('/tags/autocomplete', {
        params: { dimension: dimensionId, q: query, limit },
      })
      .then((r) => r.data),

  resolve: (dimensionId: string, path: string, label?: string) =>
    apiClient
      .post<TagValueResponse>('/tags/resolve', { dimensionId, path, label })
      .then((r) => r.data),

  getEntityTags: (entityType: string, entityId: string) =>
    apiClient
      .get<Array<{ entityType: string; entityId: string; tagValue: TagValueResponse; taggedAt: string }>>(
        `/tags/entity/${entityType}/${entityId}`,
      )
      .then((r) => r.data.map((t) => t.tagValue)),

  putEntityTags: (
    entityType: string,
    entityId: string,
    dimensionId: string,
    tagValueIds: string[],
  ) =>
    apiClient
      .put<Array<{ entityType: string; entityId: string; tagValue: TagValueResponse; taggedAt: string }>>(
        `/tags/entity/${entityType}/${entityId}`,
        { dimensionId, tagValueIds },
      )
      .then((r) => r.data.map((t) => t.tagValue)),
};
