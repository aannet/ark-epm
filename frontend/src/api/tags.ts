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

  // Helper to set all tags for an entity (calls API for each dimension)
  setEntityTags: async (
    entityType: string,
    entityId: string,
    tagValueIds: string[],
  ): Promise<void> => {
    // Get current entity tags to understand dimensions
    const currentTags = await tagsApi.getEntityTags(entityType, entityId);
    
    // Group tags by dimension
    const currentByDimension = new Map<string, string[]>();
    currentTags.forEach((tag) => {
      if (!currentByDimension.has(tag.dimensionId)) {
        currentByDimension.set(tag.dimensionId, []);
      }
      currentByDimension.get(tag.dimensionId)!.push(tag.id);
    });

    // Clear all current tags first by setting empty arrays per dimension
    for (const dimensionId of currentByDimension.keys()) {
      await tagsApi.putEntityTags(entityType, entityId, dimensionId, []);
    }

    // Group new tags by dimension and set them
    // We need to fetch tag details to get dimension info
    if (tagValueIds.length > 0) {
      // Call the backend batch endpoint which handles tag assignment
      await apiClient.put(`/tags/entity/${entityType}/${entityId}/batch`, {
        tagValueIds,
      });
    }
  },
};
