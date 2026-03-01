import { Component, ReactNode, ErrorInfo } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
          <Typography variant="h1" color="primary.main" gutterBottom>
            Une erreur inattendue s'est produite
          </Typography>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box
              component="code"
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8125rem',
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                mb: 3,
                maxWidth: '100%',
                overflow: 'auto',
              }}
            >
              {this.state.error.message}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={this.handleReload}>
              Recharger la page
            </Button>
            <Button variant="contained" onClick={this.handleGoHome}>
              Retour à l'accueil
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
