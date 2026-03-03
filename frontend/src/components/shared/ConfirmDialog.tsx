import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'error' | 'warning';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  severity = 'error',
  isLoading = false,
}: ConfirmDialogProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" disabled={isLoading}>
          {cancelLabel || t('common.confirmDialog.cancelLabel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={severity}
          disabled={isLoading}
        >
          {confirmLabel || t('common.confirmDialog.confirmLabel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
