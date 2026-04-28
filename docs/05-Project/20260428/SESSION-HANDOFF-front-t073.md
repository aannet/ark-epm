# SESSION-HANDOFF — front — T-073 (2026-04-28)

## Tâche
T-073 — Adapter le layout de Application Detail aux autres pages détail

## Ce qui a été fait

### Code
- **`frontend/src/components/shared/DetailComponents.tsx`** (NOUVEAU)
  - Extrait des composants inline de ApplicationDetailPage : `DetailRow`, `ClickableRow`, `RelationCard`
  - Réutilisés par toutes les pages détail (DRY)

- **`ApplicationDetailPage.tsx`** — refactoring pour utiliser `DetailComponents`

- **`BusinessCapabilityDetailPage.tsx`** — refonte complète
  - maxWidth="xl", AppBreadcrumbs, Avatar `secondary.dark`
  - Header inline : h2 + subtitle "Niveau X · Domaine" + chips Criticality/TechnicalFit + Edit
  - 2 tabs : Informations (2-col) / Applications (`useBusinessCapabilityApplications`)
  - Tab Applications : table paginée 20/page (name, domain, owner, criticality, lifecycle)

- **`InterfaceDetailPage.tsx`** — refonte complète
  - maxWidth="xl", AppBreadcrumbs, Avatar `info.dark`
  - Header inline : h2 + subtitle "source → [middleware →] target" + chip type + chip criticality + Edit
  - 1 tab Informations (2-col)
  - Source/Target/Middleware en `RelationCard` cliquables
  - Sidebar : tags, technicalContact, errorRate, description, comment, dates

- **`DataObjectDetailPage.tsx`** — refonte
  - maxWidth="xl", AppBreadcrumbs, Avatar `success.dark`
  - Header inline : h2 + subtitle type + chip isSourceOfTruth + Edit
  - 2 tabs : Informations (2-col) / Applications (ApplicationListTable existant)
  - Delete déplacé en bas de page (droite)

- **`ITComponentDetailPage.tsx`** — refonte
  - maxWidth="xl", AppBreadcrumbs, Avatar `warning.dark`
  - Header inline : h2 + subtitle "technology · type" + Edit
  - 2 tabs : Informations (2-col) / Applications (table paginée existante)
  - Delete déplacé en bas de page (droite)

- **`ProviderDetailPage.tsx`** — refonte
  - maxWidth="xl`, AppBreadcrumbs (remplace MUI Breadcrumbs custom), Avatar `error.dark`
  - Header inline : h2 + subtitle contractType + Edit
  - 2 tabs : Informations (2-col) / Applications (table paginée existante)
  - Delete déplacé en bas de page (droite)

### i18n
- `fr.json` : +1 clé `businessCapabilities.detail.updatedAt`
- Réutilisation des clés `applications.detail.section.*` (general, relations, tags, metadata)

### Specs
- `FS-07-Business-Capabilities-front.md` §4.6 — Layout Contract réécrit (v1.1)
- `FS-08-Interfaces-front.md` §4.3 — Layout Contract réécrit (v1.1)
- `FS-03-Providers-front.md` §4.3 — Layout Contract réécrit (v1.1)
- `FS-04-IT-Components-front.md` §4.3 — Layout Contract réécrit (v1.1)
- `FS-05-Data-Objects-front.md` §4.3 — Layout Contract réécrit (v1.1)

### Validation
- `tsc --noEmit` : 0 erreur
- `npm run build` : succès

## Points d'attention
1. **ITComponentDetailPage tags** : mapping `EntityTagResponse[] → TagValueResponse[]` via `.map(t => ({ ...t.tagValue, dimensionColor: t.tagValue.dimensionColor ?? undefined }))` (même pattern que ITComponentDrawer)
2. **BusinessCapabilityDetailPage RouterLink** : MUI v9 exige `<Link component={RouterLink}>` au lieu de `<RouterLink>` direct
3. **InterfaceDetailPage** : pas de tab Applications (l'interface EST la relation entre apps)
4. **ProviderDetailPage** : Edit dans header inline, Delete dans footer (pattern cohérent)
5. **Ctrl+F5** recommandé après déploiement pour vider le cache navigateur

## Gates validées
- T-065 done (référence layout)
- T-064 done (MUI v9 stable)
- Build + tsc OK
- 5 specs front mises à jour
