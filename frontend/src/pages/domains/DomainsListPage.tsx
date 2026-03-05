import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useDomains, useDeleteDomain } from '@/api/domains';
import { hasPermission } from '@/store/auth';
import { Domain } from '@/types/domain';

export default function DomainsListPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('domains:write');

  const { data: domains, isLoading, error } = useDomains();
  const deleteDomain = useDeleteDomain();

  const [deleteDialog, setDeleteDialog] = useState<Domain | null>(null);

  const handleDeleteClick = (domain: Domain) => {
    setDeleteDialog(domain);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;
    try {
      await deleteDomain.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch (err) {
      // Error handled by query
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/domains/${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={t('domains.list.title')} />
        <LoadingSkeleton rows={5} columns={canWrite ? 4 : 3} />
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

  const isEmpty = !domains || domains.length === 0;

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
                  <TableSortLabel active direction="asc">
                    {t('domains.list.columns.name')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>{t('domains.list.columns.description')}</TableCell>
                <TableCell>{t('domains.list.columns.createdAt')}</TableCell>
                {canWrite && (
                  <TableCell align="right">
                    {t('domains.list.columns.actions')}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {domains.map((domain) => (
                <TableRow
                  key={domain.id}
                  hover
                  onClick={() => handleRowClick(domain.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{domain.name}</TableCell>
                  <TableCell>{domain.description || '—'}</TableCell>
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
        message={t('domains.delete.confirmMessage', {
          name: deleteDialog?.name,
        })}
        confirmLabel={t('common.confirmDialog.confirmLabel')}
        cancelLabel={t('common.confirmDialog.cancelLabel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog(null)}
        isLoading={deleteDomain.isPending}
      />
    </PageContainer>
  );
}
