import { useTranslation } from 'react-i18next';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

// AGENT-DECISION: front — T-053 — phases identiques à Application.lifecycleStatus
export const BC_LIFECYCLE_PHASES = [
  'draft',
  'in_progress',
  'production',
  'deprecated',
  'retired',
] as const;

export type BcLifecyclePhase = (typeof BC_LIFECYCLE_PHASES)[number];

type StepState = 'completed' | 'active' | 'upcoming';

function getStepState(
  phase: BcLifecyclePhase,
  currentPhase: BcLifecyclePhase | null
): StepState {
  if (!currentPhase) return 'upcoming';
  const currentIndex = BC_LIFECYCLE_PHASES.indexOf(currentPhase);
  const phaseIndex = BC_LIFECYCLE_PHASES.indexOf(phase);
  if (phaseIndex < currentIndex) return 'completed';
  if (phaseIndex === currentIndex) return 'active';
  return 'upcoming';
}

interface LifecycleStepperProps {
  /** Phase courante de l'entité (null = non défini) */
  currentPhase: string | null;
  /** Mode édition : clic sur une phase appelle onPhaseChange */
  editable?: boolean;
  /** Callback appelé lors d'un clic en mode édition */
  onPhaseChange?: (phase: BcLifecyclePhase) => void;
}

export function LifecycleStepper({
  currentPhase,
  editable = false,
  onPhaseChange,
}: LifecycleStepperProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Normalize currentPhase to BcLifecyclePhase | null
  const normalizedPhase = BC_LIFECYCLE_PHASES.includes(currentPhase as BcLifecyclePhase)
    ? (currentPhase as BcLifecyclePhase)
    : null;

  const CHEVRON_OVERLAP = 12;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0,
      }}
    >
      {BC_LIFECYCLE_PHASES.map((phase, index) => {
        const state = getStepState(phase, normalizedPhase);
        const isFirst = index === 0;
        const isActive = state === 'active';
        const isClickable = editable && !isActive;

        // Background color by state
        const bgColor =
          state === 'completed'
            ? theme.palette.success.main
            : state === 'active'
              ? '#1A237E' // primary.dark — Indigo Blueprint
              : theme.palette.grey[200];

        const textColor =
          state === 'completed' || state === 'active'
            ? '#ffffff'
            : theme.palette.text.secondary;

        const hoverBgColor =
          state === 'completed'
            ? theme.palette.success.dark
            : state === 'upcoming'
              ? theme.palette.grey[300]
              : undefined;

        return (
          <Box
            key={phase}
            onClick={() => {
              if (editable && onPhaseChange) {
                onPhaseChange(phase);
              }
            }}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              minWidth: isMobile ? '100%' : 160,
              height: 40,
              pl: isFirst ? 2 : isMobile ? 2 : `${CHEVRON_OVERLAP + 8}px`,
              pr: isMobile ? 2 : 2,
              ml: isMobile ? 0 : index > 0 ? `-${CHEVRON_OVERLAP}px` : 0,
              backgroundColor: bgColor,
              color: textColor,
              fontWeight: isActive ? 700 : 400,
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              cursor: isClickable ? 'pointer' : isActive ? 'default' : 'default',
              transition: 'background-color 0.2s',
              zIndex: isActive ? 2 : BC_LIFECYCLE_PHASES.length - index,
              // Chevron shape (desktop only)
              ...(!isMobile && {
                clipPath: isFirst
                  ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                  : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
              }),
              ...(isClickable && hoverBgColor
                ? {
                    '&:hover': {
                      backgroundColor: hoverBgColor,
                    },
                  }
                : {}),
            }}
          >
            {state === 'completed' && (
              <CheckIcon sx={{ fontSize: 14, flexShrink: 0 }} />
            )}
            <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t(`applications.lifecycle.${phase}`)}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default LifecycleStepper;
