import { useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Link, Tabs, Tab, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, CircularProgress, Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageContainer from '@/components/layout/PageContainer';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { TagChipList } from '@/components/tags';
import { DetailRow } from '@/components/shared/DetailComponents';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getITComponent, deleteITComponent, getITComponentApplications } from '@/services/api/it-components.api';
import { hasPermission } from '@/store/auth';
import { format409Message, formatDateTime } from '@/utils/it-components.utils';

export default function ITComponentDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('it-components:write');
  const [activeTab, setActiveTab] = useState(0);
  const [appsPage, setAppsPage] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ['it-component', id], queryFn: () => getITComponent(id!), enabled: !!id });
  const { data: appsData, isLoading: isLoadingApps } = useQuery({ queryKey: ['it-component-apps', id, appsPage], queryFn: () => getITComponentApplications(id!, { page: appsPage + 1, limit: 20 }), enabled: !!id && activeTab === 1 });

  const deleteMutation = useMutation({
    mutationFn: deleteITComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-components'] });
      navigate('/it-components', { state: { alert: { severity: 'success', message: t('it-components.alert.deleteSuccess') } } });
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setDeleteError(format409Message(t, err?.response?.data?.details?.applicationsCount || 0));
      } else {
        setAlert({ severity: 'error', message: t('it-components.alert.errors.serverError') });
        setDeleteOpen(false);
      }
    },
  });

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('it-components.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('it-components.detail.breadcrumb.list'), onClick: () => navigate('/it-components') },
          { label: '...' },
        ]} />
        <LoadingSkeleton rows={5} columns={2} />
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('it-components.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('it-components.detail.breadcrumb.list'), onClick: () => navigate('/it-components') },
          { label: '...' },
        ]} />
        <EmptyState title={t('errors.notFound.title')} description={t('it-components.alert.errors.notFound')} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <ArkAlert open={!!alert} severity={alert?.severity || 'success'} message={alert?.message || ''} autoDismiss={5000} onClose={() => setAlert(null)} />

      <AppBreadcrumbs items={[
        { label: t('it-components.detail.breadcrumb.home'), onClick: () => navigate('/') },
        { label: t('it-components.detail.breadcrumb.list'), onClick: () => navigate('/it-components') },
        { label: data.name },
      ]} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Avatar sx={{ bgcolor: 'warning.dark', width: 48, height: 48, fontSize: '1.25rem' }}>
          {data.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" component="h1">{data.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {data.technology && data.type ? `${data.technology} · ${data.type}` : (data.technology || data.type || t('it-components.detail.noValue'))}
          </Typography>
        </Box>
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/it-components/${id}/edit`)}
          >
            {t('it-components.detail.buttonEdit')}
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={t('it-components.detail.tabInfo')} />
          <Tab label={`${t('it-components.detail.tabApplications')} (${data._count.applications})`} />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Box sx={{ flex: '2 1 400px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.general')}
                  </Typography>
                  <DetailRow label={t('it-components.detail.technologyLabel')}>
                    <Typography variant="body1">{data.technology || t('it-components.detail.noValue')}</Typography>
                  </DetailRow>
                  <DetailRow label={t('it-components.detail.typeLabel')}>
                    <Typography variant="body1">{data.type || t('it-components.detail.noValue')}</Typography>
                  </DetailRow>
                  <DetailRow label={t('it-components.detail.descriptionLabel')}>
                    <Typography variant="body1">{data.description || t('it-components.detail.noValue')}</Typography>
                  </DetailRow>
                  <DetailRow label={t('it-components.detail.commentLabel')}>
                    <Typography variant="body1">{data.comment || t('it-components.detail.noValue')}</Typography>
                  </DetailRow>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.tags')}
                  </Typography>
                  {data.tags?.length ? (
                    <TagChipList tags={(data.tags).map((t: any) => ({ ...t.tagValue, dimensionColor: t.tagValue.dimensionColor ?? undefined }))} deduplicate={true} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.metadata')}
                  </Typography>
                  <DetailRow label={t('it-components.detail.createdAtLabel')}>
                    <Typography variant="body1">{formatDateTime(data.createdAt)}</Typography>
                  </DetailRow>
                  <DetailRow label={t('it-components.detail.updatedAtLabel')}>
                    <Typography variant="body1">{formatDateTime(data.updatedAt)}</Typography>
                  </DetailRow>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            {isLoadingApps ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress size={24} /></Box>
            ) : appsData?.data.length ? (
              <>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead><TableRow sx={{ bgcolor: '#F1F5F9' }}><TableCell>{t('applications.list.columns.name')}</TableCell><TableCell>{t('applications.list.columns.domain')}</TableCell><TableCell>{t('applications.list.columns.owner')}</TableCell><TableCell>{t('applications.list.columns.criticality')}</TableCell><TableCell>{t('applications.list.columns.lifecycleStatus')}</TableCell></TableRow></TableHead>
                    <TableBody>{appsData.data.map(app => <TableRow key={app.id}><TableCell><Link component={RouterLink} to={`/applications/${app.id}`} underline="always" sx={{ color: 'inherit', '&:hover': { color: 'primary.main' } }}>{app.name}</Link></TableCell><TableCell>{app.domain?.name || '—'}</TableCell><TableCell>{app.owner ? `${app.owner.firstName} ${app.owner.lastName}` : '—'}</TableCell><TableCell>{app.criticality || '—'}</TableCell><TableCell>{app.lifecycleStatus || '—'}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </TableContainer>
                <TablePagination count={appsData.meta.total} page={appsPage} rowsPerPage={20} rowsPerPageOptions={[20]} onPageChange={(_, p) => setAppsPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`} />
              </>
            ) : (
              <EmptyState title={t('it-components.detail.noApplications')} />
            )}
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'space-between' }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/it-components')}>{t('it-components.detail.buttonBack')}</Button>
        {canWrite && (
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => { setDeleteOpen(true); setDeleteError(null); }}>{t('it-components.detail.buttonDelete')}</Button>
        )}
      </Box>

      <ConfirmDialog
        open={deleteOpen}
        title={t('it-components.delete.confirmTitle')}
        message={deleteError || t('it-components.delete.confirmMessage', { name: data.name })}
        confirmLabel={deleteError ? undefined : t('common.confirmDialog.confirmLabel')}
        cancelLabel={t('common.confirmDialog.cancelLabel')}
        onConfirm={deleteError ? () => {} : () => deleteMutation.mutate(id!)}
        onCancel={() => { setDeleteOpen(false); setDeleteError(null); }}
        isLoading={deleteMutation.isPending}
        severity={deleteError ? 'error' : undefined}
      />
    </PageContainer>
  );
}
