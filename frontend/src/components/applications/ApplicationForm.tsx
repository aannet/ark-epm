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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import { ApplicationFormValues } from '@/types/application';
import { DimensionTagInput } from '@/components/tags';
import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';
import { LifecycleStepper } from '@/components/shared/LifecycleStepper';

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
    itComponents: SelectOption[];
    businessCapabilities: SelectOption[];
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
    providers: initialValues?.providers || [],
    itComponents: initialValues?.itComponents || [],
    capabilityIds: initialValues?.capabilityIds || [],
    ownerId: initialValues?.ownerId || null,
    criticality: initialValues?.criticality || null,
    lifecycleStatus: initialValues?.lifecycleStatus || null,
    tags: initialValues?.tags || [],
  });

  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [providerRole, setProviderRole] = useState<string>('');
  
  const [itComponentDialogOpen, setItComponentDialogOpen] = useState(false);
  const [selectedItComponentId, setSelectedItComponentId] = useState<string>('');

  const [capabilityDialogOpen, setCapabilityDialogOpen] = useState(false);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string>('');

  const handleChange = useCallback(
    (field: keyof ApplicationFormValues, value: string | null) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAddProvider = () => {
    if (selectedProviderId && !values.providers.some(p => p.id === selectedProviderId)) {
      setValues((prev) => ({
        ...prev,
        providers: [
          ...prev.providers,
          {
            id: selectedProviderId,
            role: providerRole || null,
          },
        ],
      }));
      setSelectedProviderId('');
      setProviderRole('');
      setProviderDialogOpen(false);
    }
  };

  const handleRemoveProvider = (providerId: string) => {
    setValues((prev) => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== providerId),
    }));
  };

  const handleUpdateProviderRole = (providerId: string, newRole: string) => {
    setValues((prev) => ({
      ...prev,
      providers: prev.providers.map(p =>
        p.id === providerId ? { ...p, role: newRole || null } : p
      ),
    }));
  };

  const handleAddItComponent = () => {
    if (selectedItComponentId && !values.itComponents.some(ic => ic.id === selectedItComponentId)) {
      setValues((prev) => ({
        ...prev,
        itComponents: [
          ...prev.itComponents,
          { id: selectedItComponentId },
        ],
      }));
      setSelectedItComponentId('');
      setItComponentDialogOpen(false);
    }
  };

  const handleRemoveItComponent = (itComponentId: string) => {
    setValues((prev) => ({
      ...prev,
      itComponents: prev.itComponents.filter(ic => ic.id !== itComponentId),
    }));
  };

  const handleAddCapability = () => {
    if (selectedCapabilityId && !values.capabilityIds.includes(selectedCapabilityId)) {
      setValues((prev) => ({
        ...prev,
        capabilityIds: [...prev.capabilityIds, selectedCapabilityId],
      }));
      setSelectedCapabilityId('');
      setCapabilityDialogOpen(false);
    }
  };

  const handleRemoveCapability = (capabilityId: string) => {
    setValues((prev) => ({
      ...prev,
      capabilityIds: prev.capabilityIds.filter(id => id !== capabilityId),
    }));
  };

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

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('applications.form.providersLabel')}
          </Typography>
          {values.providers.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {values.providers.map((provider) => {
                const providerName = availableOptions.providers.find(p => p.id === provider.id)?.name || provider.id;
                return (
                  <Box
                    key={provider.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {providerName}
                      </Typography>
                      <TextField
                        size="small"
                        placeholder={t('applications.form.providerRoleLabel')}
                        value={provider.role || ''}
                        onChange={(e) => handleUpdateProviderRole(provider.id, e.target.value)}
                        disabled={isLoading}
                        sx={{ mt: 0.5, width: '150px' }}
                        variant="outlined"
                      />
                    </Box>
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveProvider(provider.id)}
                      disabled={isLoading}
                    >
                      {t('applications.form.removeProvider')}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setProviderDialogOpen(true)}
            disabled={isLoading}
            fullWidth
          >
            {t('applications.form.addProvider')}
          </Button>
        </Box>

        {/* Provider Selection Dialog */}
        <Dialog
          open={providerDialogOpen}
          onClose={() => {
            setProviderDialogOpen(false);
            setSelectedProviderId('');
            setProviderRole('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{t('applications.form.selectProvider')}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('applications.form.providerLabel')}</InputLabel>
              <Select
                value={selectedProviderId}
                label={t('applications.form.providerLabel')}
                onChange={(e) => setSelectedProviderId(e.target.value)}
              >
                <MenuItem value="">
                  <em>{t('applications.detail.noValue')}</em>
                </MenuItem>
                {availableOptions.providers
                  .filter(p => !values.providers.some(vp => vp.id === p.id))
                  .map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={t('applications.form.providerRoleLabel')}
              placeholder="editor, integrator, support..."
              value={providerRole}
              onChange={(e) => setProviderRole(e.target.value)}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setProviderDialogOpen(false);
                setSelectedProviderId('');
                setProviderRole('');
              }}
            >
              {t('applications.form.cancelButton')}
            </Button>
            <Button
              onClick={handleAddProvider}
              variant="contained"
              disabled={!selectedProviderId}
            >
              {t('applications.form.addButton')}
            </Button>
          </DialogActions>
         </Dialog>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('applications.form.itComponentsLabel')}
          </Typography>
          {values.itComponents.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {values.itComponents.map((itComponent) => {
                const itComponentName = availableOptions.itComponents.find(ic => ic.id === itComponent.id)?.name || itComponent.id;
                return (
                  <Box
                    key={itComponent.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {itComponentName}
                    </Typography>
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveItComponent(itComponent.id)}
                      disabled={isLoading}
                    >
                      {t('applications.form.removeItComponent')}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setItComponentDialogOpen(true)}
            disabled={isLoading}
            fullWidth
          >
            {t('applications.form.addItComponent')}
          </Button>
        </Box>

        {/* IT Component Selection Dialog */}
        <Dialog
          open={itComponentDialogOpen}
          onClose={() => {
            setItComponentDialogOpen(false);
            setSelectedItComponentId('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{t('applications.form.selectItComponent')}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('applications.relations.itComponents')}</InputLabel>
              <Select
                value={selectedItComponentId}
                label={t('applications.relations.itComponents')}
                onChange={(e) => setSelectedItComponentId(e.target.value)}
              >
                <MenuItem value="">
                  <em>{t('applications.detail.noValue')}</em>
                </MenuItem>
                {availableOptions.itComponents
                  .filter(ic => !values.itComponents.some(vic => vic.id === ic.id))
                  .map((itComponent) => (
                    <MenuItem key={itComponent.id} value={itComponent.id}>
                      {itComponent.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setItComponentDialogOpen(false);
                setSelectedItComponentId('');
              }}
            >
              {t('applications.form.cancelButton')}
            </Button>
            <Button
              onClick={handleAddItComponent}
              variant="contained"
              disabled={!selectedItComponentId}
            >
              {t('applications.form.addButton')}
            </Button>
          </DialogActions>
        </Dialog>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('applications.form.businessCapabilitiesLabel')}
          </Typography>
          {values.capabilityIds.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {values.capabilityIds.map((capabilityId) => {
                const capabilityName = availableOptions.businessCapabilities.find(bc => bc.id === capabilityId)?.name || capabilityId;
                return (
                  <Box
                    key={capabilityId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {capabilityName}
                    </Typography>
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveCapability(capabilityId)}
                      disabled={isLoading}
                    >
                      {t('applications.form.removeBusinessCapability')}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCapabilityDialogOpen(true)}
            disabled={isLoading}
            fullWidth
          >
            {t('applications.form.addBusinessCapability')}
          </Button>
        </Box>

        {/* Business Capability Selection Dialog */}
        <Dialog
          open={capabilityDialogOpen}
          onClose={() => {
            setCapabilityDialogOpen(false);
            setSelectedCapabilityId('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{t('applications.form.selectBusinessCapability')}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('applications.form.businessCapabilitiesLabel')}</InputLabel>
              <Select
                value={selectedCapabilityId}
                label={t('applications.form.businessCapabilitiesLabel')}
                onChange={(e) => setSelectedCapabilityId(e.target.value)}
              >
                <MenuItem value="">
                  <em>{t('applications.detail.noValue')}</em>
                </MenuItem>
                {availableOptions.businessCapabilities
                  .filter(bc => !values.capabilityIds.includes(bc.id))
                  .map((bc) => (
                    <MenuItem key={bc.id} value={bc.id}>
                      {bc.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setCapabilityDialogOpen(false);
                setSelectedCapabilityId('');
              }}
            >
              {t('applications.form.cancelButton')}
            </Button>
            <Button
              onClick={handleAddCapability}
              variant="contained"
              disabled={!selectedCapabilityId}
            >
              {t('applications.form.addButton')}
            </Button>
          </DialogActions>
        </Dialog>

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

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('applications.form.lifecycleStatusLabel')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('applications.lifecycle.editDescription')}
          </Typography>
          <LifecycleStepper
            currentPhase={values.lifecycleStatus}
            editable
            onPhaseChange={(phase) => handleChange('lifecycleStatus', phase)}
          />
          {values.lifecycleStatus && (
            <Button
              variant="text"
              size="small"
              startIcon={<ClearIcon />}
              onClick={() => handleChange('lifecycleStatus', null)}
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              {t('applications.lifecycle.clearButton')}
            </Button>
          )}
        </Box>

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

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
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
