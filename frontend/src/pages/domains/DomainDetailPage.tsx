import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Stack, Paper, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import { useDomain } from '@/api/domains';
import { hasPermission } from '@/store/auth';

export default function DomainDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('domains:write');

  const { data: domain, isLoading, error } = useDomain(id || '');

  useEffect(() => {
    if (error && (error as any)?.response?.status === 404) {
      navigate('/domains');
    }
  }, [error, navigate]);

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
            <Typography variant="body2" color="text.secondary">
              {domain.description || t('domains.detail.noDescription')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('domains.list.columns.createdAt')}:{' '}
              {new Date(domain.createdAt).toLocaleDateString('fr-FR')}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </PageContainer>
  );
}
