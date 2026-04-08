import { useTranslation } from 'react-i18next';
import { Box, Typography, Chip } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { BusinessCapabilityTreeNode } from '@/types/businessCapability';
import CriticalityChip from './CriticalityChip';
import { getRootNodeIds } from '@/utils/businessCapability.utils';

interface BusinessCapabilityTreeProps {
  tree: BusinessCapabilityTreeNode[];
  onNodeSelect: (nodeId: string) => void;
  isLoading?: boolean;
}

export default function BusinessCapabilityTree({
  tree,
  onNodeSelect,
  isLoading,
}: BusinessCapabilityTreeProps): JSX.Element {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      </Box>
    );
  }

  if (!tree.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">
          {t('businessCapabilities.list.emptyState.title')}
        </Typography>
      </Box>
    );
  }

  const defaultExpanded = getRootNodeIds(tree);

  const renderTreeItem = (node: BusinessCapabilityTreeNode): JSX.Element => {
    const label = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {node.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          L{node.level}
        </Typography>
        {node.criticality && <CriticalityChip level={node.criticality} size="small" />}
        <Chip label={node._count.applicationMappings} size="small" variant="outlined" />
      </Box>
    );

    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={label}
        onClick={() => onNodeSelect(node.id)}
      >
        {node.children.map(renderTreeItem)}
      </TreeItem>
    );
  };

  return (
    <SimpleTreeView
      defaultExpandedItems={defaultExpanded}
      slots={{
        collapseIcon: ExpandMoreIcon,
        expandIcon: ChevronRightIcon,
      }}
      sx={{
        '& .MuiTreeItem-content': {
          py: 0.5,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        },
        '& .MuiTreeItem-label': {
          fontSize: '0.875rem',
        },
      }}
    >
      {tree.map(renderTreeItem)}
    </SimpleTreeView>
  );
}
