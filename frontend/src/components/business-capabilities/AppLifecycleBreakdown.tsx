import { Box, Typography, Stack, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ApplicationMapping } from '@/types/businessCapability';

interface AppLifecycleBreakdownProps {
  applications: ApplicationMapping[];
}

export default function AppLifecycleBreakdown({ applications }: AppLifecycleBreakdownProps): JSX.Element {
  const { t } = useTranslation();

  // Group applications by lifecycleStatus
  const breakdown = applications.reduce<Record<string, number>>((acc, app) => {
    const status = app.lifecycleStatus || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusOrder = ['Active', 'Planned', 'Sunset', 'Retired', 'UNKNOWN'];
  const sortedStatuses = Object.keys(breakdown).sort(
    (a, b) => statusOrder.indexOf(a) - statusOrder.indexOf(b)
  );

  if (sortedStatuses.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('businessCapabilities.drawer.noApplications')}
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {sortedStatuses.map((status) => (
        <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">
            {t(`applications.lifecycleStatus.${status}`, { defaultValue: status })}
          </Typography>
          <Chip label={breakdown[status]} size="small" variant="outlined" />
        </Box>
      ))}
    </Stack>
  );
}
