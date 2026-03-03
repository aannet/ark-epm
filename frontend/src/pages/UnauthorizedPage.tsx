import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SecurityIcon from '@mui/icons-material/Security';

export default function UnauthorizedPage(): JSX.Element {
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
      <SecurityIcon sx={{ fontSize: 80, color: 'primary.main' }} />
      <Typography variant="h1" sx={{ color: 'primary.main', fontSize: 72, fontWeight: 700 }}>
        {t('errors.unauthorized.code')}
      </Typography>
      <Typography variant="h5" sx={{ color: 'text.primary' }}>
        {t('errors.unauthorized.title')}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        {t('errors.unauthorized.description')}
      </Typography>
      <Button variant="contained" onClick={() => navigate('/login')}>
        {t('common.actions.signIn')}
      </Button>
    </Box>
  );
}
