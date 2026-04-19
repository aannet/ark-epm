import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';
import { debounce } from '@mui/material/utils';
import { search } from '@/api/search';
import { SearchQueryParams, SearchResponse, SearchableEntityType } from '@/types/search';

export interface UseOmnisearchReturn {
  results: SearchResponse['data'];
  meta: SearchResponse['meta'] | null;
  isLoading: boolean;
  error: Error | null;
  query: string;
  setQuery: (query: string) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number | ((prev: number) => number)) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  types: SearchableEntityType[];
  setTypes: (types: SearchableEntityType[]) => void;
}

export function useOmnisearch(): UseOmnisearchReturn {
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [types, setTypes] = useState<SearchableEntityType[]>([]);

  const debouncedSetQuery = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedQuery(value);
      }, 300),
    [],
  );

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      debouncedSetQuery(value);
      setSelectedIndex(0);
    },
    [debouncedSetQuery],
  );

  const shouldSearch = debouncedQuery.length >= 2;

  const queryParams: SearchQueryParams | null = shouldSearch
    ? {
        q: debouncedQuery,
        ...(types.length > 0 && { types }),
        limit: 20,
      }
    : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', queryParams],
    queryFn: async () => {
      if (!queryParams) {
        return { data: [], meta: { total: 0, query: '', types: [], limit: 20 } } as SearchResponse;
      }
      return search(queryParams);
    },
    enabled: shouldSearch,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  return {
    results: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading: isLoading && shouldSearch,
    error: error as Error | null,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    open,
    setOpen,
    types,
    setTypes,
  };
}
