import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  Tooltip,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { tagsApi } from '../../api/tags';
import { TagValueResponse, DimensionTagInputProps } from './DimensionTagInput.types';

export function DimensionTagInput({
  dimensionId,
  dimensionName,
  entityType,
  entityId,
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
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

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

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        fetchOptions(newInputValue);
      }, 300);

      setDebounceTimer(timer);
    },
    [debounceTimer, fetchOptions],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleChange = useCallback(
    async (
      _: React.SyntheticEvent,
      newValue: (TagValueResponse | string)[],
    ) => {
      const tagsToResolve: string[] = [];

      const processedValue = newValue.map((item) => {
        if (typeof item === 'string') {
          tagsToResolve.push(item);
          return item;
        }
        return item;
      });

      if (tagsToResolve.length > 0) {
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

            if (entityId) {
              await tagsApi.putEntityTags(
                entityType,
                entityId,
                dimensionId,
                [...value.map((v) => v.id), resolved.id],
              );
            }
          }

          const newTags = [...value, ...resolvedTags];
          onChange(newTags);
        } catch (error) {
          console.error('Error resolving tags:', error);
        }
      } else {
        const finalValue = processedValue.filter(
          (item): item is TagValueResponse => typeof item !== 'string',
        );

        if (entityId && finalValue.length !== value.length) {
          try {
            await tagsApi.putEntityTags(
              entityType,
              entityId,
              dimensionId,
              finalValue.map((v) => v.id),
            );
          } catch (error) {
            console.error('Error updating entity tags:', error);
          }
        }

        onChange(finalValue);
      }

      setInputValue('');
      setOptions([]);
    },
    [dimensionId, entityId, entityType, onChange, value],
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
            <Tooltip
              key={key}
              title={t('tags.tooltip.fullPath', { path: option.path })}
            >
              <Chip
                {...tagProps}
                label={option.label}
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
            </Tooltip>
          );
        })
      }
      noOptionsText={t('tags.autocomplete.noOptions')}
      loadingText={t('tags.autocomplete.loading')}
    />
  );
}
