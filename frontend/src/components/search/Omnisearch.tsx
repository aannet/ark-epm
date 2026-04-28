import { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  List,
  ListSubheader,
  TextField,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import KeyboardShortcutHint from '@/components/shared/KeyboardShortcutHint';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useOmnisearch } from './useOmnisearch';
import { OmnisearchItem } from './OmnisearchItem';
import { typeToRoute } from '@/utils/search.utils';
import { SearchResultItem, SearchableEntityType } from '@/types/search';

const TYPE_ORDER: SearchableEntityType[] = [
  'application',
  'businessCapability',
  'domain',
  'dataObject',
  'itComponent',
  'provider',
  'interface',
];

interface GroupedResults {
  type: SearchableEntityType;
  items: SearchResultItem[];
}

export function Omnisearch(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    results,
    meta,
    isLoading,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    open,
    setOpen,
  } = useOmnisearch();

  // Focus automatique à chaque ouverture (première et réouvertures)
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const groupedResults = useMemo((): GroupedResults[] => {
    const groups: Record<SearchableEntityType, SearchResultItem[]> = {
      application: [],
      domain: [],
      businessCapability: [],
      provider: [],
      itComponent: [],
      dataObject: [],
      interface: [],
    };

    results.forEach((result) => {
      groups[result.type].push(result);
    });

    return TYPE_ORDER.filter((type) => groups[type].length > 0).map((type) => ({
      type,
      items: groups[type],
    }));
  }, [results]);

  const flatResults = useMemo((): SearchResultItem[] => {
    return groupedResults.flatMap((group) => group.items);
  }, [groupedResults]);

  const navigateToResult = useCallback(
    (result: SearchResultItem) => {
      const baseRoute = typeToRoute[result.type];
      navigate(`${baseRoute}/${result.id}`);
      setOpen(false);
      setQuery('');
    },
    [navigate, setOpen, setQuery],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            navigateToResult(flatResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [open, flatResults, selectedIndex, navigateToResult, setOpen, setSelectedIndex],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [setOpen]);

  const showMinCharsMessage = !isLoading && query.length > 0 && query.length < 2;
  const showEmptyState = !isLoading && query.length >= 2 && results.length === 0;
  const showResults = !isLoading && results.length > 0;

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{ mx: 1 }}
        aria-label={t('search.openButton')}
        size="small"
      >
        <SearchIcon />
        <KeyboardShortcutHint
          shortcut="Ctrl+K"
          macShortcut="⌘K"
          sx={{
            ml: 0.5,
            fontSize: '0.65rem',
            opacity: 0.7,
            display: { xs: 'none', sm: 'inline-flex' },
          }}
        />
      </IconButton>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              mt: 8,
              borderRadius: 2,
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 0 }}>
          <TextField
            fullWidth
            inputRef={inputRef}
            variant="outlined"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: isLoading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>

        <DialogContent sx={{ p: 0, minHeight: 200, maxHeight: 400, overflow: 'auto' }}>
          {showMinCharsMessage && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {t('search.minChars', { count: 2 })}
              </Typography>
            </Box>
          )}

          {isLoading && (
            <Box sx={{ p: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    height: 48,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 0.4 },
                      '50%': { opacity: 0.8 },
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {showEmptyState && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <SearchOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t('search.noResults')}
              </Typography>
              <Typography color="text.secondary">
                {t('search.tryDifferentTerm')}
              </Typography>
            </Box>
          )}

          {showResults && (
            <List sx={{ pt: 0 }}>
              {groupedResults.map((group, groupIndex) => (
                <Box key={group.type}>
                  <ListSubheader
                    sx={{
                      bgcolor: 'transparent',
                      py: 1,
                      px: 2,
                      lineHeight: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {t(`search.types.${group.type}`)}
                    {group.items.length > 5 && ` (${group.items.length})`}
                  </ListSubheader>
                  {group.items.map((result, itemIndex) => {
                    const flatIndex =
                      groupedResults
                        .slice(0, groupIndex)
                        .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;
                    return (
                      <OmnisearchItem
                        key={result.id}
                        result={result}
                        query={query}
                        selected={flatIndex === selectedIndex}
                        onClick={() => navigateToResult(result)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                      />
                    );
                  })}
                  {groupIndex < groupedResults.length - 1 && (
                    <Divider sx={{ my: 1, mx: 2 }} />
                  )}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>

        {(showResults || showEmptyState) && (
          <Box
            sx={{
              p: 1.5,
              px: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {t('search.footerKeyboardHint')}
            </Typography>
            {showResults && meta && (
              <Typography variant="caption" color="text.secondary">
                {t('search.resultCount', { count: results.length, total: meta.total })}
              </Typography>
            )}
          </Box>
        )}
      </Dialog>
    </>
  );
}
