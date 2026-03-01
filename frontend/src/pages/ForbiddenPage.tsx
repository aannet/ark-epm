import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BlockIcon from '@mui/icons-material/Block';

export default function ForbiddenPage(): JSX.Element {
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
      <BlockIcon sx={{ fontSize: 80, color: 'error.main' }} />
      <Typography variant="h1" sx={{ color: 'error.main', fontSize: 72, fontWeight: 700 }}>
        403
      </Typography>
      <Typography variant="h5" sx={{ color: 'text.primary' }}>
        Accès refusé
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        Vous n'avez pas les droits nécessaires pour accéder à cette page.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={() => navigate('/')}>
          Retour à l'accueil
        </Button>
        <Button variant="outlined" href="mailto:admin@ark.io">
          Contacter l'administrateur
        </Button>
      </Box>
    </Box>
  );
}
