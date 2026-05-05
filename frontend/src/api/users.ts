import { useMutation, useQuery } from '@tanstack/react-query';
import client from './client';
import { CreateUserDto, Role, UpdateUserDto, UserResponse } from '@/types/auth';
import { queryClient } from '@/queryClient';

interface QueryUsersParams {
  isActive?: boolean;
}

export function useUsers(filters?: QueryUsersParams) {
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

export function useUser(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await client.get<UserResponse>(`/users/${id}`);
      return response.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await client.get<Role[]>('/roles');
      return response.data;
    },
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: async (data: CreateUserDto) => {
      const response = await client.post<UserResponse>('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser(id: string) {
  return useMutation({
    mutationFn: async (data: UpdateUserDto) => {
      const response = await client.patch<UserResponse>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/users/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}
