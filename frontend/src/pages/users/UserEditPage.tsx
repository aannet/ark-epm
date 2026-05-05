import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layout';
import { EmptyState, LoadingSkeleton, PageHeader } from '@/components/shared';
import UserForm, { UserFormValues } from '@/components/users/UserForm';
import { useRoles, useUpdateUser, useUser } from '@/api/users';
import { useDomains } from '@/api/domains';
import { hasPermission } from '@/store/auth';

export default function UserEditPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('users:write');

  const { data: user, isLoading: isLoadingUser, error: userError } = useUser(id || '', {
    enabled: !!id,
  });
  const { data: roles, isLoading: isLoadingRoles, error: rolesError } = useRoles();
  const { data: domainsData, isLoading: isLoadingDomains, error: domainsError } = useDomains({ limit: 100 });

  const updateUser = useUpdateUser(id || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: UserFormValues) => {
    if (!id || !canWrite) {
      return;
    }

    try {
      setError(null);
      await updateUser.mutateAsync({
        firstName: values.firstName.trim() || null,
        lastName: values.lastName.trim() || null,
        roleId: values.roleId || null,
        isActive: values.isActive,
        domainIds: values.domainIds,
      });

      navigate('/users', {
        state: {
          alert: { severity: 'success', message: t('users.alert.updated') },
        },
      });
    } catch {
      setError(t('errors.unexpected.description'));
    }
  };

  if (isLoadingUser || isLoadingRoles || isLoadingDomains) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title={t('users.form.editTitle')} />
        <LoadingSkeleton rows={5} columns={1} />
      </PageContainer>
    );
  }

  if (userError || rolesError || domainsError || !user) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title={t('users.form.editTitle')} />
        <EmptyState title={t('errors.notFound.title')} description={t('errors.notFound.description')} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title={t('users.form.editTitle')} subtitle={user.email} />
      <UserForm
        mode="edit"
        initialValues={{
          email: user.email,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          roleId: user.role?.id ?? '',
          domainIds: user.domainIds,
          isActive: user.isActive,
        }}
        roles={roles ?? []}
        domains={domainsData?.data ?? []}
        isLoading={updateUser.isPending}
        canWrite={canWrite}
        error={error}
        onCancel={() => navigate('/users')}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}
