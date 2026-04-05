import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import ITComponentForm from '@/components/it-components/ITComponentForm';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createITComponent, updateITComponent, getITComponent } from '@/services/api/it-components.api';
import { ITComponentFormValues } from '@/types/it-component';
import { hasPermission } from '@/store/auth';

interface ITComponentFormPageProps {
  mode: 'create' | 'edit';
}

export default function ITComponentFormPage({ mode }: ITComponentFormPageProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('it-components:write');

  const [error, setError] = useState<string | null>(null);
  const [serverAlert, setServerAlert] = useState<{ severity: 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!canWrite) navigate('/403');
  }, [canWrite, navigate]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['it-component', id],
    queryFn: () => getITComponent(id!),
    enabled: mode === 'edit' && !!id,
  });

  useEffect(() => {
    if (mode === 'edit' && !isLoading && !existing && id) {
      navigate('/it-components', {
        state: { alert: { severity: 'error', message: t('it-components.alert.errors.notFound') } },
      });
    }
  }, [mode, isLoading, existing, id, navigate, t]);

  const createMutation = useMutation({
    mutationFn: createITComponent,
    onSuccess: (data) => {
      navigate(`/it-components/${data.id}`, {
        state: { alert: { severity: 'success', message: t('it-components.alert.createSuccess') } },
      });
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      if (status === 409) setError('duplicate');
      else if (status === 400) setError('validation');
      else setServerAlert({ severity: 'error', message: t('it-components.alert.errors.serverError') });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: ITComponentFormValues) => updateITComponent(id!, values),
    onSuccess: () => {
      navigate(`/it-components/${id}`, {
        state: { alert: { severity: 'success', message: t('it-components.alert.updateSuccess') } },
      });
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      if (status === 409) setError('duplicate');
      else if (status === 400) setError('validation');
      else setServerAlert({ severity: 'error', message: t('it-components.alert.errors.serverError') });
    },
  });

  const handleSubmit = (values: ITComponentFormValues) => {
    setError(null);
    setServerAlert(null);
    if (mode === 'create') createMutation.mutate(values);
    else updateMutation.mutate(values);
  };

  const handleCancel = () => {
    navigate(mode === 'create' ? '/it-components' : `/it-components/${id}`);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton rows={5} columns={1} />
      </PageContainer>
    );
  }

  const breadcrumbItems =
    mode === 'create'
      ? [
          { label: t('it-components.form.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('it-components.form.breadcrumb.list'), onClick: () => navigate('/it-components') },
          { label: t('it-components.form.breadcrumb.new') },
        ]
      : [
          { label: t('it-components.form.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('it-components.form.breadcrumb.list'), onClick: () => navigate('/it-components') },
          { label: existing?.name ?? '...', onClick: () => navigate(`/it-components/${id}`) },
          { label: t('common.actions.edit') },
        ];

  return (
    <PageContainer maxWidth="sm">
      <ArkAlert
        open={!!serverAlert}
        severity="error"
        message={serverAlert?.message ?? ''}
        autoDismiss={5000}
        onClose={() => setServerAlert(null)}
      />

      <AppBreadcrumbs items={breadcrumbItems} />

      <PageHeader
        title={mode === 'create' ? t('it-components.form.createTitle') : t('it-components.form.editTitle')}
      />

      <ITComponentForm
        initialValues={existing ?? undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        error={error}
      />
    </PageContainer>
  );
}
