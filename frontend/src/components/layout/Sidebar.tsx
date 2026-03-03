import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme, alpha, IconButton } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import Apps from '@mui/icons-material/Apps';
import AccountTree from '@mui/icons-material/AccountTree';
import AltRoute from '@mui/icons-material/AltRoute';
import Storage from '@mui/icons-material/Storage';
import Dns from '@mui/icons-material/Dns';
import Business from '@mui/icons-material/Business';
import Folder from '@mui/icons-material/Folder';
import Logout from '@mui/icons-material/Logout';

interface SidebarProps {
  onLogout?: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactElement;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Applications', icon: <Apps />, path: '/applications' },
  { label: 'Capacités métier', icon: <AccountTree />, path: '/business-capabilities' },
  { label: 'Interfaces', icon: <AltRoute />, path: '/interfaces' },
  { label: 'Objets de données', icon: <Storage />, path: '/data-objects' },
  { label: 'Composants IT', icon: <Dns />, path: '/it-components' },
  { label: 'Fournisseurs', icon: <Business />, path: '/providers' },
  { label: 'Domaines', icon: <Folder />, path: '/domains' },
];

export default function Sidebar({ onLogout }: SidebarProps): JSX.Element {
  const theme = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string): boolean => pathname.startsWith(path);
  const white = theme.palette.primary.contrastText;
  const secondaryMain = theme.palette.secondary.main;

  return (
    <Box
      component="nav"
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: 'primary.main',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${alpha(white, 0.1)}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: white,
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          ARK EPM
        </Typography>
      </Box>

      <List sx={{ flex: 1, pt: 2 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1, py: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1,
                  bgcolor: active ? alpha(secondaryMain, 0.12) : 'transparent',
                  '&:hover': {
                    bgcolor: active ? alpha(secondaryMain, 0.16) : alpha(white, 0.08),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? 'secondary.main' : alpha(white, 0.85),
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    sx: {
                      color: active ? white : alpha(white, 0.85),
                      fontWeight: active ? 600 : 400,
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha(white, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: alpha(white, 0.6) }}>
            Utilisateur
          </Typography>
        </Box>
        {onLogout && (
          <IconButton
            onClick={onLogout}
            size="small"
            sx={{
              color: alpha(white, 0.7),
              '&:hover': {
                bgcolor: alpha(white, 0.1),
                color: white,
              },
            }}
          >
            <Logout fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
