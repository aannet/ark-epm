import { Fragment } from 'react';
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                  flexWrap: { xs: 'wrap', md: 'nowrap' },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <MuiLink
                    component={RouterLink}
                    to={`/applications/${app.id}`}
                    underline="hover"
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'primary.main',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {app.name}
                  </MuiLink>

                  {app.businessCapability ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden', minWidth: 0 }}>
                      {app.businessCapability.ancestors.map((ancestor) => (
                        <Fragment key={ancestor.id}>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.disabled', whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            {ancestor.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.disabled', mx: 0.4, opacity: 0.6, flexShrink: 0 }}
                          >
                            {'>'}
                          </Typography>
                        </Fragment>
                      ))}

                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {app.businessCapability.name}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                      {t('home.todo.incomplete.noBusinessCapability')}
                    </Typography>
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    flexShrink: 0,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  }}
                >
                  {app.missingFields.map((field) => (
                    <Chip
                      key={field}
                      label={t(MISSING_FIELD_LABELS[field])}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: 10,
                        height: 20,
                        color: 'text.disabled',
                        borderStyle: 'dashed',
                        borderColor: 'divider',
                        borderRadius: '3px',
                        '& .MuiChip-label': { px: '6px' },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
