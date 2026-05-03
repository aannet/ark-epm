import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import { useTranslation } from 'react-i18next';
import { Domain } from '@/types/domain';
import { FocalType, GraphCriticality, LayerKey } from '@/types/graph';

interface GraphToolbarProps {
  focalType: FocalType | null;
  activeLayers: LayerKey[];
  depth: number;
  domains: Domain[];
  selectedCriticalities: GraphCriticality[];
  selectedDomainIds: string[];
  onLayersChange: (layers: LayerKey[]) => void;
  onDepthChange: (depth: number) => void;
  onCriticalitiesChange: (criticalities: GraphCriticality[]) => void;
  onDomainIdsChange: (domainIds: string[]) => void;
  onFitView: () => void;
}

const DEPTH_MARKS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
];

const CRITICALITY_OPTIONS: GraphCriticality[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const LAYER_KEYS: LayerKey[] = [
  'applications',
  'interfaces',
  'business_capabilities',
  'providers',
  'it_components',
  'data_objects',
];

function getLockedLayer(focalType: FocalType | null): LayerKey | null {
  switch (focalType) {
    case 'application':
      return 'applications';
    case 'business_capability':
      return 'business_capabilities';
    case 'provider':
      return 'providers';
    case 'it_component':
      return 'it_components';
    case 'data_object':
      return 'data_objects';
    case 'domain':
      return 'applications';
    default:
      return null;
  }
}

export default function GraphToolbar({
  focalType,
  activeLayers,
  depth,
  domains,
  selectedCriticalities,
  selectedDomainIds,
  onLayersChange,
  onDepthChange,
  onCriticalitiesChange,
  onDomainIdsChange,
  onFitView,
}: GraphToolbarProps): JSX.Element {
  const { t } = useTranslation();
  const lockedLayer = getLockedLayer(focalType);

  const handleLayersChange = (_event: React.MouseEvent<HTMLElement>, value: LayerKey[]) => {
    const uniqueLayers = Array.from(new Set(value));
    if (lockedLayer && !uniqueLayers.includes(lockedLayer)) {
      onLayersChange([...uniqueLayers, lockedLayer]);
      return;
    }

    onLayersChange(uniqueLayers);
  };

  const handleCriticalityChange = (event: SelectChangeEvent<GraphCriticality[]>) => {
    const value = event.target.value;
    const parsed = (typeof value === 'string' ? value.split(',') : value) as GraphCriticality[];
    onCriticalitiesChange(parsed);
  };

  const handleDomainChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const parsed = (typeof value === 'string' ? value.split(',') : value) as string[];
    onDomainIdsChange(parsed);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ minWidth: 300 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {t('graph.toolbar.layers')}
        </Typography>
        <ToggleButtonGroup value={activeLayers} onChange={handleLayersChange} size="small">
          {LAYER_KEYS.map((layerKey) => (
            <ToggleButton key={layerKey} value={layerKey} disabled={lockedLayer === layerKey}>
              {t(`graph.layers.${layerKey}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ minWidth: 180 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {t('graph.toolbar.depth')}
        </Typography>
        <Slider
          value={depth}
          marks={DEPTH_MARKS}
          min={1}
          max={3}
          step={1}
          valueLabelDisplay="auto"
          onChange={(_event, value) => onDepthChange(value as number)}
        />
      </Box>

      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel id="graph-criticality-label">{t('graph.toolbar.criticality')}</InputLabel>
        <Select
          labelId="graph-criticality-label"
          multiple
          value={selectedCriticalities}
          onChange={handleCriticalityChange}
          input={<OutlinedInput label={t('graph.toolbar.criticality')} />}
          renderValue={(selected) => {
            if (selected.length === 0) {
              return t('graph.toolbar.all');
            }
            return selected.map((item) => t(`interfaces.criticality.${item}`)).join(', ');
          }}
        >
          {CRITICALITY_OPTIONS.map((criticality) => (
            <MenuItem key={criticality} value={criticality}>
              {t(`interfaces.criticality.${criticality}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 240 }}>
        <InputLabel id="graph-domain-label">{t('graph.toolbar.domain')}</InputLabel>
        <Select
          labelId="graph-domain-label"
          multiple
          value={selectedDomainIds}
          onChange={handleDomainChange}
          input={<OutlinedInput label={t('graph.toolbar.domain')} />}
          renderValue={(selected) => {
            if (selected.length === 0) {
              return t('graph.toolbar.all');
            }

            const domainNames = domains
              .filter((domain) => selected.includes(domain.id))
              .map((domain) => domain.name);

            return domainNames.join(', ');
          }}
        >
          {domains.map((domain) => (
            <MenuItem key={domain.id} value={domain.id}>
              {domain.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button variant="outlined" size="small" startIcon={<FitScreenIcon />} onClick={onFitView}>
        {t('graph.toolbar.fitView')}
      </Button>
    </Box>
  );
}
