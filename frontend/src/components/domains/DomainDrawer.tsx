import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Skeleton,
  Chip,
  Divider,
  Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDomain } from '@/api/domains';
import { hasPermission } from '@/store/auth';

interface DomainDrawerProps {
  domainId: string | null;
  open: boolean;
  onClose: () => void;
}

const MAX_VISIBLE_TAGS = 10;

export default function DomainDrawer({ domainId, open, onClose }: DomainDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('domains:write');
  const [showAllTags, setShowAllTags] = useState(false);
  
  const { data: domain, isLoading } = useDomain(domainId || '', {
    enabled: !!domainId,
  });

  const visibleTags = useMemo(() => {
    if (!domain?.tags) return [];
    if (showAllTags) return domain.tags;
    return domain.tags.slice(0, MAX_VISIBLE_TAGS);
  }, [domain?.tags, showAllTags]);

  const hasMoreTags = domain?.tags && domain.tags.length > MAX_VISIBLE_TAGS;
  const hiddenCount = hasMoreTags ? (domain?.tags?.length || 0) - MAX_VISIBLE_TAGS : 0;

  const handleViewDetails = () => {
    if (domainId) {
      navigate(`/domains/${domainId}`);
    }
  };

  const handleEdit = () => {
    if (domainId) {
      navigate(`/domains/${domainId}/edit`);
    }
  };

  const handleClose = () => {
    setShowAllTags(false);
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
            {isLoading ? <Skeleton width={200} /> : (domain?.name || t('domains.drawer.title'))}
          </Typography>
          <IconButton 
            onClick={handleClose} 
            aria-label={t('domains.drawer.close')}
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
          ) : domain ? (
            <>
              {/* Section Informations */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('domains.drawer.section.info')}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('domains.list.columns.name')}
                  </Typography>
                  <Typography variant="body1">{domain.name}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('domains.list.columns.description')}
                  </Typography>
                  <Typography variant="body1">
                    {domain.description || t('domains.detail.noDescription')}
                  </Typography>
                </Box>

                {domain.comment && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('domains.list.columns.comment')}
                    </Typography>
                    <Typography variant="body1">{domain.comment}</Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Section Tags */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('domains.drawer.section.tags')}
                </Typography>
                {domain.tags && domain.tags.length > 0 ? (
                  <Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {visibleTags.map((tag) => (
                        <Chip
                          key={tag.id}
                          label={tag.label}
                          size="small"
                          sx={{
                            backgroundColor:
                              tag.dimensionName === 'Geography'
                                ? '#2196F3'
                                : tag.dimensionName === 'Brand'
                                ? '#9C27B0'
                                : '#FF9800',
                            color: '#fff',
                          }}
                          title={tag.path}
                        />
                      ))}
                    </Box>
                    {hasMoreTags && !showAllTags && (
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => setShowAllTags(true)}
                        sx={{ mt: 1, textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {t('domains.drawer.showMoreTags', { count: hiddenCount })}
                      </Link>
                    )}
                  </Box>
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
                  {t('domains.drawer.section.metadata')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('domains.list.columns.createdAt')}:{' '}
                  {new Date(domain.createdAt).toLocaleDateString('fr-FR')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('domains.list.columns.updatedAt')}:{' '}
                  {new Date(domain.updatedAt).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
            </>
          ) : null}
        </Box>

        {/* Footer */}
        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleEdit}
            disabled={isLoading || !domain || !canWrite}
          >
            {t('domains.drawer.edit')}
          </Button>
          <Button
            variant="outlined"
            onClick={handleViewDetails}
            disabled={isLoading || !domain}
          >
            {t('domains.drawer.viewFullDetails')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
