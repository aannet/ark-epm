import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Tabs,
  Tab,
  Avatar,
  Stack,
  Card,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import StatusChip from '@/components/shared/StatusChip';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { TagChipList } from '@/components/tags';
import { LifecycleStepper } from '@/components/shared/LifecycleStepper';
import { useApplication } from '@/api/applications';
import { hasPermission } from '@/store/auth';

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>{children}</Box>
    </Box>
  );
}

function ClickableRow({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: 'action.hover' } : {},
        transition: 'background-color 0.15s',
        minWidth: 0,
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      <Box sx={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
        <Box sx={{ mt: 0.25 }}>{children}</Box>
      </Box>
      {onClick && <ArrowForwardIcon color="action" sx={{ fontSize: 20, flexShrink: 0, ml: 1 }} />}
    </Card>
  );
}

function RelationCard({
  name,
  sublabel,
  onClick,
}: {
  name: string;
  sublabel?: string | null;
  onClick?: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: 'action.hover' } : {},
        transition: 'background-color 0.15s',
        minWidth: 0,
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      <Box sx={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Typography>
        {sublabel && (
          <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{sublabel}</Typography>
        )}
      </Box>
      {onClick && <ArrowForwardIcon color="action" sx={{ fontSize: 20, flexShrink: 0, ml: 1 }} />}
    </Card>
  );
}

export default function ApplicationDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canWrite = hasPermission('applications:write');
  const [activeTab, setActiveTab] = useState(0);

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
    <PageContainer maxWidth="xl">
      <AppBreadcrumbs
        items={[
          { label: t('applications.detail.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('applications.detail.breadcrumb.list'), onClick: () => navigate('/applications') },
          { label: application.name },
        ]}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Avatar sx={{ bgcolor: 'primary.dark', width: 48, height: 48, fontSize: '1.25rem' }}>
          {application.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" component="h1">{application.name}</Typography>
          {application.domain && (
            <Typography variant="body2" color="text.secondary">
              {application.domain.name}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
          {application.criticality && (
            <StatusChip type="criticality" value={application.criticality as any} />
          )}
          {application.lifecycleStatus && (
            <StatusChip type="lifecycle" value={application.lifecycleStatus as any} />
          )}
        </Stack>
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/applications/${id}/edit`)}
          >
            {t('applications.detail.editButton')}
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label={t('applications.detail.tabs.general')} />
          <Tab label={t('applications.detail.tabs.interfaces')} />
          <Tab label={t('applications.detail.tabs.assessment')} />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Box sx={{ flex: '2 1 400px', minWidth: 0 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.general')}
                  </Typography>
                  <DetailRow label={t('applications.list.columns.description')}>
                    <Typography variant="body1">
                      {application.description || t('applications.detail.noDescription')}
                    </Typography>
                  </DetailRow>
                  <DetailRow label={t('applications.detail.owner')}>
                    <Typography variant="body1">
                      {application.owner
                        ? `${application.owner.firstName} ${application.owner.lastName}`
                        : t('applications.detail.noValue')}
                    </Typography>
                  </DetailRow>
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('applications.detail.criticality')}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {application.criticality ? (
                          <StatusChip type="criticality" value={application.criticality as any} />
                        ) : (
                          <Typography variant="body1">{t('applications.detail.noValue')}</Typography>
                        )}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('applications.detail.phaseActuelle')}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {application.lifecycleStatus ? (
                          <StatusChip type="lifecycle" value={application.lifecycleStatus as any} />
                        ) : (
                          <Typography variant="body1">{t('applications.detail.noValue')}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.relations')}
                  </Typography>
                  <Stack spacing={2}>
                    <ClickableRow
                      label={t('applications.list.columns.domain')}
                      onClick={application.domain ? () => navigate(`/domains/${application.domain!.id}`) : undefined}
                    >
                      <Typography variant="body1">
                        {application.domain ? application.domain.name : t('applications.detail.noValue')}
                      </Typography>
                    </ClickableRow>

                    {application.businessCapabilities && application.businessCapabilities.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                          {t('applications.relations.businessCapabilities')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {application.businessCapabilities.map((bc) => (
                            <Chip
                              key={bc.id}
                              label={bc.name}
                              size="small"
                              onClick={() => navigate(`/business-capabilities/${bc.id}`)}
                              sx={{ cursor: 'pointer', maxWidth: '100%' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {application.providers && application.providers.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                          {t('applications.form.providersLabel')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          {application.providers.map((provider) => (
                            <Box key={provider.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 6px)' } }}>
                              <RelationCard
                                name={provider.name}
                                sublabel={provider.role ? t(`applications.roles.${provider.role}`) ?? provider.role : null}
                                onClick={() => navigate(`/providers/${provider.id}`)}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {application.itComponents && application.itComponents.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                          {t('applications.form.itComponentsLabel')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          {application.itComponents.map((itc) => (
                            <Box key={itc.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 6px)' } }}>
                              <RelationCard
                                name={itc.name}
                                onClick={() => navigate(`/it-components/${itc.id}`)}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
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
                    <Typography variant="body1" color="text.secondary">—</Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('applications.detail.section.metadata')}
                  </Typography>
                  <DetailRow label={t('applications.detail.comment')}>
                    <Typography variant="body1">
                      {application.comment || t('applications.detail.noComment')}
                    </Typography>
                  </DetailRow>
                  <DetailRow label={t('applications.list.columns.createdAt')}>
                    <Typography variant="body1">
                      {new Date(application.createdAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  </DetailRow>
                  <DetailRow label={t('applications.detail.updatedAt')}>
                    <Typography variant="body1">
                      {new Date(application.updatedAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  </DetailRow>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {t('common.comingSoon')}
            </Typography>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ p: 4 }}>
            {application.lifecycleStatus ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {t('applications.lifecycle.sectionTitle')}
                </Typography>
                <LifecycleStepper
                  currentPhase={application.lifecycleStatus}
                  editable={false}
                />
              </>
            ) : (
              <Typography variant="body1" color="text.secondary">
                {t('applications.lifecycle.notDefined')}
              </Typography>
            )}
          </Box>
        )}
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
