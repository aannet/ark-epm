import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import AppBreadcrumbs from '@/components/shared/AppBreadcrumbs';
import { ApplicationForm } from '@/components/applications';
import { useApplication, useUpdateApplication } from '@/api/applications';
import { useDomains } from '@/api/domains';
import { useProviders } from '@/api/providers';
import { useITComponents } from '@/api/it-components';
import { useBusinessCapabilities } from '@/api/businessCapabilities';
import { useTagDimensions } from '@/hooks/useTagDimensions';
import { ApplicationFormValues } from '@/types/application';
import { tagsApi } from '@/api/tags';

const CRITICALITIES = ['low', 'medium', 'high', 'mission-critical'];
const LIFECYCLE_STATUSES = ['draft', 'in_progress', 'production', 'deprecated', 'retired'];

// Mock data for users (until APIs are ready)
const MOCK_USERS: { id: string; firstName: string; lastName: string }[] = [];

export default function ApplicationEditPage(): JSX.Element {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateApplication = useUpdateApplication(id || '');
  const { dimensions: availableDimensions } = useTagDimensions();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const { data: application, isLoading: isLoadingApp, error } = useApplication(id || '', {
    enabled: !!id,
  });
  const { data: domains, isLoading: isLoadingDomains } = useDomains();
  const { data: providersData, isLoading: isLoadingProviders } = useProviders({ limit: 200 });
  const { data: itComponentsData, isLoading: isLoadingItComponents } = useITComponents({ limit: 200 });
  const { data: capabilitiesData, isLoading: isLoadingCapabilities } = useBusinessCapabilities({ limit: 200 });

  // Map API responses to select options format
  const domainOptions = (domains?.data || []).map(d => ({ id: d.id, name: d.name }));
  const providerOptions = (providersData?.data || []).map(p => ({ id: p.id, name: p.name }));
  const itComponentOptions = (itComponentsData?.data || []).map(ic => ({ id: ic.id, name: ic.name }));
  const capabilityOptions = (capabilitiesData?.data || []).map(bc => ({ id: bc.id, name: bc.name }));

  useEffect(() => {
    if (error && (error as any)?.response?.status === 404) {
      navigate('/applications');
    }
  }, [error, navigate]);

  const handleSubmit = useCallback(
    async (values: ApplicationFormValues) => {
      setSubmitError(null);
      setFieldError(null);

      try {
        // First update the application
        await updateApplication.mutateAsync(values);

        // Then update the tags separately
        await tagsApi.setEntityTags('application', id!, values.tags.map((t) => t.id));

        navigate(`/applications/${id}`, {
          state: {
            alert: { severity: 'success', message: t('applications.alert.updated') },
          },
        });
      } catch (err) {
        const status = (err as any)?.response?.status;
        const code = (err as any)?.response?.data?.code;

        if (status === 409 && code === 'CONFLICT') {
          setFieldError(t('applications.form.nameDuplicate'));
        } else if (status >= 500) {
          setSubmitError(t('applications.alert.errors.serverError'));
        } else {
          setSubmitError(t('applications.alert.errors.unknown'));
        }
      }
    },
    [updateApplication, navigate, id, t]
  );

  const handleCancel = () => {
    navigate(`/applications/${id}`);
  };

  if (isLoadingApp || isLoadingDomains || isLoadingProviders || isLoadingItComponents || isLoadingCapabilities) {
    return (
      <PageContainer>
        <PageHeader title={t('applications.form.editTitle')} />
        <LoadingSkeleton rows={8} columns={1} />
      </PageContainer>
    );
  }

  if (!application) {
    return (
      <PageContainer>
        <PageHeader title={t('applications.form.editTitle')} />
        <ArkAlert
          open={true}
          severity="error"
          message={t('applications.alert.errors.notFound')}
          autoDismiss={undefined}
          onClose={() => navigate('/applications')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="sm">
      <AppBreadcrumbs
        items={[
          { label: t('applications.form.breadcrumb.home'), onClick: () => navigate('/') },
          { label: t('applications.form.breadcrumb.list'), onClick: () => navigate('/applications') },
          { label: application.name, onClick: () => navigate(`/applications/${id}`) },
          { label: t('common.actions.edit') },
        ]}
      />

      <PageHeader title={t('applications.form.editTitle')} />

      {submitError && (
        <Box sx={{ mb: 3 }}>
          <ArkAlert
            open={true}
            severity="error"
            message={submitError}
          autoDismiss={undefined}
            onClose={() => setSubmitError(null)}
          />
        </Box>
      )}

      <ApplicationForm
         entityId={id}
         initialValues={{
           name: application.name,
           description: application.description || '',
           comment: application.comment || '',
           domainId: application.domain?.id || null,
           providers: application.providers || [],
           itComponents: application.itComponents || [],
           capabilityIds: (application.businessCapabilities || []).map(bc => bc.id),
           ownerId: application.owner?.id || null,
           criticality: application.criticality,
           lifecycleStatus: application.lifecycleStatus,
           tags: application.tags,
         }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateApplication.isPending}
        error={submitError}
        fieldError={fieldError}
         availableOptions={{
           domains: domainOptions,
           providers: providerOptions,
           itComponents: itComponentOptions,
           businessCapabilities: capabilityOptions,
           users: MOCK_USERS,
           criticalities: CRITICALITIES,
           lifecycleStatuses: LIFECYCLE_STATUSES,
         }}
        availableDimensions={availableDimensions}
      />
    </PageContainer>
  );
}
