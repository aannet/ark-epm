import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import { TagValueResponse } from './DimensionTagInput.types';
import { deduplicateByDepth, getTagColor, groupByDimension } from './DimensionTagInput.utils';

export interface TagChipListProps {
  tags: TagValueResponse[];
  maxVisible?: number;
  deduplicate?: boolean;
  showMoreButton?: boolean;
  size?: 'small' | 'medium';
}

export function TagChipList({
  tags,
  maxVisible = 3,
  deduplicate = true,
  showMoreButton = true,
  size = 'small',
}: TagChipListProps): JSX.Element {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const processedTags = useMemo(() => {
    if (deduplicate) {
      return deduplicateByDepth(tags);
    }
    return tags;
  }, [tags, deduplicate]);

  const visibleTags = useMemo(() => {
    return processedTags.slice(0, maxVisible);
  }, [processedTags, maxVisible]);

  const hasMore = processedTags.length > maxVisible;
  const moreCount = processedTags.length - maxVisible;

  const groupedByDimension = useMemo(() => {
    return groupByDimension(processedTags);
  }, [processedTags]);

  const handleOpenDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  if (!processedTags || processedTags.length === 0) {
    return <Box component="span">—</Box>;
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {visibleTags.map((tag) => (
          <Tooltip
            key={tag.id}
            title={t('tags.tooltip.fullPath', { path: tag.path })}
          >
            <Chip
              label={tag.label}
              size={size}
              sx={{
                backgroundColor: getTagColor(tag),
                color: '#fff',
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
              }}
            />
          </Tooltip>
        ))}
        
        {hasMore && showMoreButton && (
          <Tooltip title={t('tags.drawer.showAll', { count: moreCount })}>
            <IconButton
              size={size}
              onClick={handleOpenDrawer}
              sx={{
                ml: 0.5,
                p: size === 'small' ? 0.25 : 0.5,
                '& .MuiSvgIcon-root': {
                  fontSize: size === 'small' ? '1rem' : '1.25rem',
                },
              }}
            >
              <MoreHorizIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {t('tags.drawer.title')}
          </Typography>
          <IconButton onClick={handleCloseDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2, overflow: 'auto' }}>
          {Array.from(groupedByDimension.entries()).map(([dimensionName, dimensionTags]) => (
            <Box key={dimensionName} sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                {dimensionName}
              </Typography>
              <List dense disablePadding>
                {dimensionTags.map((tag) => (
                  <ListItem
                    key={tag.id}
                    disablePadding
                    sx={{ py: 0.5 }}
                  >
                    <Tooltip title={t('tags.tooltip.fullPath', { path: tag.path })}>
                      <Chip
                        label={tag.label}
                        size="small"
                        sx={{
                          backgroundColor: getTagColor(tag),
                          color: '#fff',
                        }}
                      />
                    </Tooltip>
                    <ListItemText
                      primary={tag.path}
                      sx={{
                        ml: 1,
                        '& .MuiListItemText-primary': {
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Box>
      </Drawer>
    </>
  );
}
