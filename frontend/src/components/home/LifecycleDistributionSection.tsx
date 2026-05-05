import { Box, LinearProgress, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { LifecycleDistribution } from '@/types/home';

interface LifecycleDistributionSectionProps {
  distribution: LifecycleDistribution;
  isLoading: boolean;
}

type LifecycleStatus = keyof Omit<LifecycleDistribution, 'total'>;

const LIFECYCLE_ORDER: LifecycleStatus[] = [
  'draft',
  'in_progress',
  'production',
  'deprecated',
  'retired',
];

export default function LifecycleDistributionSection({
  distribution,
  isLoading,
}: LifecycleDistributionSectionProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('home.lifecycle.title')}
      </Typography>

      {isLoading ? (
        <LoadingSkeleton rows={5} columns={1} />
      ) : (
        <>
          {distribution.total === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('home.lifecycle.empty')}
            </Typography>
          ) : null}

          {LIFECYCLE_ORDER.map((status) => {
            const count = distribution[status];
            const percent =
              distribution.total > 0 ? Math.round((count / distribution.total) * 100) : 0;

            return (
              <Box key={status} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{t(`home.lifecycle.statuses.${status}`)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`${count} ${t('home.lifecycle.appsLabel')} (${percent}%)`}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={percent} color="primary" />
              </Box>
            );
          })}
        </>
      )}
    </Paper>
  );
}
