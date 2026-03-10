import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Stack, Paper, Typography, Chip, Box, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ArkAlert from '@/components/shared/ArkAlert';
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

      <Stack spacing={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/domains')}
          >
            {t('domains.detail.backButton')}
          </Button>
          {canWrite && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/domains/${id}/edit`)}
            >
              {t('domains.detail.editButton')}
            </Button>
          )}
        </Stack>

        <Paper
          elevation={0}
          sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Stack spacing={2}>
            <Typography variant="h5">{domain.name}</Typography>
            
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
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {domain.tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.label}
                      size="small"
                      sx={{
                        backgroundColor: tag.dimensionName === 'Geography' ? '#2196F3' : 
                                        tag.dimensionName === 'Brand' ? '#9C27B0' : '#FF9800',
                        color: '#fff',
                      }}
                      title={tag.path}
                    />
                  ))}
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
      </Stack>
    </PageContainer>
  );
}
