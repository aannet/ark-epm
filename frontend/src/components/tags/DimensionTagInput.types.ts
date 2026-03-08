export interface TagValueResponse {
  id: string;
  dimensionId: string;
  dimensionName: string;
  path: string;
  label: string;
  depth: number;
  parentId: string | null;
}

export interface DimensionTagInputProps {
  dimensionId: string;
  dimensionName: string;
  entityType: string;
  entityId?: string;
  value: TagValueResponse[];
  onChange: (tags: TagValueResponse[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  color?: string;
}
