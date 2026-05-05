import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import NotFoundPage from '@/pages/NotFoundPage';
import DesignSystemPage from '@/pages/DesignSystemPage';
import LoginPage from '@/pages/LoginPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import PrivateRoute from '@/components/PrivateRoute';
import { clearAuth, initializeAuth } from '@/store/auth';
import { logout } from '@/api/auth';
import { useEffect } from 'react';
import HomePage from '@/pages/home/HomePage';
import UserListPage from '@/pages/users/UserListPage';
import UserNewPage from '@/pages/users/UserNewPage';
import UserEditPage from '@/pages/users/UserEditPage';

// Domain pages
import DomainsListPage from '@/pages/domains/DomainsListPage';
import DomainNewPage from '@/pages/domains/DomainNewPage';
import DomainDetailPage from '@/pages/domains/DomainDetailPage';
import DomainEditPage from '@/pages/domains/DomainEditPage';

// Provider pages
import ProvidersListPage from '@/pages/providers/ProvidersListPage';
import ProviderNewPage from '@/pages/providers/ProviderNewPage';
import ProviderDetailPage from '@/pages/providers/ProviderDetailPage';
import ProviderEditPage from '@/pages/providers/ProviderEditPage';

// Application pages
import ApplicationsListPage from '@/pages/applications/ApplicationsListPage';
import ApplicationNewPage from '@/pages/applications/ApplicationNewPage';
import ApplicationDetailPage from '@/pages/applications/ApplicationDetailPage';
import ApplicationEditPage from '@/pages/applications/ApplicationEditPage';

// IT Component pages
import ITComponentListPage from '@/pages/it-components/ITComponentListPage';
import ITComponentFormPage from '@/pages/it-components/ITComponentFormPage';
import ITComponentDetailPage from '@/pages/it-components/ITComponentDetailPage';

// Data Object pages
import DataObjectListPage from '@/pages/data-objects/DataObjectListPage';
import DataObjectDetailPage from '@/pages/data-objects/DataObjectDetailPage';
import DataObjectFormPage from '@/pages/data-objects/DataObjectFormPage';

// Business Capabilities pages
import BusinessCapabilitiesPage from '@/pages/business-capabilities/BusinessCapabilitiesPage';
import BusinessCapabilityNewPage from '@/pages/business-capabilities/BusinessCapabilityNewPage';
import BusinessCapabilityDetailPage from '@/pages/business-capabilities/BusinessCapabilityDetailPage';
import BusinessCapabilityEditPage from '@/pages/business-capabilities/BusinessCapabilityEditPage';

// Interfaces pages
import InterfaceListPage from '@/pages/interfaces/InterfaceListPage';
import InterfaceNewPage from '@/pages/interfaces/InterfaceNewPage';
import InterfaceDetailPage from '@/pages/interfaces/InterfaceDetailPage';
import InterfaceEditPage from '@/pages/interfaces/InterfaceEditPage';
import GraphPage from '@/pages/graph/GraphPage';

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
            <Route index element={<HomePage />} />
            
            {/* Applications routes */}
            <Route path="applications" element={<Outlet />}>
              <Route index element={<ApplicationsListPage />} />
              <Route path="new" element={<ApplicationNewPage />} />
              <Route path=":id" element={<ApplicationDetailPage />} />
              <Route path=":id/edit" element={<ApplicationEditPage />} />
            </Route>
            
             {/* Providers routes */}
             <Route path="providers" element={<Outlet />}>
               <Route index element={<ProvidersListPage />} />
               <Route path="new" element={<ProviderNewPage />} />
               <Route path=":id" element={<ProviderDetailPage />} />
               <Route path=":id/edit" element={<ProviderEditPage />} />
             </Route>
             
             {/* IT Components routes */}
             <Route path="it-components" element={<Outlet />}>
               <Route index element={<ITComponentListPage />} />
               <Route path="new" element={<ITComponentFormPage mode="create" />} />
               <Route path=":id" element={<ITComponentDetailPage />} />
               <Route path=":id/edit" element={<ITComponentFormPage mode="edit" />} />
             </Route>

             {/* Data Objects routes */}
             <Route path="data-objects" element={<Outlet />}>
               <Route index element={<DataObjectListPage />} />
               <Route path="new" element={<DataObjectFormPage mode="create" />} />
               <Route path=":id" element={<DataObjectDetailPage />} />
               <Route path=":id/edit" element={<DataObjectFormPage mode="edit" />} />
             </Route>
             
             {/* Domains routes */}
            <Route path="domains" element={<Outlet />}>
              <Route index element={<DomainsListPage />} />
              <Route path="new" element={<DomainNewPage />} />
              <Route path=":id" element={<DomainDetailPage />} />
              <Route path=":id/edit" element={<DomainEditPage />} />
            </Route>

             {/* Business Capabilities routes */}
             <Route path="business-capabilities" element={<Outlet />}>
               <Route index element={<BusinessCapabilitiesPage />} />
               <Route path="new" element={<BusinessCapabilityNewPage />} />
               <Route path=":id" element={<BusinessCapabilityDetailPage />} />
               <Route path=":id/edit" element={<BusinessCapabilityEditPage />} />
             </Route>

              {/* Interfaces routes */}
              <Route path="interfaces" element={<Outlet />}>
                <Route index element={<InterfaceListPage />} />
                <Route path="new" element={<InterfaceNewPage />} />
                <Route path=":id" element={<InterfaceDetailPage />} />
                <Route path=":id/edit" element={<InterfaceEditPage />} />
              </Route>

               {/* Graph route */}
               <Route path="graph" element={<GraphPage />} />

               {/* AGENT-DECISION: front — keep users list/edit under users:read and gate creation under users:write. */}
               <Route path="users" element={<Outlet />}>
                 <Route element={<PrivateRoute permission="users:read" />}>
                   <Route index element={<UserListPage />} />
                   <Route path=":id" element={<UserEditPage />} />
                 </Route>
                 <Route element={<PrivateRoute permission="users:write" />}>
                   <Route path="new" element={<UserNewPage />} />
                 </Route>
               </Route>
            </Route>
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
