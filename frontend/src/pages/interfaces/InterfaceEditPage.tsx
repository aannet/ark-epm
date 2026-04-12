import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import InterfaceForm from '@/components/interfaces/InterfaceForm';
import { useInterface, useUpdateInterface } from '@/api/interfaces';
import { InterfaceFormValues } from '@/types/interface';
import { formatInterfaceTitle } from '@/utils/interfaces.utils';

export default function InterfaceEditPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [error, setError] = useState<string | null>(null);

  const { data: iface, isLoading, error: fetchError } = useInterface(id || '');
  const updateMutation = useUpdateInterface(id || '');

  // Redirect on 404
  useEffect(() => {
    if (fetchError) {
      navigate('/interfaces');
    }
  }, [fetchError, navigate]);

  const handleSubmit = async (values: InterfaceFormValues) => {
    setError(null);
    try {
      await updateMutation.mutateAsync(values);
      navigate(`/interfaces/${id}`, {
        state: { alert: { severity: 'success', message: t('interfaces.snackbar.updated') } },
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;

      if (status === 422 && code === 'SELF_REFERENCE') {
        setError(t('interfaces.form.selfReference'));
      } else if (status === 404 && code === 'APPLICATION_NOT_FOUND') {
        setError(t('interfaces.form.applicationNotFound'));
      } else if (status === 400) {
        setError(t('interfaces.form.typeRequired'));
      } else {
        setError(t('common.snackbar.error'));
      }
    }
  };

  const handleCancel = () => {
    navigate(`/interfaces/${id}`);
  };

  const title = iface ? formatInterfaceTitle(iface) : '...';

  const breadcrumbItems = [
    { label: t('interfaces.form.breadcrumb.home'), onClick: () => navigate('/') },
    { label: t('interfaces.form.breadcrumb.list'), onClick: () => navigate('/interfaces') },
    { label: title, onClick: () => navigate(`/interfaces/${id}`) },
    { label: t('interfaces.form.breadcrumb.edit') },
  ];

  if (isLoading) {
    return (
      <PageContainer maxWidth="sm">
        <AppBreadcrumbs items={breadcrumbItems} />
        <PageHeader title={t('interfaces.form.editTitle')} />
        <LoadingSkeleton rows={6} columns={1} />
      </PageContainer>
    );
  }

  if (!iface) {
    return (
      <PageContainer maxWidth="sm">
        <AppBreadcrumbs items={breadcrumbItems} />
        <EmptyState
          title={t('errors.notFound.title')}
          description={t('errors.notFound.description')}
        />
      </PageContainer>
    );
  }

  const initialValues: Partial<InterfaceFormValues> = {
    sourceAppId: iface.sourceAppId,
    targetAppId: iface.targetAppId,
    middlewareAppId: iface.middlewareApp?.id ?? null,
    name: iface.name ?? '',
    type: iface.type,
    frequency: iface.frequency ?? null,
    criticality: iface.criticality ?? null,
    technicalContact: iface.technicalContact ?? '',
    errorRate: iface.errorRate ?? null,
    description: iface.description ?? '',
    comment: iface.comment ?? '',
    tagPaths: [],
  };

  return (
    <PageContainer maxWidth="sm">
      <AppBreadcrumbs items={breadcrumbItems} />
      <PageHeader title={t('interfaces.form.editTitle')} />

      <InterfaceForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateMutation.isPending}
        error={error}
      />
    </PageContainer>
  );
}
