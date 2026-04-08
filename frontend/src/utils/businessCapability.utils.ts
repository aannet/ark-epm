import { Theme } from '@mui/material/styles';
import { BusinessCapabilityTreeNode, BusinessCapabilityListItem, CriticalityLevel } from '@/types/businessCapability';

/**
 * Calcule récursivement le total d'applications (nœud + descendants).
 * Utilisé pour la vue matrix et l'agrégation US19.
 * 
 * @param node - Nœud de l'arbre des Business Capabilities
 * @returns Total d'applications cumulées (nœud + enfants)
 */
export function sumApplications(node: BusinessCapabilityTreeNode): number {
  return (
    node._count.applicationMappings +
    node.children.reduce((acc, child) => acc + sumApplications(child), 0)
  );
}

/**
 * Vérifie si un nœud est un descendant d'un ancêtre donné.
 * Utilisé pour exclure les descendants du sélecteur parent (RM-BC-05).
 * 
 * @param tree - Arbre complet des Business Capabilities
 * @param ancestorId - ID du nœud potentiellement ancêtre
 * @param nodeId - ID du nœud à vérifier
 * @returns true si nodeId est descendant de ancestorId
 */
export function isDescendant(
  tree: BusinessCapabilityTreeNode[],
  ancestorId: string,
  nodeId: string
): boolean {
  if (ancestorId === nodeId) return true;

  function findNode(nodes: BusinessCapabilityTreeNode[], id: string): BusinessCapabilityTreeNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  }

  function checkDescendants(node: BusinessCapabilityTreeNode): boolean {
    if (node.id === ancestorId) return true;
    return node.children.some(checkDescendants);
  }

  const startNode = findNode(tree, nodeId);
  if (!startNode) return false;
  return checkDescendants(startNode);
}

/**
 * Construit le chemin hiérarchique complet d'un nœud (pour breadcrumb).
 * Utilisé dans le drawer et les pages de détail (RM-BC-07).
 * 
 * @param tree - Arbre complet des Business Capabilities
 * @param nodeId - ID du nœud cible
 * @returns Array de { id, name } depuis la racine jusqu'au nœud
 */
export function buildHierarchyPath(
  tree: BusinessCapabilityTreeNode[],
  nodeId: string
): Array<{ id: string; name: string }> {
  function findPath(
    nodes: BusinessCapabilityTreeNode[],
    targetId: string,
    currentPath: Array<{ id: string; name: string }> = []
  ): Array<{ id: string; name: string }> | null {
    for (const node of nodes) {
      const newPath = [...currentPath, { id: node.id, name: node.name }];
      
      if (node.id === targetId) {
        return newPath;
      }
      
      if (node.children.length > 0) {
        const found = findPath(node.children, targetId, newPath);
        if (found) return found;
      }
    }
    return null;
  }

  return findPath(tree, nodeId) || [];
}

/**
 * Aplatit l'arbre récursif en liste plate avec level.
 * Utilisé pour convertir le résultat de GET /tree en format tableau.
 * 
 * @param tree - Arbre des Business Capabilities
 * @returns Liste plate avec chaque nœud et ses métadonnées
 */
export function flattenTree(tree: BusinessCapabilityTreeNode[]): BusinessCapabilityListItem[] {
  function flatten(nodes: BusinessCapabilityTreeNode[]): BusinessCapabilityListItem[] {
    return nodes.reduce<BusinessCapabilityListItem[]>((acc, node) => {
      const item: BusinessCapabilityListItem = {
        id: node.id,
        name: node.name,
        description: null,
        level: node.level,
        parentId: null,
        parent: null,
        domainId: node.domainId,
        domain: node.domain,
        criticality: node.criticality,
        technicalFit: node.technicalFit,
        createdAt: '',
        _count: node._count,
        tags: [],
      };
      
      return [...acc, item, ...flatten(node.children)];
    }, []);
  }

  return flatten(tree);
}

/**
 * Extrait les IDs des nœuds racine (level 0) depuis l'arbre.
 * Utilisé pour l'expansion par défaut dans MUI TreeView.
 * 
 * @param tree - Arbre des Business Capabilities
 * @returns Array d'IDs des nœuds racine
 */
export function getRootNodeIds(tree: BusinessCapabilityTreeNode[]): string[] {
  return tree.filter((node) => node.level === 0).map((node) => node.id);
}

/**
 * Retourne la couleur de background selon la criticality.
 * Utilisé pour la vue matrix (US13, RM-BC-04).
 * 
 * @param criticality - Niveau de criticité (LOW/MEDIUM/HIGH/CRITICAL ou null)
 * @param theme - Thème MUI
 * @returns Couleur de background
 */
export function getCriticalityColor(criticality: CriticalityLevel | null, theme: Theme): string {
  switch (criticality) {
    case 'LOW':
      return theme.palette.success.light;
    case 'MEDIUM':
      return theme.palette.warning.light;
    case 'HIGH':
      return theme.palette.error.light;
    case 'CRITICAL':
      return theme.palette.error.dark;
    default:
      return theme.palette.grey[300];
  }
}
