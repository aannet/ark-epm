import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs, Link, Typography, TextField, Button, Box } from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createITComponent, updateITComponent, getITComponent } from '@/services/api/it-components.api';
import { ITComponentFormValues } from '@/types/it-component';

interface ITComponentFormPageProps {
  mode: 'create' | 'edit';
}

export default function ITComponentFormPage({ mode }: ITComponentFormPageProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [values, setValues] = useState<ITComponentFormValues>({ name: '', technology: '', type: '', description: '', comment: '', tags: [] });

  const { data: existing, isLoading } = useQuery({
    queryKey: ['it-component', id],
    queryFn: () => getITComponent(id!),
    enabled: mode === 'edit' && !!id,
  });

  useEffect(() => {
    if (existing) {
      setValues({
        name: existing.name,
        technology: existing.technology || '',
        type: existing.type || '',
        description: existing.description || '',
        comment: existing.comment || '',
        tags: [],
      });
    }
  }, [existing]);

  useEffect(() => {
    if (mode === 'edit' && !isLoading && !existing && id) {
      navigate('/it-components', { state: { alert: { severity: 'error', message: t('it-components.alert.errors.notFound') } } });
    }
  }, [mode, isLoading, existing, id, navigate, t]);

  const createMutation = useMutation({
    mutationFn: createITComponent,
    onSuccess: (data) => { navigate(`/it-components/${data.id}`, { state: { alert: { severity: 'success', message: t('it-components.alert.createSuccess') } } }); },
    onError: (err: any) => { setError(err?.response?.status === 409 ? 'duplicate' : err?.response?.status === 400 ? 'validation' : 'server'); },
  });

  const updateMutation = useMutation({
    mutationFn: (v: ITComponentFormValues) => updateITComponent(id!, v),
    onSuccess: () => { navigate(`/it-components/${id}`, { state: { alert: { severity: 'success', message: t('it-components.alert.updateSuccess') } } }); },
    onError: (err: any) => { setError(err?.response?.status === 409 ? 'duplicate' : err?.response?.status === 400 ? 'validation' : 'server'); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!values.name.trim()) return;
    if (mode === 'create') createMutation.mutate(values); else updateMutation.mutate(values);
  };

  const handleCancel = () => { navigate(mode === 'create' ? '/it-components' : `/it-components/${id}`); };

  if (isLoading) return <PageContainer><LoadingSkeleton rows={5} /></PageContainer>;

  return (
    <PageContainer maxWidth="sm">
      <ArkAlert open={!!alert} severity={alert?.severity || 'success'} message={alert?.message || ''} autoDismiss={5000} onClose={() => setAlert(null)} />
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" onClick={() => navigate('/')} underline="hover">{t('it-components.form.breadcrumb.home')}</Link>
        <Link component="button" onClick={() => navigate('/it-components')} underline="hover">{t('it-components.form.breadcrumb.list')}</Link>
        <Typography color="text.primary">{mode === 'create' ? t('it-components.form.breadcrumb.new') : existing?.name}</Typography>
      </Breadcrumbs>
      <PageHeader title={mode === 'create' ? t('it-components.form.createTitle') : t('it-components.form.editTitle')} />
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField name="name" label={t('it-components.form.nameLabel')} value={values.name} onChange={(e) => setValues(v => ({ ...v, name: e.target.value }))} required fullWidth autoFocus error={!!error} helperText={error === 'duplicate' ? t('it-components.form.nameDuplicate') : error === 'validation' ? t('it-components.form.nameRequired') : ''} disabled={createMutation.isPending || updateMutation.isPending} inputProps={{ maxLength: 255 }} />
        <TextField name="technology" label={t('it-components.form.technologyLabel')} value={values.technology} onChange={(e) => setValues(v => ({ ...v, technology: e.target.value }))} fullWidth placeholder={t('it-components.form.technologyPlaceholder')} disabled={createMutation.isPending || updateMutation.isPending} inputProps={{ maxLength: 255 }} />
        <TextField name="type" label={t('it-components.form.typeLabel')} value={values.type} onChange={(e) => setValues(v => ({ ...v, type: e.target.value }))} fullWidth placeholder={t('it-components.form.typePlaceholder')} disabled={createMutation.isPending || updateMutation.isPending} inputProps={{ maxLength: 100 }} />
        <TextField name="description" label={t('it-components.form.descriptionLabel')} value={values.description} onChange={(e) => setValues(v => ({ ...v, description: e.target.value }))} fullWidth multiline rows={3} disabled={createMutation.isPending || updateMutation.isPending} inputProps={{ maxLength: 2000 }} />
        <TextField name="comment" label={t('it-components.form.commentLabel')} value={values.comment} onChange={(e) => setValues(v => ({ ...v, comment: e.target.value }))} fullWidth multiline rows={3} disabled={createMutation.isPending || updateMutation.isPending} inputProps={{ maxLength: 2000 }} />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="outlined" onClick={handleCancel} disabled={createMutation.isPending || updateMutation.isPending}>{t('it-components.form.buttonCancel')}</Button>
          <Button type="submit" variant="contained" disabled={!values.name.trim() || createMutation.isPending || updateMutation.isPending}>{t('it-components.form.buttonSave')}</Button>
        </Box>
      </Box>
    </PageContainer>
  );
}
