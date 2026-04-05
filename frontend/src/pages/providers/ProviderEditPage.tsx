import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import ArkAlert from '@/components/shared/ArkAlert';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { ProviderForm } from '@/components/providers';
import { useProvider, useUpdateProvider } from '@/api/providers';
import { tagsApi } from '@/api/tags';
import { useQuery } from '@tanstack/react-query';
import { ProviderFormValues } from '@/types/provider';
import { hasPermission } from '@/store/auth';
import { resolveAlertMessage } from '@/utils/provider.utils';

export default function ProviderEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('providers:write');

  const [alert, setAlert] = useState<{ severity: 'error'; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canWrite) navigate('/403');
  }, [canWrite, navigate]);

  const { data: provider, isLoading, error: providerError } = useProvider(id || '');

  useEffect(() => {
    if (providerError && (providerError as any).response?.status === 404) {
      navigate('/providers');
    }
  }, [providerError, navigate]);

  const { data: dimensions } = useQuery({
    queryKey: ['tag-dimensions'],
    queryFn: () => tagsApi.getDimensions(),
  });

  const updateProvider = useUpdateProvider(id || '');

  const handleSubmit = async (values: ProviderFormValues) => {
    if (!id) return;
    try {
      setError(null);

      await updateProvider.mutateAsync({ ...values, tags: [] });

      if (values.tags && values.tags.length > 0) {
        const tagsByDimension = new Map<string, string[]>();
        values.tags.forEach((tag) => {
          const existing = tagsByDimension.get(tag.dimensionId) || [];
          existing.push(tag.id);
          tagsByDimension.set(tag.dimensionId, existing);
        });
        for (const [dimensionId, tagIds] of tagsByDimension.entries()) {
          await tagsApi.putEntityTags('provider', id, dimensionId, tagIds);
        }
      }

      navigate(`/providers/${id}`, {
        state: { alert: { severity: 'success', message: t('providers.alert.updateSuccess') } },
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(t('providers.form.nameDuplicate'));
      } else if (err.response?.status === 400) {
        setError(t('providers.form.nameRequired'));
      } else {
        setAlert({ severity: 'error', message: resolveAlertMessage(t, err.response?.status ?? 500) });
      }
    }
  };

  const availableDimensions = dimensions?.map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color || '#007FFF',
  }));

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton rows={5} columns={1} />
      </PageContainer>
    );
  }

  if (!provider) return null;

  return (
    <PageContainer>
      <ArkAlert
        open={!!alert}
        severity="error"
        message={alert?.message ?? ''}
        onClose={() => setAlert(null)}
      />

      <AppBreadcrumbs
        items={[
          { label: t('providers.form.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('providers.form.breadcrumb.list'), onClick: () => navigate('/providers') },
          { label: provider.name, onClick: () => navigate(`/providers/${id}`) },
          { label: t('common.actions.edit') },
        ]}
      />

      <PageHeader title={t('providers.form.editTitle')} />

      <ProviderForm
        initialValues={{
          name: provider.name,
          description: provider.description || '',
          comment: provider.comment || '',
          contractType: provider.contractType || '',
          expiryDate: provider.expiryDate,
          tags: provider.tags,
        }}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/providers/${id}`)}
        isLoading={updateProvider.isPending}
        error={error}
        availableDimensions={availableDimensions}
        entityId={id}
      />
    </PageContainer>
  );
}
