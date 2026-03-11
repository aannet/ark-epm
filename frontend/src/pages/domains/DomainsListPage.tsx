import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { TagChipList } from '@/components/tags';
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
  const canWrite = hasPermission('domains:write');

  const { data: domains, isLoading, error } = useDomains();
  const deleteDomain = useDeleteDomain();

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [deleteDialog, setDeleteDialog] = useState<Domain | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);

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
  };

  const sortedDomains = useMemo(() => {
    if (!domains) return [];
    return [...domains].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'description') {
        const descA = a.description || '';
        const descB = b.description || '';
        if (descA === '' && descB !== '') return 1;
        if (descA !== '' && descB === '') return -1;
        comparison = descA.localeCompare(descB);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [domains, sortField, sortOrder]);

  const handleDeleteClick = (domain: Domain) => {
    setDeleteDialog(domain);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;
    try {
      await deleteDomain.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
      navigate('/domains', {
        state: {
          alert: { severity: 'success', message: t('domains.alert.deleted') },
        },
      });
      setAlert({ severity: 'success', message: t('domains.alert.deleted') });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 409 && code === 'DEPENDENCY_CONFLICT') {
        const appCount = err?.response?.data?.applicationsCount ?? 0;
        const bcCount = err?.response?.data?.businessCapabilitiesCount ?? 0;
        setDeleteDialog({
          ...deleteDialog,
          name: format409Message(t, appCount, bcCount),
        } as Domain);
      } else if (status && status >= 500) {
        setAlert({ severity: 'error', message: t('domains.alert.errors.serverError') });
      }
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/domains/${id}`);
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

  const isEmpty = !sortedDomains || sortedDomains.length === 0;
  const isDependencyConflict = deleteDialog && !deleteDialog.createdAt;

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
                <TableCell>
                  {t('domains.list.columns.tags')}
                </TableCell>
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
                  <TableCell align="right">
                    {t('domains.list.columns.actions')}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedDomains.map((domain) => (
                <TableRow
                  key={domain.id}
                  hover
                  onClick={() => handleRowClick(domain.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{domain.name}</TableCell>
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
                    <TableCell align="right">
                      <IconButton
                        aria-label={t('common.actions.edit')}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/domains/${domain.id}/edit`);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label={t('common.actions.delete')}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(domain);
                        }}
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

      <ConfirmDialog
        open={!!deleteDialog}
        title={t('domains.delete.confirmTitle')}
        message={isDependencyConflict 
          ? (deleteDialog?.name || '') 
          : t('domains.delete.confirmMessage', { name: deleteDialog?.name })
        }
        confirmLabel={isDependencyConflict ? undefined : t('common.confirmDialog.confirmLabel')}
        cancelLabel={t('common.confirmDialog.cancelLabel')}
        onConfirm={isDependencyConflict ? () => {} : handleDeleteConfirm}
        onCancel={() => setDeleteDialog(null)}
        isLoading={deleteDomain.isPending}
        severity={isDependencyConflict ? 'error' : undefined}
      />
    </PageContainer>
  );
}
