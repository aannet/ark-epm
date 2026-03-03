import { Component, ReactNode, ErrorInfo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
        <ErrorFallback
          error={this.state.error}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onReload, onGoHome }: { error: Error | null; onReload: () => void; onGoHome: () => void }): JSX.Element {
  const { t } = useTranslation();

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
        {t('errors.unexpected.title')}
      </Typography>
      {process.env.NODE_ENV === 'development' && error && (
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
          {t('errors.unexpected.technical')} {error.message}
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={onReload}>
          {t('common.actions.reload')}
        </Button>
        <Button variant="contained" onClick={onGoHome}>
          {t('common.actions.backHome')}
        </Button>
      </Box>
    </Box>
  );
}

export default ErrorBoundary;
