import apiClient from './client';
import { LoginRequest, LoginResponse, UserResponse } from '../types/auth';

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export const getMe = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>('/auth/me');
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};
