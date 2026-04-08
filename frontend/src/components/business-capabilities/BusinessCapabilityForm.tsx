import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  Stack,
  Typography,
  Box,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  BusinessCapabilityFormValues,
  CriticalityLevel,
  TechnicalFitLevel,
} from '@/types/businessCapability';
import { DimensionTagInput } from '@/components/tags';
import { TagValueResponse } from '@/components/tags/DimensionTagInput.types';
import { useDomains } from '@/api/domains';
import { useBusinessCapabilitiesTree } from '@/api/businessCapabilities';
import { isDescendant, flattenTree } from '@/utils/businessCapability.utils';

interface BusinessCapabilityFormProps {
  initialValues?: Partial<BusinessCapabilityFormValues>;
  onSubmit: (values: BusinessCapabilityFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  circularReferenceError?: boolean;
  availableDimensions?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  entityId?: string;
  excludeParentId?: string;
}

const CRITICALITY_OPTIONS: CriticalityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TECHNICAL_FIT_OPTIONS: TechnicalFitLevel[] = ['ADEQUATE', 'PARTIAL', 'INADEQUATE', 'LEGACY'];

export default function BusinessCapabilityForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  error,
  circularReferenceError,
  availableDimensions = [],
  entityId,
  excludeParentId,
}: BusinessCapabilityFormProps): JSX.Element {
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [comment, setComment] = useState(initialValues?.comment || '');
  const [parentId, setParentId] = useState<string | null>(initialValues?.parentId || null);
  const [domainId, setDomainId] = useState<string | null>(initialValues?.domainId || null);
  const [criticality, setCriticality] = useState<CriticalityLevel | null>(
    initialValues?.criticality || null
  );
  const [technicalFit, setTechnicalFit] = useState<TechnicalFitLevel | null>(
    initialValues?.technicalFit || null
  );
  const [tags, setTags] = useState<TagValueResponse[]>(initialValues?.tags || []);

  // Validation state
  const [nameError, setNameError] = useState<string | null>(null);

  // Fetch domains for autocomplete
  const { data: domainsData } = useDomains({ limit: 100 });
  const domains = domainsData?.data || [];

  // Fetch tree for parent selection
  const { data: treeData } = useBusinessCapabilitiesTree();
  const tree = treeData || [];

  // Flatten tree for parent selection, excluding current entity and its descendants
  const getSelectableParents = useCallback(() => {
    if (!tree.length) return [];

    const flatList = flattenTree(tree);

    // Filter out current entity and its descendants
    return flatList.filter((item) => {
      // Always exclude self
      if (excludeParentId && item.id === excludeParentId) return false;
      // Exclude descendants
      if (excludeParentId && isDescendant(tree, item.id, excludeParentId)) return false;
      return true;
    });
  }, [tree, excludeParentId]);

  const selectableParents = getSelectableParents();

  // Handle dimension tags change
  const handleDimensionTagsChange = useCallback(
    (dimensionName: string, dimensionTags: TagValueResponse[]) => {
      setTags((prevTags) => {
        const tagsWithoutDimension = prevTags.filter(
          (tag) => tag.dimensionName !== dimensionName
        );
        return [...tagsWithoutDimension, ...dimensionTags];
      });
    },
    []
  );

  // Client-side validation
  const validateForm = (): boolean => {
    let valid = true;

    if (!name.trim()) {
      setNameError(t('businessCapabilities.form.nameRequired'));
      valid = false;
    } else {
      setNameError(null);
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    await onSubmit({
      name: name.trim(),
      description,
      comment,
      parentId,
      domainId,
      criticality,
      technicalFit,
      tags,
    });
  };

  // Reset form when initialValues change
  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || '');
      setDescription(initialValues.description || '');
      setComment(initialValues.comment || '');
      setParentId(initialValues.parentId || null);
      setDomainId(initialValues.domainId || null);
      setCriticality(initialValues.criticality || null);
      setTechnicalFit(initialValues.technicalFit || null);
      setTags(initialValues.tags || []);
    }
  }, [initialValues]);

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {/* Name */}
        <TextField
          label={t('businessCapabilities.form.nameLabel')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          disabled={isLoading}
          error={!!nameError || !!error}
          helperText={nameError || error}
          variant="outlined"
        />

        {/* Description */}
        <TextField
          label={t('businessCapabilities.form.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
          disabled={isLoading}
          variant="outlined"
        />

        {/* Comment */}
        <TextField
          label={t('businessCapabilities.form.comment')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          fullWidth
          multiline
          rows={2}
          disabled={isLoading}
          variant="outlined"
        />

        {/* Parent selection */}
        <Autocomplete
          options={selectableParents}
          getOptionLabel={(option) => `${option.name} (L${option.level})`}
          value={selectableParents.find((p) => p.id === parentId) || null}
          onChange={(_e, newValue) => setParentId(newValue?.id || null)}
          disabled={isLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('businessCapabilities.form.parent')}
              placeholder={t('businessCapabilities.form.parentPlaceholder')}
              error={!!circularReferenceError}
              helperText={
                circularReferenceError ? t('businessCapabilities.form.circularReference') : undefined
              }
              variant="outlined"
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />

        {/* Domain selection */}
        <Autocomplete
          options={domains}
          getOptionLabel={(option) => option.name}
          value={domains.find((d) => d.id === domainId) || null}
          onChange={(_e, newValue) => setDomainId(newValue?.id || null)}
          disabled={isLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('businessCapabilities.form.domain')}
              variant="outlined"
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />

        {/* Criticality */}
        <FormControl fullWidth disabled={isLoading}>
          <InputLabel>{t('businessCapabilities.form.criticality')}</InputLabel>
          <Select
            value={criticality || ''}
            onChange={(e) => setCriticality((e.target.value as CriticalityLevel) || null)}
            label={t('businessCapabilities.form.criticality')}
          >
            <MenuItem value="">
              <em>—</em>
            </MenuItem>
            {CRITICALITY_OPTIONS.map((level) => (
              <MenuItem key={level} value={level}>
                {t(`businessCapabilities.criticality.${level}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Technical Fit */}
        <FormControl fullWidth disabled={isLoading}>
          <InputLabel>{t('businessCapabilities.form.technicalFit')}</InputLabel>
          <Select
            value={technicalFit || ''}
            onChange={(e) => setTechnicalFit((e.target.value as TechnicalFitLevel) || null)}
            label={t('businessCapabilities.form.technicalFit')}
          >
            <MenuItem value="">
              <em>—</em>
            </MenuItem>
            {TECHNICAL_FIT_OPTIONS.map((level) => (
              <MenuItem key={level} value={level}>
                {t(`businessCapabilities.technicalFit.${level}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Tags */}
        {availableDimensions.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('businessCapabilities.detail.tags')}
            </Typography>
            <Stack spacing={2}>
              {availableDimensions.map((dimension) => (
                <DimensionTagInput
                  key={dimension.id}
                  dimensionId={dimension.id}
                  dimensionName={dimension.name}
                  entityType="business-capability"
                  entityId={entityId}
                  value={tags.filter((tag) => tag.dimensionName === dimension.name)}
                  onChange={(dimensionTags) => {
                    handleDimensionTagsChange(dimension.name, dimensionTags);
                  }}
                  multiple={true}
                  color={dimension.color}
                  disabled={isLoading}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
            {t('businessCapabilities.form.cancelButton')}
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {t('businessCapabilities.form.saveButton')}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
