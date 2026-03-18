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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import StatusChip from '@/components/shared/StatusChip';
import { TagChipList } from '@/components/tags';
import { ApplicationFilters, ApplicationDrawer } from '@/components/applications';
import { useTagDimensions } from '@/hooks/useTagDimensions';
import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';
import {
  useApplications,
  useDeleteApplication,
  useApplicationDependencies,
} from '@/api/applications';
import { hasPermission } from '@/store/auth';
import { ApplicationListItem, ApplicationFilters as FiltersType } from '@/types/application';
import { format409Message } from '@/utils/application.utils';

type SortField = 'name' | 'domain' | 'provider' | 'criticality' | 'lifecycleStatus' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface AlertState {
  severity: 'success' | 'error';
  message: string;
}

const DEFAULT_FILTERS: FiltersType = {
  lifecycleStatus: null,
  tagValueIds: [],
};

const LIFECYCLE_STATUSES = ['draft', 'in_progress', 'production', 'deprecated', 'retired'];

export default function ApplicationsListPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const canWrite = hasPermission('applications:write');
  const { dimensions: availableDimensions } = useTagDimensions();

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
    const validFields: SortField[] = ['name', 'domain', 'provider', 'criticality', 'lifecycleStatus', 'createdAt'];
    return validFields.includes(sortBy) ? sortBy : 'name';
  };

  const getSortOrderFromUrl = (): SortOrder => {
    const order = searchParams.get('sortOrder');
    return order === 'desc' ? 'desc' : 'asc';
  };

  const getFiltersFromUrl = (): FiltersType => {
    const lifecycleStatus = searchParams.get('lifecycleStatus');
    const tagValueIds = searchParams.getAll('tagValueIds');
    return {
      lifecycleStatus: lifecycleStatus || null,
      tagValueIds: tagValueIds.length > 0 ? tagValueIds : [],
    };
  };

  const [page, setPage] = useState(getPageFromUrl());
  const [rowsPerPage, setRowsPerPage] = useState(getLimitFromUrl());
  const [sortField, setSortField] = useState<SortField>(getSortFieldFromUrl());
  const [sortOrder, setSortOrder] = useState<SortOrder>(getSortOrderFromUrl());
  const [filters, setFilters] = useState<FiltersType>(getFiltersFromUrl());
  const [selectedTags, setSelectedTags] = useState<TagValueResponse[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<ApplicationListItem | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  // Sync URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (page !== 1) params.set('page', page.toString());
    if (rowsPerPage !== 20) params.set('limit', rowsPerPage.toString());
    if (sortField !== 'name') params.set('sortBy', sortField);
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder);
    if (filters.lifecycleStatus) params.set('lifecycleStatus', filters.lifecycleStatus);
    filters.tagValueIds.forEach(id => params.append('tagValueIds', id));
    
    setSearchParams(params, { replace: false });
  }, [page, rowsPerPage, sortField, sortOrder, filters, setSearchParams]);

  // Update selectedTags when filters change (from URL or manual)
  // Update state when URL changes (back/forward navigation)
  useEffect(() => {
    setPage(getPageFromUrl());
    setRowsPerPage(getLimitFromUrl());
    setSortField(getSortFieldFromUrl());
    setSortOrder(getSortOrderFromUrl());
    setFilters(getFiltersFromUrl());
    // Note: selectedTags cannot be reconstructed from URL alone without tag values data
  }, [searchParams]);

  const { data, isLoading, error } = useApplications({
    page,
    limit: rowsPerPage,
    sortBy: sortField,
    sortOrder,
    lifecycleStatus: filters.lifecycleStatus,
    tagValueIds: filters.tagValueIds,
  });

  const deleteApplication = useDeleteApplication();

  const { data: dependencies } = useApplicationDependencies(deleteDialog?.id || '', {
    enabled: !!deleteDialog,
  });

  useEffect(() => {
    if (location.state?.alert) {
      setAlert(location.state.alert);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1); // Reset page when sort changes
  };

  const handleDeleteClick = (application: ApplicationListItem) => {
    setDeleteDialog(application);
    setDeleteErrorMessage(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;

    // Check dependencies first
    if (dependencies?.hasDependencies) {
      setDeleteErrorMessage(format409Message(t, dependencies.counts));
      return;
    }

    try {
      await deleteApplication.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
      navigate('/applications', {
        state: {
          alert: { severity: 'success', message: t('applications.alert.deleted') },
        },
      });
      setAlert({ severity: 'success', message: t('applications.alert.deleted') });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 409 && code === 'DEPENDENCY_CONFLICT') {
        setDeleteErrorMessage(format409Message(t, err?.response?.data?.details));
      } else if (status && status >= 500) {
        setAlert({ severity: 'error', message: t('applications.alert.errors.serverError') });
        setDeleteDialog(null);
      }
    }
  };

  const handleRowClick = (id: string, fieldName: string) => {
    if (fieldName === 'name') {
      navigate(`/applications/${id}`);
    } else {
      setSelectedApplicationId(id);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedTags([]);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: FiltersType, newSelectedTags?: TagValueResponse[]) => {
    setFilters(newFilters);
    if (newSelectedTags !== undefined) {
      setSelectedTags(newSelectedTags);
    }
    setPage(1);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={t('applications.list.title')} />
        <LoadingSkeleton rows={5} columns={canWrite ? 7 : 6} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title={t('applications.list.title')} />
        <EmptyState
          title={t('errors.unexpected.title')}
          description={t('errors.unexpected.description')}
        />
      </PageContainer>
    );
  }

  const applications = data?.data || [];
  const isEmpty = applications.length === 0;

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title={t('applications.list.title')}
        subtitle={t('applications.list.subtitle')}
        action={
          canWrite
            ? {
                label: t('applications.list.addButton'),
                onClick: () => navigate('/applications/new'),
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

      <ApplicationFilters
        lifecycleStatusOptions={LIFECYCLE_STATUSES}
        availableDimensions={availableDimensions}
        filters={filters}
        selectedTags={selectedTags}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {isEmpty ? (
        <EmptyState
          title={t('applications.list.emptyState.title')}
          description={t('applications.list.emptyState.description')}
          action={
            canWrite
              ? {
                  label: t('applications.list.emptyState.cta'),
                  onClick: () => navigate('/applications/new'),
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
                    {t('applications.list.columns.name')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'domain'}
                    direction={sortField === 'domain' ? sortOrder : 'asc'}
                    onClick={() => handleSort('domain')}
                  >
                    {t('applications.list.columns.domain')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'provider'}
                    direction={sortField === 'provider' ? sortOrder : 'asc'}
                    onClick={() => handleSort('provider')}
                  >
                    {t('applications.list.columns.provider')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'criticality'}
                    direction={sortField === 'criticality' ? sortOrder : 'asc'}
                    onClick={() => handleSort('criticality')}
                  >
                    {t('applications.list.columns.criticality')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'lifecycleStatus'}
                    direction={sortField === 'lifecycleStatus' ? sortOrder : 'asc'}
                    onClick={() => handleSort('lifecycleStatus')}
                  >
                    {t('applications.list.columns.lifecycleStatus')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>{t('applications.list.columns.tags')}</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'createdAt'}
                    direction={sortField === 'createdAt' ? sortOrder : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    {t('applications.list.columns.createdAt')}
                  </TableSortLabel>
                </TableCell>
                {canWrite && (
                  <TableCell align="right">
                    {t('applications.list.columns.actions')}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow
                  key={application.id}
                  hover
                  onClick={() => handleRowClick(application.id, 'row')}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <MuiLink
                      component={Link}
                      to={`/applications/${application.id}`}
                      underline="always"
                      sx={{
                        color: 'inherit',
                        '&:hover': { color: 'primary.main' },
                        textDecoration: 'underline',
                      }}
                    >
                      {application.name}
                    </MuiLink>
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(application.id, 'domain')}>
                    {application.domain?.name || '—'}
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(application.id, 'provider')}>
                    {application.provider?.name || '—'}
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(application.id, 'criticality')}>
                    {application.criticality ? (
                      <StatusChip type="criticality" value={application.criticality as any} />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(application.id, 'lifecycle')}>
                    {application.lifecycleStatus ? (
                      <StatusChip type="lifecycle" value={application.lifecycleStatus as any} />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(application.id, 'tags')}>
                    <TagChipList
                      tags={application.tags || []}
                      maxVisible={3}
                      deduplicate={true}
                      showMoreButton={true}
                      size="small"
                    />
                  </TableCell>
                  <TableCell onClick={() => handleRowClick(application.id, 'created')}>
                    {new Date(application.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  {canWrite && (
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        aria-label={t('common.actions.edit')}
                        onClick={() => navigate(`/applications/${application.id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label={t('common.actions.delete')}
                        onClick={() => handleDeleteClick(application)}
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
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('applications.list.pagination.rowsPerPage')}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`}
        />
        </>
      )}

      <ConfirmDialog
        open={!!deleteDialog}
        title={t('applications.delete.confirmTitle')}
        message={
          deleteErrorMessage ||
          t('applications.delete.confirmMessage', { name: deleteDialog?.name })
        }
        confirmLabel={deleteErrorMessage ? undefined : t('common.confirmDialog.confirmLabel')}
        cancelLabel={t('common.confirmDialog.cancelLabel')}
        onConfirm={deleteErrorMessage ? () => {} : handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialog(null);
          setDeleteErrorMessage(null);
        }}
        isLoading={deleteApplication.isPending}
        severity={deleteErrorMessage ? 'error' : undefined}
      />

      <ApplicationDrawer
        applicationId={selectedApplicationId}
        open={!!selectedApplicationId}
        onClose={() => setSelectedApplicationId(null)}
      />
    </PageContainer>
  );
}
