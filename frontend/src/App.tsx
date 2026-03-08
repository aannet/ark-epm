import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import NotFoundPage from '@/pages/NotFoundPage';
import DesignSystemPage from '@/pages/DesignSystemPage';
import LoginPage from '@/pages/LoginPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import PrivateRoute from '@/components/PrivateRoute';
import { initializeAuth, clearAuth } from '@/store/auth';
import { logout } from '@/api/auth';
import { useEffect } from 'react';
import DomainsListPage from '@/pages/domains/DomainsListPage';
import DomainNewPage from '@/pages/domains/DomainNewPage';
import DomainDetailPage from '@/pages/domains/DomainDetailPage';
import DomainEditPage from '@/pages/domains/DomainEditPage';

function App(): JSX.Element {
  useEffect(() => {
    initializeAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Best-effort - ignore network errors
    }
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/401" element={<UnauthorizedPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/design" element={<DesignSystemPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<AppShell onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/applications" replace />} />
            <Route path="applications/*" element={<div />} />
            <Route path="business-capabilities/*" element={<div />} />
            <Route path="interfaces/*" element={<div />} />
            <Route path="data-objects/*" element={<div />} />
            <Route path="it-components/*" element={<div />} />
            <Route path="providers/*" element={<div />} />
            <Route path="domains" element={<Outlet />}>
              <Route index element={<DomainsListPage />} />
              <Route path="new" element={<DomainNewPage />} />
              <Route path=":id" element={<DomainDetailPage />} />
              <Route path=":id/edit" element={<DomainEditPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<PrivateRoute permission="users:write" />}>
          <Route path="/users" element={<div />} />
        </Route>

        <Route element={<PrivateRoute permission="roles:write" />}>
          <Route path="/roles" element={<div />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
