import { Chip, ChipProps } from '@mui/material';
import { useTranslation } from 'react-i18next';

export type CriticalityValue = 'low' | 'medium' | 'high' | 'mission-critical';
export type LifecycleValue = 'draft' | 'in_progress' | 'production' | 'deprecated' | 'retired';

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
  draft: 'default',
  in_progress: 'info',
  production: 'success',
  deprecated: 'warning',
  retired: 'default',
};

const activeColors: Record<string, ChipProps['color']> = {
  true: 'success',
  false: 'default',
};

export default function StatusChip({ type, value }: StatusChipProps): JSX.Element {
  const { t } = useTranslation();
  const valueStr = String(value);
  
  let color: ChipProps['color'] = 'default';
  let label: string = valueStr;
  
  if (type === 'criticality') {
    color = criticalityColors[value as CriticalityValue];
    label = t(`applications.criticality.${valueStr}`);
  } else if (type === 'lifecycle') {
    color = lifecycleColors[value as LifecycleValue];
    label = t(`applications.lifecycle.${valueStr}`);
  } else if (type === 'active') {
    color = activeColors[valueStr];
    label = t(`common.status.${valueStr === 'true' ? 'active' : 'inactive'}`);
  }

  const isBold = type === 'criticality' && (value === 'high' || value === 'mission-critical');

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      sx={{
        fontWeight: isBold ? 700 : 500,
        fontSize: '0.75rem',
      }}
    />
  );
}
