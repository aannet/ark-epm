import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { ConfirmDialog, ArkAlert } from '@/components/shared';
import { TagChipList } from '@/components/tags';
import { DetailRow } from '@/components/shared/DetailComponents';
import { useProvider, useProviderApplications, useDeleteProvider } from '@/api/providers';
import { hasPermission } from '@/store/auth';
import ExpiryDateBadge from '@/components/providers/ExpiryDateBadge';
import ProviderRoleBadge from '@/components/providers/ProviderRoleBadge';
import { format409Message } from '@/utils/provider.utils';

interface AlertState {
  severity: 'success' | 'error' | 'warning';
  message: string;
}

export default function ProviderDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('providers:write');

  const [tabIndex, setTabIndex] = useState(0);
  const [appPage, setAppPage] = useState(1);
  const [appRowsPerPage, setAppRowsPerPage] = useState(20);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const { data: provider, isLoading, error } = useProvider(id || '');
  const { data: appsData, isLoading: appsLoading } = useProviderApplications(
    id || '',
    { page: appPage, limit: appRowsPerPage },
    { enabled: !!id && tabIndex === 1 },
  );

  const deleteProvider = useDeleteProvider();

  useEffect(() => {
    if (error && (error as any).response?.status === 404) {
      navigate('/providers');
    }
  }, [error, navigate]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleAppPageChange = (_event: unknown, newPage: number) => {
    setAppPage(newPage + 1);
  };

  const handleAppRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAppRowsPerPage(parseInt(event.target.value, 10));
    setAppPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      await deleteProvider.mutateAsync(id);
      navigate('/providers', {
        state: { alert: { severity: 'success', message: t('providers.alert.deleteSuccess') } },
      });
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.code === 'DEPENDENCY_CONFLICT') {
        const appCount = err.response?.data?.details?.applicationsCount ?? 0;
        setAlert({ severity: 'error', message: format409Message(t, appCount) });
      } else {
        setAlert({ severity: 'error', message: t('providers.alert.errors.serverError') });
      }
    }
    setDeleteDialog(false);
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('providers.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('providers.detail.breadcrumb.list'), onClick: () => navigate('/providers') },
          { label: '...' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!provider) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('providers.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('providers.detail.breadcrumb.list'), onClick: () => navigate('/providers') },
          { label: '...' },
        ]} />
        <Typography variant="h6" color="error">{t('providers.alert.errors.notFound')}</Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <AppBreadcrumbs items={[
        { label: t('providers.detail.breadcrumb.home'), onClick: () => navigate('/') },
        { label: t('providers.detail.breadcrumb.list'), onClick: () => navigate('/providers') },
        { label: provider.name },
      ]} />

      <ArkAlert
        severity={alert?.severity ?? 'success'}
        message={alert?.message ?? ''}
        open={!!alert}
        onClose={() => setAlert(null)}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Avatar sx={{ bgcolor: 'error.dark', width: 48, height: 48, fontSize: '1.25rem' }}>
          {provider.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" component="h1">{provider.name}</Typography>
          {provider.contractType && (
            <Typography variant="body2" color="text.secondary">{provider.contractType}</Typography>
          )}
        </Box>
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/providers/${id}/edit`)}
          >
            {t('providers.detail.buttonEdit')}
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={t('providers.detail.tabInfo')} />
          <Tab label={t('providers.detail.tabApplications')} />
        </Tabs>

        {tabIndex === 0 && (
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Box sx={{ flex: '2 1 400px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.general')}
                  </Typography>
                  {provider.description && (
                    <DetailRow label={t('providers.detail.descriptionLabel')}>
                      <Typography variant="body1">{provider.description}</Typography>
                    </DetailRow>
                  )}
                  {provider.comment && (
                    <DetailRow label={t('providers.detail.commentLabel')}>
                      <Typography variant="body1">{provider.comment}</Typography>
                    </DetailRow>
                  )}
                  {provider.contractType && (
                    <DetailRow label={t('providers.detail.contractTypeLabel')}>
                      <Typography variant="body1">{provider.contractType}</Typography>
                    </DetailRow>
                  )}
                  {provider.expiryDate && (
                    <DetailRow label={t('providers.detail.expiryDateLabel')}>
                      <ExpiryDateBadge date={provider.expiryDate} />
                    </DetailRow>
                  )}
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.tags')}
                  </Typography>
                  {provider.tags && provider.tags.length > 0 ? (
                    <TagChipList tags={provider.tags} maxVisible={999} deduplicate={true} showMoreButton={false} size="small" />
                  ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.metadata')}
                  </Typography>
                  <DetailRow label={t('providers.detail.createdAtLabel')}>
                    <Typography variant="body1">{new Date(provider.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</Typography>
                  </DetailRow>
                  {provider.updatedAt && (
                    <DetailRow label={t('providers.detail.updatedAtLabel')}>
                      <Typography variant="body1">{new Date(provider.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</Typography>
                    </DetailRow>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {tabIndex === 1 && (
          <Box sx={{ p: 2 }}>
            {appsLoading && !appsData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : appsData?.data && appsData.data.length > 0 ? (
              <>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                        <TableCell>{t('applications.list.columns.name')}</TableCell>
                        <TableCell>{t('applications.list.columns.domain')}</TableCell>
                        <TableCell>{t('applications.list.columns.owner')}</TableCell>
                        <TableCell>{t('applications.list.columns.criticality')}</TableCell>
                        <TableCell>{t('applications.list.columns.providerRole')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appsData.data.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{app.name}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{app.domain?.name || '—'}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{app.owner ? `${app.owner.firstName} ${app.owner.lastName}` : '—'}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{app.criticality || '—'}</Typography></TableCell>
                          <TableCell><ProviderRoleBadge role={app.providerRole} size="small" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[10, 20, 50]}
                  component="div"
                  count={appsData.meta.total}
                  rowsPerPage={appRowsPerPage}
                  page={appPage - 1}
                  onPageChange={handleAppPageChange}
                  onRowsPerPageChange={handleAppRowsPerPageChange}
                />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">{t('common.noData')}</Typography>
            )}
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'space-between' }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/providers')}>
          {t('providers.detail.buttonBack')}
        </Button>
        {canWrite && (
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialog(true)}>
            {t('providers.detail.buttonDelete')}
          </Button>
        )}
      </Box>

      {deleteDialog && (
        <ConfirmDialog
          open={true}
          title={t('providers.delete.confirmTitle')}
          message={t('providers.delete.confirmMessage', { name: provider.name })}
          confirmLabel={t('common.actions.delete')}
          cancelLabel={t('common.actions.cancel')}
          severity="warning"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteDialog(false)}
          isLoading={deleteProvider.isPending}
        />
      )}
    </PageContainer>
  );
}
