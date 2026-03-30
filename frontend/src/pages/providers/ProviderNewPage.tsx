import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import { PageContainer } from '@/components/layout';
import { ProviderForm } from '@/components/providers';
import ArkAlert from '@/components/shared/ArkAlert';
import { useCreateProvider } from '@/api/providers';
import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';
import { ProviderFormValues } from '@/types/provider';
import { hasPermission } from '@/store/auth';
import { resolveAlertMessage } from '@/utils/provider.utils';

interface TagDimension {
  id: string;
  name: string;
  color?: string;
}

export default function ProviderNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('providers:write');

  const [alert, setAlert] = useState<{ severity: 'error'; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no write permission
  useEffect(() => {
    if (!canWrite) {
      navigate('/403');
    }
  }, [canWrite, navigate]);

  // Fetch available tag dimensions
  const { data: dimensions } = useQuery({
    queryKey: ['tag-dimensions'],
    queryFn: async () => {
      const response = await client.get<TagDimension[]>('/tags/dimensions');
      return response.data;
    },
  });

  const createProvider = useCreateProvider();

  const handleSubmit = async (values: ProviderFormValues) => {
    try {
      setError(null);

      // Create provider (without tags initially)
      const newProvider = await createProvider.mutateAsync({
        ...values,
        tags: [],
      });

      // Save tags for each dimension if any
      if (values.tags && values.tags.length > 0) {
        const tagsByDimension = values.tags.reduce(
          (acc, tag) => {
            if (!acc[tag.dimensionId]) {
              acc[tag.dimensionId] = [];
            }
            acc[tag.dimensionId].push(tag.id);
            return acc;
          },
          {} as Record<string, string[]>,
        );

        // Save tags for each dimension
        await Promise.all(
          Object.entries(tagsByDimension).map(([dimensionId, tagIds]) =>
            client.put(`/tags/entities/provider/${newProvider.id}/${dimensionId}`, {
              tagIds,
            }),
          ),
        );
      }

      // Navigate to detail page with success alert
      navigate(`/providers/${newProvider.id}`, {
        state: {
          alert: {
            severity: 'success',
            message: t('providers.alert.createSuccess'),
          },
        },
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(t('providers.form.nameDuplicate'));
      } else if (err.response?.status === 400) {
        setError(t('providers.form.nameRequired'));
      } else {
        setAlert({
          severity: 'error',
          message: resolveAlertMessage(t, err.response?.status ?? 500),
        });
      }
    }
  };

  const handleCancel = () => {
    navigate('/providers');
  };

  return (
    <PageContainer>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          onClick={() => navigate('/')}
          variant="body2"
          sx={{ cursor: 'pointer' }}
        >
          {t('providers.form.breadcrumb.home')}
        </Link>
        <Link
          component="button"
          onClick={() => navigate('/providers')}
          variant="body2"
          sx={{ cursor: 'pointer' }}
        >
          {t('providers.form.breadcrumb.list')}
        </Link>
        <Typography variant="body2">{t('providers.form.breadcrumb.new')}</Typography>
      </Breadcrumbs>

      {/* Title */}
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        {t('providers.form.breadcrumb.new')}
      </Typography>

      {/* Form */}
      <Box sx={{ maxWidth: 600 }}>
        <ProviderForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createProvider.isPending}
          error={error}
          availableDimensions={dimensions}
        />
      </Box>

      {/* Error Alert */}
      {alert && (
        <ArkAlert
          severity={alert.severity}
          message={alert.message}
          open={true}
          onClose={() => setAlert(null)}
        />
      )}
    </PageContainer>
  );
}
