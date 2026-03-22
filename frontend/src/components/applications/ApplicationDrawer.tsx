import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Skeleton,
  Divider,
  Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useApplication, useApplicationDependencies } from '@/api/applications';
import { hasPermission } from '@/store/auth';
import { TagChipList } from '@/components/tags';
import StatusChip from '@/components/shared/StatusChip';

interface ApplicationDrawerProps {
  applicationId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function ApplicationDrawer({
  applicationId,
  open,
  onClose,
}: ApplicationDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('applications:write');

  const { data: application, isLoading: isLoadingApp } = useApplication(applicationId || '', {
    enabled: !!applicationId,
  });

  const { data: dependencies, isLoading: isLoadingDeps } = useApplicationDependencies(
    applicationId || '',
    { enabled: !!applicationId }
  );

  const isLoading = isLoadingApp || isLoadingDeps;

  const handleViewDetails = () => {
    if (applicationId) {
      navigate(`/applications/${applicationId}`);
    }
  };

  const handleEdit = () => {
    if (applicationId) {
      navigate(`/applications/${applicationId}/edit`);
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
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h6" sx={{ flex: 1, pr: 2, wordBreak: 'break-word' }}>
            {isLoading ? <Skeleton width={200} /> : (application?.name || t('applications.drawer.close'))}
          </Typography>
          <IconButton
            onClick={handleClose}
            aria-label={t('applications.drawer.close')}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="text" height={30} width="80%" />
              <Skeleton variant="text" height={20} width="60%" />
              <Skeleton variant="rectangular" height={80} />
              <Skeleton variant="text" height={20} width="40%" />
              <Skeleton variant="text" height={20} width="50%" />
            </Box>
          ) : application ? (
            <>
              {/* Section Informations */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('applications.detail.section.general')}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('applications.list.columns.name')}
                  </Typography>
                  <Typography variant="body1">{application.name}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('applications.list.columns.description')}
                  </Typography>
                  <Typography variant="body1">
                    {application.description || t('applications.detail.noDescription')}
                  </Typography>
                </Box>

                {application.domain && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('applications.list.columns.domain')}
                    </Typography>
                    <Link
                      component="button"
                      variant="body1"
                      onClick={() => navigate(`/domains/${application.domain!.id}`)}
                      sx={{ textAlign: 'left', textDecoration: 'underline' }}
                    >
                      {application.domain.name}
                    </Link>
                  </Box>
                )}

                {application.providers && application.providers.length > 0 && (
                   <Box sx={{ mb: 2 }}>
                     <Typography variant="body2" color="text.secondary">
                       {t('applications.list.columns.provider')}
                     </Typography>
                     {application.providers.map((provider) => (
                       <Box key={provider.id} sx={{ mb: 1 }}>
                         <Link
                           component="button"
                           variant="body1"
                           onClick={() => navigate(`/providers/${provider.id}`)}
                           sx={{ textAlign: 'left', textDecoration: 'underline', display: 'block' }}
                         >
                           {provider.name}
                         </Link>
                         {provider.role && (
                           <Typography variant="caption" color="text.secondary">
                             ({provider.role})
                           </Typography>
                         )}
                       </Box>
                     ))}
                   </Box>
                 )}

                {application.owner && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('applications.detail.owner')}
                    </Typography>
                    <Typography variant="body1">
                      {application.owner.firstName} {application.owner.lastName}
                    </Typography>
                  </Box>
                )}

                {application.criticality && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('applications.detail.criticality')}
                    </Typography>
                    <StatusChip type="criticality" value={application.criticality as any} />
                  </Box>
                )}

                {application.lifecycleStatus && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('applications.list.columns.lifecycleStatus')}
                    </Typography>
                    <StatusChip type="lifecycle" value={application.lifecycleStatus as any} />
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Section Tags */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('applications.detail.section.tags')}
                </Typography>
                {application.tags && application.tags.length > 0 ? (
                  <TagChipList
                    tags={application.tags}
                    maxVisible={10}
                    deduplicate={true}
                    showMoreButton={true}
                    size="small"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Section Métadonnées */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('applications.detail.section.metadata')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('applications.list.columns.createdAt')}:{' '}
                  {new Date(application.createdAt).toLocaleDateString('fr-FR')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('applications.detail.updatedAt')}:{' '}
                  {new Date(application.updatedAt).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>

              {/* Dependencies Info (if any) */}
              {dependencies?.hasDependencies && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      {t('applications.delete.confirmTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('applications.delete.blockedMessage', dependencies.counts)}
                    </Typography>
                  </Box>
                </>
              )}
            </>
          ) : null}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            mt: 2,
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="contained"
            onClick={handleEdit}
            disabled={isLoading || !application || !canWrite}
          >
            {t('applications.drawer.edit')}
          </Button>
          <Button
            variant="outlined"
            onClick={handleViewDetails}
            disabled={isLoading || !application}
          >
            {t('applications.drawer.viewFullDetails')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
