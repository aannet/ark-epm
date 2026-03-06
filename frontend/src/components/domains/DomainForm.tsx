import { useTranslation } from 'react-i18next';
import { TextField, Button, Stack } from '@mui/material';
import { DomainFormValues } from '@/types/domain';

interface DomainFormProps {
  initialValues?: Partial<DomainFormValues>;
  onSubmit: (values: DomainFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function DomainForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: DomainFormProps): JSX.Element {
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await onSubmit({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || '',
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
          error={error?.includes('name')}
          helperText={
            error && error.includes('name') ? error : undefined
          }
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
