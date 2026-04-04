import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import DataObjectForm from '@/components/data-objects/DataObjectForm';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createDataObject, updateDataObject, getDataObject } from '@/services/api/data-objects.api';
import { DataObjectFormValues } from '@/types/data-object';

interface DataObjectFormPageProps {
  mode: 'create' | 'edit';
}

export default function DataObjectFormPage({ mode }: DataObjectFormPageProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [serverAlert, setServerAlert] = useState<{ severity: 'error'; message: string } | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['data-object', id],
    queryFn: () => getDataObject(id!),
    enabled: mode === 'edit' && !!id,
  });

  // Redirect if edit target not found
  useEffect(() => {
    if (mode === 'edit' && !isLoading && !existing && id) {
      navigate('/data-objects');
    }
  }, [mode, isLoading, existing, id, navigate]);

  const createMutation = useMutation({
    mutationFn: createDataObject,
    onSuccess: (data) => {
      navigate(`/data-objects/${data.id}`, {
        state: { alert: { severity: 'success', message: t('data-objects.alert.createSuccess') } },
      });
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      if (status === 409) setError('duplicate');
      else if (status === 400) setError('validation');
      else setServerAlert({ severity: 'error', message: t('data-objects.alert.errors.serverError') });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: DataObjectFormValues) => updateDataObject(id!, values),
    onSuccess: () => {
      navigate(`/data-objects/${id}`, {
        state: { alert: { severity: 'success', message: t('data-objects.alert.updateSuccess') } },
      });
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      if (status === 409) setError('duplicate');
      else if (status === 400) setError('validation');
      else setServerAlert({ severity: 'error', message: t('data-objects.alert.errors.serverError') });
    },
  });

  const handleSubmit = async (values: DataObjectFormValues) => {
    setError(null);
    setServerAlert(null);
    if (mode === 'create') createMutation.mutate(values);
    else updateMutation.mutate(values);
  };

  const handleCancel = () => {
    navigate(mode === 'create' ? '/data-objects' : `/data-objects/${id}`);
  };

  const isLoading_ = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <PageContainer><LoadingSkeleton rows={5} /></PageContainer>;

  const breadcrumbItems = mode === 'create'
    ? [
        { label: t('data-objects.form.breadcrumb.home'), onClick: () => navigate('/') },
        { label: t('data-objects.form.breadcrumb.list'), onClick: () => navigate('/data-objects') },
        { label: t('data-objects.form.breadcrumb.new') },
      ]
    : [
        { label: t('data-objects.form.breadcrumb.home'), onClick: () => navigate('/') },
        { label: t('data-objects.form.breadcrumb.list'), onClick: () => navigate('/data-objects') },
        { label: existing?.name ?? '...', onClick: () => navigate(`/data-objects/${id}`) },
        { label: t('data-objects.form.breadcrumb.edit') },
      ];

  return (
    <PageContainer maxWidth="sm">
      {serverAlert && (
        <ArkAlert
          open={!!serverAlert}
          severity="error"
          message={serverAlert.message}
          onClose={() => setServerAlert(null)}
        />
      )}

      <AppBreadcrumbs items={breadcrumbItems} />

      <PageHeader
        title={mode === 'create' ? t('data-objects.form.createTitle') : t('data-objects.form.editTitle')}
      />

      <DataObjectForm
        initialValues={existing ?? undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading_}
        error={error}
      />
    </PageContainer>
  );
}
