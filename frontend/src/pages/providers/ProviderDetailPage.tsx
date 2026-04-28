import {
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Breadcrumbs,
  Link,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layout';
import { ConfirmDialog, ArkAlert } from '@/components/shared';
import { TagChipList } from '@/components/tags';
import { useProvider, useProviderApplications, useDeleteProvider } from '@/api/providers';
import { hasPermission } from '@/store/auth';
import ExpiryDateBadge from '@/components/providers/ExpiryDateBadge';
import ProviderRoleBadge from '@/components/providers/ProviderRoleBadge';
import { format409Message } from '@/utils/provider.utils';

interface AlertState {
  severity: 'success' | 'error' | 'warning';
  message: string;
}

export default function ProviderDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const canWrite = hasPermission('providers:write');

  const [tabIndex, setTabIndex] = useState(0);
  const [appPage, setAppPage] = useState(1);
  const [appRowsPerPage, setAppRowsPerPage] = useState(20);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Fetch provider
  const { data: provider, isLoading, error } = useProvider(id || '');

  // Fetch applications (lazy load when tab is active)
  const { data: appsData, isLoading: appsLoading } = useProviderApplications(
    id || '',
    { page: appPage, limit: appRowsPerPage },
    {
      enabled: !!id && tabIndex === 1,
    },
  );

  const deleteProvider = useDeleteProvider();

  // Handle 404 redirect
  useEffect(() => {
    if (error && (error as any).response?.status === 404) {
      navigate('/providers');
    }
  }, [error, navigate]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleAppPageChange = (_event: unknown, newPage: number) => {
    setAppPage(newPage + 1);
  };

  const handleAppRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAppRowsPerPage(parseInt(event.target.value, 10));
    setAppPage(1);
  };

  const handleEditClick = () => {
    if (id) {
      navigate(`/providers/${id}/edit`);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;

    try {
      await deleteProvider.mutateAsync(id);
      navigate('/providers', {
        state: {
          alert: {
            severity: 'success',
            message: t('providers.alert.deleteSuccess'),
          },
        },
      });
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.code === 'DEPENDENCY_CONFLICT') {
        const appCount = err.response?.data?.details?.applicationsCount ?? 0;
        setAlert({
          severity: 'error',
          message: format409Message(t, appCount),
        });
      } else {
        setAlert({
          severity: 'error',
          message: t('providers.alert.errors.serverError'),
        });
      }
    }
    setDeleteDialog(false);
  };

  const handleBackClick = () => {
    navigate('/providers');
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!provider) {
    return (
      <PageContainer>
        <Typography variant="h6" color="error">
          {t('providers.alert.errors.notFound')}
        </Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          onClick={() => navigate('/')}
          variant="body2"
          sx={{ cursor: 'pointer' }}
        >
          {t('providers.detail.breadcrumb.home')}
        </Link>
        <Link
          component="button"
          onClick={handleBackClick}
          variant="body2"
          sx={{ cursor: 'pointer' }}
        >
          {t('providers.detail.breadcrumb.list')}
        </Link>
        <Typography variant="body2">{provider.name}</Typography>
      </Breadcrumbs>

      {/* Title & Action Buttons */}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {provider.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackClick}
          >
            {t('providers.detail.buttonBack')}
          </Button>
          {canWrite && (
            <>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
              >
                {t('providers.detail.buttonEdit')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
              >
                {t('providers.detail.buttonDelete')}
              </Button>
            </>
          )}
        </Box>
      </Stack>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth">
          <Tab label={t('providers.detail.tabInfo')} />
          <Tab label={t('providers.detail.tabApplications')} />
        </Tabs>

        {/* Tab 0: General Info */}
        {tabIndex === 0 && (
          <Box sx={{ p: 3 }}>
            {provider.description && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t('providers.detail.descriptionLabel')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {provider.description}
                </Typography>
              </>
            )}

            {provider.comment && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t('providers.detail.commentLabel')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {provider.comment}
                </Typography>
              </>
            )}

            {provider.contractType && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t('providers.detail.contractTypeLabel')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {provider.contractType}
                </Typography>
              </>
            )}

            {provider.expiryDate && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t('providers.detail.expiryDateLabel')}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <ExpiryDateBadge date={provider.expiryDate} />
                </Box>
              </>
            )}

            {provider.tags && provider.tags.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('providers.detail.tagsLabel')}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <TagChipList
                    tags={provider.tags}
                    maxVisible={999}
                    deduplicate={true}
                    showMoreButton={false}
                    size="small"
                  />
                </Box>
              </>
            )}

            {/* Metadata */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {t('providers.detail.createdAtLabel')}
                  </Typography>
                  <Typography variant="body2">
                    {new Date(provider.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
                {provider.updatedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {t('providers.detail.updatedAtLabel')}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(provider.updatedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Box>
        )}

        {/* Tab 1: Applications */}
        {tabIndex === 1 && (
          <Box sx={{ p: 3 }}>
            {appsLoading && !appsData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : appsData?.data && appsData.data.length > 0 ? (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                        <TableCell>{t('applications.list.columns.name')}</TableCell>
                        <TableCell>{t('applications.list.columns.domain')}</TableCell>
                        <TableCell>{t('applications.list.columns.owner')}</TableCell>
                        <TableCell>{t('applications.list.columns.criticality')}</TableCell>
                        <TableCell>{t('applications.list.columns.providerRole')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appsData.data.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {app.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {app.domain?.name || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {app.owner
                                ? `${app.owner.firstName} ${app.owner.lastName}`
                                : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {app.criticality || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <ProviderRoleBadge role={app.providerRole} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                <TablePagination
                  rowsPerPageOptions={[10, 20, 50]}
                  component="div"
                  count={appsData.meta.total}
                  rowsPerPage={appRowsPerPage}
                  page={appPage - 1}
                  onPageChange={handleAppPageChange}
                  onRowsPerPageChange={handleAppRowsPerPageChange}
                />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('common.noData')}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <ConfirmDialog
          open={true}
          title={t('providers.delete.confirmTitle')}
          message={t('providers.delete.confirmMessage', { name: provider.name })}
          confirmLabel={t('common.actions.delete')}
          cancelLabel={t('common.actions.cancel')}
          severity="warning"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteDialog(false)}
          isLoading={deleteProvider.isPending}
        />
      )}

      {/* Error Alert */}
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
