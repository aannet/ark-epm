import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DataObjectFormValues } from '@/types/data-object';

const TYPE_OPTIONS = ['database', 'dataset', 'file'];

interface DataObjectFormProps {
  initialValues?: Partial<DataObjectFormValues>;
  onSubmit: (values: DataObjectFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function DataObjectForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: DataObjectFormProps): JSX.Element {
  const { t } = useTranslation();
  const [values, setValues] = useState<DataObjectFormValues>({
    name: '',
    type: '',
    description: '',
    comment: '',
    isSourceOfTruth: false,
    tags: [],
  });

  useEffect(() => {
    if (initialValues) {
      setValues({
        name: initialValues.name ?? '',
        type: initialValues.type ?? '',
        description: initialValues.description ?? '',
        comment: initialValues.comment ?? '',
        isSourceOfTruth: initialValues.isSourceOfTruth ?? false,
        tags: [],
      });
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    await onSubmit(values);
  };

  const isFormValid = values.name.trim().length > 0;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Name */}
      <TextField
        name="name"
        label={`${t('data-objects.form.nameLabel')} *`}
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        required
        fullWidth
        autoFocus
        variant="outlined"
        error={error === 'duplicate' || error === 'validation'}
        helperText={
          error === 'duplicate'
            ? t('data-objects.form.nameDuplicate')
            : error === 'validation'
            ? t('data-objects.form.nameRequired')
            : ''
        }
        disabled={isLoading}
        slotProps={{ htmlInput: { maxLength: 255 } }}
      />

      {/* Type — Autocomplete freeSolo */}
      <Autocomplete
        freeSolo
        options={TYPE_OPTIONS}
        value={values.type}
        onChange={(_, newValue) => setValues((v) => ({ ...v, type: newValue ?? '' }))}
        onInputChange={(_, newValue) => setValues((v) => ({ ...v, type: newValue ?? '' }))}
        disabled={isLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('data-objects.form.typeLabel')}
            variant="outlined"
            placeholder={t('data-objects.form.typePlaceholder')}
          />
        )}
      />

      {/* isSourceOfTruth — Checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            checked={values.isSourceOfTruth}
            onChange={(e) => setValues((v) => ({ ...v, isSourceOfTruth: e.target.checked }))}
            disabled={isLoading}
          />
        }
        label={t('data-objects.form.isSourceOfTruthCheckbox')}
      />

      {/* Description */}
      <TextField
        name="description"
        label={t('data-objects.form.descriptionLabel')}
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        fullWidth
        variant="outlined"
        multiline
        rows={3}
        disabled={isLoading}
        slotProps={{ htmlInput: { maxLength: 2000 } }}
      />

      {/* Comment */}
      <TextField
        name="comment"
        label={t('data-objects.form.commentLabel')}
        value={values.comment}
        onChange={(e) => setValues((v) => ({ ...v, comment: e.target.value }))}
        fullWidth
        variant="outlined"
        multiline
        rows={3}
        disabled={isLoading}
        slotProps={{ htmlInput: { maxLength: 2000 } }}
      />

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
          {t('data-objects.form.buttonCancel')}
        </Button>
        <Button type="submit" variant="contained" disabled={!isFormValid || isLoading}>
          {t('data-objects.form.buttonSave')}
        </Button>
      </Box>
    </Box>
  );
}
