import { Box, Chip, Link as MuiLink, Paper, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { ExpiringProvider } from '@/types/home';

interface ProviderExpirySectionProps {
  providers: ExpiringProvider[];
  isLoading: boolean;
}

export default function ProviderExpirySection({
  providers,
  isLoading,
}: ProviderExpirySectionProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">{t('home.todo.contracts.title')}</Typography>
        <Tooltip title={t('home.todo.contracts.tooltip')}>
          <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary' }}>
            <InfoOutlinedIcon fontSize="small" />
          </Box>
        </Tooltip>
      </Box>

      {isLoading ? (
        <LoadingSkeleton rows={3} columns={1} />
      ) : providers.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('home.todo.contracts.empty')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {providers.slice(0, 5).map((provider) => {
            const chipColor: 'error' | 'warning' = provider.daysUntilExpiry <= 30 ? 'error' : 'warning';
            const chipLabelKey =
              provider.daysUntilExpiry <= 30
                ? 'home.todo.contracts.expiresSoon'
                : 'home.todo.contracts.expiresInDays';

            return (
              <Box
                key={provider.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <MuiLink
                  component={RouterLink}
                  to={`/providers/${provider.id}`}
                  underline="hover"
                  sx={{ fontWeight: 600 }}
                >
                  {provider.name}
                </MuiLink>

                <Chip
                  size="small"
                  color={chipColor}
                  label={t(chipLabelKey, { days: provider.daysUntilExpiry })}
                />
              </Box>
            );
          })}

          <Box sx={{ mt: 1 }}>
            <MuiLink component={RouterLink} to="/providers" underline="hover">
              {t('home.todo.contracts.viewAll')}
            </MuiLink>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
