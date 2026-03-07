import '@/i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/theme';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import App from './App';
import { queryClient } from './queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
