import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TableSortLabel,
  Link as MuiLink,
  TextField,
  InputAdornment,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  Chip,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GridViewIcon from '@mui/icons-material/GridView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import BusinessCapabilityDrawer from '@/components/business-capabilities/BusinessCapabilityDrawer';
import BusinessCapabilityTree from '@/components/business-capabilities/BusinessCapabilityTree';
import BusinessCapabilityMatrix from '@/components/business-capabilities/BusinessCapabilityMatrix';
import CriticalityChip from '@/components/business-capabilities/CriticalityChip';
import { useBusinessCapabilitiesTree, useDeleteBusinessCapability } from '@/api/businessCapabilities';
import { useDomains } from '@/api/domains';
import { hasPermission } from '@/store/auth';
import { ViewMode } from '@/types/businessCapability';
import { flattenTree, getRootNodeIds } from '@/utils/businessCapability.utils';

type SortField = 'name' | 'level' | 'criticality';
type SortOrder = 'asc' | 'desc';

interface AlertState {
  severity: 'success' | 'error';
  message: string;
}

export default function BusinessCapabilitiesPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canWrite = hasPermission('business-capabilities:write');

  // View mode from URL
  const getViewFromUrl = (): ViewMode => {
    const view = searchParams.get('view') as ViewMode;
    return ['list', 'tree', 'matrix'].includes(view) ? view : 'list';
  };

  const [view, setView] = useState<ViewMode>(getViewFromUrl());
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [domainFilter, setDomainFilter] = useState<string | null>(searchParams.get('domainId') || null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Fetch tree data
  const { data: treeData, isLoading, error } = useBusinessCapabilitiesTree({
    search: searchValue || undefined,
    domainId: domainFilter || undefined,
  });

  // Fetch domains for filter
  const { data: domainsData } = useDomains({ limit: 100 });
  const domains = domainsData?.data || [];

  const deleteCapability = useDeleteBusinessCapability();

  // Flatten tree for list view
  const flatList = useMemo(() => {
    if (!treeData) return [];
    return flattenTree(treeData);
  }, [treeData]);

  // Initialize expanded state with root nodes
  useEffect(() => {
    if (treeData && expanded.size === 0) {
      const rootIds = getRootNodeIds(treeData);
      setExpanded(new Set(rootIds));
    }
  }, [treeData]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== 'list') params.set('view', view);
    if (searchValue) params.set('search', searchValue);
    if (domainFilter) params.set('domainId', domainFilter);
    setSearchParams(params, { replace: true });
  }, [view, searchValue, domainFilter, setSearchParams]);

  // Handle view change
  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, newView: ViewMode | null) => {
    if (newView) {
      setView(newView);
    }
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle search
  const handleSearchSubmit = () => {
    setSearchValue(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  // Handle expand/collapse
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter visible rows based on expanded state
  const getVisibleRows = () => {
    if (!flatList.length) return [];

    // Sort
    const sorted = [...flatList].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'level':
          comparison = a.level - b.level;
          break;
        case 'criticality':
          const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
          const aIndex = a.criticality ? order.indexOf(a.criticality) : -1;
          const bIndex = b.criticality ? order.indexOf(b.criticality) : -1;
          comparison = aIndex - bIndex;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // For hierarchical view, we need to filter based on expanded state
    // This requires knowing the parent chain
    return sorted.filter((row) => {
      if (row.level === 0) return true;

      // Find if all ancestors are expanded
      // Since we're working with a flat list, we need to check parentId chain
      // For simplicity, show all rows in sorted order (the expand/collapse is visual only with indentation)
      return true;
    });
  };

  // Handle delete
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteDialog({ id, name });
    setDeleteErrorMessage(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;
    try {
      await deleteCapability.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
      setAlert({ severity: 'success', message: t('businessCapabilities.snackbar.deleted') });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 409 && code === 'DEPENDENCY_CONFLICT') {
        const childrenCount = err?.response?.data?.details?.childrenCount ?? 0;
        const applicationsCount = err?.response?.data?.details?.applicationsCount ?? 0;
        setDeleteErrorMessage(
          t('businessCapabilities.delete.blockedMessage', { childrenCount, applicationsCount })
        );
      } else {
        setAlert({ severity: 'error', message: t('common.snackbar.error') });
        setDeleteDialog(null);
      }
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchInput('');
    setSearchValue('');
    setDomainFilter(null);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={t('businessCapabilities.list.title')} />
        <LoadingSkeleton rows={5} columns={canWrite ? 6 : 5} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title={t('businessCapabilities.list.title')} />
        <EmptyState
          title={t('errors.unexpected.title')}
          description={t('errors.unexpected.description')}
        />
      </PageContainer>
    );
  }

  const visibleRows = getVisibleRows();
  const isEmpty = !treeData || treeData.length === 0;

  return (
    <PageContainer>
      <PageHeader
        title={t('businessCapabilities.list.title')}
        subtitle={t('businessCapabilities.list.subtitle')}
        action={
          canWrite
            ? {
                label: t('businessCapabilities.list.addButton'),
                onClick: () => navigate('/business-capabilities/new'),
                icon: <AddIcon />,
              }
            : undefined
        }
        secondaryAction={
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="list" aria-label={t('businessCapabilities.views.list')}>
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="tree" aria-label={t('businessCapabilities.views.tree')}>
              <AccountTreeIcon />
            </ToggleButton>
            <ToggleButton value="matrix" aria-label={t('businessCapabilities.views.matrix')}>
              <GridViewIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      <ArkAlert
        open={!!alert}
        severity={alert?.severity ?? 'success'}
        message={alert?.message ?? ''}
        autoDismiss={5000}
        onClose={() => setAlert(null)}
      />

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder={t('businessCapabilities.list.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Autocomplete
          options={domains}
          getOptionLabel={(option) => option.name}
          value={domains.find((d) => d.id === domainFilter) || null}
          onChange={(_e, newValue) => setDomainFilter(newValue?.id || null)}
          size="small"
          sx={{ minWidth: 200 }}
          renderInput={(params) => (
            <TextField {...params} label={t('businessCapabilities.list.filters.domain')} variant="outlined" />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />
        {(searchValue || domainFilter) && (
          <Button variant="outlined" size="small" onClick={handleResetFilters}>
            {t('applications.filters.reset')}
          </Button>
        )}
      </Box>

      {isEmpty ? (
        <EmptyState
          title={t('businessCapabilities.list.emptyState.title')}
          description={t('businessCapabilities.list.emptyState.description')}
          action={
            canWrite
              ? {
                  label: t('businessCapabilities.list.emptyState.cta'),
                  onClick: () => navigate('/business-capabilities/new'),
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* List View */}
          {view === 'list' && (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'name'}
                        direction={sortField === 'name' ? sortOrder : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        {t('businessCapabilities.list.columns.name')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'level'}
                        direction={sortField === 'level' ? sortOrder : 'asc'}
                        onClick={() => handleSort('level')}
                      >
                        {t('businessCapabilities.list.columns.level')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>{t('businessCapabilities.list.columns.domain')}</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'criticality'}
                        direction={sortField === 'criticality' ? sortOrder : 'asc'}
                        onClick={() => handleSort('criticality')}
                      >
                        {t('businessCapabilities.list.columns.criticality')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>{t('businessCapabilities.list.columns.applicationsCount')}</TableCell>
                    {canWrite && (
                      <TableCell align="right">{t('businessCapabilities.list.columns.actions')}</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => setSelectedCapabilityId(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', pl: row.level * 3 }}>
                          {row._count.children > 0 && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(row.id);
                              }}
                              sx={{ mr: 0.5 }}
                            >
                              {expanded.has(row.id) ? (
                                <ExpandMoreIcon fontSize="small" />
                              ) : (
                                <ChevronRightIcon fontSize="small" />
                              )}
                            </IconButton>
                          )}
                          <MuiLink
                            component={Link}
                            to={`/business-capabilities/${row.id}`}
                            underline="always"
                            sx={{
                              color: 'inherit',
                              '&:hover': { color: 'primary.main' },
                            }}
                          >
                            {row.name}
                          </MuiLink>
                        </Box>
                      </TableCell>
                      <TableCell>L{row.level}</TableCell>
                      <TableCell>{row.domain?.name || '—'}</TableCell>
                      <TableCell>
                        {row.criticality ? <CriticalityChip level={row.criticality} /> : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row._count.applicationMappings}
                          size="small"
                          clickable
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCapabilityId(row.id);
                          }}
                        />
                      </TableCell>
                      {canWrite && (
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            aria-label={t('common.actions.edit')}
                            onClick={() => navigate(`/business-capabilities/${row.id}/edit`)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            aria-label={t('common.actions.delete')}
                            onClick={() => handleDeleteClick(row.id, row.name)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tree View */}
          {view === 'tree' && treeData && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
              <BusinessCapabilityTree
                tree={treeData}
                onNodeSelect={(id) => setSelectedCapabilityId(id)}
              />
            </Paper>
          )}

          {/* Matrix View */}
          {view === 'matrix' && treeData && (
            <BusinessCapabilityMatrix
              tree={treeData}
              onNodeClick={(id) => setSelectedCapabilityId(id)}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteDialog}
        title={t('businessCapabilities.delete.confirmTitle')}
        message={
          deleteErrorMessage ||
          t('businessCapabilities.delete.confirmMessage', { name: deleteDialog?.name })
        }
        confirmLabel={deleteErrorMessage ? undefined : t('common.confirmDialog.confirmLabel')}
        cancelLabel={t('common.confirmDialog.cancelLabel')}
        onConfirm={deleteErrorMessage ? () => {} : handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialog(null);
          setDeleteErrorMessage(null);
        }}
        isLoading={deleteCapability.isPending}
        severity={deleteErrorMessage ? 'error' : undefined}
      />

      {/* Drawer */}
      <BusinessCapabilityDrawer
        capabilityId={selectedCapabilityId}
        open={!!selectedCapabilityId}
        onClose={() => setSelectedCapabilityId(null)}
      />
    </PageContainer>
  );
}
