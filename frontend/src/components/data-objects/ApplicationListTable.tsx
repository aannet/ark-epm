import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Link,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDataObjectApplications } from '@/services/api/data-objects.api';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import { ApplicationWithRole } from '@/types/data-object';

const roleColorMap: Record<string, 'default' | 'warning' | 'success'> = {
  consumer: 'default',
  producer: 'warning',
  owner: 'success',
};

interface ApplicationListTableProps {
  dataObjectId: string;
}

export default function ApplicationListTable({ dataObjectId }: ApplicationListTableProps): JSX.Element {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['data-object-apps-detail', dataObjectId, page],
    queryFn: () => getDataObjectApplications(dataObjectId, { page: page + 1, limit: 20 }),
    enabled: !!dataObjectId,
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (!data?.data?.length) return <EmptyState title={t('data-objects.detail.noApplications')} />;

  return (
    <Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F1F5F9' }}>
              <TableCell>{t('applications.list.columns.name')}</TableCell>
              <TableCell>{t('it-components.list.columns.role', 'Rôle')}</TableCell>
              <TableCell>{t('applications.list.columns.domain')}</TableCell>
              <TableCell>{t('applications.list.columns.owner')}</TableCell>
              <TableCell>{t('applications.list.columns.criticality')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.data.map((app: ApplicationWithRole) => (
              <TableRow key={app.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <TableCell>
                  <Link
                    component={RouterLink}
                    to={`/applications/${app.id}`}
                    underline="always"
                    sx={{ color: 'inherit', '&:hover': { color: 'primary.main' } }}
                  >
                    {app.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={t(`data-objects.roles.${app.role}`, app.role)}
                    color={roleColorMap[app.role] ?? 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{app.domain?.name ?? '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {app.owner ? `${app.owner.firstName} ${app.owner.lastName}` : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{app.criticality ?? '—'}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={data.meta.total}
        page={page}
        rowsPerPage={20}
        rowsPerPageOptions={[20]}
        onPageChange={(_, p) => setPage(p)}
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('common.of')} ${count}`}
      />
    </Box>
  );
}
