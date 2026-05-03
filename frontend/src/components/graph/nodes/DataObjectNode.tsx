import StorageIcon from '@mui/icons-material/Storage';
import { useTheme } from '@mui/material';
import { NodeProps } from '@xyflow/react';
import EntityNodeCard from './EntityNodeCard';

export default function DataObjectNode(props: NodeProps): JSX.Element {
  const theme = useTheme();

  return (
    <EntityNodeCard
      {...props}
      icon={<StorageIcon fontSize="small" />}
      color={theme.palette.success.main}
      shape="cylinder"
    />
  );
}
