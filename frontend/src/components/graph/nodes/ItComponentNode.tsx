import MemoryIcon from '@mui/icons-material/Memory';
import { useTheme } from '@mui/material';
import { NodeProps } from '@xyflow/react';
import EntityNodeCard from './EntityNodeCard';

export default function ItComponentNode(props: NodeProps): JSX.Element {
  const theme = useTheme();

  return <EntityNodeCard {...props} icon={<MemoryIcon fontSize="small" />} color={theme.palette.info.main} />;
}
