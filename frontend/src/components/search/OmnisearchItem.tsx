import { ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { SearchResultItem } from '@/types/search';
import { highlightMatch, truncate, getTypeIcon } from '@/utils/search.utils';

interface OmnisearchItemProps {
  result: SearchResultItem;
  query: string;
  selected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export function OmnisearchItem({
  result,
  query,
  selected,
  onClick,
  onMouseEnter,
}: OmnisearchItemProps): JSX.Element {
  const IconComponent = getTypeIcon(result.type);

  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      sx={{
        py: 1,
        px: 2,
        borderRadius: 1,
        mx: 1,
        my: 0.5,
        '&.Mui-selected': {
          bgcolor: 'action.selected',
        },
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
        <IconComponent fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="body2" fontWeight={600} component="span">
            {highlightMatch(result.name, query)}
          </Typography>
        }
        secondary={
          result.description ? (
            <Typography
              variant="caption"
              color="text.secondary"
              component="span"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {truncate(result.description, 60)}
            </Typography>
          ) : null
        }
      />
    </ListItemButton>
  );
}
