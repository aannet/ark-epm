import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import { login } from '../api/auth';
import { setAuth } from '../store/auth';

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({ email, password });
      setAuth(response.accessToken, response.user);
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (message?.includes('disabled')) {
        setError(t('auth.login.accountDisabled'));
      } else {
        setError(t('auth.login.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
          {t('auth.login.title')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('auth.login.emailLabel')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
            variant="outlined"
            size="small"
          />
          <TextField
            fullWidth
            label={t('auth.login.passwordLabel')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
            variant="outlined"
            size="small"
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? t('auth.login.loadingLabel') : t('auth.login.submitLabel')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
