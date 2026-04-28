import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Link,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import PageContainer from '@/components/layout/PageContainer';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ArkAlert from '@/components/shared/ArkAlert';
import CriticalityChip from '@/components/business-capabilities/CriticalityChip';
import TechnicalFitChip from '@/components/business-capabilities/TechnicalFitChip';
import { TagChipList } from '@/components/tags';
import { DetailRow, ClickableRow } from '@/components/shared/DetailComponents';
import { useBusinessCapability, useBusinessCapabilityApplications } from '@/api/businessCapabilities';
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
  const [activeTab, setActiveTab] = useState(0);
  const [appsPage, setAppsPage] = useState(0);

  const { data: capability, isLoading, error } = useBusinessCapability(id || '');
  const { data: appsData, isLoading: isLoadingApps } = useBusinessCapabilityApplications(
    id || '',
    { page: appsPage + 1, limit: 20 },
    { enabled: !!id && activeTab === 1 }
  );

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    if (error) {
      navigate('/business-capabilities');
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('businessCapabilities.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('businessCapabilities.detail.breadcrumb.list'), onClick: () => navigate('/business-capabilities') },
          { label: '...' },
        ]} />
        <LoadingSkeleton rows={6} columns={2} />
      </PageContainer>
    );
  }

  if (!capability) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('businessCapabilities.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('businessCapabilities.detail.breadcrumb.list'), onClick: () => navigate('/business-capabilities') },
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
        { label: t('businessCapabilities.detail.breadcrumb.home'), onClick: () => navigate('/') },
        { label: t('businessCapabilities.detail.breadcrumb.list'), onClick: () => navigate('/business-capabilities') },
        { label: capability.name },
      ]} />

      <ArkAlert
        open={!!alert}
        severity={alert?.severity ?? 'success'}
        message={alert?.message ?? ''}
        autoDismiss={5000}
        onClose={() => setAlert(null)}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Avatar sx={{ bgcolor: 'secondary.dark', width: 48, height: 48, fontSize: '1.25rem' }}>
          {capability.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" component="h1">{capability.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('businessCapabilities.detail.subtitle', {
              level: capability.level,
              domain: capability.domain?.name || t('businessCapabilities.detail.noDomain'),
            })}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
          {capability.criticality && (
            <CriticalityChip level={capability.criticality} />
          )}
          {capability.technicalFit && (
            <TechnicalFitChip level={capability.technicalFit} />
          )}
        </Stack>
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/business-capabilities/${id}/edit`)}
          >
            {t('businessCapabilities.detail.editButton')}
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label={t('businessCapabilities.drawer.tabs.info')} />
          <Tab label={`${t('businessCapabilities.drawer.tabs.applications')} (${capability._count.applicationMappings})`} />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Box sx={{ flex: '2 1 400px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.general')}
                  </Typography>
                  <DetailRow label={t('businessCapabilities.form.description')}>
                    <Typography variant="body1">
                      {capability.description || t('businessCapabilities.detail.noValue')}
                    </Typography>
                  </DetailRow>
                  <DetailRow label={t('businessCapabilities.form.comment')}>
                    <Typography variant="body1">
                      {capability.comment || t('businessCapabilities.detail.noValue')}
                    </Typography>
                  </DetailRow>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.relations')}
                  </Typography>
                  <Stack spacing={2}>
                    <ClickableRow
                      label={t('businessCapabilities.form.domain')}
                      onClick={capability.domain ? () => navigate(`/domains/${capability.domain!.id}`) : undefined}
                    >
                      <Typography variant="body1">
                        {capability.domain ? capability.domain.name : t('businessCapabilities.detail.noValue')}
                      </Typography>
                    </ClickableRow>

                    <ClickableRow
                      label={t('businessCapabilities.form.parent')}
                      onClick={capability.parent ? () => navigate(`/business-capabilities/${capability.parent!.id}`) : undefined}
                    >
                      <Typography variant="body1">
                        {capability.parent ? capability.parent.name : t('businessCapabilities.detail.rootCapability')}
                      </Typography>
                    </ClickableRow>

                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('businessCapabilities.form.criticality')}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {capability.criticality ? (
                            <CriticalityChip level={capability.criticality} />
                          ) : (
                            <Typography variant="body1">{t('businessCapabilities.detail.noValue')}</Typography>
                          )}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('businessCapabilities.form.technicalFit')}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {capability.technicalFit ? (
                            <TechnicalFitChip level={capability.technicalFit} />
                          ) : (
                            <Typography variant="body1">{t('businessCapabilities.detail.noValue')}</Typography>
                          )}
                        </Box>
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
                  {capability.tags && capability.tags.length > 0 ? (
                    <TagChipList
                      tags={capability.tags}
                      maxVisible={20}
                      deduplicate={true}
                      showMoreButton={true}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1" color="text.secondary">—</Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.metadata')}
                  </Typography>
                  <DetailRow label={t('businessCapabilities.list.columns.createdAt')}>
                    <Typography variant="body1">
                      {new Date(capability.createdAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  </DetailRow>
                  <DetailRow label={t('businessCapabilities.detail.updatedAt')}>
                    <Typography variant="body1">
                      {new Date(capability.updatedAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  </DetailRow>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            {isLoadingApps && !appsData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress size={24} /></Box>
            ) : appsData?.data.length ? (
              <>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                        <TableCell>{t('applications.list.columns.name')}</TableCell>
                        <TableCell>{t('applications.list.columns.domain')}</TableCell>
                        <TableCell>{t('applications.list.columns.owner')}</TableCell>
                        <TableCell>{t('applications.list.columns.criticality')}</TableCell>
                        <TableCell>{t('applications.list.columns.lifecycleStatus')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appsData.data.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <Link component={RouterLink} to={`/applications/${app.id}`} underline="always" sx={{ color: 'inherit', '&:hover': { color: 'primary.main' } }}>
                              {app.name}
                            </Link>
                          </TableCell>
                          <TableCell>{app.domain?.name || '—'}</TableCell>
                          <TableCell>{app.owner ? `${app.owner.firstName} ${app.owner.lastName}` : '—'}</TableCell>
                          <TableCell>{app.criticality || '—'}</TableCell>
                          <TableCell>{app.lifecycleStatus || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  count={appsData.meta.total}
                  page={appsPage}
                  rowsPerPage={20}
                  rowsPerPageOptions={[20]}
                  onPageChange={(_, p) => setAppsPage(p)}
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`}
                />
              </>
            ) : (
              <EmptyState title={t('businessCapabilities.form.noApplications')} />
            )}
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/business-capabilities')}
        >
          {t('businessCapabilities.detail.backButton')}
        </Button>
      </Box>
    </PageContainer>
  );
}
