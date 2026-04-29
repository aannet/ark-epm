import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, Link as MuiLink, TableSortLabel,
  Box, Autocomplete, FormControl, InputLabel, Select, MenuItem,
  Typography, TextField, Chip, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import { RowActionsMenu } from '@/components/shared';
import InterfaceDrawer from '@/components/interfaces/InterfaceDrawer';
// AGENT-DECISION: front — CriticalityChip importé depuis business-capabilities/ en attendant migration vers shared/ (post-MVP)
import CriticalityChip from '@/components/business-capabilities/CriticalityChip';
import { useInterfaces, useDeleteInterface } from '@/api/interfaces';
import { useApplications } from '@/api/applications';
import { useDebounce } from '@/hooks/useDebounce';
import { hasPermission } from '@/store/auth';
import { InterfaceListItem, InterfaceType, CriticalityLevel } from '@/types/interface';

type SortField = 'name' | 'sourceApp' | 'targetApp' | 'type' | 'criticality' | 'frequency' | 'createdAt';

const INTERFACE_TYPE_OPTIONS: InterfaceType[] = [
  'REST', 'SOAP', 'FTP', 'SFTP', 'DATABASE',
  'MESSAGE_QUEUE', 'BATCH_FILE', 'EVENT_STREAM',
  'GRAPHQL', 'GRPC', 'OTHER',
];

