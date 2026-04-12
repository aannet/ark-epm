import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack, Paper, Typography, Box, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ArkAlert from '@/components/shared/ArkAlert';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { TagChipList } from '@/components/tags';
import { useDomain } from '@/api/domains';
import { hasPermission } from '@/store/auth';

interface AlertState {
  severity: 'success' | 'error';
  message: string;
}

export default function DomainDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('domains:write');

  const { data: domain, isLoading, error } = useDomain(id || '');
  const [alert, setAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    if (error && (error as any)?.response?.status === 404) {
      navigate('/domains');
    }
  }, [error, navigate]);

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton rows={3} columns={2} />
      </PageContainer>
    );
  }

  if (!domain) {
    return (
      <PageContainer>
        <EmptyState
          title={t('errors.notFound.title')}
          description={t('errors.notFound.description')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ArkAlert
        open={!!alert}
        severity={alert?.severity ?? 'success'}
        message={alert?.message ?? ''}
        autoDismiss={5000}
        onClose={() => setAlert(null)}
      />

      <AppBreadcrumbs
        items={[
          { label: t('domains.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('domains.detail.breadcrumb.list'), onClick: () => navigate('/domains') },
          { label: domain.name },
        ]}
      />

      <PageHeader
        title={domain.name}
        action={
          canWrite
            ? {
                label: t('domains.detail.editButton'),
                onClick: () => navigate(`/domains/${id}/edit`),
                icon: <EditIcon />,
              }
            : undefined
        }
      />

      <Paper
        elevation={0}
        sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Stack spacing={2}>
            
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('domains.list.columns.description')}
              </Typography>
              <Typography variant="body2">
                {domain.description || t('domains.detail.noDescription')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('domains.list.columns.comment')}
              </Typography>
              <Typography variant="body2">
                {domain.comment || t('domains.detail.noComment')}
              </Typography>
            </Box>

            <Divider />

            {domain.tags && domain.tags.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('domains.list.columns.tags')}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <TagChipList
                    tags={domain.tags}
                    maxVisible={999}
                    deduplicate={true}
                    showMoreButton={false}
                    size="small"
                  />
                </Box>
              </Box>
            )}

            <Divider />

            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('domains.list.columns.createdAt')}
                </Typography>
                <Typography variant="body2">
                  {new Date(domain.createdAt).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
              
              {domain.updatedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('domains.list.columns.updatedAt')}
                  </Typography>
                  <Typography variant="body2">
                    {new Date(domain.updatedAt).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        </Paper>
    </PageContainer>
  );
}
