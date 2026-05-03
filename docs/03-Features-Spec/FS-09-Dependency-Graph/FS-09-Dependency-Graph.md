# FS-09 — Dependency Graph

| Champ | Valeur |
|---|---|
| **ID** | FS-09 |
| **Titre** | Dependency Graph — Visualisation des dépendances applicatives |
| **Statut** | `draft` |
| **Dépend de** | FS-01, FS-06-BACK, FS-08-BACK |
| **Sprint** | S4 |
| **Date** | 2026-05-03 |

---

## Documents

| Document | Statut | Rôle |
|---|---|---|
| [FS-09-Dependency-Graph-userstories.md](./FS-09-Dependency-Graph-userstories.md) | `stable` | User stories P1 + P2, tableau de décisions D1-D19 |
| [FS-09-Dependency-Graph-back.md](./FS-09-Dependency-Graph-back.md) | `draft` | Spec backend — `GET /api/v1/graph` |
| [FS-09-Dependency-Graph-front.md](./FS-09-Dependency-Graph-front.md) | `draft` | Spec frontend — GraphPage ReactFlow |

---

## Résumé

Expose un canvas ReactFlow centré sur une entité focale (Application, BC, Domain, Provider, IT Component, Data Object) et affiche ses dépendances en multi-couches. Layout Dagre automatique, filtres client-side (criticité, domaine), toolbar avec toggle couches et depth slider.

---

## Décisions clés (voir tableau complet dans userstories.md)

| Décision | Valeur P1 |
|---|---|
| Endpoint | `GET /api/v1/graph?focalType=&focalId=&depth=&layers=` |
| Focal | 6 types d'entités ARK |
| Filtering | layers/depth/focal = server · criticality/domain = client |
| Permission | `applications:read` (réutilisation) |
| Layout | Dagre (LR) fixe en P1 |
| Nœud middleware | Nœud intermédiaire → 2 arêtes visuelles |
| Drawer | PNS-02 existant — appel à la volée `GET /[type]/:id` |

---

## Scope P2 (tâches futures)

- **US-08** : Navigation historique ← → (useState)
- **US-09** : Switch algo ELK / Force-directed
- **US-11** : Export Mermaid
- **US-12** : Deep linking complet (gestion focalId invalide, bouton partage)
- **D12** : Domain GroupNode conteneur
- **US-01** : Bouton "Voir dans le graphe" sur les pages détail entités

---

## Gates bloquantes

| Gate | Description | Statut |
|---|---|---|
| T-085 (spec) | FS-09-BACK + FS-09-FRONT rédigées | ✅ in_progress |
| T-086 (back) | WITH RECURSIVE BC enfants — prérequis US-04 | ⏳ open |
| T-003 (impl) | Implémentation ReactFlow front | 🔒 blocked jusqu'à FS-09-BACK done |
