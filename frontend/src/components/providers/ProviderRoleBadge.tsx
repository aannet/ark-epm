import { Chip, ChipProps } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ProviderRoleBadgeProps {
  role: string | null | undefined;
  size?: 'small' | 'medium';
}

export default function ProviderRoleBadge({
  role,
  size = 'small',
}: ProviderRoleBadgeProps) {
  const { t } = useTranslation();

  if (!role) {
    return null;
  }

  const colorMap: Record<string, ChipProps['color']> = {
    editor: 'primary',
    integrator: 'secondary',
    support: 'info',
    vendor: 'warning',
  };

  const color = colorMap[role] ?? 'default';

  // Try to get i18n label, fallback to raw role
  const label = (() => {
    try {
      return t(`applications.roles.${role}`);
    } catch {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
  })();

  return (
    <Chip
      label={label}
      color={color}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
}
