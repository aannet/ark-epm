import { useState, type MouseEvent } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface RowActionsMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
}

export default function RowActionsMenu({
  onView,
  onEdit,
  onDelete,
  viewLabel,
  editLabel,
  deleteLabel,
}: RowActionsMenuProps): JSX.Element | null {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setMenuAnchor(null);
  };

  const hasActions = !!(onView || onEdit || onDelete);
  if (!hasActions) {
    return null;
  }

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <MoreVertIcon />
      </IconButton>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleClose}>
        {onView && (
          <MenuItem
            onClick={() => {
              onView();
              handleClose();
            }}
          >
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            {viewLabel ?? t('common.actions.view')}
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem
            onClick={() => {
              onEdit();
              handleClose();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            {editLabel ?? t('common.actions.edit')}
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem
            onClick={() => {
              onDelete();
              handleClose();
            }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            {deleteLabel ?? t('common.actions.delete')}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
