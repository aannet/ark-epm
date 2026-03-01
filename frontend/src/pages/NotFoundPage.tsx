import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage(): JSX.Element {
  const navigate = useNavigate();

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
        404
      </Typography>
      <Typography variant="h3" sx={{ mt: 2 }}>
        Page introuvable
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        La page que vous recherchez n'existe pas ou a été déplacée.
      </Typography>
      <Button variant="contained" onClick={handleGoHome}>
        Retour à l'accueil
      </Button>
    </Box>
  );
}
