import { useTranslation } from 'react-i18next';
import { Box, Card, Typography, Chip, Tooltip } from '@mui/material';
import { BusinessCapabilityTreeNode } from '@/types/businessCapability';
import { sumApplications } from '@/utils/businessCapability.utils';
import CriticalityChip from './CriticalityChip';

interface BusinessCapabilityMatrixProps {
  tree: BusinessCapabilityTreeNode[];
  onNodeClick: (nodeId: string) => void;
  isLoading?: boolean;
}

export default function BusinessCapabilityMatrix({
  tree,
  onNodeClick,
  isLoading,
}: BusinessCapabilityMatrixProps): JSX.Element {
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

  const renderTile = (node: BusinessCapabilityTreeNode, depth: number = 0): JSX.Element => {
    const totalApps = sumApplications(node);

    const tooltipContent = (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {node.name}
        </Typography>
        <Typography variant="caption">
          {t('businessCapabilities.common.levelAndApplications', {
            level: node.level,
            count: totalApps,
          })}
        </Typography>
      </Box>
    );

    return (
      <Box
        key={node.id}
        sx={{
          width: depth === 0
            ? { xs: '100%', md: 'calc(50% - 8px)' }
            : { xs: '100%', md: 'calc(50% - 4px)' },
          minWidth: 0,
        }}
      >
        <Tooltip title={tooltipContent} arrow placement="top">
          <Card
            onClick={() => onNodeClick(node.id)}
            sx={{
              p: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
              minHeight: depth === 0 ? 150 : 80,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography
                variant={depth === 0 ? 'h6' : 'subtitle2'}
                sx={{
                  fontWeight: 600,
                  flex: 1,
                  wordBreak: 'break-word',
                }}
              >
                {node.name}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: node.children.length > 0 ? 2 : 0 }}>
              {node.criticality && <CriticalityChip level={node.criticality} size="small" />}
              <Chip
                label={t('businessCapabilities.matrix.applicationsChip', { count: totalApps })}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Box>

            {/* Nested children */}
            {node.children.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
                {node.children.map((child) => renderTile(child, depth + 1))}
              </Box>
            )}
          </Card>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {tree.map((node) => renderTile(node, 0))}
    </Box>
  );
}
