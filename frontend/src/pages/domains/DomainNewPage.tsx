import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import DomainForm from '@/components/domains/DomainForm';
import { useCreateDomain } from '@/api/domains';
import { DomainFormValues } from '@/types/domain';

export default function DomainNewPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createDomain = useCreateDomain();

  const handleSubmit = async (values: DomainFormValues) => {
    const domain = await createDomain.mutateAsync(values);
    navigate(`/domains/${domain.id}`);
  };

  const handleCancel = () => {
    navigate('/domains');
  };

  return (
    <PageContainer>
      <PageHeader title={t('domains.form.createTitle')} />
      <DomainForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createDomain.isPending}
        error={createDomain.error ? t('domains.form.nameDuplicate') : null}
      />
    </PageContainer>
  );
}
