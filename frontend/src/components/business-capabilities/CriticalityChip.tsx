import { Chip, ChipProps } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CriticalityLevel } from '@/types/businessCapability';

interface CriticalityChipProps {
  level: CriticalityLevel;
  size?: ChipProps['size'];
}

export default function CriticalityChip({ level, size = 'small' }: CriticalityChipProps): JSX.Element {
  const { t } = useTranslation();

  const colorMap: Record<CriticalityLevel, 'success' | 'warning' | 'error'> = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'error',
    CRITICAL: 'error',
  };

  const bgColorMap: Record<CriticalityLevel, string> = {
    LOW: '#4caf50',
    MEDIUM: '#ff9800',
    HIGH: '#f44336',
    CRITICAL: '#d32f2f',
  };

  return (
    <Chip
      label={t(`businessCapabilities.criticality.${level}`)}
      color={colorMap[level]}
      size={size}
      sx={{
        backgroundColor: bgColorMap[level],
        color: 'white',
        fontWeight: 500,
      }}
    />
  );
}
