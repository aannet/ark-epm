import { Box, Typography, Button, Paper, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout';
import { PageHeader, EmptyState, LoadingSkeleton, StatusChip, ConfirmDialog } from '@/components/shared';
import { useState } from 'react';

export default function DesignSystemPage(): JSX.Element {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <PageContainer>
      <Typography variant="h2" gutterBottom>
        Design System — ARK EPM
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Page de validation visuelle des composants — Usage développement uniquement
      </Typography>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h3" sx={{ mb: 2 }}>
        Boutons
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button variant="contained">Action principale</Button>
        <Button variant="outlined">Action secondaire</Button>
        <Button color="error">Suppression</Button>
        <Button variant="text">Texte</Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h3" sx={{ mb: 2 }}>
        StatusChip — Criticality
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <StatusChip type="criticality" value="low" />
        <StatusChip type="criticality" value="medium" />
        <StatusChip type="criticality" value="high" />
        <StatusChip type="criticality" value="mission-critical" />
      </Box>

      <Typography variant="h3" sx={{ mb: 2 }}>
        StatusChip — Lifecycle
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <StatusChip type="lifecycle" value="draft" />
        <StatusChip type="lifecycle" value="in_progress" />
        <StatusChip type="lifecycle" value="production" />
        <StatusChip type="lifecycle" value="deprecated" />
        <StatusChip type="lifecycle" value="retired" />
      </Box>

      <Typography variant="h3" sx={{ mb: 2 }}>
        StatusChip — Active
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
        <StatusChip type="active" value={true} />
        <StatusChip type="active" value={false} />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h3" sx={{ mb: 2 }}>
        PageHeader
      </Typography>
      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
        <PageHeader
          title="Liste des domaines"
          subtitle="Gérez vos domaines métier"
          action={{
            label: 'Créer un domaine',
            onClick: () => {},
            icon: <AddIcon />,
          }}
        />
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h3" sx={{ mb: 2 }}>
        EmptyState
      </Typography>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <EmptyState
          title="Aucun domaine créé"
          description="Commencez par créer votre premier domaine."
          action={{
            label: 'Créer un domaine',
            onClick: () => {},
          }}
        />
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h3" sx={{ mb: 2 }}>
        LoadingSkeleton
      </Typography>
      <LoadingSkeleton rows={3} columns={4} />

      <Divider sx={{ my: 4 }} />

      <Typography variant="h3" sx={{ mb: 2 }}>
        ConfirmDialog
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Button variant="contained" color="error" onClick={() => setDialogOpen(true)}>
          Ouvrir dialog
        </Button>
        <ConfirmDialog
          open={dialogOpen}
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          onConfirm={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
          severity="error"
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h3" sx={{ mb: 2 }}>
        Pages d'erreur
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/foo-bar')}>
          Tester 404 (NotFoundPage)
        </Button>
      </Box>
    </PageContainer>
  );
}
