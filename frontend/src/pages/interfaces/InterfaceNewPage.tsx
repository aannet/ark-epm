import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import InterfaceForm from '@/components/interfaces/InterfaceForm';
import { useCreateInterface } from '@/api/interfaces';
import { InterfaceFormValues } from '@/types/interface';

export default function InterfaceNewPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateInterface();

  const handleSubmit = async (values: InterfaceFormValues) => {
    setError(null);
    try {
      const created = await createMutation.mutateAsync(values);
      navigate(`/interfaces/${created.id}`, {
        state: { alert: { severity: 'success', message: t('interfaces.snackbar.created') } },
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
    navigate('/interfaces');
  };

  const breadcrumbItems = [
    { label: t('interfaces.form.breadcrumb.home'), onClick: () => navigate('/') },
    { label: t('interfaces.form.breadcrumb.list'), onClick: () => navigate('/interfaces') },
    { label: t('interfaces.form.breadcrumb.new') },
  ];

  return (
    <PageContainer maxWidth="sm">
      <AppBreadcrumbs items={breadcrumbItems} />
      <PageHeader title={t('interfaces.form.createTitle')} />

      <InterfaceForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createMutation.isPending}
        error={error}
      />
    </PageContainer>
  );
}
