import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useApplications } from '@/api/applications';
import { useBusinessCapabilities } from '@/api/businessCapabilities';
import { useDomains } from '@/api/domains';
import { useITComponents } from '@/api/it-components';
import { useProviders } from '@/api/providers';
import { getDataObjects } from '@/services/api/data-objects.api';
import { FocalType } from '@/types/graph';

interface GraphFocalOption {
  id: string;
  label: string;
  focalType: FocalType;
  categoryLabel: string;
}

interface GraphAutocompleteProps {
  focalType: FocalType | null;
  focalId: string | null;
  onSelect: (focalType: FocalType, focalId: string) => void;
}

function mapToOption(id: string, label: string, focalType: FocalType, categoryLabel: string): GraphFocalOption {
  return {
    id,
    label,
    focalType,
    categoryLabel,
  };
}

export default function GraphAutocomplete({ focalType, focalId, onSelect }: GraphAutocompleteProps): JSX.Element {
  const { t } = useTranslation();

  const applicationsQuery = useApplications({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const businessCapabilitiesQuery = useBusinessCapabilities({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const domainsQuery = useDomains({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const providersQuery = useProviders({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const itComponentsQuery = useITComponents({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });

  const dataObjectsQuery = useQuery({
    queryKey: ['graph', 'autocomplete', 'data-objects'],
    queryFn: () =>
      getDataObjects({
        page: 1,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
  });

  const options = useMemo<GraphFocalOption[]>(() => {
    const applications = (applicationsQuery.data?.data || []).map((item) =>
      mapToOption(item.id, item.name || t('graph.nodes.unnamed'), 'application', t('graph.entityTypes.application'))
    );
    const businessCapabilities = (businessCapabilitiesQuery.data?.data || []).map((item) =>
      mapToOption(
        item.id,
        item.name || t('graph.nodes.unnamed'),
        'business_capability',
        t('graph.entityTypes.business_capability')
      )
    );
    const domains = (domainsQuery.data?.data || []).map((item) =>
      mapToOption(item.id, item.name || t('graph.nodes.unnamed'), 'domain', t('graph.entityTypes.domain'))
    );
    const providers = (providersQuery.data?.data || []).map((item) =>
      mapToOption(item.id, item.name || t('graph.nodes.unnamed'), 'provider', t('graph.entityTypes.provider'))
    );
    const itComponents = (itComponentsQuery.data?.data || []).map((item) =>
      mapToOption(
        item.id,
        item.name || t('graph.nodes.unnamed'),
        'it_component',
        t('graph.entityTypes.it_component')
      )
    );
    const dataObjects = (dataObjectsQuery.data?.data || []).map((item) =>
      mapToOption(item.id, item.name || t('graph.nodes.unnamed'), 'data_object', t('graph.entityTypes.data_object'))
    );

    return [
      ...applications,
      ...businessCapabilities,
      ...domains,
      ...providers,
      ...itComponents,
      ...dataObjects,
    ];
  }, [
    applicationsQuery.data?.data,
    businessCapabilitiesQuery.data?.data,
    dataObjectsQuery.data?.data,
    domainsQuery.data?.data,
    itComponentsQuery.data?.data,
    providersQuery.data?.data,
    t,
  ]);

  const isLoading =
    applicationsQuery.isLoading ||
    businessCapabilitiesQuery.isLoading ||
    domainsQuery.isLoading ||
    providersQuery.isLoading ||
    itComponentsQuery.isLoading ||
    dataObjectsQuery.isLoading;

  const selectedValue = options.find((option) => option.id === focalId && option.focalType === focalType) || null;

  return (
    <Box sx={{ width: '100%', maxWidth: 760, mx: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('graph.emptyState.noFocal.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('graph.emptyState.noFocal.description')}
      </Typography>

      <Autocomplete
        options={options}
        value={selectedValue}
        loading={isLoading}
        loadingText={t('common.loading')}
        autoHighlight
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.id === value.id && option.focalType === value.focalType}
        onChange={(_event, value) => {
          if (value) {
            onSelect(value.focalType, value.id);
          }
        }}
        renderOption={(props, option) => (
          <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Typography variant="body2">{option.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.categoryLabel}
            </Typography>
          </Box>
        )}
        renderInput={(params) => (
          <TextField {...params} label={t('graph.autocomplete.placeholder')} variant="outlined" />
        )}
      />
    </Box>
  );
}
