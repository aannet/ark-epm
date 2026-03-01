// =============================================================================
// ARK EPM — MUI Theme
// Version 0.1 — Février 2026
// Source de vérité : ARK - Design charte express v0.1 + ARK - UI Kit v0.1
//
// Usage :
//   import { theme } from '@/theme';
//   <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>
// =============================================================================

import { createTheme, alpha } from '@mui/material/styles';

// ─── 1. DESIGN TOKENS ────────────────────────────────────────────────────────

const tokens = {
  // Brand
  primary: '#1A237E',       // Indigo — Sidebar, Header, Branding
  secondary: '#007FFF',     // Bleu Azure — Boutons, liens, focus

  // Backgrounds
  bgDefault: '#F8FAFC',     // Gris neutre — Fond de page (Content zone)
  bgPaper: '#FFFFFF',       // Blanc — Cartes, Formulaires, Tableaux

  // Text
  textPrimary: '#1E293B',   // Ardoise — Texte principal
  textSecondary: '#64748B', // Gris bleu — Labels, aides, placeholders

  // Border
  divider: '#E2E8F0',       // Lignes de séparation

  // Semantic
  error: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  info: '#0369A1',

  // DataGrid / Table specifics
  tableHeader: '#F1F5F9',   // Header fond gris neutre

  // Shape
  radiusStandard: 4,        // px — Cartes, conteneurs (aspect "plan technique")
  radiusAction: 6,          // px — Boutons, Inputs
} as const;

// ─── 2. THEME MUI ────────────────────────────────────────────────────────────

