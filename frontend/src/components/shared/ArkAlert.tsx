import { useEffect } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

export interface ArkAlertProps {
  severity: 'success' | 'error' | 'warning' | 'info';
  message: string;
  open: boolean;
  onClose: () => void;
  autoDismiss?: number;
  title?: string;
}

export default function ArkAlert({
  severity,
  message,
  open,
  onClose,
  autoDismiss,
  title,
}: ArkAlertProps): JSX.Element {
  useEffect(() => {
    if (open && autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [open, autoDismiss, onClose]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoDismiss ?? null}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{ width: '100%' }}
        variant="filled"
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
}
