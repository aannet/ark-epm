import { useQuery } from '@tanstack/react-query';
import client from './client';
import { UserResponse } from '@/types/auth';

interface QueryUsersParams {
  isActive?: boolean;
}

export function useUsers(filters?: QueryUsersParams) {
  // AGENT-DECISION: front — expose dedicated users hook and default to active users only for owner selector.
  const params = filters?.isActive === undefined ? {} : { isActive: filters.isActive };

  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await client.get<UserResponse[]>('/users', {
        params,
      });
      return response.data;
    },
  });
}
