import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Stack,
  Autocomplete,
  TextField,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link,
  Button,
} from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import ArkAlert from '@/components/shared/ArkAlert';
import LifecycleStepper, { BcLifecyclePhase } from '@/components/shared/LifecycleStepper';
import BusinessCapabilityForm from '@/components/business-capabilities/BusinessCapabilityForm';
import {
  useBusinessCapability,
  useUpdateBusinessCapability,
  useBusinessCapabilityApplications,
  useBusinessCapabilitiesTree,
} from '@/api/businessCapabilities';
import { tagsApi, TagDimensionResponse } from '@/api/tags';
import { BusinessCapabilityFormValues, BusinessCapabilityListItem } from '@/types/businessCapability';
import { isDescendant, flattenTree } from '@/utils/businessCapability.utils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BusinessCapabilityEditPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [circularReferenceError, setCircularReferenceError] = useState(false);
  const [dimensions, setDimensions] = useState<TagDimensionResponse[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<BcLifecyclePhase | null>(null);
  const [lifecycleAlert, setLifecycleAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  const { data: capability, isLoading, error: fetchError } = useBusinessCapability(id || '');
  const { data: applicationsData } = useBusinessCapabilityApplications(id || '', { limit: 100 });
  const { data: treeData } = useBusinessCapabilitiesTree();
  const updateMutation = useUpdateBusinessCapability(id || '');

  const applications = applicationsData?.data || [];
  const tree = treeData || [];

  // Fetch tag dimensions
  useEffect(() => {
    tagsApi.getDimensions('business-capability').then((dims) => {
      setDimensions(dims);
    });
  }, []);

  // Initialize selectedParentId and selectedPhase from capability
  useEffect(() => {
    if (capability) {
      setSelectedParentId(capability.parentId);
      setSelectedPhase((capability.lifecycleStatus as BcLifecyclePhase) ?? null);
    }
  }, [capability]);

  // Redirect on 404
  useEffect(() => {
    if (fetchError) {
      navigate('/business-capabilities');
    }
  }, [fetchError, navigate]);

  // Get selectable parents (excluding self and descendants)
  const getSelectableParents = (): BusinessCapabilityListItem[] => {
    if (!tree.length || !id) return [];

    const flatList = flattenTree(tree);

    return flatList.filter((item) => {
      // Exclude self
      if (item.id === id) return false;
      // Exclude descendants
      if (isDescendant(tree, item.id, id)) return false;
      return true;
    });
  };

  const selectableParents = getSelectableParents();

  const handleSubmit = async (values: BusinessCapabilityFormValues) => {
    setError(null);
    setCircularReferenceError(false);

    try {
      // Don't send parentId in general tab update
      const { parentId: _parentId, ...updateData } = values;
      await updateMutation.mutateAsync(updateData);
      navigate(`/business-capabilities/${id}`, {
        state: { alert: { severity: 'success', message: t('businessCapabilities.snackbar.updated') } },
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;

      if (status === 409 && code === 'CONFLICT') {
        setError(t('businessCapabilities.form.nameDuplicate'));
      } else if (status === 400 && code === 'CIRCULAR_REFERENCE') {
        setError(t('businessCapabilities.form.circularReference'));
      } else {
        setError(t('common.snackbar.error'));
      }
    }
  };

  const handleParentChange = async (newParentId: string | null) => {
    setCircularReferenceError(false);

    try {
      await updateMutation.mutateAsync({ parentId: newParentId });
      setSelectedParentId(newParentId);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'CIRCULAR_REFERENCE') {
        setCircularReferenceError(true);
      }
    }
  };

  const handleLifecycleSave = async () => {
    setLifecycleAlert(null);
    try {
      await updateMutation.mutateAsync({ lifecycleStatus: selectedPhase ?? null });
      setLifecycleAlert({ severity: 'success', message: t('businessCapabilities.snackbar.lifecycleUpdated') });
    } catch {
      setLifecycleAlert({ severity: 'error', message: t('common.snackbar.error') });
    }
  };

  const handleCancel = () => {
    navigate(`/business-capabilities/${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="md">
        <LoadingSkeleton rows={6} columns={1} />
      </PageContainer>
    );
  }

  if (!capability) {
    return (
      <PageContainer maxWidth="md">
        <EmptyState
          title={t('errors.notFound.title')}
          description={t('errors.notFound.description')}
        />
      </PageContainer>
    );
  }

  const breadcrumbItems = [
    { label: t('businessCapabilities.form.breadcrumb.home'), onClick: () => navigate('/') },
    { label: t('businessCapabilities.form.breadcrumb.list'), onClick: () => navigate('/business-capabilities') },
    { label: capability.name, onClick: () => navigate(`/business-capabilities/${id}`) },
    { label: t('businessCapabilities.form.breadcrumb.edit') },
  ];

  return (
    <PageContainer maxWidth="md">
      <AppBreadcrumbs items={breadcrumbItems} />
      <PageHeader title={t('businessCapabilities.form.editTitle')} />

      <Tabs
        value={activeTab}
        onChange={(_e, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={t('businessCapabilities.form.tabs.general')} />
        <Tab label={t('businessCapabilities.form.tabs.relations')} />
        <Tab label={t('businessCapabilities.lifecycle.tabLabel')} />
        <Tab label={t('businessCapabilities.form.tabs.audit')} />
      </Tabs>

      {/* Tab: General */}
      <TabPanel value={activeTab} index={0}>
        <BusinessCapabilityForm
          initialValues={{
            name: capability.name,
            description: capability.description || '',
            comment: capability.comment || '',
            parentId: capability.parentId,
            domainId: capability.domainId,
            criticality: capability.criticality,
            technicalFit: capability.technicalFit,
            tags: capability.tags,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateMutation.isPending}
          error={error}
          availableDimensions={dimensions.map((d) => ({
            id: d.id,
            name: d.name,
            color: d.color || '#1976d2',
          }))}
          entityId={id}
          excludeParentId={id}
        />
      </TabPanel>

      {/* Tab: Relations */}
      <TabPanel value={activeTab} index={1}>
        <Stack spacing={4}>
          {/* Hierarchy Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('businessCapabilities.form.sections.hierarchy')}
            </Typography>
            <Autocomplete
              options={selectableParents}
              getOptionLabel={(option) => `${option.name} (L${option.level})`}
              value={selectableParents.find((p) => p.id === selectedParentId) || null}
              onChange={(_e, newValue) => handleParentChange(newValue?.id || null)}
              disabled={updateMutation.isPending}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('businessCapabilities.form.parent')}
                  placeholder={t('businessCapabilities.form.parentPlaceholder')}
                  error={circularReferenceError}
                  variant="outlined"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
            {circularReferenceError && (
              <FormHelperText error>
                {t('businessCapabilities.form.circularReference')}
              </FormHelperText>
            )}
          </Box>

          {/* Applications Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('businessCapabilities.form.sections.applications')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('businessCapabilities.form.relatedApplicationsCount', {
                count: capability._count.applicationMappings,
              })}
            </Typography>

            {applications.length > 0 ? (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('applications.list.columns.name')}</TableCell>
                      <TableCell>{t('applications.list.columns.domain')}</TableCell>
                      <TableCell>{t('applications.list.columns.owner')}</TableCell>
                      <TableCell>{t('applications.list.columns.criticality')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.map((app) => (
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
                        <TableCell>
                          {app.owner
                            ? `${app.owner.firstName} ${app.owner.lastName}`
                            : t('businessCapabilities.detail.noValue')}
                        </TableCell>
                        <TableCell>{app.criticality || t('businessCapabilities.detail.noValue')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('businessCapabilities.form.applicationsRelationHint')}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('businessCapabilities.form.noApplications')}
              </Typography>
            )}
          </Box>
        </Stack>
      </TabPanel>

      {/* Tab: Lifecycle */}
      <TabPanel value={activeTab} index={2}>
        <Stack spacing={3}>
          {lifecycleAlert && (
            <ArkAlert
              open
              severity={lifecycleAlert.severity}
              message={lifecycleAlert.message}
              autoDismiss={4000}
              onClose={() => setLifecycleAlert(null)}
            />
          )}
          <Typography variant="body2" color="text.secondary">
            {t('businessCapabilities.lifecycle.editDescription')}
          </Typography>
          <LifecycleStepper
            currentPhase={selectedPhase}
            editable
            onPhaseChange={(phase) => setSelectedPhase(phase)}
          />
          {selectedPhase !== null && (
            <Box>
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                onClick={() => setSelectedPhase(null)}
              >
                {t('businessCapabilities.lifecycle.clearButton')}
              </Button>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Button
              variant="contained"
              disabled={selectedPhase === (capability.lifecycleStatus as BcLifecyclePhase ?? null) || updateMutation.isPending}
              onClick={handleLifecycleSave}
            >
              {t('common.actions.save')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSelectedPhase((capability.lifecycleStatus as BcLifecyclePhase) ?? null)}
            >
              {t('common.actions.cancel')}
            </Button>
          </Box>
        </Stack>
      </TabPanel>

      {/* Tab: Audit */}
      <TabPanel value={activeTab} index={3}>
        <EmptyState
          title={t('businessCapabilities.form.audit.placeholder.title')}
          description={t('businessCapabilities.form.audit.placeholder.description')}
        />
      </TabPanel>
    </PageContainer>
  );
}
