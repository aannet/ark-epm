import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layout';
import { EmptyState, LoadingSkeleton, PageHeader } from '@/components/shared';
import { useHomeSummary } from '@/api/home';
import { hasPermission } from '@/store/auth';
import WelcomeBanner from '@/components/home/WelcomeBanner';
import KpiTile from '@/components/home/KpiTile';
import IncompleteAppsSection from '@/components/home/IncompleteAppsSection';
import ProviderExpirySection from '@/components/home/ProviderExpirySection';
import LifecycleDistributionSection from '@/components/home/LifecycleDistributionSection';
import DataQualitySection from '@/components/home/DataQualitySection';
import { DataQualitySummary, LifecycleDistribution } from '@/types/home';

const DEFAULT_LIFECYCLE_DISTRIBUTION: LifecycleDistribution = {
  draft: 0,
  in_progress: 0,
  production: 0,
  deprecated: 0,
  retired: 0,
  total: 0,
};

const DEFAULT_DATA_QUALITY: DataQualitySummary = {
  completeCount: 0,
  totalCount: 0,
  scorePercent: null,
};

export default function HomePage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: summary, isLoading, error } = useHomeSummary();

  const canReadApplications = hasPermission('applications:read');
  const canReadProviders = hasPermission('providers:read');
  const canCreateApplication = hasPermission('applications:write');

  if (error) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title={t('home.page.title')} />
        <EmptyState
          title={t('errors.unexpected.title')}
          description={t('errors.unexpected.description')}
        />
      </PageContainer>
    );
  }

  const kpis = summary?.kpis;
  const missionCriticalValue =
    kpis?.missionCriticalPercent === null || kpis?.missionCriticalPercent === undefined
      ? null
      : `${Math.round(kpis.missionCriticalPercent)}%`;

  const isGlobalEmpty = summary?.kpis?.appsCount === 0;

  const showIncompleteSection = canReadApplications && (isLoading || summary?.incompleteApps !== null);
  const showContractsSection = canReadProviders && (isLoading || summary?.expiringProviders !== null);
  const showLifecycleSection = isLoading || summary?.lifecycleDistribution !== null;
  const showQualitySection = isLoading || summary?.dataQuality !== null;

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title={t('home.page.title')} />

      <WelcomeBanner />

      <Box sx={{ mb: 3 }}>
        {isLoading ? (
          <LoadingSkeleton rows={1} columns={4} />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <KpiTile
              label={t('home.kpis.apps.label')}
              value={kpis?.appsCount ?? null}
              onClick={() => navigate('/applications')}
            />
            <KpiTile
              label={t('home.kpis.missionCritical.label')}
              value={missionCriticalValue}
              subtext={t('home.kpis.missionCritical.subtext', {
                count: kpis?.missionCriticalDenominator ?? 0,
              })}
              onClick={() => navigate('/applications')}
            />
            <KpiTile
              label={t('home.kpis.interfaces.label')}
              value={kpis?.interfacesCount ?? null}
              onClick={() => navigate('/interfaces')}
            />
            <KpiTile
              label={t('home.kpis.coveredCapabilities.label')}
              value={kpis?.coveredCapabilitiesCount ?? null}
              onClick={() => navigate('/business-capabilities')}
            />
          </Box>
        )}
      </Box>

      {isGlobalEmpty ? (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
          <EmptyState
            title={t('home.empty.title')}
            description={t('home.empty.description')}
          />

          {canCreateApplication ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              {canCreateApplication ? (
                <Button variant="contained" onClick={() => navigate('/applications/new')}>
                  {t('home.empty.ctaCreate')}
                </Button>
              ) : null}
            </Box>
          ) : null}
        </Box>
      ) : (
        <>
          {(showIncompleteSection || showContractsSection) && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
                mb: 3,
              }}
            >
              {showIncompleteSection ? (
                <IncompleteAppsSection apps={summary?.incompleteApps ?? []} isLoading={isLoading} />
              ) : null}

              {showContractsSection ? (
                <ProviderExpirySection
                  providers={summary?.expiringProviders ?? []}
                  isLoading={isLoading}
                />
              ) : null}
            </Box>
          )}

          {(showLifecycleSection || showQualitySection) && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                gap: 2,
              }}
            >
              {showLifecycleSection ? (
                <LifecycleDistributionSection
                  distribution={summary?.lifecycleDistribution ?? DEFAULT_LIFECYCLE_DISTRIBUTION}
                  isLoading={isLoading}
                />
              ) : null}

              {showQualitySection ? (
                <DataQualitySection quality={summary?.dataQuality ?? DEFAULT_DATA_QUALITY} isLoading={isLoading} />
              ) : null}
            </Box>
          )}
        </>
      )}

      {!showIncompleteSection && !showContractsSection && !isGlobalEmpty && !isLoading ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('home.todo.noVisibleSections')}
        </Typography>
      ) : null}
    </PageContainer>
  );
}
