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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Get tags from each dimension input
    const tags: TagValueResponse[] = [];
    availableDimensions.forEach((dim) => {
      const dimTags = (e.currentTarget as any)[`tags_${dim.name}`]?.value;
      if (dimTags) {
        try {
          const parsed = JSON.parse(dimTags);
          if (Array.isArray(parsed)) {
            tags.push(...parsed);
          }
        } catch {
          // Ignore parse errors
        }
      }
    });
    
    await onSubmit({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || '',
      comment: (formData.get('comment') as string) || '',
      tags,
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
                  value={initialValues?.tags?.filter(
                    (t) => t.dimensionName === dimension.name
                  ) || []}
                  onChange={(tags) => {
                    // Store tags in a hidden input for form submission
                    const input = document.getElementById(
                      `tags_${dimension.name}`
                    ) as HTMLInputElement;
                    if (input) {
                      input.value = JSON.stringify(tags);
                    }
                  }}
                  multiple={true}
                  color={dimension.color}
                  disabled={isLoading}
                />
              ))}
            </Stack>
            {availableDimensions.map((dimension) => (
              <input
                key={`hidden_${dimension.id}`}
                type="hidden"
                id={`tags_${dimension.name}`}
                name={`tags_${dimension.name}`}
                value={JSON.stringify(
                  initialValues?.tags?.filter(
                    (t) => t.dimensionName === dimension.name
                  ) || []
                )}
              />
            ))}
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
