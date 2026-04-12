import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import BusinessCapabilityForm from '@/components/business-capabilities/BusinessCapabilityForm';
import { useCreateBusinessCapability } from '@/api/businessCapabilities';
import { tagsApi, TagDimensionResponse } from '@/api/tags';
import { BusinessCapabilityFormValues } from '@/types/businessCapability';

export default function BusinessCapabilityNewPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<TagDimensionResponse[]>([]);

  const createMutation = useCreateBusinessCapability();

  // Fetch tag dimensions
  useEffect(() => {
    tagsApi.getDimensions('business-capability').then((dims) => {
      setDimensions(dims);
    });
  }, []);

  const handleSubmit = async (values: BusinessCapabilityFormValues) => {
    setError(null);
    try {
      const created = await createMutation.mutateAsync(values);
      navigate(`/business-capabilities/${created.id}`, {
        state: { alert: { severity: 'success', message: t('businessCapabilities.snackbar.created') } },
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;

      if (status === 409 && code === 'CONFLICT') {
        setError(t('businessCapabilities.form.nameDuplicate'));
      } else if (status === 400) {
        setError(t('businessCapabilities.form.nameRequired'));
      } else {
        setError(t('common.snackbar.error'));
      }
    }
  };

  const handleCancel = () => {
    navigate('/business-capabilities');
  };

  const breadcrumbItems = [
    { label: t('businessCapabilities.form.breadcrumb.home'), onClick: () => navigate('/') },
    { label: t('businessCapabilities.form.breadcrumb.list'), onClick: () => navigate('/business-capabilities') },
    { label: t('businessCapabilities.form.breadcrumb.new') },
  ];

  return (
    <PageContainer maxWidth="sm">
      <AppBreadcrumbs items={breadcrumbItems} />
      <PageHeader title={t('businessCapabilities.form.createTitle')} />

      <BusinessCapabilityForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createMutation.isPending}
        error={error}
        availableDimensions={dimensions.map((d) => ({
          id: d.id,
          name: d.name,
          color: d.color || '#1976d2',
        }))}
      />
    </PageContainer>
  );
}
