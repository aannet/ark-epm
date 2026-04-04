import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Tabs, Tab, Button, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { TagChipList } from '@/components/tags';
import ApplicationListTable from '@/components/data-objects/ApplicationListTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDataObject, deleteDataObject } from '@/services/api/data-objects.api';
import { hasPermission } from '@/store/auth';
import { format409Message, formatDate } from '@/utils/data-objects.utils';

export default function DataObjectDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('data-objects:write');

  const [activeTab, setActiveTab] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  // Read navigation state alert (post-create or post-update)
  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['data-object', id],
    queryFn: () => getDataObject(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!isLoading && error) {
      navigate('/data-objects');
    }
  }, [isLoading, error, navigate]);

  const deleteMutation = useMutation({
    mutationFn: deleteDataObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-objects'] });
      navigate('/data-objects', { state: { alert: { severity: 'success', message: t('data-objects.alert.deleteSuccess') } } });
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setDeleteError(format409Message(t, err?.response?.data?.details?.applicationsCount ?? 0));
      } else {
        setAlert({ severity: 'error', message: t('data-objects.alert.errors.serverError') });
        setDeleteOpen(false);
      }
    },
  });

  if (isLoading) return <PageContainer><LoadingSkeleton rows={5} /></PageContainer>;
  if (!data) return <PageContainer><EmptyState title={t('data-objects.alert.errors.notFound')} /></PageContainer>;

  return (
    <PageContainer maxWidth="md">
      <ArkAlert open={!!alert} severity={alert?.severity ?? 'success'} message={alert?.message ?? ''} autoDismiss={5000} onClose={() => setAlert(null)} />

      <AppBreadcrumbs items={[
        { label: t('data-objects.detail.breadcrumb.home'), onClick: () => navigate('/') },
        { label: t('data-objects.detail.breadcrumb.list'), onClick: () => navigate('/data-objects') },
        { label: data.name },
      ]} />

      <PageHeader
        title={data.name}
        action={canWrite ? { label: t('data-objects.detail.editButton'), onClick: () => navigate(`/data-objects/${id}/edit`), icon: <EditIcon /> } : undefined}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={t('data-objects.detail.tabInfo')} />
        <Tab label={`${t('data-objects.detail.tabApplications')} (${data._count?.appDataObjectMaps ?? 0})`} />
      </Tabs>

      {activeTab === 0 ? (
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{t('data-objects.detail.typeLabel')}</Typography>
            <Typography>{data.type ?? t('data-objects.detail.noValue')}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{t('data-objects.detail.isSourceOfTruthLabel')}</Typography>
            {data.isSourceOfTruth ? (
              <Chip size="small" variant="filled" color="success" label={t('data-objects.list.columns.isSourceOfTruthTrue')} />
            ) : (
              <Chip size="small" variant="outlined" color="default" label={t('data-objects.list.columns.isSourceOfTruthFalse')} />
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{t('data-objects.detail.descriptionLabel')}</Typography>
            <Typography>{data.description ?? t('data-objects.detail.noValue')}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{t('data-objects.detail.commentLabel')}</Typography>
            <Typography>{data.comment ?? t('data-objects.detail.noValue')}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{t('data-objects.detail.tagsLabel')}</Typography>
            {data.tags?.length ? (
              <TagChipList tags={data.tags} deduplicate={true} />
            ) : (
              <Typography variant="body2" color="text.secondary">{t('data-objects.detail.noValue')}</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{t('data-objects.detail.createdAtLabel')}</Typography>
            <Typography>{formatDate(data.createdAt)}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{t('data-objects.detail.updatedAtLabel')}</Typography>
            <Typography>{formatDate(data.updatedAt)}</Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ pt: 2 }}>
          <ApplicationListTable dataObjectId={id!} />
        </Box>
      )}

      {/* Footer actions */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/data-objects')}>
          {t('data-objects.detail.buttonBack')}
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/data-objects/${id}/edit`)}
          disabled={!canWrite}
        >
          {t('data-objects.detail.editButton')}
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => { setDeleteOpen(true); setDeleteError(null); }}
          disabled={!canWrite}
        >
          {t('data-objects.detail.buttonDelete')}
        </Button>
      </Box>

      <ConfirmDialog
        open={deleteOpen}
        title={t('data-objects.delete.confirmTitle')}
        message={deleteError ?? t('data-objects.delete.confirmMessage', { name: data.name })}
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
