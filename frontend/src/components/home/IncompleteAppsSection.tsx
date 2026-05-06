import { Box, Chip, Link as MuiLink, Paper, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { IncompleteApp } from '@/types/home';

interface IncompleteAppsSectionProps {
  apps: IncompleteApp[];
  isLoading: boolean;
}

const MISSING_FIELD_LABELS: Record<IncompleteApp['missingFields'][number], string> = {
  owner: 'home.todo.incomplete.missingOwner',
  criticality: 'home.todo.incomplete.missingCriticality',
  lifecycle: 'home.todo.incomplete.missingLifecycle',
};

export default function IncompleteAppsSection({
  apps,
  isLoading,
}: IncompleteAppsSectionProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">{t('home.todo.incomplete.title')}</Typography>
        <Tooltip title={t('home.todo.incomplete.tooltip')}>
          <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary' }}>
            <InfoOutlinedIcon fontSize="small" />
          </Box>
        </Tooltip>
      </Box>

      {isLoading ? (
        <LoadingSkeleton rows={3} columns={1} />
      ) : apps.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('home.todo.incomplete.empty')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {apps.slice(0, 5).map((app) => (
            <Box
              key={app.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
              }}
            >
              <MuiLink
                component={RouterLink}
                to={`/applications/${app.id}`}
                underline="hover"
                sx={{ fontWeight: 600 }}
              >
                {app.name}
              </MuiLink>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {app.missingFields.map((field) => (
                  <Chip key={field} size="small" color="warning" label={t(MISSING_FIELD_LABELS[field])} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
