import { Box, Skeleton } from '@mui/material';

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function LoadingSkeleton({
  rows = 5,
  columns = 4,
}: LoadingSkeletonProps): JSX.Element {
  return (
    <Box sx={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 2,
            mb: 2,
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="rectangular"
              animation="wave"
              height={40}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}
