import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Skeleton,
  Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useInterface } from '@/api/interfaces';
import { hasPermission } from '@/store/auth';
import { TagChipList } from '@/components/tags';
// AGENT-DECISION: front — CriticalityChip importé depuis business-capabilities/ en attendant migration vers shared/ (post-MVP)
import CriticalityChip from '@/components/business-capabilities/CriticalityChip';
import { Chip } from '@mui/material';

interface InterfaceDrawerProps {
  interfaceId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function InterfaceDrawer({
  interfaceId,
  open,
  onClose,
}: InterfaceDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('interfaces:write');

  const { data: iface, isLoading } = useInterface(interfaceId || '', {
    enabled: !!interfaceId,
  });

  const handleViewDetails = () => {
    if (interfaceId) {
      navigate(`/interfaces/${interfaceId}`);
    }
  };

  const handleEdit = () => {
    if (interfaceId) {
      navigate(`/interfaces/${interfaceId}/edit`);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { width: 400, backgroundColor: 'background.paper' } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {isLoading ? <Skeleton width={200} /> : (iface?.name ?? t('interfaces.drawer.unnamedInterface'))}
          </Typography>
          <IconButton
            onClick={handleClose}
            aria-label={t('common.actions.close')}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Subtitle: Source → [Middleware] → Cible */}
        <Box sx={{ px: 2, pb: 1 }}>
          {isLoading || !iface ? (
            <Skeleton variant="text" width="80%" />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Link
                component="button"
                underline="hover"
                onClick={() => navigate(`/applications/${iface.sourceAppId}`)}
              >
                {iface.sourceApp.name}
              </Link>
              <ArrowForwardIcon fontSize="small" color="action" />
              {iface.middlewareApp && (
                <>
                  <Link
                    component="button"
                    underline="hover"
                    onClick={() => navigate(`/applications/${iface.middlewareApp!.id}`)}
                  >
                    {iface.middlewareApp.name}
                  </Link>
                  <ArrowForwardIcon fontSize="small" color="action" />
                </>
              )}
              <Link
                component="button"
                underline="hover"
                onClick={() => navigate(`/applications/${iface.targetAppId}`)}
              >
                {iface.targetApp.name}
              </Link>
            </Box>
          )}
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="text" height={30} width="80%" />
              <Skeleton variant="text" height={20} width="60%" />
              <Skeleton variant="rectangular" height={80} />
            </Box>
          ) : iface ? (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('interfaces.drawer.type')}
                </Typography>
                <Chip
                  label={t(`interfaces.type.${iface.type}`)}
                  size="small"
                  color="default"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('interfaces.drawer.criticality')}
                </Typography>
                {iface.criticality ? (
                  <CriticalityChip level={iface.criticality} size="small" />
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    {t('interfaces.detail.noValue')}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('interfaces.drawer.frequency')}
                </Typography>
                <Typography variant="body1">
                  {iface.frequency
                    ? t(`interfaces.frequency.${iface.frequency}`)
                    : t('interfaces.detail.noValue')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('interfaces.drawer.technicalContact')}
                </Typography>
                <Typography variant="body1">
                  {iface.technicalContact ?? t('interfaces.detail.noValue')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('interfaces.drawer.errorRate')}
                </Typography>
                <Typography variant="body1">
                  {iface.errorRate !== null
                    ? `${iface.errorRate} %`
                    : t('interfaces.detail.noValue')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('interfaces.drawer.description')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {iface.description ?? t('interfaces.detail.noValue')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('interfaces.drawer.comment')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {iface.comment ?? t('interfaces.detail.noValue')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('interfaces.drawer.tags')}
                </Typography>
                <TagChipList tags={iface.tags} />
              </Box>
            </>
          ) : null}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="outlined"
            disabled={!canWrite}
            onClick={handleEdit}
          >
            {t('interfaces.drawer.editButton')}
          </Button>
          <Button
            variant="text"
            onClick={handleViewDetails}
          >
            {t('interfaces.drawer.viewFullButton')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
