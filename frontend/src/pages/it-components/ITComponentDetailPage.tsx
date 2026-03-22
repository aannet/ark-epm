import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Breadcrumbs, Link, Tabs, Tab, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageContainer from '@/components/layout/PageContainer';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
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
  const { data: appsData } = useQuery({ queryKey: ['it-component-apps', id, appsPage], queryFn: () => getITComponentApplications(id!, { page: appsPage + 1, limit: 20 }), enabled: !!id && activeTab === 1 });

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

  if (isLoading) return <PageContainer><LoadingSkeleton rows={5} /></PageContainer>;
  if (error || !data) {
    return <PageContainer><EmptyState title={t('errors.notFound.title')} description={t('it-components.alert.errors.notFound')} /></PageContainer>;
  }

  return (
    <PageContainer maxWidth="md">
      <ArkAlert open={!!alert} severity={alert?.severity || 'success'} message={alert?.message || ''} autoDismiss={5000} onClose={() => setAlert(null)} />
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" onClick={() => navigate('/')} underline="hover">{t('it-components.detail.breadcrumb.home')}</Link>
        <Link component="button" onClick={() => navigate('/it-components')} underline="hover">{t('it-components.detail.breadcrumb.list')}</Link>
        <Typography color="text.primary">{data.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h4">{data.name}</Typography>
        {data._count.applications > 0 && <Typography variant="subtitle1" color="primary">{data._count.applications} {t('it-components.detail.applicationsCount')}</Typography>}
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={t('it-components.detail.tabInfo')} />
        <Tab label={`${t('it-components.detail.tabApplications')} (${data._count.applications})`} />
      </Tabs>

      {activeTab === 0 ? (
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.detail.technologyLabel')}</Typography><Typography>{data.technology || t('it-components.detail.noValue')}</Typography></Box>
          <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.detail.typeLabel')}</Typography><Typography>{data.type || t('it-components.detail.noValue')}</Typography></Box>
          <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.detail.descriptionLabel')}</Typography><Typography>{data.description || t('it-components.detail.noValue')}</Typography></Box>
          <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.detail.commentLabel')}</Typography><Typography>{data.comment || t('it-components.detail.noValue')}</Typography></Box>
          <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.detail.tagsLabel')}</Typography><Typography variant="caption">{data.tags?.length ? `${data.tags.length} tag(s)` : '—'}</Typography></Box>
          <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.detail.createdAtLabel')}</Typography><Typography>{formatDateTime(data.createdAt)}</Typography></Box>
          <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.detail.updatedAtLabel')}</Typography><Typography>{formatDateTime(data.updatedAt)}</Typography></Box>
        </Box>
      ) : (
        <Box sx={{ pt: 2 }}>
          {appsData?.data.length ? (
            <>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead><TableRow sx={{ bgcolor: '#F1F5F9' }}><TableCell>{t('applications.list.columns.name')}</TableCell><TableCell>{t('applications.list.columns.domain')}</TableCell><TableCell>{t('applications.list.columns.owner')}</TableCell><TableCell>{t('applications.list.columns.criticality')}</TableCell><TableCell>{t('applications.list.columns.lifecycleStatus')}</TableCell></TableRow></TableHead>
                  <TableBody>{appsData.data.map(app => <TableRow key={app.id}><TableCell>{app.name}</TableCell><TableCell>{app.domain?.name || '—'}</TableCell><TableCell>{app.owner ? `${app.owner.firstName} ${app.owner.lastName}` : '—'}</TableCell><TableCell>{app.criticality || '—'}</TableCell><TableCell>{app.lifecycleStatus || '—'}</TableCell></TableRow>)}</TableBody>
                </Table>
              </TableContainer>
              <TablePagination component="div" count={appsData.meta.total} page={appsPage} rowsPerPage={20} rowsPerPageOptions={[20]} onPageChange={(_, p) => setAppsPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`} />
            </>
          ) : <EmptyState title={t('it-components.detail.noApplications')} />}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/it-components')}>{t('it-components.detail.buttonBack')}</Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/it-components/${id}/edit`)} disabled={!canWrite}>{t('it-components.detail.buttonEdit')}</Button>
        <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => { setDeleteOpen(true); setDeleteError(null); }} disabled={!canWrite}>{t('it-components.detail.buttonDelete')}</Button>
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
