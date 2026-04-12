import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Stack, Button, Link, Paper, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ArkAlert from '@/components/shared/ArkAlert';
// AGENT-DECISION: front — CriticalityChip importé depuis business-capabilities/ en attendant migration vers shared/ (post-MVP)
import CriticalityChip from '@/components/business-capabilities/CriticalityChip';
import { TagChipList } from '@/components/tags';
import { useInterface } from '@/api/interfaces';
import { hasPermission } from '@/store/auth';
import { formatInterfaceTitle } from '@/utils/interfaces.utils';

interface AlertState {
  severity: 'success' | 'error';
  message: string;
}

export default function InterfaceDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const canWrite = hasPermission('interfaces:write');

  const [alert, setAlert] = useState<AlertState | null>(null);

  const { data: iface, isLoading, error } = useInterface(id || '');

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
      navigate('/interfaces');
    }
  }, [error, navigate]);

  const title = iface ? formatInterfaceTitle(iface) : '...';

  const breadcrumbItems = [
    { label: t('interfaces.detail.breadcrumb.home'), onClick: () => navigate('/') },
    { label: t('interfaces.detail.breadcrumb.list'), onClick: () => navigate('/interfaces') },
    { label: title },
  ];

  if (isLoading) {
    return (
      <PageContainer maxWidth="md">
        <AppBreadcrumbs items={breadcrumbItems} />
        <LoadingSkeleton rows={6} columns={1} />
      </PageContainer>
    );
  }

  if (!iface) {
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
        title={title}
        subtitle={`${iface.sourceApp.name}${iface.middlewareApp ? ` → ${iface.middlewareApp.name}` : ''} → ${iface.targetApp.name}`}
        action={
          canWrite
            ? {
                label: t('interfaces.detail.editButton'),
                onClick: () => navigate(`/interfaces/${id}/edit`),
                icon: <EditIcon />,
              }
            : undefined
        }
      />

      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.drawer.type')}
            </Typography>
            <Chip
              label={t(`interfaces.type.${iface.type}`)}
              size="small"
            />
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.drawer.criticality')}
            </Typography>
            {iface.criticality ? (
              <CriticalityChip level={iface.criticality} />
            ) : (
              <Typography variant="body1">—</Typography>
            )}
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.drawer.frequency')}
            </Typography>
            <Typography variant="body1">
              {iface.frequency ? t(`interfaces.frequency.${iface.frequency}`) : '—'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.form.sourceAppLabel')}
            </Typography>
            <Link
              component="button"
              underline="hover"
              onClick={() => navigate(`/applications/${iface.sourceAppId}`)}
            >
              {iface.sourceApp.name}
            </Link>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.form.middlewareAppLabel')}
            </Typography>
            {iface.middlewareApp ? (
              <Link
                component="button"
                underline="hover"
                onClick={() => navigate(`/applications/${iface.middlewareApp!.id}`)}
              >
                {iface.middlewareApp!.name}
              </Link>
            ) : (
              <Typography variant="body1">{t('interfaces.detail.noValue')}</Typography>
            )}
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.form.targetAppLabel')}
            </Typography>
            <Link
              component="button"
              underline="hover"
              onClick={() => navigate(`/applications/${iface.targetAppId}`)}
            >
              {iface.targetApp.name}
            </Link>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.drawer.technicalContact')}
            </Typography>
            <Typography variant="body1">
              {iface.technicalContact ?? t('interfaces.detail.noValue')}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.drawer.errorRate')}
            </Typography>
            <Typography variant="body1">
              {iface.errorRate !== null ? `${iface.errorRate} %` : t('interfaces.detail.noValue')}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.form.descriptionLabel')}
            </Typography>
            <Typography variant="body1">
              {iface.description ?? t('interfaces.detail.noValue')}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.form.commentLabel')}
            </Typography>
            <Typography variant="body1">
              {iface.comment ?? t('interfaces.detail.noValue')}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.drawer.tags')}
            </Typography>
            <TagChipList tags={iface.tags} />
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.detail.createdAt')}
            </Typography>
            <Typography variant="body1">
              {new Date(iface.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('interfaces.detail.updatedAt')}
            </Typography>
            <Typography variant="body1">
              {new Date(iface.updatedAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/interfaces')}
        >
          {t('interfaces.detail.backButton')}
        </Button>
      </Box>
    </PageContainer>
  );
}
