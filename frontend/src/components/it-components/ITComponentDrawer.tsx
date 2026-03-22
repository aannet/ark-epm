import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drawer, Box, Typography, IconButton, Tabs, Tab, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmptyState from '@/components/shared/EmptyState';
import { ITComponentResponse } from '@/types/it-component';
import { getITComponentApplications } from '@/services/api/it-components.api';
import { hasPermission } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/utils/it-components.utils';

interface ITComponentDrawerProps {
  itComponent: ITComponentResponse | undefined;
  open: boolean;
  onClose: () => void;
}

export default function ITComponentDrawer({ itComponent, open, onClose }: ITComponentDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canWrite = hasPermission('it-components:write');
  const [activeTab, setActiveTab] = useState(0);
  const [appsPage, setAppsPage] = useState(0);

  const { data: appsData } = useQuery({
    queryKey: ['it-component-apps-drawer', itComponent?.id, appsPage],
    queryFn: () => itComponent ? getITComponentApplications(itComponent.id, { page: appsPage + 1, limit: 5 }) : null,
    enabled: !!itComponent && activeTab === 1,
  });

  if (!itComponent) return <></>;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 400, display: 'flex', flexDirection: 'column' } }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{t('it-components.drawer.title')}</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}><CloseIcon /></IconButton>
      </Box>
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={t('it-components.drawer.tabInfo')} />
        <Tab label={`${t('it-components.drawer.tabApplications')} (${itComponent._count.applications})`} />
      </Tabs>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {activeTab === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.nameLabel')}</Typography><Typography variant="subtitle1" fontWeight={600}>{itComponent.name}</Typography></Box>
            <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.technologyLabel')}</Typography><Typography>{itComponent.technology || '—'}</Typography></Box>
            <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.typeLabel')}</Typography><Typography>{itComponent.type || '—'}</Typography></Box>
            <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.descriptionLabel')}</Typography><Typography variant="body2" color="text.secondary">{itComponent.description || '—'}</Typography></Box>
            <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.tagsLabel')}</Typography><Typography variant="caption">{itComponent.tags?.length ? `${itComponent.tags.length} tag(s)` : '—'}</Typography></Box>
            <Box><Typography variant="subtitle2" color="text.secondary">{t('it-components.drawer.applicationsCountLabel')}</Typography><Typography>{itComponent._count.applications}</Typography></Box>
            <Divider />
            <Typography variant="caption" color="text.secondary">{t('it-components.detail.createdAtLabel')}: {formatDateTime(itComponent.createdAt)}</Typography>
            <Typography variant="caption" color="text.secondary">{t('it-components.detail.updatedAtLabel')}: {formatDateTime(itComponent.updatedAt)}</Typography>
          </Box>
        ) : (
          appsData?.data?.length ? (
            <>
              <TableContainer component={Paper} elevation={0}><Table size="small"><TableHead><TableRow><TableCell>{t('applications.list.columns.name')}</TableCell><TableCell>{t('applications.list.columns.domain')}</TableCell></TableRow></TableHead><TableBody>{appsData.data.map(app => <TableRow key={app.id}><TableCell>{app.name}</TableCell><TableCell>{app.domain?.name || '—'}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
              <TablePagination component="div" count={appsData.meta.total} page={appsPage} rowsPerPage={5} rowsPerPageOptions={[5]} onPageChange={(_, p) => setAppsPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`} />
            </>
          ) : <EmptyState title={t('it-components.drawer.noApplications')} />
        )}
      </Box>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => { onClose(); navigate(`/it-components/${itComponent.id}/edit`); }} disabled={!canWrite}>{t('it-components.drawer.buttonEdit')}</Button>
        <Button variant="outlined" endIcon={<ArrowForwardIcon />} onClick={() => { onClose(); navigate(`/it-components/${itComponent.id}`); }}>{t('it-components.drawer.buttonViewDetail')}</Button>
      </Box>
    </Drawer>
  );
}
