import { useQuery } from '@tanstack/react-query';
import client from './client';
import { HomeSummaryResponse } from '@/types/home';

export function useHomeSummary() {
  return useQuery({
    queryKey: ['home', 'summary'],
    queryFn: async () => {
      const response = await client.get<HomeSummaryResponse>('/home/summary');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
