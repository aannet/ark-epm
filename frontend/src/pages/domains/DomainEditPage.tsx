import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import DomainForm from '@/components/domains/DomainForm';
import { useDomain, useUpdateDomain } from '@/api/domains';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import { DomainFormValues } from '@/types/domain';

export default function DomainEditPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: domain, isLoading, error } = useDomain(id || '');
  const updateDomain = useUpdateDomain(id || '');

  useEffect(() => {
    if (error && (error as any)?.response?.status === 404) {
      navigate('/domains');
    }
  }, [error, navigate]);

  const handleSubmit = async (values: DomainFormValues) => {
    await updateDomain.mutateAsync(values);
  };

  const handleCancel = () => {
    navigate(`/domains/${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={t('domains.form.editTitle')} />
        <LoadingSkeleton rows={2} columns={2} />
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

  return (
    <PageContainer>
      <PageHeader title={t('domains.form.editTitle')} />
      <DomainForm
        initialValues={{
          name: domain.name,
          description: domain.description || '',
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateDomain.isPending}
        error={
          updateDomain.error
            ? (updateDomain.error as any)?.response?.data?.code === 'CONFLICT'
              ? t('domains.form.nameDuplicate')
              : null
            : null
        }
      />
    </PageContainer>
  );
}
