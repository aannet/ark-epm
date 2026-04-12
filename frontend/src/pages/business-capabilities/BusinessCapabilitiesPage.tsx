import { useState, useEffect, useMemo, type MouseEvent } from 'react';
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
  Link as MuiLink,
  TextField,
  InputAdornment,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import { RowActionsMenu } from '@/components/shared';
import BusinessCapabilityDrawer from '@/components/business-capabilities/BusinessCapabilityDrawer';
import BusinessCapabilityMatrix from '@/components/business-capabilities/BusinessCapabilityMatrix';
import CriticalityChip from '@/components/business-capabilities/CriticalityChip';
import { useBusinessCapabilitiesTree, useDeleteBusinessCapability } from '@/api/businessCapabilities';
import { useDomains } from '@/api/domains';
import { hasPermission } from '@/store/auth';
import { ViewMode } from '@/types/businessCapability';
import { flattenTree, getRootNodeIds, sortTreeHierarchically } from '@/utils/businessCapability.utils';

type SortField = 'name' | 'criticality';
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
    return ['list', 'matrix'].includes(view) ? view : 'list';
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

  // Flatten tree for list view (sorted hierarchically before flattening)
  const flatList = useMemo(() => {
    if (!treeData) return [];
    return flattenTree(sortTreeHierarchically(treeData, sortField, sortOrder));
  }, [treeData, sortField, sortOrder]);

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

  // Handle sort (combined field_order value from Select)
  const handleSortChange = (value: string) => {
    const [field, order] = value.split('_');
    setSortField(field as SortField);
    setSortOrder(order as SortOrder);
  };

  // Handle search
  const handleSearchSubmit = () => {
    setSearchValue(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  // Expand all / collapse all
  const allExpandableIds = flatList.filter((r) => r._count.children > 0).map((r) => r.id);
  const isAllExpanded = allExpandableIds.length > 0 && allExpandableIds.every((id) => expanded.has(id));

  const expandAll = () => setExpanded(new Set(allExpandableIds));
  const collapseAll = () => setExpanded(new Set());

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

  // Filter visible rows based on expanded state (sort applied via flatList useMemo)
  const getVisibleRows = () => {
    if (!flatList.length) return [];

    // When a filter is active, show all results — expand/collapse only applies to unfiltered browsing
    if (searchValue || domainFilter) return flatList;

    const rowById = new Map(flatList.map((row) => [row.id, row]));

    return flatList.filter((row) => {
      if (row.level === 0) return true;

      let currentParentId = row.parentId;
      while (currentParentId) {
        if (!expanded.has(currentParentId)) return false;
        currentParentId = rowById.get(currentParentId)?.parentId ?? null;
      }

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
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Tooltip title={isAllExpanded ? t('businessCapabilities.list.collapseAll') : t('businessCapabilities.list.expandAll')}>
          <IconButton size="small" onClick={isAllExpanded ? collapseAll : expandAll}>
            {isAllExpanded ? <UnfoldLessIcon fontSize="small" /> : <UnfoldMoreIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
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
        <FormControl size="small" sx={{ minWidth: 210 }}>
          <InputLabel>{t('businessCapabilities.list.sortBy')}</InputLabel>
          <Select
            value={`${sortField}_${sortOrder}`}
            onChange={(e) => handleSortChange(e.target.value as string)}
            label={t('businessCapabilities.list.sortBy')}
          >
            <MenuItem value="name_asc">{t('businessCapabilities.list.sortOptions.nameAsc')}</MenuItem>
            <MenuItem value="name_desc">{t('businessCapabilities.list.sortOptions.nameDesc')}</MenuItem>
            <MenuItem value="criticality_asc">{t('businessCapabilities.list.sortOptions.criticalityAsc')}</MenuItem>
            <MenuItem value="criticality_desc">{t('businessCapabilities.list.sortOptions.criticalityDesc')}</MenuItem>
          </Select>
        </FormControl>
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
            <>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                    <TableCell>{t('businessCapabilities.list.columns.name')}</TableCell>
                    <TableCell>{t('businessCapabilities.list.columns.level')}</TableCell>
                    <TableCell>{t('businessCapabilities.list.columns.domain')}</TableCell>
                    <TableCell>{t('businessCapabilities.list.columns.criticality')}</TableCell>
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
                          {row._count.children > 0 ? (
                            <IconButton
                              size="small"
                              onClick={(e: MouseEvent<HTMLElement>) => {
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
                          ) : (
                            <Box sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 0.5 }}>
                              <FiberManualRecordIcon sx={{ fontSize: 8, color: 'text.disabled' }} />
                            </Box>
                          )}
                          <MuiLink
                            component={Link}
                            to={`/business-capabilities/${row.id}`}
                            underline="hover"
                            sx={{
                              color: (['#424242', '#616161', '#9E9E9E', '#BDBDBD'] as const)[Math.min(row.level, 3)],
                              '&:hover': { color: 'primary.main' },
                              fontWeight: row.level === 0 ? 700 : 'normal',
                            }}
                          >
                            {row.name}
                          </MuiLink>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`L${row.level}`}
                          size="small"
                          sx={{
                            bgcolor: (['#BDBDBD', '#E0E0E0', '#EEEEEE', '#F5F5F5'] as const)[Math.min(row.level, 3)],
                            color: row.level === 0 ? 'text.primary' : 'text.secondary',
                            fontWeight: row.level === 0 ? 600 : 400,
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                      </TableCell>
                       <TableCell>{row.domain?.name || t('businessCapabilities.detail.noValue')}</TableCell>
                      <TableCell>
                         {row.criticality ? (
                           <CriticalityChip level={row.criticality} />
                         ) : (
                           t('businessCapabilities.detail.noValue')
                         )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row._count.applicationMappings}
                          size="small"
                          clickable
                         onClick={(e: MouseEvent<HTMLElement>) => {
                            e.stopPropagation();
                            setSelectedCapabilityId(row.id);
                          }}
                        />
                      </TableCell>
                       {canWrite && (
                         <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                           <RowActionsMenu
                             onView={() => navigate(`/business-capabilities/${row.id}`)}
                             onEdit={() => navigate(`/business-capabilities/${row.id}/edit`)}
                             onDelete={() => handleDeleteClick(row.id, row.name)}
                           />
                         </TableCell>
                       )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </>
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
