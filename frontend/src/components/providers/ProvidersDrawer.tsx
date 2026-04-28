import {
  Drawer,
  Box,
  IconButton,
  Tabs,
  Tab,
  Button,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TagChipList } from '@/components/tags';
import { useProvider, useProviderApplications } from '@/api/providers';
import { hasPermission } from '@/store/auth';
import ExpiryDateBadge from './ExpiryDateBadge';
import ProviderRoleBadge from './ProviderRoleBadge';

interface ProvidersDrawerProps {
  providerId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function ProvidersDrawer({ providerId, open, onClose }: ProvidersDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('providers:write');

  const [tabIndex, setTabIndex] = useState(0);
  const [appPage, setAppPage] = useState(1);
  const [appRowsPerPage, setAppRowsPerPage] = useState(5);

  // Fetch provider data (enabled only when drawer is open)
  const { data: provider, isLoading } = useProvider(providerId || '', {
    enabled: open && !!providerId,
  });

  // Fetch applications (lazy load when Applications tab is active)
  const { data: appsData, isLoading: appsLoading } = useProviderApplications(
    providerId || '',
    { page: appPage, limit: appRowsPerPage },
    {
      enabled: open && !!providerId && tabIndex === 1,
    },
  );

  const handleClose = () => {
    setTabIndex(0);
    setAppPage(1);
    onClose();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleEditClick = () => {
    if (providerId) {
      handleClose();
      navigate(`/providers/${providerId}/edit`);
    }
  };

  const handleViewDetailsClick = () => {
    if (providerId) {
      handleClose();
      navigate(`/providers/${providerId}`);
    }
  };

  const handleAppPageChange = (_event: unknown, newPage: number) => {
    setAppPage(newPage + 1);
  };

  const handleAppRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAppRowsPerPage(parseInt(event.target.value, 10));
    setAppPage(1);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: 400,
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">
          {isLoading ? '...' : provider?.name || t('providers.drawer.title')}
        </Typography>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content (scrollable) */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : provider ? (
          <>
            {/* Tabs */}
            <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth">
              <Tab label={t('providers.drawer.tabInfo')} />
              <Tab label={t('providers.drawer.tabApplications')} />
            </Tabs>

            {/* Tab 0: Informations */}
            {tabIndex === 0 && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {t('providers.list.columns.name')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {provider.name}
                  </Typography>
                </Box>

                {provider.description && (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('providers.detail.descriptionLabel')}
                      </Typography>
                      <Typography variant="body2">{provider.description}</Typography>
                    </Box>
                  </>
                )}

                {provider.comment && (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('providers.detail.commentLabel')}
                      </Typography>
                      <Typography variant="body2">{provider.comment}</Typography>
                    </Box>
                  </>
                )}

                {provider.contractType && (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('providers.drawer.contractType')}
                      </Typography>
                      <Typography variant="body2">{provider.contractType}</Typography>
                    </Box>
                  </>
                )}

                {provider.expiryDate && (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('providers.drawer.expiryDate')}
                      </Typography>
                      <ExpiryDateBadge date={provider.expiryDate} />
                    </Box>
                  </>
                )}

                {provider.tags && provider.tags.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {t('providers.detail.tagsLabel')}
                      </Typography>
                      <TagChipList
                        tags={provider.tags}
                        maxVisible={10}
                        deduplicate={true}
                        showMoreButton={true}
                        size="small"
                      />
                    </Box>
                  </>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Metadata */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {t('providers.detail.createdAtLabel')}
                  </Typography>
                  <Typography variant="caption">
                    {new Date(provider.createdAt).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>

                {provider.updatedAt && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {t('providers.detail.updatedAtLabel')}
                    </Typography>
                    <Typography variant="caption">
                      {new Date(provider.updatedAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Tab 1: Applications */}
            {tabIndex === 1 && (
              <Box>
                {appsLoading && !appsData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : appsData?.data && appsData.data.length > 0 ? (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                            <TableCell>{t('applications.list.columns.name')}</TableCell>
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
                                <ProviderRoleBadge role={app.providerRole} size="small" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 20]}
                      count={appsData.meta.total}
                      rowsPerPage={appRowsPerPage}
                      page={appPage - 1}
                      onPageChange={handleAppPageChange}
                      onRowsPerPageChange={handleAppRowsPerPageChange}
                    />
                  </>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('common.noData')}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        ) : null}
      </Box>

      {/* Footer */}
      {provider && (
        <Box
          sx={{
            pt: 2,
            px: 2,
            pb: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={handleViewDetailsClick}
            disabled={isLoading}
          >
            {t('providers.drawer.buttonViewDetail')}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleEditClick}
            disabled={isLoading || !canWrite}
          >
            {t('providers.drawer.buttonEdit')}
          </Button>
        </Box>
      )}
    </Drawer>
  );
}
