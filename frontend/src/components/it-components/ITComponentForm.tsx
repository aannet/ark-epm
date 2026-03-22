import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, TextField, Button } from '@mui/material';
import { ITComponentFormValues } from '@/types/it-component';

interface ITComponentFormProps {
  initialValues?: Partial<ITComponentFormValues>;
  onSubmit: (values: ITComponentFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function ITComponentForm({ initialValues, onSubmit, onCancel, isLoading = false, error }: ITComponentFormProps): JSX.Element {
  const { t } = useTranslation();
  const [values, setValues] = useState<ITComponentFormValues>({ name: '', technology: '', type: '', description: '', comment: '', tags: [] });

  useEffect(() => {
    if (initialValues) {
      setValues({ name: initialValues.name || '', technology: initialValues.technology || '', type: initialValues.type || '', description: initialValues.description || '', comment: initialValues.comment || '', tags: [] });
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (values.name.trim()) onSubmit(values);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField name="name" label={t('it-components.form.nameLabel')} value={values.name} onChange={(e) => setValues(v => ({ ...v, name: e.target.value }))} required fullWidth autoFocus error={!!error} helperText={error === 'duplicate' ? t('it-components.form.nameDuplicate') : error === 'validation' ? t('it-components.form.nameRequired') : ''} disabled={isLoading} inputProps={{ maxLength: 255 }} />
      <TextField name="technology" label={t('it-components.form.technologyLabel')} value={values.technology} onChange={(e) => setValues(v => ({ ...v, technology: e.target.value }))} fullWidth placeholder={t('it-components.form.technologyPlaceholder')} disabled={isLoading} inputProps={{ maxLength: 255 }} />
      <TextField name="type" label={t('it-components.form.typeLabel')} value={values.type} onChange={(e) => setValues(v => ({ ...v, type: e.target.value }))} fullWidth placeholder={t('it-components.form.typePlaceholder')} disabled={isLoading} inputProps={{ maxLength: 100 }} />
      <TextField name="description" label={t('it-components.form.descriptionLabel')} value={values.description} onChange={(e) => setValues(v => ({ ...v, description: e.target.value }))} fullWidth multiline rows={3} disabled={isLoading} inputProps={{ maxLength: 2000 }} />
      <TextField name="comment" label={t('it-components.form.commentLabel')} value={values.comment} onChange={(e) => setValues(v => ({ ...v, comment: e.target.value }))} fullWidth multiline rows={3} disabled={isLoading} inputProps={{ maxLength: 2000 }} />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="outlined" onClick={onCancel} disabled={isLoading}>{t('it-components.form.buttonCancel')}</Button>
        <Button type="submit" variant="contained" disabled={!values.name.trim() || isLoading}>{t('it-components.form.buttonSave')}</Button>
      </Box>
    </Box>
  );
}
