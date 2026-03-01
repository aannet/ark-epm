import { Box, Typography, Button } from '@mui/material';
import Inbox from '@mui/icons-material/Inbox';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
      }}
    >
      <Box sx={{ color: 'text.secondary', mb: 2 }}>
        {icon || <Inbox sx={{ fontSize: 64 }} />}
      </Box>
      <Typography variant="h4" color="text.primary" gutterBottom textAlign="center">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
