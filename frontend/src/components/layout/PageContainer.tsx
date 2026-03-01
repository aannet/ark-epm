import { Box, Container, ContainerProps } from '@mui/material';
import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: ContainerProps['maxWidth'];
}

export default function PageContainer({
  children,
  maxWidth = 'xl',
}: PageContainerProps): JSX.Element {
  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        bgcolor: 'background.default',
      }}
    >
      <Container
        maxWidth={maxWidth}
        sx={{
          pt: 3,
          pb: 3,
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
