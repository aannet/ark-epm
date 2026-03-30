import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Breadcrumbs, Link, Typography, CircularProgress } from '@mui/material';
import { PageContainer } from '@/components/layout';
import { ProviderForm } from '@/components/providers';
import ArkAlert from '@/components/shared/ArkAlert';
import { useProvider, useUpdateProvider } from '@/api/providers';
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

export default function ProviderEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('providers:write');

  const [alert, setAlert] = useState<{ severity: 'error'; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no write permission
  useEffect(() => {
    if (!canWrite) {
      navigate('/403');
    }
  }, [canWrite, navigate]);

  // Fetch provider
  const { data: provider, isLoading: providerLoading, error: providerError } = useProvider(id || '');

  // Redirect on 404
  useEffect(() => {
    if (providerError && (providerError as any).response?.status === 404) {
      navigate('/providers');
    }
  }, [providerError, navigate]);

  // Fetch available tag dimensions
  const { data: dimensions } = useQuery({
    queryKey: ['tag-dimensions'],
    queryFn: async () => {
      const response = await client.get<TagDimension[]>('/tags/dimensions');
      return response.data;
    },
  });

  const updateProvider = useUpdateProvider(id || '');

  const handleSubmit = async (values: ProviderFormValues) => {
    if (!id) return;

    try {
      setError(null);

      // Update provider (without tags initially)
      await updateProvider.mutateAsync({
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
            client.put(`/tags/entities/provider/${id}/${dimensionId}`, {
              tagIds,
            }),
          ),
        );
      } else {
        // If no tags, clear all tags by setting empty array for all dimensions
        // This is optional - depends on backend behavior
      }

      // Navigate back to detail page with success alert
      navigate(`/providers/${id}`, {
        state: {
          alert: {
            severity: 'success',
            message: t('providers.alert.updateSuccess'),
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
    navigate(`/providers/${id}`);
  };

  if (providerLoading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!provider) {
    return (
      <PageContainer>
        <Typography variant="h6" color="error">
          {t('providers.alert.errors.notFound')}
        </Typography>
      </PageContainer>
    );
  }

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
        <Link
          component="button"
          onClick={() => navigate(`/providers/${id}`)}
          variant="body2"
          sx={{ cursor: 'pointer' }}
        >
          {provider.name}
        </Link>
        <Typography variant="body2">{t('common.actions.edit')}</Typography>
      </Breadcrumbs>

      {/* Title */}
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        {t('providers.form.editTitle')}
      </Typography>

      {/* Form */}
      <Box sx={{ maxWidth: 600 }}>
        <ProviderForm
          initialValues={{
            name: provider.name,
            description: provider.description || '',
            comment: provider.comment || '',
            contractType: provider.contractType || '',
            expiryDate: provider.expiryDate,
            tags: provider.tags,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateProvider.isPending}
          error={error}
          availableDimensions={dimensions}
          entityId={id}
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
