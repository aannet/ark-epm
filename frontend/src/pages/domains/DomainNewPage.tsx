import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import DomainForm from '@/components/domains/DomainForm';
import ArkAlert from '@/components/shared/ArkAlert';
import { useCreateDomain } from '@/api/domains';
import { DomainFormValues } from '@/types/domain';
import { resolveAlertMessage } from '@/utils/domain.utils';

export default function DomainNewPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createDomain = useCreateDomain();

  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const handleSubmit = async (values: DomainFormValues) => {
    try {
      const domain = await createDomain.mutateAsync(values);
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

  return (
    <PageContainer>
      <PageHeader title={t('domains.form.createTitle')} />

      <ArkAlert
        open={!!errorAlert}
        severity="error"
        message={errorAlert || ''}
        onClose={() => setErrorAlert(null)}
      />

      <DomainForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createDomain.isPending}
        error={
          createDomain.error
            ? (createDomain.error as any)?.response?.status === 409 ||
              (createDomain.error as any)?.response?.status === 400
              ? t('domains.form.nameRequired')
              : null
            : null
        }
      />
    </PageContainer>
  );
}
