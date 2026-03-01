import { UserResponse } from '../types/auth';

let _token: string | null = null;
let _user: UserResponse | null = null;

export const setAuth = (token: string, user: UserResponse): void => {
  _token = token;
  _user = user;
};

export const getToken = (): string | null => {
  return _token;
};

export const getUser = (): UserResponse | null => {
  return _user;
};

export const clearAuth = (): void => {
  _token = null;
  _user = null;
};

export const hasPermission = (permission: string): boolean => {
  if (!_user?.role?.permissions) {
    return false;
  }
  return _user.role.permissions.some((p) => p.name === permission);
};

export const initializeAuth = (): void => {
  // Token is now stored only in memory - no sessionStorage/localStorage
};
