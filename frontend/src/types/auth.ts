export interface Permission {
  id: string;
  name: string;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  permissions?: Permission[];
}

export interface DomainRef {
  id: string;
  name: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  role: Role | null;
  createdAt: string;
  domainIds: string[];
  domains: DomainRef[];
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  roleId: string | null;
  domainIds: string[];
}

export interface UpdateUserDto {
  firstName?: string | null;
  lastName?: string | null;
  roleId?: string | null;
  isActive?: boolean;
  domainIds?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}
