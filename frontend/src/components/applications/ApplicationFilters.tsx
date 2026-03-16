import { useTranslation } from 'react-i18next';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { DimensionTagInput } from '@/components/tags';
import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';
import { ApplicationFilters as FiltersType } from '@/types/application';

interface DimensionOption {
  id: string;
  name: string;
  color: string;
}

interface ApplicationFiltersProps {
  lifecycleStatusOptions: string[];
  availableDimensions: DimensionOption[];
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onReset: () => void;
}

export default function ApplicationFilters({
  lifecycleStatusOptions,
  availableDimensions,
  filters,
  onFiltersChange,
  onReset,
}: ApplicationFiltersProps): JSX.Element {
  const { t } = useTranslation();

  const handleLifecycleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      lifecycleStatus: value || null,
    });
  };

  const handleDimensionTagsChange = (dimensionName: string, tags: TagValueResponse[]) => {
    const otherTags = filters.tagValueIds.filter((_id) => {
      const tag = availableDimensions.find((d) => d.name === dimensionName);
      return tag ? false : true;
    });
    
    const newTagIds = tags.map((t) => t.id);
    onFiltersChange({
      ...filters,
      tagValueIds: [...otherTags, ...newTagIds],
    });
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
      <FormControl sx={{ minWidth: 200 }} size="small">
        <InputLabel id="lifecycle-status-label">
          {t('applications.filters.lifecycleStatus')}
        </InputLabel>
        <Select
          labelId="lifecycle-status-label"
          value={filters.lifecycleStatus || ''}
          label={t('applications.filters.lifecycleStatus')}
          onChange={(e) => handleLifecycleStatusChange(e.target.value)}
          displayEmpty
        >
          <MenuItem value="">
            <em>{t('common.actions.cancel')}</em>
          </MenuItem>
          {lifecycleStatusOptions.map((status) => (
            <MenuItem key={status} value={status}>
              {t(`applications.lifecycle.${status}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {availableDimensions.map((dimension) => (
        <Box key={dimension.id} sx={{ minWidth: 250 }}>
          <DimensionTagInput
            dimensionId={dimension.id}
            dimensionName={dimension.name}
            entityType="application"
            value={[]} // Filter mode doesn't track specific values
            onChange={(tags) => handleDimensionTagsChange(dimension.name, tags)}
            multiple={true}
            color={dimension.color}
          />
        </Box>
      ))}

      <Button variant="text" onClick={onReset} sx={{ alignSelf: 'center' }}>
        {t('common.actions.cancel')}
      </Button>
    </Box>
  );
}
