import { Box, Typography, Card } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>{children}</Box>
    </Box>
  );
}

export function ClickableRow({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: 'action.hover' } : {},
        transition: 'background-color 0.15s',
        minWidth: 0,
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      <Box sx={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
        <Box sx={{ mt: 0.25 }}>{children}</Box>
      </Box>
      {onClick && <ArrowForwardIcon color="action" sx={{ fontSize: 20, flexShrink: 0, ml: 1 }} />}
    </Card>
  );
}

export function RelationCard({
  name,
  sublabel,
  onClick,
}: {
  name: string;
  sublabel?: string | null;
  onClick?: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: 'action.hover' } : {},
        transition: 'background-color 0.15s',
        minWidth: 0,
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      <Box sx={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Typography>
        {sublabel && (
          <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{sublabel}</Typography>
        )}
      </Box>
      {onClick && <ArrowForwardIcon color="action" sx={{ fontSize: 20, flexShrink: 0, ml: 1 }} />}
    </Card>
  );
}
