import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Avatar, Paper, Typography } from '@mui/material';
import { PageContainer } from '@/components/layout';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import ArkAlert from '@/components/shared/ArkAlert';
import { ProviderForm } from '@/components/providers';
import { useCreateProvider } from '@/api/providers';
import { tagsApi } from '@/api/tags';
import { useQuery } from '@tanstack/react-query';
import { ProviderFormValues } from '@/types/provider';
import { hasPermission } from '@/store/auth';
import { resolveAlertMessage } from '@/utils/provider.utils';

export default function ProviderNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('providers:write');

  const [alert, setAlert] = useState<{ severity: 'error'; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canWrite) navigate('/403');
  }, [canWrite, navigate]);

  const { data: dimensions } = useQuery({
    queryKey: ['tag-dimensions'],
    queryFn: () => tagsApi.getDimensions(),
  });

  const createProvider = useCreateProvider();

  const handleSubmit = async (values: ProviderFormValues) => {
    try {
      setError(null);

      const newProvider = await createProvider.mutateAsync({ ...values, tags: [] });

      if (values.tags && values.tags.length > 0) {
        const tagsByDimension = new Map<string, string[]>();
        values.tags.forEach((tag) => {
          const existing = tagsByDimension.get(tag.dimensionId) || [];
          existing.push(tag.id);
          tagsByDimension.set(tag.dimensionId, existing);
        });
        for (const [dimensionId, tagIds] of tagsByDimension.entries()) {
          await tagsApi.putEntityTags('provider', newProvider.id, dimensionId, tagIds);
        }
      }

      navigate(`/providers/${newProvider.id}`, {
        state: { alert: { severity: 'success', message: t('providers.alert.createSuccess') } },
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

  return (
    <PageContainer maxWidth="xl">
      <AppBreadcrumbs
        items={[
          { label: t('providers.form.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('providers.form.breadcrumb.list'), onClick: () => navigate('/providers') },
          { label: t('providers.form.breadcrumb.new') },
        ]}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'error.dark', width: 48, height: 48, fontSize: '1.25rem' }}>
          {t('providers.form.createTitle').charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" component="h1">
            {t('providers.form.createTitle')}
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 4 }}>
        {alert && (
          <Box sx={{ mb: 3 }}>
            <ArkAlert
              open={!!alert}
              severity="error"
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </Box>
        )}

        <ProviderForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/providers')}
          isLoading={createProvider.isPending}
          error={error}
          availableDimensions={availableDimensions}
        />
      </Paper>
    </PageContainer>
  );
}
