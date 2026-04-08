import { useTranslation } from 'react-i18next';
import { Box, Card, Typography, Chip, Grid, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BusinessCapabilityTreeNode } from '@/types/businessCapability';
import { getCriticalityColor, sumApplications } from '@/utils/businessCapability.utils';

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
  const theme = useTheme();

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
    const bgColor = getCriticalityColor(node.criticality, theme);
    const textColor = node.criticality === 'HIGH' || node.criticality === 'CRITICAL' ? 'white' : 'text.primary';

    const tooltipContent = (
      <Box>
        <Typography variant="body2" fontWeight="bold">
          {node.name}
        </Typography>
        <Typography variant="caption">
          {t('businessCapabilities.common.levelAndApplications', {
            level: node.level,
            count: totalApps,
          })}
        </Typography>
        {node.criticality && (
          <Typography variant="caption" display="block">
            {t('businessCapabilities.matrix.criticalityLabel')}: {t(`businessCapabilities.criticality.${node.criticality}`)}
          </Typography>
        )}
      </Box>
    );

    return (
      <Grid item xs={12} sm={depth === 0 ? 6 : 12} md={depth === 0 ? 4 : 6} key={node.id}>
        <Tooltip title={tooltipContent} arrow placement="top">
          <Card
            onClick={() => onNodeClick(node.id)}
            sx={{
              backgroundColor: bgColor,
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
                  color: textColor,
                  fontWeight: 600,
                  flex: 1,
                  wordBreak: 'break-word',
                }}
              >
                {node.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: textColor,
                  opacity: 0.8,
                  ml: 1,
                }}
              >
                L{node.level}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: node.children.length > 0 ? 2 : 0 }}>
              <Chip
                label={t('businessCapabilities.matrix.applicationsChip', { count: totalApps })}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  color: textColor,
                  fontWeight: 500,
                }}
              />
            </Box>

            {/* Nested children */}
            {node.children.length > 0 && (
              <Grid container spacing={1} sx={{ mt: 'auto' }}>
                {node.children.map((child) => renderTile(child, depth + 1))}
              </Grid>
            )}
          </Card>
        </Tooltip>
      </Grid>
    );
  };

  return (
    <Grid container spacing={2}>
      {tree.map((node) => renderTile(node, 0))}
    </Grid>
  );
}
