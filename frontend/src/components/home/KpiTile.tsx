import { Box, ButtonBase, Paper, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';

interface KpiTileProps {
  label: string;
  value: number | string | null;
  subtext?: string;
  tooltip?: string;
  onClick: () => void;
}

export default function KpiTile({ label, value, subtext, tooltip, onClick }: KpiTileProps): JSX.Element {
  const { t } = useTranslation();
  const renderedValue = value === null ? '—' : value;

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        height: '100%',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: 'secondary.main',
          boxShadow: 2,
        },
      }}
    >
      <ButtonBase
        onClick={onClick}
        sx={{
          width: '100%',
          textAlign: 'left',
          display: 'block',
          p: 2,
          borderRadius: 2,
          cursor: 'pointer',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {tooltip ? (
            <Tooltip title={tooltip}>
              <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary' }}>
                <InfoOutlinedIcon fontSize="small" />
              </Box>
            </Tooltip>
          ) : null}
        </Box>

        <Box sx={{ mt: 1 }}>
          {value === null ? (
            <Tooltip title={t('home.errors.unavailable')}>
              <Typography variant="h4" component="span">
                {renderedValue}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="h4" component="span">
              {renderedValue}
            </Typography>
          )}
        </Box>

        {subtext ? (
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
            {subtext}
          </Typography>
        ) : null}
      </ButtonBase>
    </Paper>
  );
}
