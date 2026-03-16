import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  Stack,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { ApplicationFormValues } from '@/types/application';
import { DimensionTagInput } from '@/components/tags';
import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';

interface DimensionOption {
  id: string;
  name: string;
  color: string;
}

interface SelectOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface ApplicationFormProps {
  initialValues?: Partial<ApplicationFormValues>;
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  fieldError?: string | null;
  availableOptions: {
    domains: SelectOption[];
    providers: SelectOption[];
    users: UserOption[];
    criticalities: string[];
    lifecycleStatuses: string[];
  };
  availableDimensions?: DimensionOption[];
  entityId?: string;
}

export default function ApplicationForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
  fieldError,
  availableOptions,
  availableDimensions = [],
  entityId,
}: ApplicationFormProps): JSX.Element {
  const { t } = useTranslation();

  const [values, setValues] = useState<ApplicationFormValues>({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    comment: initialValues?.comment || '',
    domainId: initialValues?.domainId || null,
    providerId: initialValues?.providerId || null,
    ownerId: initialValues?.ownerId || null,
    criticality: initialValues?.criticality || null,
    lifecycleStatus: initialValues?.lifecycleStatus || null,
    tags: initialValues?.tags || [],
  });

  const handleChange = useCallback(
    (field: keyof ApplicationFormValues, value: string | null) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleDimensionTagsChange = useCallback(
    (dimensionName: string, dimensionTags: TagValueResponse[]) => {
      setValues((prev) => {
        const tagsWithoutDimension = prev.tags.filter(
          (tag) => tag.dimensionName !== dimensionName
        );
        return {
          ...prev,
          tags: [...tagsWithoutDimension, ...dimensionTags],
        };
      });
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          name="name"
          label={t('applications.form.nameLabel')}
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          fullWidth
          disabled={isLoading}
          error={!!error || !!fieldError}
          helperText={fieldError || error || undefined}
        />

        <TextField
          name="description"
          label={t('applications.form.descriptionLabel')}
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
          fullWidth
          multiline
          rows={3}
          disabled={isLoading}
        />

        <TextField
          name="comment"
          label={t('applications.form.commentLabel')}
          value={values.comment}
          onChange={(e) => handleChange('comment', e.target.value)}
          fullWidth
          multiline
          rows={2}
          disabled={isLoading}
        />

        <FormControl fullWidth disabled={isLoading}>
          <InputLabel id="domain-label">{t('applications.form.domainLabel')}</InputLabel>
          <Select
            labelId="domain-label"
            value={values.domainId || ''}
            label={t('applications.form.domainLabel')}
            onChange={(e) => handleChange('domainId', e.target.value || null)}
          >
            <MenuItem value="">
              <em>{t('applications.detail.noValue')}</em>
            </MenuItem>
            {availableOptions.domains.map((domain) => (
              <MenuItem key={domain.id} value={domain.id}>
                {domain.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={isLoading}>
          <InputLabel id="provider-label">{t('applications.form.providerLabel')}</InputLabel>
          <Select
            labelId="provider-label"
            value={values.providerId || ''}
            label={t('applications.form.providerLabel')}
            onChange={(e) => handleChange('providerId', e.target.value || null)}
          >
            <MenuItem value="">
              <em>{t('applications.detail.noValue')}</em>
            </MenuItem>
            {availableOptions.providers.map((provider) => (
              <MenuItem key={provider.id} value={provider.id}>
                {provider.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={isLoading}>
          <InputLabel id="owner-label">{t('applications.form.ownerLabel')}</InputLabel>
          <Select
            labelId="owner-label"
            value={values.ownerId || ''}
            label={t('applications.form.ownerLabel')}
            onChange={(e) => handleChange('ownerId', e.target.value || null)}
          >
            <MenuItem value="">
              <em>{t('applications.detail.noValue')}</em>
            </MenuItem>
            {availableOptions.users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('applications.form.criticalityLabel')}
          </Typography>
          <RadioGroup
            row
            value={values.criticality || ''}
            onChange={(e) => handleChange('criticality', e.target.value || null)}
          >
            <FormControlLabel
              value=""
              control={<Radio />}
              label={t('applications.detail.noValue')}
              disabled={isLoading}
            />
            {availableOptions.criticalities.map((criticality) => (
              <FormControlLabel
                key={criticality}
                value={criticality}
                control={<Radio />}
                label={t(`applications.criticality.${criticality}`)}
                disabled={isLoading}
              />
            ))}
          </RadioGroup>
        </Box>

        <FormControl fullWidth disabled={isLoading}>
          <InputLabel id="lifecycle-status-label">
            {t('applications.form.lifecycleStatusLabel')}
          </InputLabel>
          <Select
            labelId="lifecycle-status-label"
            value={values.lifecycleStatus || ''}
            label={t('applications.form.lifecycleStatusLabel')}
            onChange={(e) => handleChange('lifecycleStatus', e.target.value || null)}
          >
            <MenuItem value="">
              <em>{t('applications.detail.noValue')}</em>
            </MenuItem>
            {availableOptions.lifecycleStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {t(`applications.lifecycle.${status}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {availableDimensions.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('applications.form.tagsLabel')}
            </Typography>
            <Stack spacing={2}>
              {availableDimensions.map((dimension) => (
                <DimensionTagInput
                  key={dimension.id}
                  dimensionId={dimension.id}
                  dimensionName={dimension.name}
                  entityType="application"
                  entityId={entityId}
                  value={values.tags.filter((t) => t.dimensionName === dimension.name)}
                  onChange={(dimensionTags) =>
                    handleDimensionTagsChange(dimension.name, dimensionTags)
                  }
                  multiple={true}
                  color={dimension.color}
                  disabled={isLoading}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
            {t('applications.form.cancelButton')}
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {t('applications.form.saveButton')}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
