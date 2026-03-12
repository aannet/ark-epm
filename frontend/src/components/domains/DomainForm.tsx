import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField, Button, Stack, Typography, Box } from '@mui/material';
import { DomainFormValues } from '@/types/domain';
import { DimensionTagInput } from '@/components/tags';
import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';

interface DomainFormProps {
  initialValues?: Partial<DomainFormValues>;
  onSubmit: (values: DomainFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  availableDimensions?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  entityId?: string;
}

export default function DomainForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
  availableDimensions = [],
  entityId,
}: DomainFormProps): JSX.Element {
  const { t } = useTranslation();
  
  // Maintain reactive state for tags
  const [tags, setTags] = useState<TagValueResponse[]>(initialValues?.tags || []);
  
  console.log('=== DomainForm render ===');
  console.log('Current tags state:', tags);
  console.log('Initial values:', initialValues?.tags);

  const handleDimensionTagsChange = useCallback((dimensionName: string, dimensionTags: TagValueResponse[]) => {
    console.log('=== handleDimensionTagsChange called ===');
    console.log('dimensionName:', dimensionName);
    console.log('dimensionTags:', dimensionTags);
    console.log('Current tags before update:', tags);
    
    setTags((prevTags) => {
      console.log('Inside setTags callback, prevTags:', prevTags);
      // Remove all tags for this dimension
      const tagsWithoutDimension = prevTags.filter(
        (tag) => tag.dimensionName !== dimensionName
      );
      console.log('tagsWithoutDimension:', tagsWithoutDimension);
      // Add new tags for this dimension
      const newTags = [...tagsWithoutDimension, ...dimensionTags];
      console.log('New tags state:', newTags);
      return newTags;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await onSubmit({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || '',
      comment: (formData.get('comment') as string) || '',
      tags, // Use reactive state instead of DOM query
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          name="name"
          label={t('domains.form.nameLabel')}
          defaultValue={initialValues?.name || ''}
          required
          fullWidth
          disabled={isLoading}
          error={!!error}
          helperText={error ?? undefined}
        />
        <TextField
          name="description"
          label={t('domains.form.descriptionLabel')}
          defaultValue={initialValues?.description || ''}
          fullWidth
          multiline
          rows={3}
          disabled={isLoading}
        />
        <TextField
          name="comment"
          label={t('domains.form.commentLabel')}
          defaultValue={initialValues?.comment || ''}
          fullWidth
          multiline
          rows={2}
          disabled={isLoading}
        />
        
        {availableDimensions.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('domains.form.tagsLabel')}
            </Typography>
            <Stack spacing={2}>
              {availableDimensions.map((dimension) => (
                <DimensionTagInput
                  key={dimension.id}
                  dimensionId={dimension.id}
                  dimensionName={dimension.name}
                  entityType="domain"
                  entityId={entityId}
                  value={tags.filter(
                    (t) => t.dimensionName === dimension.name
                  )}
                  onChange={(dimensionTags) => {
                    console.log('=== DimensionTagInput onChange in DomainForm ===');
                    console.log('dimensionTags received:', dimensionTags);
                    handleDimensionTagsChange(dimension.name, dimensionTags);
                  }}
                  multiple={true}
                  color={dimension.color}
                  disabled={isLoading}
                />
              ))}
            </Stack>
          </Box>
        )}
        
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('domains.form.cancelButton')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {t('domains.form.saveButton')}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
