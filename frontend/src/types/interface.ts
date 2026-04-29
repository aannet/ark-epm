import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';

export type { TagValueResponse };

export type InterfaceType =
  | 'REST' | 'SOAP' | 'FTP' | 'SFTP' | 'DATABASE'
  | 'MESSAGE_QUEUE' | 'BATCH_FILE' | 'EVENT_STREAM'
  | 'GRAPHQL' | 'GRPC' | 'OTHER';

export type InterfaceFrequency =
  | 'REALTIME' | 'NEAR_REALTIME' | 'HOURLY' | 'DAILY'
  | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND';

export type CriticalityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InterfaceAppRef {
  id: string;
  name: string;
}

export interface InterfaceListItem {
  id: string;
  name: string | null;
  sourceApp: InterfaceAppRef;
  targetApp: InterfaceAppRef;
  middlewareApp: InterfaceAppRef | null;
  type: InterfaceType;
  frequency: InterfaceFrequency | null;
  criticality: CriticalityLevel | null;
  errorRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterfaceResponse {
  id: string;
  name: string | null;
  description: string | null;
  comment: string | null;
  sourceAppId: string;
  sourceApp: InterfaceAppRef;
  targetAppId: string;
  targetApp: InterfaceAppRef;
  middlewareAppId: string | null;
  middlewareApp: InterfaceAppRef | null;
  type: InterfaceType;
  frequency: InterfaceFrequency | null;
  criticality: CriticalityLevel | null;
  technicalContact: string | null;
  errorRate: number | null;
  tags: TagValueResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface InterfaceFormValues {
  sourceAppId: string | null;
  targetAppId: string | null;
  middlewareAppId: string | null;
  name: string;
  type: InterfaceType | '';
  frequency: InterfaceFrequency | null;
  criticality: CriticalityLevel | null;
  technicalContact: string;
  errorRate: number | null;
  description: string;
  comment: string;
  tagPaths: string[];
}

export interface InterfaceFilters {
  search?: string;
  sourceAppId?: string;
  middlewareAppId?: string;
  targetAppId?: string;
  type?: InterfaceType;
  criticality?: CriticalityLevel;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedInterfaceList {
  data: InterfaceListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
