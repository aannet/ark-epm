import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Avatar, Paper, Typography } from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
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
    <PageContainer maxWidth="xl">
      <AppBreadcrumbs items={breadcrumbItems} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'info.dark', width: 48, height: 48, fontSize: '1.25rem' }}>
          {t('interfaces.form.createTitle').charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" component="h1">
            {t('interfaces.form.createTitle')}
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 4 }}>
        <InterfaceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending}
          error={error}
        />
      </Paper>
    </PageContainer>
  );
}
