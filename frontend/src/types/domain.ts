export interface Domain {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface DomainFormValues {
  name: string;
  description: string;
}
