import AppsIcon from '@mui/icons-material/Apps';
import { useTheme } from '@mui/material';
import { NodeProps } from '@xyflow/react';
import EntityNodeCard from './EntityNodeCard';

export default function ApplicationNode(props: NodeProps): JSX.Element {
  const theme = useTheme();

  return <EntityNodeCard {...props} icon={<AppsIcon fontSize="small" />} color={theme.palette.primary.main} />;
}
