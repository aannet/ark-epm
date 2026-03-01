import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';

export default function UnauthorizedPage(): JSX.Element {
  const navigate = useNavigate();

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
        401
      </Typography>
      <Typography variant="h5" sx={{ color: 'text.primary' }}>
        Session expirée
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        Votre session a expiré ou vous n'êtes pas connecté.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/login')}>
        Se connecter
      </Button>
    </Box>
  );
}
