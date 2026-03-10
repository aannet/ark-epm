import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';

export interface Domain {
  id: string;
  name: string;
  description: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagValueResponse[];
}

export interface DomainFormValues {
  name: string;
  description: string;
  comment: string;
  tags: TagValueResponse[];
}
