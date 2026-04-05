import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  TableSortLabel,
  Link as MuiLink,
  TextField,
  InputAdornment,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import { TagChipList } from '@/components/tags';
import { DomainDrawer } from '@/components/domains';
import { useDomains, useDeleteDomain } from '@/api/domains';
import { hasPermission } from '@/store/auth';
import { Domain } from '@/types/domain';
import { format409Message } from '@/utils/domain.utils';

type SortField = 'name' | 'description' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface AlertState {
  severity: 'success' | 'error';
  message: string;
}

export default function DomainsListPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const canWrite = hasPermission('domains:write');

  // Parse URL params
  const getPageFromUrl = () => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    return isNaN(page) || page < 1 ? 1 : page;
  };
  const getLimitFromUrl = () => {
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    return [10, 20, 50].includes(limit) ? limit : 20;
  };
  const getSortFieldFromUrl = (): SortField => {
    const sortBy = searchParams.get('sortBy') as SortField;
    const validFields: SortField[] = ['name', 'description', 'createdAt'];
    return validFields.includes(sortBy) ? sortBy : 'name';
  };
  const getSortOrderFromUrl = (): SortOrder => {
    const order = searchParams.get('sortOrder');
    return order === 'desc' ? 'desc' : 'asc';
  };

  const [page, setPage] = useState(getPageFromUrl());
  const [rowsPerPage, setRowsPerPage] = useState(getLimitFromUrl());
  const [sortField, setSortField] = useState<SortField>(getSortFieldFromUrl());
  const [sortOrder, setSortOrder] = useState<SortOrder>(getSortOrderFromUrl());
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [deleteDialog, setDeleteDialog] = useState<Domain | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  // Sync URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (page !== 1) params.set('page', page.toString());
    if (rowsPerPage !== 20) params.set('limit', rowsPerPage.toString());
    if (sortField !== 'name') params.set('sortBy', sortField);
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder);
    if (searchValue) params.set('search', searchValue);
    setSearchParams(params, { replace: false });
  }, [page, rowsPerPage, sortField, sortOrder, searchValue, setSearchParams]);

  useEffect(() => {
    setPage(getPageFromUrl());
    setRowsPerPage(getLimitFromUrl());
    setSortField(getSortFieldFromUrl());
    setSortOrder(getSortOrderFromUrl());
  }, [searchParams]);

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const { data, isLoading, error } = useDomains({
    page,
    limit: rowsPerPage,
    sortBy: sortField,
    sortOrder,
    search: searchValue || undefined,
  });

  const deleteDomain = useDeleteDomain();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSearchSubmit = () => {
    setSearchValue(searchInput);
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  const handleDeleteClick = (domain: Domain) => {
    setDeleteDialog(domain);
    setDeleteErrorMessage(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;
    try {
      await deleteDomain.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
      setAlert({ severity: 'success', message: t('domains.alert.deleted') });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 409 && code === 'DEPENDENCY_CONFLICT') {
        const appCount = err?.response?.data?.applicationsCount ?? 0;
        const bcCount = err?.response?.data?.businessCapabilitiesCount ?? 0;
        setDeleteErrorMessage(format409Message(t, appCount, bcCount));
      } else if (status && status >= 500) {
        setAlert({ severity: 'error', message: t('domains.alert.errors.serverError') });
        setDeleteDialog(null);
      }
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={t('domains.list.title')} />
        <LoadingSkeleton rows={5} columns={canWrite ? 5 : 4} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title={t('domains.list.title')} />
        <EmptyState
          title={t('errors.unexpected.title')}
          description={t('errors.unexpected.description')}
        />
      </PageContainer>
    );
  }

  const domains = data?.data || [];
  const isEmpty = domains.length === 0;

  return (
    <PageContainer>
      <PageHeader
        title={t('domains.list.title')}
        subtitle={t('domains.list.subtitle')}
        action={
          canWrite
            ? {
                label: t('domains.list.addButton'),
                onClick: () => navigate('/domains/new'),
                icon: <AddIcon />,
              }
            : undefined
        }
      />

      <ArkAlert
        open={!!alert}
        severity={alert?.severity ?? 'success'}
        message={alert?.message ?? ''}
        autoDismiss={5000}
        onClose={() => setAlert(null)}
      />

      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder={t('domains.list.search')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
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
          sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}
        />
      </Box>

      {isEmpty ? (
        <EmptyState
          title={t('domains.list.emptyState.title')}
          description={t('domains.list.emptyState.description')}
          action={
            canWrite
              ? {
                  label: t('domains.list.emptyState.cta'),
                  onClick: () => navigate('/domains/new'),
                }
              : undefined
          }
        />
      ) : (
        <>
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
                      {t('domains.list.columns.name')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'description'}
                      direction={sortField === 'description' ? sortOrder : 'asc'}
                      onClick={() => handleSort('description')}
                    >
                      {t('domains.list.columns.description')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t('domains.list.columns.tags')}</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'createdAt'}
                      direction={sortField === 'createdAt' ? sortOrder : 'asc'}
                      onClick={() => handleSort('createdAt')}
                    >
                      {t('domains.list.columns.createdAt')}
                    </TableSortLabel>
                  </TableCell>
                  {canWrite && (
                    <TableCell align="right">{t('domains.list.columns.actions')}</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow
                    key={domain.id}
                    hover
                    onClick={() => setSelectedDomainId(domain.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <MuiLink
                        component={Link}
                        to={`/domains/${domain.id}`}
                        underline="always"
                        sx={{
                          color: 'inherit',
                          '&:hover': { color: 'primary.main' },
                          textDecoration: 'underline',
                        }}
                      >
                        {domain.name}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{domain.description || '—'}</TableCell>
                    <TableCell>
                      <TagChipList
                        tags={domain.tags || []}
                        maxVisible={3}
                        deduplicate={true}
                        showMoreButton={true}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(domain.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    {canWrite && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          aria-label={t('common.actions.edit')}
                          onClick={() => navigate(`/domains/${domain.id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label={t('common.actions.delete')}
                          onClick={() => handleDeleteClick(domain)}
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
          <TablePagination
            component="div"
            count={data?.meta?.total || 0}
            page={(data?.meta?.page || 1) - 1}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            onPageChange={(_e, newPage) => setPage(newPage + 1)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(1);
            }}
            labelRowsPerPage={t('common.rowsPerPage')}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteDialog}
        title={t('domains.delete.confirmTitle')}
        message={
          deleteErrorMessage ||
          t('domains.delete.confirmMessage', { name: deleteDialog?.name })
        }
        confirmLabel={deleteErrorMessage ? undefined : t('common.confirmDialog.confirmLabel')}
        cancelLabel={t('common.confirmDialog.cancelLabel')}
        onConfirm={deleteErrorMessage ? () => {} : handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialog(null);
          setDeleteErrorMessage(null);
        }}
        isLoading={deleteDomain.isPending}
        severity={deleteErrorMessage ? 'error' : undefined}
      />

      <DomainDrawer
        domainId={selectedDomainId}
        open={!!selectedDomainId}
        onClose={() => setSelectedDomainId(null)}
      />
    </PageContainer>
  );
}
