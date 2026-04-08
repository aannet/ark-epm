import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, IconButton, TableSortLabel, Link as MuiLink,
  TextField, Box, FormControl, InputLabel, Select, MenuItem,
  InputAdornment,
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
import ITComponentDrawer from '@/components/it-components/ITComponentDrawer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getITComponents, deleteITComponent, getITComponent,
} from '@/services/api/it-components.api';
import { hasPermission } from '@/store/auth';
import { ITComponentListItem } from '@/types/it-component';
import { format409Message } from '@/utils/it-components.utils';

export default function ITComponentListPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canWrite = hasPermission('it-components:write');

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortField, setSortField] = useState<'name' | 'technology' | 'type' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTechnology, setFilterTechnology] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<ITComponentListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['it-components', page, rowsPerPage, sortField, sortOrder, search, filterType, filterTechnology],
    queryFn: () => getITComponents({ page, limit: rowsPerPage, sortBy: sortField, sortOrder, search, type: filterType, technology: filterTechnology }),
  });

  const { data: selectedItem } = useQuery({
    queryKey: ['it-component', selectedId],
    queryFn: () => getITComponent(selectedId!),
    enabled: !!selectedId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteITComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-components'] });
      setDeleteDialog(null);
      setAlert({ severity: 'success', message: t('it-components.alert.deleteSuccess') });
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setDeleteError(format409Message(t, err?.response?.data?.details?.applicationsCount || 0));
      } else {
        setAlert({ severity: 'error', message: t('it-components.alert.errors.serverError') });
        setDeleteDialog(null);
      }
    },
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const uniqueTypes = Array.from(new Set((data?.data || []).map((item) => item.type).filter((v): v is string => !!v)));
  const uniqueTech = Array.from(new Set((data?.data || []).map((item) => item.technology).filter((v): v is string => !!v)));

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={t('it-components.list.title')} />
        <LoadingSkeleton rows={5} columns={canWrite ? 6 : 5} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title={t('it-components.list.title')}
        subtitle={t('it-components.list.subtitle')}
        action={canWrite ? { label: t('it-components.list.addButton'), onClick: () => navigate('/it-components/new'), icon: <AddIcon /> } : undefined}
      />

      <ArkAlert open={!!alert} severity={alert?.severity || 'success'} message={alert?.message || ''} autoDismiss={5000} onClose={() => setAlert(null)} />

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder={t('it-components.list.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ minWidth: 250 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('it-components.list.filterType')}</InputLabel>
          <Select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} label={t('it-components.list.filterType')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            {uniqueTypes.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>{t('it-components.list.filterTechnology')}</InputLabel>
          <Select value={filterTechnology} onChange={(e) => { setFilterTechnology(e.target.value); setPage(1); }} label={t('it-components.list.filterTechnology')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            {uniqueTech.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {data?.data.length === 0 ? (
        <EmptyState
          title={t('it-components.list.emptyState.title')}
          description={t('it-components.list.emptyState.description')}
          action={canWrite ? { label: t('it-components.list.emptyState.cta'), onClick: () => navigate('/it-components/new') } : undefined}
        />
      ) : (
        <>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell><TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortOrder : 'asc'} onClick={() => handleSort('name')}>{t('it-components.list.columns.name')}</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortField === 'technology'} direction={sortField === 'technology' ? sortOrder : 'asc'} onClick={() => handleSort('technology')}>{t('it-components.list.columns.technology')}</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortField === 'type'} direction={sortField === 'type' ? sortOrder : 'asc'} onClick={() => handleSort('type')}>{t('it-components.list.columns.type')}</TableSortLabel></TableCell>
                  <TableCell>{t('it-components.list.columns.tags')}</TableCell>
                  <TableCell>{t('it-components.list.columns.applicationsCount')}</TableCell>
                  {canWrite && <TableCell align="right">{t('it-components.list.columns.actions')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <MuiLink
                        component={Link}
                        to={`/it-components/${item.id}`}
                        underline="always"
                        sx={{ color: 'inherit', '&:hover': { color: 'primary.main' } }}
                      >
                        {item.name}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{item.technology || '—'}</TableCell>
                    <TableCell>{item.type || '—'}</TableCell>
                    <TableCell>
                      <TagChipList
                        tags={(item.tags || []).map(t => ({ 
                          ...t.tagValue, 
                          dimensionColor: t.tagValue.dimensionColor ?? undefined 
                        }))}
                        maxVisible={3}
                        deduplicate={true}
                        showMoreButton={true}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item._count.applications}</TableCell>
                    {canWrite && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          aria-label={t('common.actions.edit')}
                          onClick={() => navigate(`/it-components/${item.id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label={t('common.actions.delete')}
                          onClick={() => { setDeleteDialog(item); setDeleteError(null); }}
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
            onPageChange={(_, p) => setPage(p + 1)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(1); }}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteDialog}
        title={t('it-components.delete.confirmTitle')}
        message={deleteError || t('it-components.delete.confirmMessage', { name: deleteDialog?.name })}
        confirmLabel={deleteError ? undefined : t('common.confirmDialog.confirmLabel')}
        cancelLabel={t('common.confirmDialog.cancelLabel')}
        onConfirm={deleteError ? () => {} : () => deleteMutation.mutate(deleteDialog!.id)}
        onCancel={() => { setDeleteDialog(null); setDeleteError(null); }}
        isLoading={deleteMutation.isPending}
        severity={deleteError ? 'error' : undefined}
      />

      <ITComponentDrawer
        itComponent={selectedItem ?? undefined}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </PageContainer>
  );
}
