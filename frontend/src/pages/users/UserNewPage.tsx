import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layout';
import { EmptyState, LoadingSkeleton, PageHeader } from '@/components/shared';
import UserForm, { UserFormValues } from '@/components/users/UserForm';
import { useCreateUser, useRoles } from '@/api/users';
import { useDomains } from '@/api/domains';

export default function UserNewPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createUser = useCreateUser();
  const { data: roles, isLoading: isLoadingRoles, error: rolesError } = useRoles();
  const { data: domainsData, isLoading: isLoadingDomains, error: domainsError } = useDomains({ limit: 100 });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: UserFormValues) => {
    try {
      setError(null);
      await createUser.mutateAsync({
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim() || null,
        lastName: values.lastName.trim() || null,
        roleId: values.roleId || null,
        domainIds: values.domainIds,
      });

      navigate('/users', {
        state: {
          alert: { severity: 'success', message: t('users.alert.created') },
        },
      });
    } catch {
      setError(t('errors.unexpected.description'));
    }
  };

  if (isLoadingRoles || isLoadingDomains) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title={t('users.form.createTitle')} />
        <LoadingSkeleton rows={5} columns={1} />
      </PageContainer>
    );
  }

  if (rolesError || domainsError) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title={t('users.form.createTitle')} />
        <EmptyState
          title={t('errors.unexpected.title')}
          description={t('errors.unexpected.description')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title={t('users.form.createTitle')} />
      <UserForm
        mode="create"
        roles={roles ?? []}
        domains={domainsData?.data ?? []}
        isLoading={createUser.isPending}
        canWrite={true}
        error={error}
        onCancel={() => navigate('/users')}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}
