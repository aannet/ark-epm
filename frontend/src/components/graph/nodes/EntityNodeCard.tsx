import { Box, Typography, useTheme } from '@mui/material';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { ReactNode } from 'react';

export interface GraphNodeData {
  [key: string]: unknown;
  label: string;
  isFocal: boolean;
  subtitle?: string;
}

interface EntityNodeCardProps extends NodeProps {
  icon: ReactNode;
  color: string;
  shape?: 'rectangle' | 'hexagon' | 'cylinder';
}

export default function EntityNodeCard({
  data,
  selected,
  icon,
  color,
  shape = 'rectangle',
}: EntityNodeCardProps): JSX.Element {
  const theme = useTheme();
  const nodeData = data as unknown as GraphNodeData;
  const borderWidth = nodeData.isFocal || selected ? 3 : 1;

  return (
    <>
      <Handle type="target" position={Position.Left} style={{ backgroundColor: theme.palette.grey[500] }} />
      <Box
        sx={{
          width: 200,
          minHeight: 72,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          bgcolor: 'background.paper',
          border: `${borderWidth}px solid ${color}`,
          borderRadius: shape === 'rectangle' ? 2 : shape === 'cylinder' ? 6 : 1,
          clipPath:
            shape === 'hexagon'
              ? 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)'
              : 'none',
          boxShadow: nodeData.isFocal
            ? `0 0 0 2px ${theme.palette.primary.light}`
            : `0 4px 12px ${theme.palette.action.disabledBackground}`,
          transition: 'box-shadow 120ms ease, transform 120ms ease',
          '&:hover': {
            boxShadow: `0 8px 18px ${theme.palette.action.disabledBackground}`,
            transform: 'translateY(-1px)',
          },
        }}
      >
        <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: nodeData.isFocal ? 700 : 600,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {nodeData.label}
          </Typography>
          {nodeData.subtitle ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {nodeData.subtitle}
            </Typography>
          ) : null}
        </Box>
      </Box>
      <Handle type="source" position={Position.Right} style={{ backgroundColor: theme.palette.grey[500] }} />
    </>
  );
}