export const theme = createTheme({

  // ── Palette ──────────────────────────────────────────────────────────────

  palette: {
    mode: 'light',

    primary: {
      main: tokens.primary,
      contrastText: '#FFFFFF',
    },

    secondary: {
      main: tokens.secondary,
      contrastText: '#FFFFFF',
    },

    background: {
      default: tokens.bgDefault,
      paper: tokens.bgPaper,
    },

    text: {
      primary: tokens.textPrimary,
      secondary: tokens.textSecondary,
    },

    divider: tokens.divider,

    error: {
      main: tokens.error,
    },

    warning: {
      main: tokens.warning,
    },

    success: {
      main: tokens.success,
    },

    info: {
      main: tokens.info,
    },
  },

  // ── Typographie ───────────────────────────────────────────────────────────

  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,

    // Titres de page
    h1: { fontSize: '1.875rem', fontWeight: 700, color: tokens.textPrimary, lineHeight: 1.2 },
    h2: { fontSize: '1.5rem',   fontWeight: 700, color: tokens.textPrimary, lineHeight: 1.3 },
    h3: { fontSize: '1.25rem',  fontWeight: 600, color: tokens.textPrimary, lineHeight: 1.4 },
    h4: { fontSize: '1.125rem', fontWeight: 600, color: tokens.textPrimary, lineHeight: 1.4 },
    h5: { fontSize: '1rem',     fontWeight: 600, color: tokens.textPrimary },
    h6: { fontSize: '0.875rem', fontWeight: 600, color: tokens.textPrimary },

    // Corps de texte
    body1: { fontSize: '0.875rem', fontWeight: 400, color: tokens.textPrimary },
    body2: { fontSize: '0.8125rem', fontWeight: 400, color: tokens.textSecondary },

    // Labels, aides
    caption: { fontSize: '0.75rem', fontWeight: 400, color: tokens.textSecondary },

    // Boutons
    button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' },

    // IDs techniques — JetBrains Mono (voir index.css pour le @font-face)
    // Utiliser : <Typography variant="body2" sx={{ fontFamily: 'mono' }}>APP-204</Typography>
    // ou la classe utilitaire sx={{ fontFamily: "'JetBrains Mono', monospace" }}
  },

  // ── Shape ─────────────────────────────────────────────────────────────────

  shape: {
    borderRadius: tokens.radiusStandard, // défaut global : 4px (Cartes, Paper)
  },

  // ── Spacing ───────────────────────────────────────────────────────────────

  spacing: 8, // 1 unit = 8px. padding standard Container = spacing(3) = 24px

  // ── Overrides des composants ──────────────────────────────────────────────

  components: {

    // ── CssBaseline — reset global ─────────────────────────────────────────

    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.bgDefault,
          color: tokens.textPrimary,
        },
        // Classe utilitaire pour les IDs techniques (APP-204, etc.)
        '.font-mono': {
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: '0.8125rem',
        },
      },
    },

    // ── Boutons ────────────────────────────────────────────────────────────

    MuiButton: {
      defaultProps: {
        disableElevation: true, // Flat — pas de box-shadow sur les boutons contained
      },
      styleOverrides: {
        root: {
          borderRadius: tokens.radiusAction, // 6px pour les boutons
          fontWeight: 500,
          textTransform: 'none',
          fontSize: '0.875rem',
          padding: '6px 16px',
        },
        contained: {
          '&:hover': {
            backgroundColor: '#1565C0', // primary légèrement plus sombre
          },
        },
        outlined: {
          borderColor: tokens.divider,
          '&:hover': {
            borderColor: tokens.secondary,
            backgroundColor: alpha(tokens.secondary, 0.04),
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radiusStandard,
          '&:hover': {
            backgroundColor: alpha(tokens.primary, 0.06),
          },
        },
      },
    },

    // ── Inputs / TextField ────────────────────────────────────────────────

    MuiTextField: {
      defaultProps: {
        variant: 'outlined', // Style outlined par défaut (UI Kit §3)
        size: 'small',
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radiusAction, // 6px
          backgroundColor: tokens.bgPaper,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.secondary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.secondary,
            borderWidth: '1px',
          },
        },
        notchedOutline: {
          borderColor: tokens.divider,
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color: tokens.textSecondary,
          '&.Mui-focused': {
            color: tokens.secondary,
          },
        },
      },
    },

    // ── Cards / Paper ──────────────────────────────────────────────────────

    MuiPaper: {
      defaultProps: {
        elevation: 0, // elevation={0} par défaut (UI Kit §5)
      },
      styleOverrides: {
        root: {
          borderRadius: tokens.radiusStandard, // 4px
          border: `1px solid ${tokens.divider}`,
          backgroundImage: 'none', // Désactive le gradient MUI par défaut
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: tokens.radiusStandard,
          border: `1px solid ${tokens.divider}`,
        },
      },
    },

    // ── Tableaux ───────────────────────────────────────────────────────────

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.tableHeader, // #F1F5F9
          '& .MuiTableCell-head': {
            backgroundColor: tokens.tableHeader,
            color: tokens.textSecondary,
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: `1px solid ${tokens.divider}`,
            padding: '10px 16px',
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          // Pas de zebra-striping (UI Kit §4)
          '&:hover': {
            backgroundColor: alpha(tokens.primary, 0.03),
          },
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderBottom: `1px solid ${tokens.divider}`,
          padding: '10px 16px',
          color: tokens.textPrimary,
        },
      },
    },

    // ── Divider ────────────────────────────────────────────────────────────

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: tokens.divider,
        },
      },
    },

    // ── Chip / Badge ───────────────────────────────────────────────────────

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radiusStandard,
          fontSize: '0.75rem',
          fontWeight: 500,
          height: '24px',
        },
      },
    },

    // ── Drawer / Sidebar ──────────────────────────────────────────────────
    // La Sidebar utilise primary.main (#1A237E) comme fond.
    // Les items actifs ont l'icône en secondary (#007FFF).
    // Voir src/components/layout/Sidebar.tsx pour l'implémentation des items.

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.primary,
          borderRight: 'none',
          color: '#FFFFFF',
        },
      },
    },

    // ── Tooltip ────────────────────────────────────────────────────────────

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: tokens.textPrimary,
          color: '#FFFFFF',
          fontSize: '0.75rem',
          borderRadius: tokens.radiusStandard,
        },
      },
    },

    // ── Dialog ────────────────────────────────────────────────────────────

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radiusStandard,
          border: `1px solid ${tokens.divider}`,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 600,
          color: tokens.textPrimary,
          padding: '20px 24px 12px',
        },
      },
    },

    // ── Snackbar / Alert ───────────────────────────────────────────────────

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radiusStandard,
          fontSize: '0.875rem',
        },
      },
    },

    // ── Container ─────────────────────────────────────────────────────────

    MuiContainer: {
      defaultProps: {
        maxWidth: 'xl',
      },
      styleOverrides: {
        root: {
          paddingLeft: '24px',  // spacing(3) — UI Kit §1
          paddingRight: '24px',
        },
      },
    },

    // ── Skeleton ──────────────────────────────────────────────────────────
    // UI Kit §6 : toujours privilégier Skeleton au spinner central

    MuiSkeleton: {
      defaultProps: {
        animation: 'wave',
      },
      styleOverrides: {
        root: {
          borderRadius: tokens.radiusStandard,
          backgroundColor: alpha(tokens.textSecondary, 0.1),
        },
      },
    },
  },
});

// ─── 3. EXPORTS UTILITAIRES ───────────────────────────────────────────────────

// Tokens réexportés pour usage direct dans les sx props
export { tokens };

// Type helper pour les sx props typées
export type AppTheme = typeof theme;