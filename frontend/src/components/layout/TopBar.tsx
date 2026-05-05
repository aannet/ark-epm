import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Omnisearch } from '@/components/search';

export default function TopBar(): JSX.Element {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  let title = '';
  if (pathname === '/') title = t('home.page.title');
  if (pathname.startsWith('/applications')) title = t('nav.applications');
  if (pathname.startsWith('/business-capabilities')) title = t('nav.businessCapabilities');
  if (pathname.startsWith('/interfaces')) title = t('nav.interfaces');
  if (pathname.startsWith('/data-objects')) title = t('nav.dataObjects');
  if (pathname.startsWith('/it-components')) title = t('nav.itComponents');
  if (pathname.startsWith('/providers')) title = t('nav.providers');
  if (pathname.startsWith('/domains')) title = t('nav.domains');
  if (pathname.startsWith('/users')) title = t('users.list.title');
  if (pathname.startsWith('/graph')) title = t('graph.page.title');

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

      <Box sx={{ flexGrow: 1 }} />

      <Omnisearch />
    </Box>
  );
}
