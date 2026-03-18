import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Link,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import StatusChip from '@/components/shared/StatusChip';
import { TagChipList } from '@/components/tags';
import { useApplication } from '@/api/applications';
import { hasPermission } from '@/store/auth';

export default function ApplicationDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canWrite = hasPermission('applications:write');

  const { data: application, isLoading, error } = useApplication(id || '', {
    enabled: !!id,
  });

  useEffect(() => {
    if (error && (error as any)?.response?.status === 404) {
      navigate('/applications');
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={t('applications.list.title')} />
        <LoadingSkeleton rows={8} columns={2} />
      </PageContainer>
    );
  }

  if (!application) {
    return (
      <PageContainer>
        <PageHeader title={t('applications.list.title')} />
        <Typography>{t('applications.alert.errors.notFound')}</Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title={application.name}
        action={
          canWrite
            ? {
                label: t('applications.detail.editButton'),
                onClick: () => navigate(`/applications/${id}/edit`),
                icon: <EditIcon />,
              }
            : undefined
        }
      />

      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
        {/* Section Informations générales */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {t('applications.detail.section.general')}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.list.columns.name')}
              </Typography>
              <Typography variant="body1">{application.name}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.detail.criticality')}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {application.criticality ? (
                  <StatusChip type="criticality" value={application.criticality as any} />
                ) : (
                  <Typography variant="body1">{t('applications.detail.noValue')}</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.list.columns.description')}
              </Typography>
              <Typography variant="body1">
                {application.description || t('applications.detail.noDescription')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.list.columns.lifecycleStatus')}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {application.lifecycleStatus ? (
                  <StatusChip type="lifecycle" value={application.lifecycleStatus as any} />
                ) : (
                  <Typography variant="body1">{t('applications.detail.noValue')}</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.detail.comment')}
              </Typography>
              <Typography variant="body1">
                {application.comment || t('applications.detail.noComment')}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section Relations */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {t('applications.detail.section.relations')}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.list.columns.domain')}
              </Typography>
              {application.domain ? (
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => navigate(`/domains/${application.domain!.id}`)}
                  sx={{ textDecoration: 'underline' }}
                >
                  {application.domain.name}
                </Link>
              ) : (
                <Typography variant="body1">{t('applications.detail.noValue')}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.list.columns.provider')}
              </Typography>
              {application.provider ? (
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => navigate(`/providers/${application.provider!.id}`)}
                  sx={{ textDecoration: 'underline' }}
                >
                  {application.provider.name}
                </Link>
              ) : (
                <Typography variant="body1">{t('applications.detail.noValue')}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.detail.owner')}
              </Typography>
              <Typography variant="body1">
                {application.owner
                  ? `${application.owner.firstName} ${application.owner.lastName}`
                  : t('applications.detail.noValue')}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section Tags */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {t('applications.detail.section.tags')}
          </Typography>
          {application.tags && application.tags.length > 0 ? (
            <TagChipList
              tags={application.tags}
              deduplicate={true}
              showMoreButton={false}
              size="small"
            />
          ) : (
            <Typography variant="body1" color="text.secondary">
              —
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section Métadonnées */}
        <Box>
          <Typography variant="h6" gutterBottom>
            {t('applications.detail.section.metadata')}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.list.columns.createdAt')}
              </Typography>
              <Typography variant="body1">
                {new Date(application.createdAt).toLocaleDateString('fr-FR')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {t('applications.detail.updatedAt')}
              </Typography>
              <Typography variant="body1">
                {new Date(application.updatedAt).toLocaleDateString('fr-FR')}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/applications')}
        >
          {t('applications.detail.backButton')}
        </Button>
      </Box>
    </PageContainer>
  );
}
