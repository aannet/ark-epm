import { Box, IconButton, LinearProgress, Paper, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { DataQualitySummary } from '@/types/home';

interface DataQualitySectionProps {
  quality: DataQualitySummary;
  isLoading: boolean;
}

export default function DataQualitySection({
  quality,
  isLoading,
}: DataQualitySectionProps): JSX.Element {
  const { t } = useTranslation();

  let progressColor: 'error' | 'warning' | 'success' = 'success';
  const scoreValue = quality.scorePercent ?? 0;
  if (scoreValue < 50) {
    progressColor = 'error';
  } else if (scoreValue < 80) {
    progressColor = 'warning';
  }

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">{t('home.quality.title')}</Typography>
        <Tooltip title={t('home.quality.tooltip')}>
          <IconButton size="small" aria-label={t('home.quality.title')}>
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {isLoading ? (
        <LoadingSkeleton rows={1} columns={1} />
      ) : quality.totalCount === 0 ? (
        <Typography variant="h4">—</Typography>
      ) : (
        <>
          <LinearProgress variant="determinate" value={scoreValue} color={progressColor} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t('home.quality.score', {
              complete: quality.completeCount,
              total: quality.totalCount,
              percent: scoreValue,
            })}
          </Typography>
        </>
      )}
    </Paper>
  );
}
