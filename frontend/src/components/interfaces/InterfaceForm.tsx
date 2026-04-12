import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  Stack,
  Box,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  InterfaceFormValues,
  InterfaceType,
  InterfaceFrequency,
  CriticalityLevel,
} from '@/types/interface';
import { useApplications } from '@/api/applications';

interface InterfaceFormProps {
  initialValues?: Partial<InterfaceFormValues>;
  onSubmit: (values: InterfaceFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;

}

const INTERFACE_TYPE_OPTIONS: InterfaceType[] = [
  'REST', 'SOAP', 'FTP', 'SFTP', 'DATABASE',
  'MESSAGE_QUEUE', 'BATCH_FILE', 'EVENT_STREAM',
  'GRAPHQL', 'GRPC', 'OTHER',
];

const INTERFACE_FREQUENCY_OPTIONS: InterfaceFrequency[] = [
  'REALTIME', 'NEAR_REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ON_DEMAND',
];

const CRITICALITY_OPTIONS: CriticalityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function InterfaceForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: InterfaceFormProps): JSX.Element {
  const { t } = useTranslation();

  // Form state
  const [sourceAppId, setSourceAppId] = useState<string | null>(initialValues?.sourceAppId || null);
  const [targetAppId, setTargetAppId] = useState<string | null>(initialValues?.targetAppId || null);
  const [middlewareAppId, setMiddlewareAppId] = useState<string | null>(initialValues?.middlewareAppId || null);
  const [name, setName] = useState(initialValues?.name || '');
  const [type, setType] = useState<InterfaceType | ''>(initialValues?.type || '');
  const [frequency, setFrequency] = useState<InterfaceFrequency | null>(initialValues?.frequency || null);
  const [criticality, setCriticality] = useState<CriticalityLevel | null>(initialValues?.criticality || null);
  const [technicalContact, setTechnicalContact] = useState(initialValues?.technicalContact || '');
  const [errorRate, setErrorRate] = useState<string>(
    initialValues?.errorRate !== null && initialValues?.errorRate !== undefined
      ? initialValues.errorRate.toString()
      : ''
  );
  const [description, setDescription] = useState(initialValues?.description || '');
  const [comment, setComment] = useState(initialValues?.comment || '');

  // Validation state
  const [sourceAppError, setSourceAppError] = useState<string | null>(null);
  const [targetAppError, setTargetAppError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [selfReferenceError, setSelfReferenceError] = useState<string | null>(null);

  // Clear server error when fields change
  useEffect(() => {
    if (error) {
      // Let the parent component handle displaying the error
    }
  }, [sourceAppId, targetAppId, type, error]);

  // Fetch applications for autocomplete
  const { data: applicationsData } = useApplications({ limit: 200 });
  const applications = applicationsData?.data || [];

  // Validation: RM-IF-01 sourceAppId !== targetAppId
  useEffect(() => {
    if (sourceAppId && targetAppId && sourceAppId === targetAppId) {
      setSelfReferenceError(t('interfaces.form.selfReference'));
    } else {
      setSelfReferenceError(null);
    }
  }, [sourceAppId, targetAppId, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setSourceAppError(null);
    setTargetAppError(null);
    setTypeError(null);

    // Validation
    let hasError = false;

    if (!sourceAppId) {
      setSourceAppError(t('interfaces.form.sourceAppRequired'));
      hasError = true;
    }

    if (!targetAppId) {
      setTargetAppError(t('interfaces.form.targetAppRequired'));
      hasError = true;
    }

    if (!type) {
      setTypeError(t('interfaces.form.typeRequired'));
      hasError = true;
    }

    // RM-IF-01: source !== target
    if (sourceAppId && targetAppId && sourceAppId === targetAppId) {
      setSelfReferenceError(t('interfaces.form.selfReference'));
      hasError = true;
    }

    if (hasError) return;

    const values: InterfaceFormValues = {
      sourceAppId,
      targetAppId,
      middlewareAppId,
      name,
      type,
      frequency,
      criticality,
      technicalContact,
      errorRate: errorRate ? Number(errorRate) : null,
      description,
      comment,
      tagPaths: [],
    };

    await onSubmit(values);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Stack spacing={3}>
        {/* Application Source */}
        <Autocomplete
          options={applications}
          getOptionLabel={(option) => option.name}
          value={applications.find((app) => app.id === sourceAppId) || null}
          onChange={(_e, newValue) => {
            setSourceAppId(newValue?.id || null);
            setSourceAppError(null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('interfaces.form.sourceAppLabel')}
              required
              error={!!sourceAppError}
              helperText={sourceAppError}
              variant="outlined"
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />

        {/* Application Cible */}
        <Autocomplete
          options={applications}
          getOptionLabel={(option) => option.name}
          value={applications.find((app) => app.id === targetAppId) || null}
          onChange={(_e, newValue) => {
            setTargetAppId(newValue?.id || null);
            setTargetAppError(null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('interfaces.form.targetAppLabel')}
              required
              error={!!targetAppError || !!selfReferenceError}
              helperText={targetAppError || selfReferenceError}
              variant="outlined"
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />

        {/* Composant de médiation (optionnel) */}
        <Autocomplete
          options={applications}
          getOptionLabel={(option) => option.name}
          value={applications.find((app) => app.id === middlewareAppId) || null}
          onChange={(_e, newValue) => setMiddlewareAppId(newValue?.id || null)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('interfaces.form.middlewareAppLabel')}
              placeholder={t('interfaces.form.middlewareAppPlaceholder')}
              variant="outlined"
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />

        {/* Nom (optionnel) */}
        <TextField
          label={t('interfaces.form.nameLabel')}
          placeholder={t('interfaces.form.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          variant="outlined"
        />

        {/* Type d'interface */}
        <FormControl fullWidth required error={!!typeError}>
          <InputLabel>{t('interfaces.form.typeLabel')}</InputLabel>
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value as InterfaceType);
              setTypeError(null);
            }}
            label={t('interfaces.form.typeLabel')}
            variant="outlined"
          >
            {INTERFACE_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {t(`interfaces.type.${option}`)}
              </MenuItem>
            ))}
          </Select>
          {typeError && <FormHelperText>{typeError}</FormHelperText>}
        </FormControl>

        {/* Fréquence */}
        <FormControl fullWidth>
          <InputLabel>{t('interfaces.form.frequencyLabel')}</InputLabel>
          <Select
            value={frequency || ''}
            onChange={(e) => setFrequency((e.target.value as InterfaceFrequency) || null)}
            label={t('interfaces.form.frequencyLabel')}
            variant="outlined"
          >
            <MenuItem value="">
              <em>{t('common.filters.all')}</em>
            </MenuItem>
            {INTERFACE_FREQUENCY_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {t(`interfaces.frequency.${option}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Criticité */}
        <FormControl fullWidth>
          <InputLabel>{t('interfaces.form.criticalityLabel')}</InputLabel>
          <Select
            value={criticality || ''}
            onChange={(e) => setCriticality((e.target.value as CriticalityLevel) || null)}
            label={t('interfaces.form.criticalityLabel')}
            variant="outlined"
          >
            <MenuItem value="">
              <em>{t('common.filters.all')}</em>
            </MenuItem>
            {CRITICALITY_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {t(`interfaces.criticality.${option}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Contact technique */}
        <TextField
          label={t('interfaces.form.technicalContactLabel')}
          placeholder={t('interfaces.form.technicalContactPlaceholder')}
          value={technicalContact}
          onChange={(e) => setTechnicalContact(e.target.value)}
          fullWidth
          variant="outlined"
        />

        {/* Taux d'erreur */}
        <TextField
          label={t('interfaces.form.errorRateLabel')}
          placeholder={t('interfaces.form.errorRatePlaceholder')}
          type="number"
          inputProps={{ min: 0, max: 100, step: 0.01 }}
          value={errorRate}
          onChange={(e) => setErrorRate(e.target.value)}
          fullWidth
          variant="outlined"
        />

        {/* Description */}
        <TextField
          label={t('interfaces.form.descriptionLabel')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          fullWidth
          variant="outlined"
        />

        {/* Commentaire */}
        <TextField
          label={t('interfaces.form.commentLabel')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          multiline
          rows={3}
          fullWidth
          variant="outlined"
        />

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('interfaces.form.cancelButton')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !!selfReferenceError}
          >
            {t('interfaces.form.saveButton')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
