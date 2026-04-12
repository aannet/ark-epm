import { Chip, ChipProps } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TechnicalFitLevel } from '@/types/businessCapability';

interface TechnicalFitChipProps {
  level: TechnicalFitLevel;
  size?: ChipProps['size'];
}

export default function TechnicalFitChip({ level, size = 'small' }: TechnicalFitChipProps): JSX.Element {
  const { t } = useTranslation();

  const colorMap: Record<TechnicalFitLevel, 'success' | 'info' | 'warning' | 'error'> = {
    ADEQUATE: 'success',
    PARTIAL: 'info',
    INADEQUATE: 'warning',
    LEGACY: 'error',
  };

  return (
    <Chip
      label={t(`businessCapabilities.technicalFit.${level}`)}
      color={colorMap[level]}
      size={size}
      variant="outlined"
    />
  );
}
