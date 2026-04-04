import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  Drawer,
  IconButton,
  Tab,
  Tabs,
  Typography,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TagChipList } from '@/components/tags';
import { DataObjectResponse } from '@/types/data-object';
import { hasPermission } from '@/store/auth';
import ApplicationListInDrawer from './ApplicationListInDrawer';

interface DataObjectDrawerProps {
  open: boolean;
  dataObject: DataObjectResponse | null;
  onClose: () => void;
  onNavigateDetail: (id: string) => void;
  onNavigateEdit: (id: string) => void;
}

export default function DataObjectDrawer({
  open,
  dataObject,
  onClose,
  onNavigateDetail,
  onNavigateEdit,
}: DataObjectDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const canWrite = hasPermission('data-objects:write');

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 400 } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">{t('data-objects.drawer.title')}</Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label={t('data-objects.drawer.tabInfo')} />
          <Tab label={t('data-objects.drawer.tabApplications')} />
        </Tabs>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {!dataObject ? null : activeTab === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('data-objects.drawer.nameLabel')}</Typography>
                <Typography variant="subtitle1" fontWeight={600}>{dataObject.name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('data-objects.drawer.typeLabel')}</Typography>
                <Typography variant="body2">{dataObject.type ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{t('data-objects.drawer.isSourceOfTruthLabel')}</Typography>
                {dataObject.isSourceOfTruth ? (
                  <Chip size="small" variant="filled" color="success" label={t('data-objects.list.columns.isSourceOfTruthTrue')} />
                ) : (
                  <Chip size="small" variant="outlined" color="default" label={t('data-objects.list.columns.isSourceOfTruthFalse')} />
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('data-objects.drawer.descriptionLabel')}</Typography>
                <Typography variant="body2" color="text.secondary">{dataObject.description ?? t('data-objects.detail.noValue')}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('data-objects.drawer.commentLabel')}</Typography>
                <Typography variant="body2" color="text.secondary">{dataObject.comment ?? t('data-objects.detail.noValue')}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{t('data-objects.drawer.tagsLabel')}</Typography>
                {dataObject.tags?.length ? (
                  <TagChipList tags={dataObject.tags} deduplicate={true} maxVisible={5} />
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('data-objects.drawer.applicationsCountLabel')}</Typography>
                <Typography variant="body2">{dataObject._count?.appDataObjectMaps ?? 0}</Typography>
              </Box>
            </Box>
          ) : (
            <ApplicationListInDrawer dataObjectId={dataObject.id} />
          )}
        </Box>

        {/* Footer */}
        {dataObject && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              disabled={!canWrite}
              onClick={() => onNavigateEdit(dataObject.id)}
            >
              {t('data-objects.drawer.buttonEdit')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onNavigateDetail(dataObject.id)}
            >
              {t('data-objects.drawer.buttonViewDetail')}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
