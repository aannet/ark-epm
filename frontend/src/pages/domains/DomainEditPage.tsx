import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import DomainForm from '@/components/domains/DomainForm';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ArkAlert from '@/components/shared/ArkAlert';
import { useDomain, useUpdateDomain } from '@/api/domains';
import { DomainFormValues } from '@/types/domain';
import { resolveAlertMessage } from '@/utils/domain.utils';
import { hasPermission } from '@/store/auth';
import { tagsApi } from '@/api/tags';

export default function DomainEditPage(): JSX.Element {
  if (!hasPermission('domains:write')) {
    window.location.href = '/403';
    return <></>;
  }
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: domain, isLoading, error } = useDomain(id || '');
  const updateDomain = useUpdateDomain(id || '');

  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Fetch available dimensions for tags
  const { data: dimensions, isLoading: isLoadingDimensions } = useQuery({
    queryKey: ['tag-dimensions'],
    queryFn: () => tagsApi.getDimensions(),
  });

  useEffect(() => {
    if (error && (error as any)?.response?.status === 404) {
      navigate('/domains');
    }
  }, [error, navigate]);

  const handleSubmit = async (values: DomainFormValues) => {
    try {
      // Update domain basic info
      await updateDomain.mutateAsync({
        name: values.name,
        description: values.description,
        comment: values.comment,
        tags: [], // Tags handled separately
      });

      // Save tags for each dimension (handled by DimensionTagInput onChange)
      // But we need to handle any pending tags that weren't saved yet
      if (values.tags && values.tags.length > 0 && dimensions && id) {
        const tagsByDimension = new Map<string, string[]>();
        
        values.tags.forEach((tag) => {
          const existing = tagsByDimension.get(tag.dimensionId) || [];
          existing.push(tag.id);
          tagsByDimension.set(tag.dimensionId, existing);
        });

        // Save tags for each dimension
        for (const [dimensionId, tagIds] of tagsByDimension.entries()) {
          await tagsApi.putEntityTags('domain', id, dimensionId, tagIds);
        }
      }

      navigate(`/domains/${id}`, {
        state: {
          alert: { severity: 'success', message: t('domains.alert.updated') },
        },
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 409 && code === 'CONFLICT') {
        // Inline error - handled by DomainForm
      } else if (status && status >= 500) {
        setErrorAlert(resolveAlertMessage(t, status, code));
      }
    }
  };

  const handleCancel = () => {
    navigate(`/domains/${id}`);
  };

  if (isLoading || isLoadingDimensions) {
    return (
      <PageContainer>
        <PageHeader title={t('domains.form.editTitle')} />
        <LoadingSkeleton rows={3} columns={1} />
      </PageContainer>
    );
  }

  if (!domain) {
    return (
      <PageContainer>
        <EmptyState
          title={t('errors.notFound.title')}
          description={t('errors.notFound.description')}
        />
      </PageContainer>
    );
  }

  const availableDimensions = dimensions?.map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color || '#1976d2',
  })) || [];

  return (
    <PageContainer>
      <PageHeader title={t('domains.form.editTitle')} />

      <ArkAlert
        open={!!errorAlert}
        severity="error"
        message={errorAlert || ''}
        onClose={() => setErrorAlert(null)}
      />

      <DomainForm
        initialValues={{
          name: domain.name,
          description: domain.description || '',
          comment: domain.comment || '',
          tags: domain.tags || [],
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateDomain.isPending}
        availableDimensions={availableDimensions}
        entityId={id}
        error={
          updateDomain.error
            ? (updateDomain.error as any)?.response?.status === 409
              ? t('domains.form.nameDuplicate')
              : (updateDomain.error as any)?.response?.status === 400
              ? t('domains.form.nameRequired')
              : null
            : null
        }
      />
    </PageContainer>
  );
}
