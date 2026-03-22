import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '@/api/tags';

export interface TagDimension {
  id: string;
  name: string;
  color: string;
}

export function useTagDimensions(entityType?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tag-dimensions', entityType],
    queryFn: async () => {
      const dimensions = await tagsApi.getDimensions(entityType);
      return dimensions.map((d) => ({
        id: d.id,
        name: d.name,
        color: d.color || '#2196F3',
      }));
    },
  });

  return {
    dimensions: data || [],
    isLoading,
    error,
  };
}
