import { InterfaceResponse, InterfaceListItem } from '@/types/interface';

/**
 * Formate le titre d'une interface : utilise le nom si présent,
 * sinon construit "source → [middleware] → cible"
 * AGENT-DECISION: front — RM-IF-06 implémentée : représentation chaîne source→middleware→cible
 */
export function formatInterfaceTitle(
  iface: Pick<InterfaceResponse | InterfaceListItem, 'name' | 'sourceApp' | 'middlewareApp' | 'targetApp'>
): string {
  if (iface.name) return iface.name;

  const parts = [iface.sourceApp.name];
  if (iface.middlewareApp) {
    parts.push(iface.middlewareApp.name);
  }
  parts.push(iface.targetApp.name);
  return parts.join(' → ');
}

/**
 * Formate le taux d'erreur pour affichage avec suffixe %
 * AGENT-DECISION: front — RM-IF-05 implémentée : arrondi à 2 décimales avec suffixe %
 */
export function formatErrorRate(rate: number | null): string {
  if (rate === null) return '';
  return `${Number(rate).toFixed(2)} %`;
}
