import CategoryIcon from '@mui/icons-material/Category';
import { useTheme } from '@mui/material';
import { NodeProps } from '@xyflow/react';
import EntityNodeCard from './EntityNodeCard';

export default function BusinessCapabilityNode(props: NodeProps): JSX.Element {
  const theme = useTheme();

  return (
    <EntityNodeCard
      {...props}
      icon={<CategoryIcon fontSize="small" />}
      color={theme.palette.secondary.main}
      shape="hexagon"
    />
  );
}