const CRITICALITY_OPTIONS: CriticalityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function InterfaceListPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('interfaces:write');

  // Pagination & sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [filterSourceAppId, setFilterSourceAppId] = useState<string | null>(null);
  const [filterMiddlewareAppId, setFilterMiddlewareAppId] = useState<string | null>(null);
  const [filterTargetAppId, setFilterTargetAppId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<InterfaceType | ''>('');
  const [filterCriticality, setFilterCriticality] = useState<CriticalityLevel | ''>('');
  const [filterSearch, setFilterSearch] = useState('');
  const debouncedFilterSearch = useDebounce(filterSearch, 300);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<InterfaceListItem | null>(null);
  const [alert, setAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  // Data fetching
  const { data, isLoading } = useInterfaces({
    page: page + 1,
    limit: rowsPerPage,
    sortBy: sortField,
    sortOrder,
    search: debouncedFilterSearch || undefined,
    sourceAppId: filterSourceAppId || undefined,
    middlewareAppId: filterMiddlewareAppId || undefined,
    targetAppId: filterTargetAppId || undefined,
    type: filterType || undefined,
    criticality: filterCriticality || undefined,
  });

  const { data: applicationsData } = useApplications({ limit: 200 });
  const applications = applicationsData?.data || [];

  const deleteMutation = useDeleteInterface();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
  };

  const handleDelete = useCallback(() => {
    if (!deleteDialog) return;
    deleteMutation.mutate(deleteDialog.id, {
      onSuccess: () => {
        setDeleteDialog(null);
        setAlert({ severity: 'success', message: t('interfaces.snackbar.deleted') });
      },
      onError: () => {
        setAlert({ severity: 'error', message: t('common.snackbar.deleteSuccess') });
      },
    });
  }, [deleteDialog, deleteMutation, t]);

  const resetFilters = () => {
    setFilterSourceAppId(null);
    setFilterMiddlewareAppId(null);
    setFilterTargetAppId(null);
    setFilterType('');
    setFilterCriticality('');
    setFilterSearch('');
    setPage(0);
  };

  const interfaces = data?.data || [];
  const total = data?.meta?.total || 0;

  // Sort client-side (RM-IF-08: nulls last)
  const sortedInterfaces = [...interfaces].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    // Handle nulls last
    if (aVal === null && bVal !== null) return 1;
    if (bVal === null && aVal !== null) return -1;
    if (aVal === null && bVal === null) return 0;

    // Compare
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return 0;
  });

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title={t('interfaces.list.title')}
        subtitle={t('interfaces.list.subtitle')}
        action={
          canWrite
            ? {
                label: t('interfaces.list.addButton'),
                onClick: () => navigate('/interfaces/new'),
                icon: <AddIcon />,
              }
            : undefined
        }
      />

      {alert && (
        <Box sx={{ mb: 2 }}>
          <ArkAlert
            open={!!alert}
            severity={alert.severity}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder={t('interfaces.list.filters.nameSearch')}
          value={filterSearch}
          onChange={(e) => {
            setFilterSearch(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 240 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        <Autocomplete
          options={applications}
          getOptionLabel={(option) => option.name}
          value={applications.find((app) => app.id === filterSourceAppId) || null}
          onChange={(_e, newValue) => {
            setFilterSourceAppId(newValue?.id || null);
            setPage(0);
          }}
          renderInput={(params) => (
            <TextField {...params} label={t('interfaces.list.filters.sourceApp')} size="small" sx={{ minWidth: 200 }} />
          )}
          size="small"
          sx={{ minWidth: 200 }}
        />

        <Autocomplete
          options={applications}
          getOptionLabel={(option) => option.name}
          value={applications.find((app) => app.id === filterMiddlewareAppId) || null}
          onChange={(_e, newValue) => {
            setFilterMiddlewareAppId(newValue?.id || null);
            setPage(0);
          }}
          renderInput={(params) => (
            <TextField {...params} label={t('interfaces.list.filters.middlewareApp')} size="small" sx={{ minWidth: 200 }} />
          )}
          size="small"
          sx={{ minWidth: 200 }}
        />

        <Autocomplete
          options={applications}
          getOptionLabel={(option) => option.name}
          value={applications.find((app) => app.id === filterTargetAppId) || null}
          onChange={(_e, newValue) => {
            setFilterTargetAppId(newValue?.id || null);
            setPage(0);
          }}
          renderInput={(params) => (
            <TextField {...params} label={t('interfaces.list.filters.targetApp')} size="small" sx={{ minWidth: 200 }} />
          )}
          size="small"
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('interfaces.list.filters.type')}</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as InterfaceType | '');
              setPage(0);
            }}
            label={t('interfaces.list.filters.type')}
          >
            <MenuItem value="">{t('common.filters.all')}</MenuItem>
            {INTERFACE_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>
                {t(`interfaces.type.${type}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('interfaces.list.filters.criticality')}</InputLabel>
          <Select
            value={filterCriticality}
            onChange={(e) => {
              setFilterCriticality(e.target.value as CriticalityLevel | '');
              setPage(0);
            }}
            label={t('interfaces.list.filters.criticality')}
          >
            <MenuItem value="">{t('common.filters.all')}</MenuItem>
            {CRITICALITY_OPTIONS.map((level) => (
              <MenuItem key={level} value={level}>
                {t(`interfaces.criticality.${level}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <MuiLink
          component="button"
          onClick={resetFilters}
          underline="hover"
          sx={{ alignSelf: 'center' }}
        >
          {t('common.filters.reset')}
        </MuiLink>
      </Box>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : interfaces.length === 0 ? (
        <EmptyState
          title={t('interfaces.list.emptyState.title')}
          description={t('interfaces.list.emptyState.description')}
          action={
            canWrite
              ? {
                  label: t('interfaces.list.emptyState.cta'),
                  onClick: () => navigate('/interfaces/new'),
                }
              : undefined
          }
        />
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'name'}
                      direction={sortField === 'name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      {t('interfaces.list.columns.name')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'sourceApp'}
                      direction={sortField === 'sourceApp' ? sortOrder : 'asc'}
                      onClick={() => handleSort('sourceApp')}
                    >
                      {t('interfaces.list.columns.source')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t('interfaces.list.columns.middleware')}</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'targetApp'}
                      direction={sortField === 'targetApp' ? sortOrder : 'asc'}
                      onClick={() => handleSort('targetApp')}
                    >
                      {t('interfaces.list.columns.target')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'type'}
                      direction={sortField === 'type' ? sortOrder : 'asc'}
                      onClick={() => handleSort('type')}
                    >
                      {t('interfaces.list.columns.type')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'criticality'}
                      direction={sortField === 'criticality' ? sortOrder : 'asc'}
                      onClick={() => handleSort('criticality')}
                    >
                      {t('interfaces.list.columns.criticality')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'frequency'}
                      direction={sortField === 'frequency' ? sortOrder : 'asc'}
                      onClick={() => handleSort('frequency')}
                    >
                      {t('interfaces.list.columns.frequency')}
                    </TableSortLabel>
                  </TableCell>
                  {canWrite && (
                    <TableCell align="right">{t('interfaces.list.columns.actions')}</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedInterfaces.map((iface) => (
                  <TableRow
                    key={iface.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(iface.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {iface.name ? (
                        <MuiLink
                          component="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/interfaces/${iface.id}`);
                          }}
                          underline="hover"
                        >
                          {iface.name}
                        </MuiLink>
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <MuiLink
                        component="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/applications/${iface.sourceApp.id}`);
                        }}
                        underline="hover"
                      >
                        {iface.sourceApp.name}
                      </MuiLink>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {iface.middlewareApp ? (
                        <MuiLink
                          component="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/applications/${iface.middlewareApp!.id}`);
                          }}
                          underline="hover"
                        >
                          {iface.middlewareApp.name}
                        </MuiLink>
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <MuiLink
                        component="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/applications/${iface.targetApp.id}`);
                        }}
                        underline="hover"
                      >
                        {iface.targetApp.name}
                      </MuiLink>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(`interfaces.type.${iface.type}`)}
                        color="default"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {iface.criticality ? (
                        <CriticalityChip level={iface.criticality} size="small" />
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {iface.frequency ? t(`interfaces.frequency.${iface.frequency}`) : '—'}
                    </TableCell>
                    {canWrite && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <RowActionsMenu
                          onView={() => navigate(`/interfaces/${iface.id}`)}
                          onEdit={() => navigate(`/interfaces/${iface.id}/edit`)}
                          onDelete={() => setDeleteDialog(iface)}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage={t('common.rowsPerPage')}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} ${t('common.of')} ${count}`
            }
          />
        </Paper>
      )}

      {/* Drawer */}
      <InterfaceDrawer
        interfaceId={selectedId}
        open={drawerOpen}
        onClose={handleCloseDrawer}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deleteDialog}
        title={t('interfaces.delete.confirmTitle')}
        message={
          deleteDialog
            ? t('interfaces.delete.confirmMessage', {
                source: deleteDialog.sourceApp.name,
                target: deleteDialog.targetApp.name,
              })
            : ''
        }
        confirmLabel={t('common.actions.delete')}
        cancelLabel={t('common.actions.cancel')}
        severity="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </PageContainer>
  );
}
