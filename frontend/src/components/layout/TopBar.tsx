import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/applications')) return 'Applications';
  if (pathname.startsWith('/business-capabilities')) return 'Capacités métier';
  if (pathname.startsWith('/interfaces')) return 'Interfaces';
  if (pathname.startsWith('/data-objects')) return 'Objets de données';
  if (pathname.startsWith('/it-components')) return 'Composants IT';
  if (pathname.startsWith('/providers')) return 'Fournisseurs';
  if (pathname.startsWith('/domains')) return 'Domaines';
  return '';
}

export default function TopBar(): JSX.Element {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <Box
      component="header"
      sx={{
        height: 56,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        px: 3,
      }}
    >
      <Typography variant="h3" component="h1">
        {title}
      </Typography>
    </Box>
  );
}
