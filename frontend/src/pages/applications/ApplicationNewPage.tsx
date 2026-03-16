import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import ArkAlert from '@/components/shared/ArkAlert';
import { ApplicationForm } from '@/components/applications';
import { useCreateApplication } from '@/api/applications';
import { useDomains } from '@/api/domains';
import { ApplicationFormValues } from '@/types/application';
import { tagsApi } from '@/api/tags';

// Hardcoded dimensions for now
const AVAILABLE_DIMENSIONS = [
  { id: 'geography-dim', name: 'Geography', color: '#2196F3' },
  { id: 'brand-dim', name: 'Brand', color: '#9C27B0' },
  { id: 'legal-dim', name: 'LegalEntity', color: '#FF9800' },
];

const CRITICALITIES = ['low', 'medium', 'high', 'mission-critical'];
const LIFECYCLE_STATUSES = ['draft', 'in_progress', 'production', 'deprecated', 'retired'];

// Mock data for providers and users (until APIs are ready)
const MOCK_PROVIDERS: { id: string; name: string }[] = [];
const MOCK_USERS: { id: string; firstName: string; lastName: string }[] = [];

export default function ApplicationNewPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createApplication = useCreateApplication();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const { data: domains, isLoading: isLoadingDomains } = useDomains();

  const handleSubmit = useCallback(
    async (values: ApplicationFormValues) => {
      setSubmitError(null);
      setFieldError(null);

      try {
        // First create the application
        const application = await createApplication.mutateAsync(values);

        // Then save the tags separately
        if (values.tags.length > 0) {
          await tagsApi.setEntityTags('application', application.id, values.tags.map((t) => t.id));
        }

        navigate(`/applications/${application.id}`, {
          state: {
            alert: { severity: 'success', message: t('applications.alert.created') },
          },
        });
      } catch (err: any) {
        const status = err?.response?.status;
        const code = err?.response?.data?.code;

        if (status === 409 && code === 'CONFLICT') {
          setFieldError(t('applications.form.nameDuplicate'));
        } else if (status === 400) {
          setFieldError(t('applications.form.nameRequired'));
        } else if (status >= 500) {
          setSubmitError(t('applications.alert.errors.serverError'));
        } else {
          setSubmitError(t('applications.alert.errors.unknown'));
        }
      }
    },
    [createApplication, navigate, t]
  );

  const handleCancel = () => {
    navigate('/applications');
  };

  if (isLoadingDomains) {
    return (
      <PageContainer>
        <PageHeader title={t('applications.form.createTitle')} />
        <LoadingSkeleton rows={8} columns={1} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="sm">
      <PageHeader title={t('applications.form.createTitle')} />

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
        initialValues={{
          name: '',
          description: '',
          comment: '',
          domainId: null,
          providerId: null,
          ownerId: null,
          criticality: null,
          lifecycleStatus: null,
          tags: [],
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createApplication.isPending}
        error={submitError}
        fieldError={fieldError}
        availableOptions={{
          domains: domains || [],
          providers: MOCK_PROVIDERS,
          users: MOCK_USERS,
          criticalities: CRITICALITIES,
          lifecycleStatuses: LIFECYCLE_STATUSES,
        }}
        availableDimensions={AVAILABLE_DIMENSIONS}
      />
    </PageContainer>
  );
}
