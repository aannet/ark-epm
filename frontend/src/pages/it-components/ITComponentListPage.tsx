import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, IconButton, TableSortLabel, Link as MuiLink,
  TextField, MenuItem, Box, FormControl, InputLabel, Select,
  InputAdornment, Drawer, Typography, Tabs, Tab, Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getITComponents, deleteITComponent, getITComponent, getITComponentApplications
} from '@/services/api/it-components.api';
import { hasPermission } from '@/store/auth';
import { ITComponentListItem } from '@/types/it-component';
import { format409Message, formatDateTime } from '@/utils/it-components.utils';

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState(0);
  const [appsPage, setAppsPage] = useState(0);
  
  const [deleteDialog, setDeleteDialog] = useState<ITComponentListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['it-components', page, rowsPerPage, sortField, sortOrder, search, filterType, filterTechnology],
    queryFn: () => getITComponents({ page, limit: rowsPerPage, sortBy: sortField, sortOrder, search, type: filterType, technology: filterTechnology }),
  });

  const { data: selectedItem } = useQuery({
    queryKey: ['it-component', selectedId],
    queryFn: () => selectedId ? getITComponent(selectedId) : null,
    enabled: !!selectedId,
  });

  const { data: appsData } = useQuery({
    queryKey: ['it-component-apps', selectedId, appsPage],
    queryFn: () => selectedId ? getITComponentApplications(selectedId, { page: appsPage + 1, limit: 5 }) : null,
    enabled: !!selectedId && drawerTab === 1,
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

  const handleRowClick = (id: string, isName: boolean) => {
    if (isName) {
      navigate(`/it-components/${id}`);
    } else {
      setSelectedId(id);
      setDrawerOpen(true);
      setDrawerTab(0);
      setAppsPage(0);
    }
  };

  const uniqueTypes = Array.from(new Set((data?.data || []).map(item => item.type).filter((t): t is string => !!t)));
  const uniqueTech = Array.from(new Set((data?.data || []).map(item => item.technology).filter((t): t is string => !!t)));

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
            {uniqueTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>{t('it-components.list.filterTechnology')}</InputLabel>
          <Select value={filterTechnology} onChange={(e) => { setFilterTechnology(e.target.value); setPage(1); }} label={t('it-components.list.filterTechnology')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            {uniqueTech.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                  <TableCell><TableSortLabel active={sortField === 'name'} direction={sortOrder} onClick={() => handleSort('name')}>{t('it-components.list.columns.name')}</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortField === 'technology'} direction={sortOrder} onClick={() => handleSort('technology')}>{t('it-components.list.columns.technology')}</TableSortLabel></TableCell>
                  <TableCell><TableSortLabel active={sortField === 'type'} direction={sortOrder} onClick={() => handleSort('type')}>{t('it-components.list.columns.type')}</TableSortLabel></TableCell>
                  <TableCell>{t('it-components.list.columns.tags')}</TableCell>
                  <TableCell>{t('it-components.list.columns.applicationsCount')}</TableCell>
                  {canWrite && <TableCell align="right">{t('it-components.list.columns.actions')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data.map((item) => (
                  <TableRow key={item.id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell onClick={(e) => { e.stopPropagation(); handleRowClick(item.id, true); }}>
                      <MuiLink component={Link} to={`/it-components/${item.id}`} underline="always" sx={{ color: 'inherit', '&:hover': { color: 'primary.main' } }}>{item.name}</MuiLink>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(item.id, false)}>{item.technology || '—'}</TableCell>
                    <TableCell onClick={() => handleRowClick(item.id, false)}>{item.type || '—'}</TableCell>
                    <TableCell onClick={() => handleRowClick(item.id, false)}>
                      <Typography variant="caption">{item.tags?.length ? `${item.tags.length} tag(s)` : '—'}</Typography>
                    </TableCell>
                    <TableCell onClick={() => handleRowClick(item.id, false)}>{item._count.applications}</TableCell>
                    {canWrite && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton onClick={() => navigate(`/it-components/${item.id}/edit`)}><EditIcon /></IconButton>
                        <IconButton onClick={() => { setDeleteDialog(item); setDeleteError(null); }}><EditIcon /></IconButton>
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

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 400 } }}>
        {selectedItem && (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{t('it-components.drawer.title')}</Typography>
              <IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon /></IconButton>
            </Box>
            <Tabs value={drawerTab} onChange={(_, v) => setDrawerTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label={t('it-components.drawer.tabInfo')} />
              <Tab label={`${t('it-components.drawer.tabApplications')} (${selectedItem._count.applications})`} />
            </Tabs>
            <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
              {drawerTab === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.nameLabel')}</Typography><Typography fontWeight={600}>{selectedItem.name}</Typography></Box>
                  <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.technologyLabel')}</Typography><Typography>{selectedItem.technology || '—'}</Typography></Box>
                  <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.typeLabel')}</Typography><Typography>{selectedItem.type || '—'}</Typography></Box>
                  <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.descriptionLabel')}</Typography><Typography variant="body2" color="text.secondary">{selectedItem.description || '—'}</Typography></Box>
                  <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.tagsLabel')}</Typography><Typography variant="caption">{selectedItem.tags?.length ? `${selectedItem.tags.length} tag(s)` : '—'}</Typography></Box>
                  <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.applicationsCountLabel')}</Typography><Typography>{selectedItem._count.applications}</Typography></Box>
                  <Typography variant="caption" color="text.secondary">{t('it-components.detail.createdAtLabel')}: {formatDateTime(selectedItem.createdAt)}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('it-components.detail.updatedAtLabel')}: {formatDateTime(selectedItem.updatedAt)}</Typography>
                </Box>
              ) : (
                appsData?.data.length ? (
                  <>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead><TableRow><TableCell>{t('applications.list.columns.name')}</TableCell><TableCell>{t('applications.list.columns.domain')}</TableCell></TableRow></TableHead>
                        <TableBody>{appsData.data.map(app => <TableRow key={app.id}><TableCell>{app.name}</TableCell><TableCell>{app.domain?.name || '—'}</TableCell></TableRow>)}</TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination component="div" count={appsData.meta.total} page={appsPage} rowsPerPage={5} rowsPerPageOptions={[5]} onPageChange={(_, p) => setAppsPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`} />
                  </>
                ) : <EmptyState title={t('it-components.drawer.noApplications')} />
              )}
            </Box>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="contained" onClick={() => { setDrawerOpen(false); navigate(`/it-components/${selectedItem.id}/edit`); }} disabled={!canWrite}>{t('it-components.drawer.buttonEdit')}</Button>
              <Button variant="outlined" onClick={() => { setDrawerOpen(false); navigate(`/it-components/${selectedItem.id}`); }} endIcon={<ArrowForwardIcon />}>{t('it-components.drawer.buttonViewDetail')}</Button>
            </Box>
          </>
        )}
      </Drawer>
    </PageContainer>
  );
}
