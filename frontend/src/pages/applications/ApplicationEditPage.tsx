import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import { ApplicationForm } from '@/components/applications';
import { useApplication, useUpdateApplication } from '@/api/applications';
import { useDomains } from '@/api/domains';
import { useTagDimensions } from '@/hooks/useTagDimensions';
import { ApplicationFormValues } from '@/types/application';
import { tagsApi } from '@/api/tags';

const CRITICALITIES = ['low', 'medium', 'high', 'mission-critical'];
const LIFECYCLE_STATUSES = ['draft', 'in_progress', 'production', 'deprecated', 'retired'];

// Mock data for providers and users (until APIs are ready)
const MOCK_PROVIDERS: { id: string; name: string }[] = [];
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
      } catch (err: any) {
        const status = err?.response?.status;
        const code = err?.response?.data?.code;

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

  if (isLoadingApp || isLoadingDomains) {
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
          providerId: application.provider?.id || null,
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
          domains: domains || [],
          providers: MOCK_PROVIDERS,
          users: MOCK_USERS,
          criticalities: CRITICALITIES,
          lifecycleStatuses: LIFECYCLE_STATUSES,
        }}
        availableDimensions={availableDimensions}
      />
    </PageContainer>
  );
}
