import apiClient from './client';
import { LoginRequest, LoginResponse, UserResponse } from '../types/auth';

export interface RefreshResponse {
  accessToken: string;
  user: UserResponse;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export const refreshToken = async (): Promise<ApiResult<RefreshResponse>> => {
  try {
    const response = await apiClient.post<RefreshResponse>('/auth/refresh');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to refresh token',
    };
  }
};

export const getMe = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>('/auth/me');
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};
