import { useTranslation } from 'react-i18next';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
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
  selectedTags?: TagValueResponse[];
  onFiltersChange: (filters: FiltersType, selectedTags?: TagValueResponse[]) => void;
  onReset: () => void;
}

export default function ApplicationFilters({
  lifecycleStatusOptions,
  availableDimensions,
  filters,
  selectedTags = [],
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

  const getTagsForDimension = (dimensionId: string): TagValueResponse[] => {
    return selectedTags.filter((tag) => tag.dimensionId === dimensionId);
  };

  const handleDimensionTagsChange = (dimensionId: string, tags: TagValueResponse[]) => {
    // Get all tags from other dimensions
    const otherTags = selectedTags.filter((tag) => tag.dimensionId !== dimensionId);
    
    // Combine with new tags for this dimension
    const newSelectedTags = [...otherTags, ...tags];
    
    // Update filters with just the IDs for API
    const newTagIds = newSelectedTags.map((t) => t.id);
    onFiltersChange(
      {
        ...filters,
        tagValueIds: newTagIds,
      },
      newSelectedTags
    );
  };

  const handleRemoveTag = (tagId: string) => {
    const newSelectedTags = selectedTags.filter((tag) => tag.id !== tagId);
    const newTagIds = newSelectedTags.map((t) => t.id);
    onFiltersChange(
      {
        ...filters,
        tagValueIds: newTagIds,
      },
      newSelectedTags
    );
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
            value={getTagsForDimension(dimension.id)}
            onChange={(tags) => handleDimensionTagsChange(dimension.id, tags)}
            multiple={true}
            color={dimension.color}
          />
        </Box>
      ))}

      {selectedTags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {selectedTags.map((tag) => (
            <Chip
              key={tag.id}
              label={`${tag.dimensionName}: ${tag.label}`}
              onDelete={() => handleRemoveTag(tag.id)}
              size="small"
              sx={{
                backgroundColor: tag.dimensionColor || '#2196F3',
                color: '#fff',
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    color: '#fff',
                  },
                },
              }}
            />
          ))}
        </Box>
      )}

      <Button variant="text" onClick={onReset} sx={{ alignSelf: 'center' }}>
        {t('common.actions.cancel')}
      </Button>
    </Box>
  );
}
