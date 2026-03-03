import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage(): JSX.Element {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoHome = (): void => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Typography
        variant="h1"
        color="primary.main"
        sx={{ fontSize: '6rem', fontWeight: 700, lineHeight: 1 }}
      >
        {t('errors.notFound.code')}
      </Typography>
      <Typography variant="h3" sx={{ mt: 2 }}>
        {t('errors.notFound.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        {t('errors.notFound.description')}
      </Typography>
      <Button variant="contained" onClick={handleGoHome}>
        {t('common.actions.backHome')}
      </Button>
    </Box>
  );
}
