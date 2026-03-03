import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BlockIcon from '@mui/icons-material/Block';

export default function ForbiddenPage(): JSX.Element {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        gap: 2,
      }}
    >
      <BlockIcon sx={{ fontSize: 80, color: 'error.main' }} />
      <Typography variant="h1" sx={{ color: 'error.main', fontSize: 72, fontWeight: 700 }}>
        {t('errors.forbidden.code')}
      </Typography>
      <Typography variant="h5" sx={{ color: 'text.primary' }}>
        {t('errors.forbidden.title')}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        {t('errors.forbidden.description')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('common.actions.backHome')}
        </Button>
        <Button variant="outlined" href="mailto:admin@ark.io">
          {t('common.actions.contact')}
        </Button>
      </Box>
    </Box>
  );
}
