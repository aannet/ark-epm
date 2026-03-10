import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import DomainForm from '@/components/domains/DomainForm';
import ArkAlert from '@/components/shared/ArkAlert';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { useCreateDomain } from '@/api/domains';
import { DomainFormValues } from '@/types/domain';
import { resolveAlertMessage } from '@/utils/domain.utils';
import { hasPermission } from '@/store/auth';
import { tagsApi } from '@/api/tags';

export default function DomainNewPage(): JSX.Element {
  if (!hasPermission('domains:write')) {
    window.location.href = '/403';
    return <></>;
  }
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createDomain = useCreateDomain();

  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Fetch available dimensions for tags
  const { data: dimensions, isLoading: isLoadingDimensions } = useQuery({
    queryKey: ['tag-dimensions'],
    queryFn: () => tagsApi.getDimensions(),
  });

  const handleSubmit = async (values: DomainFormValues) => {
    try {
      // First create the domain
      const domain = await createDomain.mutateAsync({
        name: values.name,
        description: values.description,
        comment: values.comment,
        tags: [], // Tags will be saved separately
      });

      // Then save tags for each dimension
      if (values.tags && values.tags.length > 0 && dimensions) {
        const tagsByDimension = new Map<string, string[]>();
        
        values.tags.forEach((tag) => {
          const existing = tagsByDimension.get(tag.dimensionId) || [];
          existing.push(tag.id);
          tagsByDimension.set(tag.dimensionId, existing);
        });

        // Save tags for each dimension
        for (const [dimensionId, tagIds] of tagsByDimension.entries()) {
          await tagsApi.putEntityTags('domain', domain.id, dimensionId, tagIds);
        }
      }

      navigate(`/domains/${domain.id}`, {
        state: {
          alert: { severity: 'success', message: t('domains.alert.created') },
        },
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 409 && code === 'CONFLICT') {
        // Inline error - handled by DomainForm
      } else if (status === 400) {
        // Inline error - handled by DomainForm
      } else if (status && status >= 500) {
        setErrorAlert(resolveAlertMessage(t, status, code));
      }
    }
  };

  const handleCancel = () => {
    navigate('/domains');
  };

  const availableDimensions = dimensions?.map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color || '#1976d2',
  })) || [];

  return (
    <PageContainer>
      <PageHeader title={t('domains.form.createTitle')} />

      <ArkAlert
        open={!!errorAlert}
        severity="error"
        message={errorAlert || ''}
        onClose={() => setErrorAlert(null)}
      />

      {isLoadingDimensions ? (
        <LoadingSkeleton rows={3} columns={1} />
      ) : (
        <DomainForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createDomain.isPending}
          availableDimensions={availableDimensions}
          initialValues={{
            name: '',
            description: '',
            comment: '',
            tags: [],
          }}
          error={
            createDomain.error
              ? (createDomain.error as any)?.response?.status === 409
                ? t('domains.form.nameDuplicate')
                : (createDomain.error as any)?.response?.status === 400
                ? t('domains.form.nameRequired')
                : null
              : null
          }
        />
      )}
    </PageContainer>
  );
}
