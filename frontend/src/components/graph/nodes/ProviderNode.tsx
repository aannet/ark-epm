import BusinessIcon from '@mui/icons-material/Business';
import { useTheme } from '@mui/material';
import { NodeProps } from '@xyflow/react';
import EntityNodeCard from './EntityNodeCard';

export default function ProviderNode(props: NodeProps): JSX.Element {
  const theme = useTheme();

  return <EntityNodeCard {...props} icon={<BusinessIcon fontSize="small" />} color={theme.palette.warning.main} />;
}
