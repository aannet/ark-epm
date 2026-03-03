import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  onLogout?: () => void;
}

export default function AppShell({ onLogout }: AppShellProps): JSX.Element {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar onLogout={onLogout} />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        <TopBar />
        <Outlet />
      </Box>
    </Box>
  );
}
