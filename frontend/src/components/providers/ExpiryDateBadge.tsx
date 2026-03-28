import { Box, Chip, Typography } from '@mui/material';

interface ExpiryDateBadgeProps {
  date: string | null | undefined;
}

export default function ExpiryDateBadge({ date }: ExpiryDateBadgeProps): JSX.Element {
  if (!date) {
    return <Typography variant="body2" color="text.secondary">—</Typography>;
  }

  const expiryDate = new Date(date);
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  const formattedDate = expiryDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (daysUntilExpiry < 0) {
    // Expired
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography variant="body2">{formattedDate}</Typography>
        <Chip label="EXPIRÉ" color="error" size="small" variant="outlined" />
      </Box>
    );
  }

  if (daysUntilExpiry < 30) {
    // URGENT
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography variant="body2">{formattedDate}</Typography>
        <Chip label="URGENT" color="error" size="small" variant="filled" />
      </Box>
    );
  }

  if (daysUntilExpiry < 90) {
    // ALERTE
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography variant="body2">{formattedDate}</Typography>
        <Chip label="ALERTE" color="warning" size="small" variant="filled" />
      </Box>
    );
  }

  // Normal
  return <Typography variant="body2">{formattedDate}</Typography>;
}
