import { Navigate, Outlet } from 'react-router-dom';
import { getToken, hasPermission } from '../store/auth';

interface PrivateRouteProps {
  permission?: string;
}

export default function PrivateRoute({ permission }: PrivateRouteProps): JSX.Element {
  const token = getToken();

  if (!token) {
    return <Navigate to="/401" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
