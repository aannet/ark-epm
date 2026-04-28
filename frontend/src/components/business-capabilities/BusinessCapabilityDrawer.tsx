import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Skeleton,
  Divider,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useBusinessCapability, useBusinessCapabilityApplications, useBusinessCapabilitiesTree } from '@/api/businessCapabilities';
import { hasPermission } from '@/store/auth';
import { TagChipList } from '@/components/tags';
import CriticalityChip from './CriticalityChip';
import TechnicalFitChip from './TechnicalFitChip';
import AppLifecycleBreakdown from './AppLifecycleBreakdown';
import { buildHierarchyPath } from '@/utils/businessCapability.utils';

interface BusinessCapabilityDrawerProps {
  capabilityId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function BusinessCapabilityDrawer({
  capabilityId,
  open,
  onClose,
}: BusinessCapabilityDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('business-capabilities:write');
  const [activeTab, setActiveTab] = useState(0);

  const { data: capability, isLoading } = useBusinessCapability(capabilityId || '', {
    enabled: !!capabilityId,
  });

  const { data: applicationsData, isLoading: isLoadingApps } = useBusinessCapabilityApplications(
    capabilityId || '',
    { limit: 100 },
    { enabled: !!capabilityId }
  );
  const applications = applicationsData?.data || [];

  const { data: treeData } = useBusinessCapabilitiesTree();
  const tree = treeData || [];

  // Build hierarchy path for breadcrumb
  const hierarchyPath = capabilityId && tree.length > 0 
    ? buildHierarchyPath(tree, capabilityId) 
    : [];

  const handleViewDetails = () => {
    if (capabilityId) {
      navigate(`/business-capabilities/${capabilityId}`);
    }
  };

  const handleEdit = () => {
    if (capabilityId) {
      navigate(`/business-capabilities/${capabilityId}/edit`);
    }
  };

  const handleClose = () => {
    setActiveTab(0);
    onClose();
  };

  const handleBreadcrumbClick = (id: string) => {
    navigate(`/business-capabilities/${id}`);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{ paper: { sx: { width: 400, backgroundColor: 'background.paper' } } }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
              {isLoading ? <Skeleton width={200} /> : capability?.name}
            </Typography>
            {!isLoading && capability && (
              <Typography variant="caption" color="text.secondary">
                {t('businessCapabilities.common.levelWithValue', { level: capability.level })}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleClose}
            aria-label={t('businessCapabilities.drawer.close')}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Hierarchy Breadcrumb */}
        {!isLoading && hierarchyPath.length > 1 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {t('businessCapabilities.drawer.hierarchy')}
            </Typography>
            <Breadcrumbs separator="›" sx={{ '& .MuiBreadcrumbs-separator': { mx: 0.5 } }}>
              {hierarchyPath.slice(0, -1).map((ancestor) => (
                <Link
                  key={ancestor.id}
                  component="button"
                  variant="caption"
                  underline="hover"
                  onClick={() => handleBreadcrumbClick(ancestor.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  {ancestor.name}
                </Link>
              ))}
              <Typography variant="caption" color="text.primary">
                {capability?.name}
              </Typography>
            </Breadcrumbs>
          </Box>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label={t('businessCapabilities.drawer.tabs.info')} />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {t('businessCapabilities.drawer.tabs.applications')}
                {capability && (
                  <Chip
                    label={capability._count.applicationMappings}
                    size="small"
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="text" height={30} width="80%" />
              <Skeleton variant="text" height={20} width="60%" />
              <Skeleton variant="rectangular" height={80} />
            </Box>
          ) : capability ? (
            <>
              {/* Tab: Info */}
              {activeTab === 0 && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('businessCapabilities.form.nameLabel')}
                    </Typography>
                    <Typography variant="body1">{capability.name}</Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('businessCapabilities.form.description')}
                    </Typography>
                    <Typography variant="body1">
                      {capability.description || t('businessCapabilities.detail.noValue')}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('businessCapabilities.form.domain')}
                    </Typography>
                    <Typography variant="body1">
                      {capability.domain?.name || t('businessCapabilities.detail.noValue')}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('businessCapabilities.form.criticality')}
                    </Typography>
                    {capability.criticality ? (
                      <CriticalityChip level={capability.criticality} />
                    ) : (
                      <Typography variant="body1">{t('businessCapabilities.detail.noValue')}</Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('businessCapabilities.form.technicalFit')}
                    </Typography>
                    {capability.technicalFit ? (
                      <TechnicalFitChip level={capability.technicalFit} />
                    ) : (
                      <Typography variant="body1">{t('businessCapabilities.detail.noValue')}</Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('businessCapabilities.detail.tags')}
                    </Typography>
                    {capability.tags && capability.tags.length > 0 ? (
                      <TagChipList
                        tags={capability.tags}
                        maxVisible={10}
                        deduplicate={true}
                        showMoreButton={true}
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('businessCapabilities.detail.noValue')}
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {/* Tab: Applications */}
              {activeTab === 1 && (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('businessCapabilities.drawer.applicationFootprint')}
                    </Typography>
                    <Typography variant="h4" sx={{ mb: 2 }}>
                      {capability._count.applicationMappings}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {t('businessCapabilities.drawer.applicationsByLifecycle')}
                    </Typography>
                    {isLoadingApps ? (
                      <Skeleton variant="rectangular" height={80} />
                    ) : (
                      <AppLifecycleBreakdown applications={applications} />
                    )}
                  </Box>

                  {applications.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('applications.list.columns.name')}</TableCell>
                            <TableCell>{t('applications.list.columns.domain')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {applications.slice(0, 5).map((app) => (
                            <TableRow key={app.id}>
                              <TableCell>
                                <Link
                                  component="button"
                                  variant="body2"
                                  onClick={() => navigate(`/applications/${app.id}`)}
                                  sx={{ cursor: 'pointer', textAlign: 'left' }}
                                >
                                  {app.name}
                                </Link>
                              </TableCell>
                              <TableCell>{app.domain?.name || t('businessCapabilities.detail.noValue')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {applications.length > 5 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {t('businessCapabilities.drawer.moreApplications', {
                            count: applications.length - 5,
                          })}
                        </Typography>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          ) : null}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            mt: 2,
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="outlined" onClick={handleViewDetails} disabled={isLoading || !capability}>
            {t('businessCapabilities.drawer.viewFullButton')}
          </Button>
          <Button
            variant="contained"
            onClick={handleEdit}
            disabled={isLoading || !capability || !canWrite}
          >
            {t('businessCapabilities.drawer.editButton')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
