import { Typography, SxProps, Theme } from '@mui/material';

interface KeyboardShortcutHintProps {
  shortcut: string;
  macShortcut?: string;
  sx?: SxProps<Theme>;
}

export function KeyboardShortcutHint({
  shortcut,
  macShortcut,
  sx,
}: KeyboardShortcutHintProps): JSX.Element {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const displayShortcut = isMac && macShortcut ? macShortcut : shortcut;

  return (
    <Typography
      component="kbd"
      variant="caption"
      sx={{
        px: 0.5,
        py: 0.25,
        borderRadius: 0.5,
        bgcolor: 'action.selected',
        color: 'text.secondary',
        fontFamily: 'inherit',
        fontSize: '0.75rem',
        fontWeight: 500,
        border: '1px solid',
        borderColor: 'divider',
        ...sx,
      }}
    >
      {displayShortcut}
    </Typography>
  );
}

export default KeyboardShortcutHint;
