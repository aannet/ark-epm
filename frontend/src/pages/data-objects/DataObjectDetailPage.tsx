import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Tabs, Tab, Button, Chip, Paper, Avatar, Stack,
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
import ApplicationListTable from '@/components/data-objects/ApplicationListTable';
import { DetailRow } from '@/components/shared/DetailComponents';
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

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('data-objects.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('data-objects.detail.breadcrumb.list'), onClick: () => navigate('/data-objects') },
          { label: '...' },
        ]} />
        <LoadingSkeleton rows={5} columns={2} />
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer maxWidth="xl">
        <AppBreadcrumbs items={[
          { label: t('data-objects.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('data-objects.detail.breadcrumb.list'), onClick: () => navigate('/data-objects') },
          { label: '...' },
        ]} />
        <EmptyState title={t('data-objects.alert.errors.notFound')} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <ArkAlert open={!!alert} severity={alert?.severity ?? 'success'} message={alert?.message ?? ''} autoDismiss={5000} onClose={() => setAlert(null)} />

      <AppBreadcrumbs items={[
        { label: t('data-objects.detail.breadcrumb.home'), onClick: () => navigate('/') },
        { label: t('data-objects.detail.breadcrumb.list'), onClick: () => navigate('/data-objects') },
        { label: data.name },
      ]} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Avatar sx={{ bgcolor: 'success.dark', width: 48, height: 48, fontSize: '1.25rem' }}>
          {data.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" component="h1">{data.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {data.type ?? t('data-objects.detail.noValue')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
          {data.isSourceOfTruth ? (
            <Chip size="small" color="success" label={t('data-objects.list.columns.isSourceOfTruthTrue')} />
          ) : (
            <Chip size="small" variant="outlined" label={t('data-objects.list.columns.isSourceOfTruthFalse')} />
          )}
        </Stack>
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/data-objects/${id}/edit`)}
          >
            {t('data-objects.detail.editButton')}
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={t('data-objects.detail.tabInfo')} />
          <Tab label={`${t('data-objects.detail.tabApplications')} (${data._count?.appDataObjectMaps ?? 0})`} />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Box sx={{ flex: '2 1 400px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.general')}
                  </Typography>
                  <DetailRow label={t('data-objects.detail.typeLabel')}>
                    <Typography variant="body1">{data.type ?? t('data-objects.detail.noValue')}</Typography>
                  </DetailRow>
                  <DetailRow label={t('data-objects.detail.isSourceOfTruthLabel')}>
                    {data.isSourceOfTruth ? (
                      <Chip size="small" color="success" label={t('data-objects.list.columns.isSourceOfTruthTrue')} />
                    ) : (
                      <Chip size="small" variant="outlined" label={t('data-objects.list.columns.isSourceOfTruthFalse')} />
                    )}
                  </DetailRow>
                  <DetailRow label={t('data-objects.detail.descriptionLabel')}>
                    <Typography variant="body1">{data.description ?? t('data-objects.detail.noValue')}</Typography>
                  </DetailRow>
                  <DetailRow label={t('data-objects.detail.commentLabel')}>
                    <Typography variant="body1">{data.comment ?? t('data-objects.detail.noValue')}</Typography>
                  </DetailRow>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.tags')}
                  </Typography>
                  {data.tags?.length ? (
                    <TagChipList tags={data.tags} deduplicate={true} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">{t('data-objects.detail.noValue')}</Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.metadata')}
                  </Typography>
                  <DetailRow label={t('data-objects.detail.createdAtLabel')}>
                    <Typography variant="body1">{formatDate(data.createdAt)}</Typography>
                  </DetailRow>
                  <DetailRow label={t('data-objects.detail.updatedAtLabel')}>
                    <Typography variant="body1">{formatDate(data.updatedAt)}</Typography>
                  </DetailRow>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            <ApplicationListTable dataObjectId={id!} />
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'space-between' }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/data-objects')}>
          {t('data-objects.detail.buttonBack')}
        </Button>
        {canWrite && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => { setDeleteOpen(true); setDeleteError(null); }}
          >
            {t('data-objects.detail.buttonDelete')}
          </Button>
        )}
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
