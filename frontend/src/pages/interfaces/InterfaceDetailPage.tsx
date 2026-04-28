import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Stack,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import PageContainer from '@/components/layout/PageContainer';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ArkAlert from '@/components/shared/ArkAlert';
import CriticalityChip from '@/components/business-capabilities/CriticalityChip';
import { TagChipList } from '@/components/tags';
import { DetailRow, RelationCard } from '@/components/shared/DetailComponents';
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
  const [activeTab, setActiveTab] = useState(0);

  const [alert, setAlert] = useState<AlertState | null>(null);

  const { data: iface, isLoading, error } = useInterface(id || '');

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    if (error) {
      navigate('/interfaces');
    }
  }, [error, navigate]);

  const title = iface ? formatInterfaceTitle(iface) : '...';
  const subtitle = iface
    ? `${iface.sourceApp.name}${iface.middlewareApp ? ` → ${iface.middlewareApp.name}` : ''} → ${iface.targetApp.name}`
    : '';

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('interfaces.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('interfaces.detail.breadcrumb.list'), onClick: () => navigate('/interfaces') },
          { label: '...' },
        ]} />
        <LoadingSkeleton rows={6} columns={2} />
      </PageContainer>
    );
  }

  if (!iface) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('interfaces.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('interfaces.detail.breadcrumb.list'), onClick: () => navigate('/interfaces') },
          { label: '...' },
        ]} />
        <EmptyState
          title={t('errors.notFound.title')}
          description={t('errors.notFound.description')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <AppBreadcrumbs items={[
        { label: t('interfaces.detail.breadcrumb.home'), onClick: () => navigate('/') },
        { label: t('interfaces.detail.breadcrumb.list'), onClick: () => navigate('/interfaces') },
        { label: title },
      ]} />

      <ArkAlert
        open={!!alert}
        severity={alert?.severity ?? 'success'}
        message={alert?.message ?? ''}
        autoDismiss={5000}
        onClose={() => setAlert(null)}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Avatar sx={{ bgcolor: 'info.dark', width: 48, height: 48, fontSize: '1.25rem' }}>
          {iface.sourceApp.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" component="h1">{title}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
          <Chip label={t(`interfaces.type.${iface.type}`)} size="small" />
          {iface.criticality && (
            <CriticalityChip level={iface.criticality} />
          )}
        </Stack>
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/interfaces/${id}/edit`)}
          >
            {t('interfaces.detail.editButton')}
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label={t('interfaces.drawer.type')} />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Box sx={{ flex: '2 1 400px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.general')}
                  </Typography>
                  <DetailRow label={t('interfaces.form.sourceAppLabel')}>
                    <RelationCard
                      name={iface.sourceApp.name}
                      onClick={() => navigate(`/applications/${iface.sourceAppId}`)}
                    />
                  </DetailRow>

                  {iface.middlewareApp && (
                    <DetailRow label={t('interfaces.form.middlewareAppLabel')}>
                      <RelationCard
                        name={iface.middlewareApp!.name}
                        onClick={() => navigate(`/applications/${iface.middlewareApp!.id}`)}
                      />
                    </DetailRow>
                  )}

                  <DetailRow label={t('interfaces.form.targetAppLabel')}>
                    <RelationCard
                      name={iface.targetApp.name}
                      onClick={() => navigate(`/applications/${iface.targetAppId}`)}
                    />
                  </DetailRow>

                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('interfaces.drawer.type')}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip label={t(`interfaces.type.${iface.type}`)} size="small" />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('interfaces.drawer.frequency')}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body1">
                          {iface.frequency ? t(`interfaces.frequency.${iface.frequency}`) : t('interfaces.detail.noValue')}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('interfaces.drawer.criticality')}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {iface.criticality ? (
                          <CriticalityChip level={iface.criticality} />
                        ) : (
                          <Typography variant="body1">{t('interfaces.detail.noValue')}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.tags')}
                  </Typography>
                  <TagChipList tags={iface.tags} />
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.metadata')}
                  </Typography>
                  <DetailRow label={t('interfaces.drawer.technicalContact')}>
                    <Typography variant="body1">{iface.technicalContact ?? t('interfaces.detail.noValue')}</Typography>
                  </DetailRow>
                  <DetailRow label={t('interfaces.drawer.errorRate')}>
                    <Typography variant="body1">
                      {iface.errorRate !== null ? `${iface.errorRate} %` : t('interfaces.detail.noValue')}
                    </Typography>
                  </DetailRow>
                  <DetailRow label={t('interfaces.form.descriptionLabel')}>
                    <Typography variant="body1">{iface.description ?? t('interfaces.detail.noValue')}</Typography>
                  </DetailRow>
                  <DetailRow label={t('interfaces.form.commentLabel')}>
                    <Typography variant="body1">{iface.comment ?? t('interfaces.detail.noValue')}</Typography>
                  </DetailRow>
                  <DetailRow label={t('interfaces.detail.createdAt')}>
                    <Typography variant="body1">{new Date(iface.createdAt).toLocaleDateString('fr-FR')}</Typography>
                  </DetailRow>
                  <DetailRow label={t('interfaces.detail.updatedAt')}>
                    <Typography variant="body1">{new Date(iface.updatedAt).toLocaleDateString('fr-FR')}</Typography>
                  </DetailRow>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/interfaces')}
        >
          {t('interfaces.detail.backButton')}
        </Button>
      </Box>
    </PageContainer>
  );
}
