import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { tagsApi } from '../../api/tags';
import { TagValueResponse, DimensionTagInputProps } from './DimensionTagInput.types';

export function DimensionTagInput({
  dimensionId,
  dimensionName,
  entityType: _entityType,
  entityId: _entityId,
  value,
  onChange,
  disabled = false,
  multiple = true,
  color,
}: DimensionTagInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<TagValueResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOptions = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await tagsApi.autocomplete(dimensionId, query);
        setOptions(results);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [dimensionId],
  );

  const handleInputChange = useCallback(
    (_: React.SyntheticEvent, newInputValue: string) => {
      setInputValue(newInputValue);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const timer = setTimeout(() => {
        fetchOptions(newInputValue);
      }, 300);

      debounceTimerRef.current = timer;
    },
    [fetchOptions],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    async (
      _event: React.SyntheticEvent,
      newValue: (TagValueResponse | string)[] | TagValueResponse | string | null,
    ) => {
      console.log('=== DimensionTagInput handleChange called ===');
      console.log('newValue:', newValue);
      console.log('Current value:', value);
      
      // Normalize value to array
      const normalizedValue: (TagValueResponse | string)[] =
        newValue === null
          ? []
          : Array.isArray(newValue)
          ? newValue
          : [newValue];

      console.log('normalizedValue:', normalizedValue);

      const tagsToResolve: string[] = [];

      const processedValue = normalizedValue.map((item) => {
        if (typeof item === 'string') {
          tagsToResolve.push(item);
          return item;
        }
        return item;
      });

      console.log('tagsToResolve:', tagsToResolve);
      console.log('processedValue:', processedValue);

      let finalTags: TagValueResponse[] = [];

      if (tagsToResolve.length > 0) {
        // Resolve new tags (freeSolo mode)
        try {
          const resolvedTags: TagValueResponse[] = [];
          for (const tagInput of tagsToResolve) {
            const path = tagInput.toLowerCase().trim().replace(/\s+/g, '-');
            const label = tagInput
              .split(/[\/-]/)
              .pop()
              ?.replace(/-/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase()) || tagInput;

            const resolved = await tagsApi.resolve(dimensionId, path, label);
            resolvedTags.push(resolved);
          }
          finalTags = [...value, ...resolvedTags];
        } catch (error) {
          console.error('Error resolving tags:', error);
          // Rollback: keep current value
          finalTags = value;
        }
      } else {
        // Existing tags selected or removed
        finalTags = processedValue.filter(
          (item): item is TagValueResponse => typeof item !== 'string',
        );
      }

      console.log('finalTags:', finalTags);
      console.log('Calling onChange with:', finalTags);

      // ALWAYS update UI - NO API calls here
      onChange(finalTags);

      setInputValue('');
      setOptions([]);
    },
    [dimensionId, onChange, value],
  );

  const chipColor = useMemo(() => {
    if (color) return color;
    return 'default';
  }, [color]);

  return (
    <Autocomplete
      multiple={multiple}
      freeSolo
      options={options}
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      disabled={disabled}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.label
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={dimensionName}
          placeholder={t('tags.autocomplete.placeholder')}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return (
            <Chip
              key={key}
              {...tagProps}
              label={option.label}
              title={t('tags.tooltip.fullPath', { path: option.path })}
              sx={{
                backgroundColor: chipColor,
                color: '#fff',
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: '#fff',
                  },
                },
              }}
            />
          );
        })
      }
      noOptionsText={t('tags.autocomplete.noOptions')}
      loadingText={t('tags.autocomplete.loading')}
    />
  );
}
