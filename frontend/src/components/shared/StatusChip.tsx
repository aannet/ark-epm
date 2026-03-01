import { Chip, ChipProps } from '@mui/material';

export type CriticalityValue = 'low' | 'medium' | 'high' | 'mission-critical';
export type LifecycleValue = 'active' | 'deprecated' | 'planned' | 'retired';

interface StatusChipProps {
  type: 'criticality' | 'lifecycle' | 'active';
  value: CriticalityValue | LifecycleValue | boolean;
}

const criticalityColors: Record<CriticalityValue, ChipProps['color']> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  'mission-critical': 'error',
};

const lifecycleColors: Record<LifecycleValue, ChipProps['color']> = {
  active: 'success',
  deprecated: 'warning',
  planned: 'info',
  retired: 'default',
};

const activeColors: Record<string, ChipProps['color']> = {
  true: 'success',
  false: 'default',
};

const labels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  'mission-critical': 'Mission Critical',
  active: 'Active',
  deprecated: 'Deprecated',
  planned: 'Planned',
  retired: 'Retired',
  true: 'Active',
  false: 'Inactive',
};

export default function StatusChip({ type, value }: StatusChipProps): JSX.Element {
  const valueStr = String(value);
  
  let color: ChipProps['color'] = 'default';
  
  if (type === 'criticality') {
    color = criticalityColors[value as CriticalityValue];
  } else if (type === 'lifecycle') {
    color = lifecycleColors[value as LifecycleValue];
  } else if (type === 'active') {
    color = activeColors[valueStr];
  }

  const isBold = type === 'criticality' && (value === 'high' || value === 'mission-critical');

  return (
    <Chip
      label={labels[valueStr] || valueStr}
      color={color}
      size="small"
      sx={{
        fontWeight: isBold ? 700 : 500,
        fontSize: '0.75rem',
      }}
    />
  );
}
