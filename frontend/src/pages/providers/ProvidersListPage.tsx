import {
  Box,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layout';
import { PageHeader, LoadingSkeleton, EmptyState, ConfirmDialog, ArkAlert } from '@/components/shared';
import { TagChipList } from '@/components/tags';
import { useProviders, useDeleteProvider } from '@/api/providers';
import { Provider, ProviderFilters } from '@/types/provider';
import { hasPermission } from '@/store/auth';
import ExpiryDateBadge from '@/components/providers/ExpiryDateBadge';
import ProvidersDrawer from '@/components/providers/ProvidersDrawer';
import { format409Message } from '@/utils/provider.utils';

type SortField = 'name' | 'createdAt' | 'expiryDate';
type SortOrder = 'asc' | 'desc';

interface AlertState {
  severity: 'success' | 'error' | 'warning';
  message: string;
}

export default function ProvidersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const canWrite = hasPermission('providers:write');

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');

  // Drawer & Delete
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Provider | null>(null);

  // Alerts
  const [alert, setAlert] = useState<AlertState | null>(null);

  // API
  const filters: ProviderFilters = {
    page,
    limit: rowsPerPage,
    search: searchValue,
    sortBy: sortField,
    sortOrder,
  };
  const { data, isLoading, error } = useProviders(filters);
  const deleteProvider = useDeleteProvider();

  // Handle alert from navigation state (success messages)
  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Auto-dismiss success alerts after 5 seconds
  useEffect(() => {
    if (alert?.severity === 'success') {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort field
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page on sort
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = () => {
    setSearchValue(searchInput);
    setPage(1); // Reset to first page on search
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleRowClick = (id: string) => {
    setSelectedProviderId(id);
  };

  const handleNameClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/providers/${id}`);
  };

  const handleDeleteClick = (provider: Provider, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialog(provider);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;

    try {
      await deleteProvider.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
      setAlert({
        severity: 'success',
        message: t('providers.alert.deleteSuccess'),
      });
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.code === 'DEPENDENCY_CONFLICT') {
        const appCount = err.response?.data?.details?.applicationsCount ?? 0;
        setDeleteDialog({
          ...deleteDialog,
          name: format409Message(t, appCount),
        });
      } else {
        setAlert({
          severity: 'error',
          message: t('providers.alert.errors.serverError'),
        });
      }
    }
  };

  const isDependencyConflict = !deleteDialog?.createdAt;

  const handleAddClick = () => {
    navigate('/providers/new');
  };

  const isEmpty = !data?.data || data.data.length === 0;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={t('providers.list.title')}
        subtitle={t('providers.list.subtitle')}
        action={
          canWrite
            ? {
                label: t('providers.list.addButton'),
                onClick: handleAddClick,
              }
            : undefined
        }
      />

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder={t('providers.list.search')}
          value={searchInput}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
          }}
        />
      </Box>

      {/* Loading State */}
      {isLoading && !data ? (
        <LoadingSkeleton rows={5} columns={canWrite ? 6 : 5} />
      ) : error ? (
        <EmptyState
          title={t('errors.unexpected.title')}
          description={t('errors.unexpected.description')}
        />
      ) : isEmpty ? (
        <EmptyState
          title={t('providers.list.emptyState.title')}
          description={t('providers.list.emptyState.description')}
          action={
            canWrite
              ? {
                  label: t('providers.list.emptyState.cta'),
                  onClick: handleAddClick,
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'name'}
                      direction={sortField === 'name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      {t('providers.list.columns.name')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t('providers.list.columns.contractType')}</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'expiryDate'}
                      direction={sortField === 'expiryDate' ? sortOrder : 'asc'}
                      onClick={() => handleSort('expiryDate')}
                    >
                      {t('providers.list.columns.expiryDate')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t('providers.list.columns.tags')}</TableCell>
                  <TableCell align="center">{t('providers.list.columns.applicationsCount')}</TableCell>
                  {canWrite && <TableCell align="center">{t('providers.list.columns.actions')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data.map((provider) => (
                  <TableRow
                    key={provider.id}
                    onClick={() => handleRowClick(provider.id)}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f9f9f9' } }}
                  >
                    <TableCell>
                      <Box
                        component="button"
                        onClick={(e) => handleNameClick(provider.id, e)}
                        sx={{
                          background: 'none',
                          border: 'none',
                          color: 'primary.main',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontSize: 'inherit',
                          fontWeight: 500,
                          padding: 0,
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {provider.name}
                      </Box>
                    </TableCell>
                    <TableCell>{provider.contractType || '—'}</TableCell>
                    <TableCell>
                      <ExpiryDateBadge date={provider.expiryDate} />
                    </TableCell>
                    <TableCell>
                      <TagChipList
                        tags={provider.tags}
                        maxVisible={3}
                        deduplicate={true}
                        showMoreButton={true}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{provider._count.appProviderMaps}</TableCell>
                    {canWrite && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/providers/${provider.id}/edit`);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteClick(provider, e)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={data?.meta.total ?? 0}
            rowsPerPage={rowsPerPage}
            page={page - 1}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      )}

      {/* Drawer */}
      {selectedProviderId && (
        <ProvidersDrawer
          providerId={selectedProviderId}
          open={!!selectedProviderId}
          onClose={() => setSelectedProviderId(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <ConfirmDialog
          open={true}
          title={t('providers.delete.confirmTitle')}
          message={
            isDependencyConflict
              ? deleteDialog.name // Error message from 409 response
              : t('providers.delete.confirmMessage', { name: deleteDialog.name })
          }
          confirmLabel={isDependencyConflict ? undefined : t('common.actions.delete')}
          cancelLabel={t('common.actions.cancel')}
          severity={isDependencyConflict ? 'error' : 'warning'}
          onConfirm={isDependencyConflict ? () => setDeleteDialog(null) : handleDeleteConfirm}
          onCancel={() => setDeleteDialog(null)}
          isLoading={deleteProvider.isPending}
        />
      )}

      {/* Success/Error Alert */}
      {alert && (
        <ArkAlert
          severity={alert.severity}
          message={alert.message}
          open={true}
          onClose={() => setAlert(null)}
        />
      )}
    </PageContainer>
  );
}
