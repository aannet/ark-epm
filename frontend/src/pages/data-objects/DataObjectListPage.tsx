import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, Link as MuiLink, TableSortLabel,
  TextField, MenuItem, Box, FormControl, InputLabel, Select,
  InputAdornment, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import { TagChipList } from '@/components/tags';
import DataObjectDrawer from '@/components/data-objects/DataObjectDrawer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDataObjects, deleteDataObject, getDataObject } from '@/services/api/data-objects.api';
import { hasPermission } from '@/store/auth';
import { DataObjectListItem } from '@/types/data-object';
import { format409Message } from '@/utils/data-objects.utils';
import { RowActionsMenu } from '@/components/shared';

type SortField = 'name' | 'type' | 'isSourceOfTruth' | 'createdAt';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function DataObjectListPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const canWrite = hasPermission('data-objects:write');

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSourceOfTruth, setFilterSourceOfTruth] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<DataObjectListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  // Read navigation state alert (post-delete from detail page)
  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const { data, isLoading } = useQuery({
    queryKey: ['data-objects', page, rowsPerPage, sortField, sortOrder, debouncedSearch, filterType, filterSourceOfTruth],
    queryFn: () => getDataObjects({
      page,
      limit: rowsPerPage,
      sortBy: sortField,
      sortOrder,
      search: debouncedSearch || undefined,
      type: filterType || undefined,
      isSourceOfTruth: filterSourceOfTruth || undefined,
    }),
  });

  const { data: selectedDataObject } = useQuery({
    queryKey: ['data-object', selectedId],
    queryFn: () => selectedId ? getDataObject(selectedId) : null,
    enabled: !!selectedId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDataObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-objects'] });
      setDeleteDialog(null);
      setDeleteError(null);
      setAlert({ severity: 'success', message: t('data-objects.alert.deleteSuccess') });
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setDeleteError(format409Message(t, err?.response?.data?.details?.applicationsCount ?? 0));
      } else {
        setAlert({ severity: 'error', message: t('data-objects.alert.errors.serverError') });
        setDeleteDialog(null);
      }
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const openDrawer = useCallback((id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={t('data-objects.list.title')} />
        <LoadingSkeleton rows={5} columns={canWrite ? 6 : 5} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title={t('data-objects.list.title')}
        subtitle={t('data-objects.list.subtitle')}
        action={canWrite ? { label: t('data-objects.list.addButton'), onClick: () => navigate('/data-objects/new'), icon: <AddIcon /> } : undefined}
      />

      <ArkAlert open={!!alert} severity={alert?.severity ?? 'success'} message={alert?.message ?? ''} autoDismiss={5000} onClose={() => setAlert(null)} />

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder={t('data-objects.list.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ minWidth: 250 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('data-objects.list.filterType')}</InputLabel>
          <Select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} label={t('data-objects.list.filterType')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="database">database</MenuItem>
            <MenuItem value="dataset">dataset</MenuItem>
            <MenuItem value="file">file</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>{t('data-objects.list.filterSourceOfTruth')}</InputLabel>
          <Select value={filterSourceOfTruth} onChange={(e) => { setFilterSourceOfTruth(e.target.value); setPage(1); }} label={t('data-objects.list.filterSourceOfTruth')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="true">Oui</MenuItem>
            <MenuItem value="false">Non</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table or Empty State */}
      {data?.data.length === 0 ? (
        <EmptyState
          title={t('data-objects.list.emptyState.title')}
          description={t('data-objects.list.emptyState.description')}
          action={canWrite ? { label: t('data-objects.list.emptyState.cta'), onClick: () => navigate('/data-objects/new') } : undefined}
        />
      ) : (
        <>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell>
                    <TableSortLabel active={sortField === 'name'} direction={sortOrder} onClick={() => handleSort('name')}>
                      {t('data-objects.list.columns.name')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'type'} direction={sortOrder} onClick={() => handleSort('type')}>
                      {t('data-objects.list.columns.type')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'isSourceOfTruth'} direction={sortOrder} onClick={() => handleSort('isSourceOfTruth')}>
                      {t('data-objects.list.columns.isSourceOfTruth')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t('data-objects.list.columns.tags')}</TableCell>
                  <TableCell>{t('data-objects.list.columns.applicationsCount')}</TableCell>
                  {canWrite && <TableCell align="right">{t('data-objects.list.columns.actions')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => openDrawer(item.id)}
                  >
                    {/* Name — stops propagation, navigates directly */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <MuiLink
                        component={Link}
                        to={`/data-objects/${item.id}`}
                        underline="always"
                        sx={{ color: 'inherit', '&:hover': { color: 'primary.main' } }}
                      >
                        {item.name}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{item.type ?? '—'}</TableCell>
                    <TableCell>
                      {item.isSourceOfTruth ? (
                        <Chip size="small" variant="filled" color="success" label={t('data-objects.list.columns.isSourceOfTruthTrue')} />
                      ) : (
                        <Chip size="small" variant="outlined" color="default" label={t('data-objects.list.columns.isSourceOfTruthFalse')} />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.tags?.length ? (
                        <TagChipList tags={item.tags} maxVisible={3} deduplicate={true} />
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {(item._count?.appDataObjectMaps ?? 0) > 0 && (
                        <Chip
                          label={item._count?.appDataObjectMaps}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      )}
                    </TableCell>
                    {canWrite && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <RowActionsMenu
                          onView={() => navigate(`/data-objects/${item.id}`)}
                          onEdit={() => navigate(`/data-objects/${item.id}/edit`)}
                          onDelete={() => {
                            setDeleteDialog(item);
                            setDeleteError(null);
                          }}
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
            count={data?.meta?.total ?? 0}
            page={(data?.meta?.page ?? 1) - 1}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            onPageChange={(_, p) => setPage(p + 1)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(1); }}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`}
          />
        </>
      )}

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!deleteDialog}
        title={t('data-objects.delete.confirmTitle')}
        message={deleteError ?? t('data-objects.delete.confirmMessage', { name: deleteDialog?.name })}
        confirmLabel={deleteError ? undefined : t('common.confirmDialog.confirmLabel')}
        cancelLabel={t('common.confirmDialog.cancelLabel')}
        onConfirm={deleteError ? () => {} : () => deleteMutation.mutate(deleteDialog!.id)}
        onCancel={() => { setDeleteDialog(null); setDeleteError(null); }}
        isLoading={deleteMutation.isPending}
        severity={deleteError ? 'error' : undefined}
      />

      {/* Side Drawer — PNS-02 */}
      <DataObjectDrawer
        open={drawerOpen}
        dataObject={selectedDataObject ?? null}
        onClose={closeDrawer}
        onNavigateDetail={(id) => { closeDrawer(); navigate(`/data-objects/${id}`); }}
        onNavigateEdit={(id) => { closeDrawer(); navigate(`/data-objects/${id}/edit`); }}
      />
    </PageContainer>
  );
}
