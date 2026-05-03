import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ApplicationDrawer from '@/components/applications/ApplicationDrawer';
import BusinessCapabilityDrawer from '@/components/business-capabilities/BusinessCapabilityDrawer';
import DataObjectDrawer from '@/components/data-objects/DataObjectDrawer';
import ITComponentDrawer from '@/components/it-components/ITComponentDrawer';
import ProvidersDrawer from '@/components/providers/ProvidersDrawer';
import { useITComponent } from '@/api/it-components';
import { getDataObject } from '@/services/api/data-objects.api';
import { GraphNode } from '@/types/graph';

interface GraphEntityDrawerProps {
  selectedNode: GraphNode | null;
  open: boolean;
  onClose: () => void;
}

export default function GraphEntityDrawer({ selectedNode, open, onClose }: GraphEntityDrawerProps): JSX.Element {
  // AGENT-DECISION: front — Réutiliser les drawers existants (PNS-02) par type pour éviter toute duplication de logique détail.
  const navigate = useNavigate();
  const selectedId = selectedNode?.id || null;
  const selectedType = selectedNode?.type || null;

  const { data: selectedItComponent } = useITComponent(selectedId || '', {
    enabled: open && selectedType === 'it_component' && Boolean(selectedId),
  });

  const { data: selectedDataObject } = useQuery({
    queryKey: ['graph', 'drawer', 'data-object', selectedId],
    enabled: open && selectedType === 'data_object' && Boolean(selectedId),
    queryFn: () => getDataObject(selectedId as string),
  });

  if (!selectedType) {
    return <></>;
  }

  if (selectedType === 'application') {
    return <ApplicationDrawer applicationId={selectedId} open={open} onClose={onClose} />;
  }

  if (selectedType === 'bc') {
    return <BusinessCapabilityDrawer capabilityId={selectedId} open={open} onClose={onClose} />;
  }

  if (selectedType === 'provider') {
    return <ProvidersDrawer providerId={selectedId} open={open} onClose={onClose} />;
  }

  if (selectedType === 'it_component') {
    return <ITComponentDrawer itComponent={selectedItComponent} open={open} onClose={onClose} />;
  }

  if (selectedType === 'data_object') {
    return (
      <DataObjectDrawer
        open={open}
        dataObject={selectedDataObject || null}
        onClose={onClose}
        onNavigateDetail={(id) => {
          onClose();
          navigate(`/data-objects/${id}`);
        }}
        onNavigateEdit={(id) => {
          onClose();
          navigate(`/data-objects/${id}/edit`);
        }}
      />
    );
  }

  return <></>;
}
