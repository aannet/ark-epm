import {
  Box,
  Button,
  Stack,
  TextField,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { DimensionTagInput } from '@/components/tags';
import { ProviderFormValues } from '@/types/provider';
import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';
import { useState, useRef } from 'react';

export interface ProviderFormProps {
  initialValues?: Partial<ProviderFormValues>;
  onSubmit: (values: ProviderFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
  availableDimensions?: Array<{ id: string; name: string; color?: string }>;
  entityId?: string;
}

export default function ProviderForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
  availableDimensions = [],
  entityId,
}: ProviderFormProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  const [tags, setTags] = useState<TagValueResponse[]>(initialValues?.tags ?? []);

  const handleDimensionTagsChange = (dimensionId: string, newTags: TagValueResponse[]) => {
    // Replace tags for this dimension
    const otherTags = tags.filter((tag) => tag.dimensionId !== dimensionId);
    setTags([...otherTags, ...newTags]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(formRef.current!);
    const expiryDateString = formData.get('expiryDate') as string;

    const values: ProviderFormValues = {
      name: (formData.get('name') as string).trim(),
      description: ((formData.get('description') as string) || '').trim(),
      comment: ((formData.get('comment') as string) || '').trim(),
      contractType: ((formData.get('contractType') as string) || '').trim(),
      expiryDate: expiryDateString ? expiryDateString : null,
      tags,
    };

    await onSubmit(values);
  };

  // Parse initial expiry date for DatePicker
  const initialExpiryDate = initialValues?.expiryDate
    ? new Date(initialValues.expiryDate)
    : null;

  const defaultExpiryDate = initialExpiryDate && !isNaN(initialExpiryDate.getTime())
    ? initialExpiryDate
    : null;

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {/* Name Field (required) */}
        <TextField
          name="name"
          label={t('providers.form.nameLabel')}
          defaultValue={initialValues?.name ?? ''}
          required
          fullWidth
          error={!!error}
          helperText={error}
          disabled={isLoading}
          slotProps={{ htmlInput: { maxLength: 255 } }}
        />

        {/* Description Field */}
        <TextField
          name="description"
          label={t('providers.form.descriptionLabel')}
          defaultValue={initialValues?.description ?? ''}
          multiline
          rows={3}
          fullWidth
          disabled={isLoading}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />

        {/* Comment Field */}
        <TextField
          name="comment"
          label={t('providers.form.commentLabel')}
          defaultValue={initialValues?.comment ?? ''}
          multiline
          rows={2}
          fullWidth
          disabled={isLoading}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />

        {/* Contract Type Field */}
        <TextField
          name="contractType"
          label={t('providers.form.contractTypeLabel')}
          placeholder={t('providers.form.contractTypePlaceholder')}
          defaultValue={initialValues?.contractType ?? ''}
          fullWidth
          disabled={isLoading}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />

        {/* Expiry Date Field (MUI DatePicker) */}
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
          <DatePicker
            label={t('providers.form.expiryDateLabel')}
            defaultValue={defaultExpiryDate}
            slotProps={{
              textField: {
                fullWidth: true,
                disabled: isLoading,
                name: 'expiryDate',
              },
            }}
            format="dd/MM/yyyy"
          />
        </LocalizationProvider>

        {/* Tags Section */}
        {availableDimensions && availableDimensions.length > 0 && (
          <Box>
            <Box sx={{ mb: 2 }}>
              {availableDimensions.map((dimension) => (
                <Box key={dimension.id} sx={{ mb: 2 }}>
                  <DimensionTagInput
                    dimensionId={dimension.id}
                    dimensionName={dimension.name}
                    color={dimension.color}
                    value={tags.filter((tag) => tag.dimensionId === dimension.id)}
                    onChange={(newTags: TagValueResponse[]) =>
                      handleDimensionTagsChange(dimension.id, newTags)
                    }
                    entityId={entityId}
                    entityType="provider"
                    disabled={isLoading}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Buttons */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('providers.form.buttonCancel')}
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            {t('providers.form.buttonSave')}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
