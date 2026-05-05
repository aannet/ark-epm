import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PageContainer } from '@/components/layout';
import {
  ArkAlert,
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  RowActionsMenu,
} from '@/components/shared';
import { useDeleteUser, useUsers } from '@/api/users';
import { hasPermission } from '@/store/auth';
import { UserResponse } from '@/types/auth';

interface AlertState {
  severity: 'success' | 'error';
  message: string;
}

export default function UserListPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const canWrite = hasPermission('users:write');

  const { data: users, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();

  const [alert, setAlert] = useState<AlertState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<UserResponse | null>(null);

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'alert' in location.state) {
      const state = location.state as { alert?: AlertState };
      if (state.alert) {
        setAlert(state.alert);
        window.history.replaceState({}, '');
      }
    }
  }, [location.state]);

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) {
      return;
    }

    try {
      await deleteUser.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
      setAlert({ severity: 'success', message: t('users.alert.deactivated') });
    } catch {
      setAlert({ severity: 'error', message: t('errors.unexpected.description') });
    }
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title={t('users.list.title')} />
        <LoadingSkeleton rows={5} columns={7} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader title={t('users.list.title')} />
        <EmptyState
          title={t('errors.unexpected.title')}
          description={t('errors.unexpected.description')}
        />
      </PageContainer>
    );
  }

  const isEmpty = !users || users.length === 0;

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title={t('users.list.title')}
        subtitle={t('users.list.subtitle')}
        action={
          canWrite
            ? {
                label: t('users.list.addButton'),
                onClick: () => navigate('/users/new'),
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
          title={t('users.list.emptyState.title')}
          description={t('users.list.emptyState.description')}
          action={
            canWrite
              ? {
                  label: t('users.list.emptyState.cta'),
                  onClick: () => navigate('/users/new'),
                }
              : undefined
          }
        />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                <TableCell>{t('users.list.columns.name')}</TableCell>
                <TableCell>{t('users.list.columns.email')}</TableCell>
                <TableCell>{t('users.list.columns.role')}</TableCell>
                <TableCell>{t('users.list.columns.domains')}</TableCell>
                <TableCell>{t('users.list.columns.status')}</TableCell>
                <TableCell>{t('users.list.columns.createdAt')}</TableCell>
                {canWrite ? <TableCell align="right">{t('users.list.columns.actions')}</TableCell> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ');

                return (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <MuiLink
                        component={Link}
                        to={`/users/${user.id}`}
                        underline="hover"
                        sx={{ color: 'inherit', fontWeight: 600 }}
                      >
                        {displayName || user.email}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role?.name ?? t('common.noData')}</TableCell>
                    <TableCell>
                      {user.domainIds.length === 0 ? (
                        <Chip label={t('users.scope.global')} size="small" variant="outlined" />
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.domains.map((domain) => (
                            <Chip key={domain.id} size="small" label={domain.name} />
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={user.isActive ? 'success' : 'default'}
                        label={user.isActive ? t('common.status.active') : t('common.status.inactive')}
                      />
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                    {canWrite ? (
                      <TableCell align="right">
                        <RowActionsMenu
                          onEdit={() => navigate(`/users/${user.id}`)}
                          onDelete={() => setDeleteDialog(user)}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={!!deleteDialog}
        title={t('users.delete.confirmTitle')}
        message={t('users.delete.confirmMessage', { email: deleteDialog?.email ?? '' })}
        confirmLabel={t('common.actions.delete')}
        cancelLabel={t('common.actions.cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog(null)}
        isLoading={deleteUser.isPending}
      />
    </PageContainer>
  );
}
