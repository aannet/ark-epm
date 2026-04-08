import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Stack, Button, Link, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ArkAlert from '@/components/shared/ArkAlert';
import CriticalityChip from '@/components/business-capabilities/CriticalityChip';
import TechnicalFitChip from '@/components/business-capabilities/TechnicalFitChip';
import { TagChipList } from '@/components/tags';
import { useBusinessCapability } from '@/api/businessCapabilities';
import { hasPermission } from '@/store/auth';

interface AlertState {
  severity: 'success' | 'error';
  message: string;
}

export default function BusinessCapabilityDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const canWrite = hasPermission('business-capabilities:write');

  const [alert, setAlert] = useState<AlertState | null>(null);

  const { data: capability, isLoading, error } = useBusinessCapability(id || '');

  // Handle alert from navigation state
  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Redirect on 404
  useEffect(() => {
    if (error) {
      navigate('/business-capabilities');
    }
  }, [error, navigate]);

  const breadcrumbItems = [
    { label: t('businessCapabilities.detail.breadcrumb.home'), onClick: () => navigate('/') },
    { label: t('businessCapabilities.detail.breadcrumb.list'), onClick: () => navigate('/business-capabilities') },
    { label: capability?.name || '...' },
  ];

  if (isLoading) {
    return (
      <PageContainer maxWidth="md">
        <AppBreadcrumbs items={breadcrumbItems} />
        <LoadingSkeleton rows={6} columns={1} />
      </PageContainer>
    );
  }

  if (!capability) {
    return (
      <PageContainer maxWidth="md">
        <AppBreadcrumbs items={breadcrumbItems} />
        <EmptyState
          title={t('errors.notFound.title')}
          description={t('errors.notFound.description')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="md">
      <AppBreadcrumbs items={breadcrumbItems} />

      <ArkAlert
        open={!!alert}
        severity={alert?.severity ?? 'success'}
        message={alert?.message ?? ''}
        autoDismiss={5000}
        onClose={() => setAlert(null)}
      />

      <PageHeader
        title={capability.name}
        subtitle={t('businessCapabilities.detail.subtitle', {
          level: capability.level,
          domain: capability.domain?.name || t('businessCapabilities.detail.noDomain'),
        })}
        action={
          canWrite
            ? {
                label: t('businessCapabilities.detail.editButton'),
                onClick: () => navigate(`/business-capabilities/${id}/edit`),
                icon: <EditIcon />,
              }
            : undefined
        }
      />

      <Stack spacing={3} sx={{ mt: 3 }}>
        {/* Description */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('businessCapabilities.form.description')}
          </Typography>
          <Typography variant="body1">
            {capability.description || t('businessCapabilities.detail.noValue')}
          </Typography>
        </Box>

        {/* Comment */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('businessCapabilities.form.comment')}
          </Typography>
          <Typography variant="body1">
            {capability.comment || t('businessCapabilities.detail.noValue')}
          </Typography>
        </Box>

        <Divider />

        {/* Domain */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('businessCapabilities.form.domain')}
          </Typography>
          <Typography variant="body1">
            {capability.domain?.name || t('businessCapabilities.detail.noValue')}
          </Typography>
        </Box>

        {/* Parent */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('businessCapabilities.form.parent')}
          </Typography>
          {capability.parent ? (
            <Link
              component="button"
              variant="body1"
              onClick={() => navigate(`/business-capabilities/${capability.parent?.id}`)}
              sx={{ cursor: 'pointer', textAlign: 'left' }}
            >
              {capability.parent.name}
            </Link>
          ) : (
            <Typography variant="body1">{t('businessCapabilities.detail.rootCapability')}</Typography>
          )}
        </Box>

        <Divider />

        {/* Criticality */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('businessCapabilities.form.criticality')}
          </Typography>
          {capability.criticality ? (
            <CriticalityChip level={capability.criticality} />
          ) : (
            <Typography variant="body1">{t('businessCapabilities.detail.noValue')}</Typography>
          )}
        </Box>

        {/* Technical Fit */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('businessCapabilities.form.technicalFit')}
          </Typography>
          {capability.technicalFit ? (
            <TechnicalFitChip level={capability.technicalFit} />
          ) : (
            <Typography variant="body1">{t('businessCapabilities.detail.noValue')}</Typography>
          )}
        </Box>

        <Divider />

        {/* Tags */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('businessCapabilities.detail.tags')}
          </Typography>
          {capability.tags && capability.tags.length > 0 ? (
            <TagChipList
              tags={capability.tags}
              maxVisible={20}
              deduplicate={true}
              showMoreButton={true}
              size="small"
            />
          ) : (
            <Typography variant="body1">{t('businessCapabilities.detail.noValue')}</Typography>
          )}
        </Box>

        {/* Metadata */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('businessCapabilities.list.columns.createdAt')}
          </Typography>
          <Typography variant="body1">
            {new Date(capability.createdAt).toLocaleDateString('fr-FR')}
          </Typography>
        </Box>

        {/* Back button */}
        <Box sx={{ pt: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/business-capabilities')}>
            {t('businessCapabilities.detail.backButton')}
          </Button>
        </Box>
      </Stack>
    </PageContainer>
  );
}
