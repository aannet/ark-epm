import { Box, Paper, Typography } from '@mui/material';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  unit?: string;
}

/**
 * Carte KPI réutilisable — affiche une métrique clé avec label, valeur et icône optionnelle.
 * Largeur : 1/3 via Grid parent (xs=12, sm=4).
 */
export default function KpiCard({ label, value, icon, unit }: KpiCardProps): JSX.Element {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: '100%',
      }}
    >
      {icon && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: 'primary.50',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography variant="h4" component="span" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {value}
          </Typography>
          {unit && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {unit}
            </Typography>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}
