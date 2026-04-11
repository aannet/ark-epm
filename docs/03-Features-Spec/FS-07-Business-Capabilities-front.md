# ARK — Feature Spec FS-07-FRONT : Business Capabilities (Frontend)

_Version 1.1 — Avril 2026_

> **Changelog v1.1 :** T-033/T-034/T-035 — suppression vue arbre MUI TreeView (redondante avec liste arborescente), vue matrix : CriticalityChip remplace couleur de fond, badge niveau supprimé, max 2 domaines L0 par rangée en desktop (`md=6`).
>
> **Changelog v1.0 :** Création initiale — module Business Capabilities frontend avec 3 vues (liste arborescente, arbre MUI TreeView, matrix), drawer read-only (PNS-02), formulaire avec criticality/technicalFit, hiérarchie récursive, agrégation client-side. Conforme PNS-11 (breadcrumb systématique). Intègre le composant partagé `AppBreadcrumbs` (première implémentation réelle PNS-11).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-07-FRONT |
| **Titre** | Business Capabilities — Pages React (2 vues / Détail / New / Edit) |
| **Priorité** | P1 |
| **Statut** | `draft` *(devient `stable` uniquement après que T-019 amendment backend est `done`)* |
| **Dépend de** | **FS-07-BACK** (gate bloquante), **T-019** (amendment criticality/technicalFit), FS-01, F-02, F-03 |
| **Spec mère** | FS-07 Business Capabilities v1.0 |
| **Estimé** | 3 jours |
| **Version** | 1.0 |

> ⚠️ Cette spec reste à `draft` tant que **T-019** (amendment FS-07-BACK pour les champs `criticality` et `technicalFit`) n'est pas au statut `done`.

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette spec fait :**

Implémenter les pages React pour la gestion des Business Capabilities : liste arborescente avec 2 vues (liste / matrix), drawer de consultation read-only (PNS-02), détail complet, création et modification. Ce module est le **patron de référence pour les hiérarchies récursives**.

Le frontend implémente :
- **2 vues interchangeables via toggle** : liste arborescente indentée, matrix tuiles imbriquées
- Liste arborescente avec expand/collapse par niveau (L0 expanded par défaut)
- Side Drawer read-only avec breadcrumb hiérarchique cliquable et empreinte applicative
- Page détail avec affichage des relations (parent, domain, applications liées)
- Formulaires de création/modification avec sélection parent (reparenting), criticality, technicalFit
- Agrégation récursive client-side du nombre d'applications (US19)
- Breakdown applications par `lifecycleStatus` (US06 reformulée)
- Gestion des erreurs `400 CIRCULAR_REFERENCE` et `409 DEPENDENCY_CONFLICT` avec compteurs enfants + apps

**Hors périmètre :**
- Backend API — couvert par `FS-07-BACK`
- Amendment backend (criticality/technicalFit) — couvert par **T-019**
- Export CSV/PNG/mermaid — P2 (US15)
- Onglet Lifecycle — P2 (US18, spec T-017)
- Drag & drop réorganisation arbre — P2

---

## 2. User Stories

### 2.1 Liste et navigation (US01, US04, US16)

**US-01 — Création de la hiérarchie L1/L2/L3**

En tant qu'Architecte Entreprise,
Je veux pouvoir créer des capacités et les imbriquer sur plusieurs niveaux,
Afin de refléter la structure réelle des métiers de la banque.

Critères d'acceptation :
- [ ] La liste affiche la hiérarchie avec indentation visuelle par niveau
- [ ] Je peux créer une capacité racine (sans parent)
- [ ] Je peux créer une capacité enfant en sélectionnant un parent
- [ ] Le niveau (`level`) est calculé automatiquement et affiché
- [ ] La hiérarchie est illimitée en profondeur (conforme ARK-Product-Brief)

**US-04 — Navigation Arborescente (Expand/Collapse)**

En tant qu'Architecte Entreprise,
Je veux pouvoir déplier ou replier les branches de la hiérarchie,
Afin de me concentrer sur un domaine spécifique sans être submergé par les données.

Critères d'acceptation :
- [ ] Chaque nœud parent a une icône expand/collapse
- [ ] Par défaut, les nœuds L0 sont déployés, L1+ sont repliés
- [ ] L'état expand/collapse persiste dans l'état local React
- [x] ~~La vue arbre MUI TreeView (`?view=tree`) gère l'expand/collapse nativement~~ _(supprimée T-033 — expand/collapse géré nativement dans la vue liste)_

**US-16 — Filtrage Avancé par Métier**

En tant qu'Architecte Entreprise,
Je veux filtrer ma vue liste par Domain,
Afin de produire des rapports segmentés pour les différents directeurs métiers.

Critères d'acceptation :
- [ ] Un filtre Domain (Autocomplete) est disponible en en-tête
- [ ] Le filtre est appliqué côté serveur (`?domainId=xxx`)
- [ ] Une recherche textuelle (`?search=`) est disponible
- [ ] Les filtres se combinent (AND)

### 2.2 Drawer et consultation (US03, US06, US07)

**US-03 — Consultation via le Side-Panel**

En tant qu'Architecte Entreprise,
Je veux cliquer sur une capacité pour ouvrir un volet latéral,
Afin de consulter ou modifier ses détails sans perdre ma position dans la hiérarchie.

Critères d'acceptation :
- [ ] Clic sur une ligne (hors nom) → ouvre le drawer
- [ ] Le drawer affiche : nom, description, domain, criticality, technicalFit, tags, breadcrumb hiérarchique
- [ ] Le drawer est **read-only** (PNS-02) — toute modification passe par "Modifier"
- [ ] Footer : "Modifier" (disabled sans `business-capabilities:write`) + "Voir la fiche complète"
- [ ] Le drawer reste ouvert lors du changement de vue (liste → matrix)

**US-06 — Distribution des Apps par Lifecycle (reformulée)**

En tant qu'Architecte Entreprise,
Je veux visualiser le nombre d'applications liées selon leur cycle de vie,
Afin d'identifier visuellement les zones de densité technologique et de préparer les plans de modernisation.

Critères d'acceptation :
- [ ] Le drawer affiche une section "Empreinte applicative"
- [ ] Total d'applications liées (`_count.applicationMappings`)
- [ ] Breakdown par `lifecycleStatus` : Active (X), Sunset (Y), etc.
- [ ] Données chargées depuis `GET /:id/applications` (pagination gérée côté frontend)

**US-07 — Saisie de l'Empreinte Applicative**

En tant qu'Architecte Entreprise,
Je veux visualiser le nombre de systèmes actifs pour chaque capacité,
Afin d'identifier visuellement les zones de forte densité technologique.

Critères d'acceptation :
- [ ] Colonne "Applications" dans la liste affiche `_count.applicationMappings`
- [ ] Le compteur est cliquable → ouvre le drawer sur l'onglet Applications
- [ ] Les applications liées sont affichées dans l'onglet Relations de la page Edit

### 2.3 Définition des Domaines et Attributs (US02, US09, US10)

**US-02 — Définition des Domaines (L1)**

En tant qu'Architecte Entreprise,
Je veux catégoriser mes capacités de plus haut niveau par domaines (ex: Customer Management),
Afin d'organiser mon référentiel par grandes lignes métier.

Critères d'acceptation :
- [ ] Le formulaire de création/édition propose un champ Domain (Autocomplete)
- [ ] Le domain est affiché dans la liste et le drawer
- [ ] Le filtre par domain est disponible (US16)

**US-09 — Évaluation de la Criticité (business criticality)**

En tant qu'Architecte Entreprise,
Je veux définir le niveau d'impact métier (ex: Medium Impact),
Afin de prioriser les projets de transformation sur les fonctions vitales.

Critères d'acceptation :
- [ ] Un champ `criticality` (enum : LOW / MEDIUM / HIGH / CRITICAL) est disponible dans le formulaire
- [ ] La criticality est affichée sous forme de chip coloré dans la liste et le drawer
- [ ] La vue matrix utilise la criticality pour la coloration des tuiles

**US-10 — Monitoring de l'Obsolescence (technical fit)**

En tant qu'Architecte Entreprise,
Je veux marquer certaines capacités comme "Legacy",
Afin de préparer les plans de retrait ou de remplacement technologique.

Critères d'acceptation :
- [ ] Un champ `technicalFit` (enum : ADEQUATE / PARTIAL / INADEQUATE / LEGACY) est disponible dans le formulaire
- [ ] Le technical fit est affiché sous forme de chip dans le drawer et la page détail
- [ ] Un filtre par technical fit sera disponible en P2

### 2.4 Rattachement hiérarchique (US05)

**US-05 — Rattachement des business capabilities enfants (L3)**

En tant qu'Architecte Entreprise,
Je veux lier des business capabilities enfants à des capacités mères,
Afin de garantir la traçabilité de la chaîne de valeur.

Critères d'acceptation :
- [ ] Le formulaire de création/édition propose un champ Parent (Autocomplete)
- [ ] La liste des parents exclut l'entité elle-même et ses descendants (prévention circulaire)
- [ ] Le niveau (`level`) est recalculé automatiquement après reparenting
- [ ] Un breadcrumb hiérarchique cliquable est affiché dans le drawer et la page détail

### 2.5 Vue Matrix (US13)

**US-13 — Vue Matrix (Mosaïque)**

En tant qu'Architecte Entreprise,
Je veux basculer sur une vue en tuiles colorées par statut,
Afin d'avoir une vision globale et synthétique de la santé du domaine en un coup d'œil.
La structure arborescente doit être représentée en tuile dans tuile.

Critères d'acceptation :
- [ ] Un toggle "Matrix" est disponible dans le header de la page
- [ ] La vue matrix affiche des tuiles imbriquées (L0 → L1 → L2)
- [ ] Chaque tuile est colorée selon la `criticality` (LOW=vert, MEDIUM=jaune, HIGH=orange, CRITICAL=rouge)
- [ ] Un badge affiche le nombre d'applications liées (`_count.applicationMappings`)
- [ ] Au hover, un tooltip affiche le breakdown par lifecycle status
- [ ] La source de données est `GET /tree` (un seul appel)

### 2.6 Agrégation récursive (US19)

**US-19 — Agrégation de l'Empreinte par Domaine**

En tant qu'Architecte Entreprise,
Je veux voir le total d'applications cumulées par domaine L1,
Afin de comparer le poids informatique entre les différentes branches de la banque.

Critères d'acceptation :
- [ ] Dans la vue matrix, chaque tuile affiche le total récursif d'applications (nœud + descendants)
- [ ] Le calcul est effectué client-side depuis la réponse `/tree`
- [ ] La formule est : `sumApplications(node) = _count.applicationMappings + children.reduce(sum)`

---

## 3. Référence Contrat API

> Le contrat API complet est défini dans **FS-07-BACK §3** + **amendment T-019**.
> La session OpenCode frontend doit recevoir FS-07-BACK §3 en contexte additionnel (voir commande §11).

Endpoints disponibles après validation de FS-07-BACK + T-019 :

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/business-capabilities` | Liste paginée flat | `business-capabilities:read` |
| `POST` | `/api/v1/business-capabilities` | Créer | `business-capabilities:write` |
| `GET` | `/api/v1/business-capabilities/tree` | Arbre complet nested (WITH RECURSIVE) | `business-capabilities:read` |
| `GET` | `/api/v1/business-capabilities/:id` | Détail | `business-capabilities:read` |
| `GET` | `/api/v1/business-capabilities/:id/children` | Enfants directs (paginé) | `business-capabilities:read` |
| `GET` | `/api/v1/business-capabilities/:id/applications` | Applications liées (paginé) | `business-capabilities:read` |
| `PATCH` | `/api/v1/business-capabilities/:id` | Modifier (inclut reparenting) | `business-capabilities:write` |
| `DELETE` | `/api/v1/business-capabilities/:id` | Supprimer | `business-capabilities:write` |

### Nouveaux champs exposés (T-019 amendment)

| Champ | Type | Présence | Valeurs |
|---|---|---|---|
| `criticality` | enum nullable | Response, ListItem, TreeNode | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| `technicalFit` | enum nullable | Response, ListItem, TreeNode | `ADEQUATE` \| `PARTIAL` \| `INADEQUATE` \| `LEGACY` |

Codes HTTP à gérer côté frontend :

| Code | Signification | Action frontend |
|------|--------------|-----------------|
| `200` / `201` | Succès | Snackbar + navigation selon contexte (voir §4) |
| `400` `CIRCULAR_REFERENCE` | Reparenting circulaire | Erreur inline sur champ `parentId` : `t('businessCapabilities.form.circularReference')` |
| `400` | Validation échouée | Erreur inline sur le champ concerné |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |
| `404` | Ressource introuvable | `navigate('/business-capabilities')` |
| `409` `CONFLICT` | Nom dupliqué | Erreur inline `t('businessCapabilities.form.nameDuplicate')` |
| `409` `DEPENDENCY_CONFLICT` | Suppression bloquée (enfants ou apps liées) | Message formaté dans `ConfirmDialog` avec `error.details.childrenCount` + `applicationsCount` |

---

## 4. Layout Contract

> Contrat de résolution des composants pour chaque page/vue.
> OpenCode **doit** utiliser le composant F-01 indiqué — jamais réinventer avec Box+Typography custom.

---

### 4.1 `BusinessCapabilitiesPage` — Vue Liste Arborescente (défaut)

```yaml
page: BusinessCapabilitiesPage
route: /business-capabilities
auth_required: true
permission_required: business-capabilities:read

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  header:
    component: PageHeader
    props:
      title: t('businessCapabilities.list.title')
      subtitle: t('businessCapabilities.list.subtitle')
      action:
        condition: hasPermission('business-capabilities:write')
        label: t('businessCapabilities.list.addButton')
        onClick: navigate('/business-capabilities/new')
        icon: AddIcon
      secondary_actions:
        component: ToggleButtonGroup (MUI)
        exclusive: true
        value: view state ('list' | 'tree' | 'matrix')
        onChange: setView + navigate('?view={value}')
        buttons:
          - value: list
            icon: ViewListIcon
            aria_label: t('businessCapabilities.views.list')
          # vue tree supprimée — T-033
          - value: matrix
            icon: GridViewIcon
            aria_label: t('businessCapabilities.views.matrix')

  filters:
    component: Box avec Row layout
    filters:
      - field: search
        component: TextField
        props:
          placeholder: t('businessCapabilities.list.searchPlaceholder')
          variant: outlined
          size: small
          InputProps:
            startAdornment: SearchIcon
      - field: domainId
        component: Autocomplete
        props:
          options: GET /api/v1/domains
          label: t('businessCapabilities.list.filters.domain')
          getOptionLabel: option.name
          size: small
      - action: reset
        component: Button
        props:
          variant: outlined
          onClick: resetFilters
          label: t('common.filters.reset')

  body:
    component: MUI Table avec TableSortLabel
    loading_state: LoadingSkeleton
    empty_state: EmptyState
    empty_state_props:
      title: t('businessCapabilities.list.emptyState.title')
      description: t('businessCapabilities.list.emptyState.description')
      action:
        condition: hasPermission('business-capabilities:write')
        label: t('businessCapabilities.list.emptyState.cta')
        onClick: navigate('/business-capabilities/new')
    columns:
      - field: name
        header: t('businessCapabilities.list.columns.name')
        sortable: true
        render: |
          <Box sx={{ paddingLeft: `${row.level * 24}px`, display: 'flex', alignItems: 'center' }}>
            {row._count.children > 0 && (
              <IconButton size="small" onClick={toggleExpand(row.id)}>
                {expanded.has(row.id) ? <ExpandMoreIcon /> : <ChevronRightIcon />}
              </IconButton>
            )}
            <Link onClick={() => navigate(`/business-capabilities/${row.id}`)}>{row.name}</Link>
          </Box>
        clickable: navigate('/business-capabilities/${row.id}')
      - field: level
        header: t('businessCapabilities.list.columns.level')
        sortable: true
        render: |
          <Typography variant="body2" color="text.secondary">L{row.level}</Typography>
      - field: domain
        header: t('businessCapabilities.list.columns.domain')
        sortable: false
        render: row.domain?.name ?? '—'
      - field: criticality
        header: t('businessCapabilities.list.columns.criticality')
        sortable: true
        render: |
          {row.criticality ? <CriticalityChip level={row.criticality} /> : '—'}
      - field: applicationsCount
        header: t('businessCapabilities.list.columns.applicationsCount')
        sortable: true
        render: |
          <Chip 
            label={row._count.applicationMappings} 
            size="small"
            onClick={openDrawerOnTab(row.id, 'applications')}
            clickable
          />
      - field: actions
        header: t('businessCapabilities.list.columns.actions')
        condition: hasPermission('business-capabilities:write')
        row_actions:
          - type: edit
            icon: EditIcon
            aria_label: t('common.actions.edit')
            onClick: navigate('/business-capabilities/${row.id}/edit')
          - type: delete
            icon: DeleteIcon
            aria_label: t('common.actions.delete')
            onClick: open confirm-delete dialog

  sort_state:
    default_field: name
    default_order: asc
    scope: client-side

  expand_state:
    default: Set with level 0 IDs expanded
    storage: React useState local
    behavior: toggle on icon click, children rows hidden if parent collapsed

  dialogs:
    - id: confirm-delete
      component: ConfirmDialog
      trigger: delete IconButton click
      props:
        title: t('businessCapabilities.delete.confirmTitle')
        message: t('businessCapabilities.delete.confirmMessage', { name: row.name })
        confirmLabel: t('common.actions.delete')
        severity: error
      on_confirm: DELETE /api/v1/business-capabilities/:id
      on_success: navigate('/business-capabilities') + snackbar t('businessCapabilities.snackbar.deleted')
      on_409_DEPENDENCY_CONFLICT: |
        remplacer message par:
        t('businessCapabilities.delete.blockedMessage', {
          childrenCount: error.details.childrenCount,
          applicationsCount: error.details.applicationsCount
        })
        + bouton Confirmer désactivé

  drawer:
    component: BusinessCapabilityDrawer
    trigger: clic sur ligne (hors nom et actions)
    props:
      capabilityId: row.id
      onClose: setDrawerOpen(false)
      onEdit: navigate(`/business-capabilities/${row.id}/edit`)

  snackbars:
    - trigger: delete success
      message: t('businessCapabilities.snackbar.deleted')
      severity: success
```

---

### ~~4.2 `BusinessCapabilitiesPage` — Vue Arbre MUI TreeView~~ _(supprimée — T-033)_

> ~~Vue retirée le 2026-04-11. La liste arborescente avec expand/collapse (§4.1) couvre le même besoin.~~

```yaml
# SUPPRIMÉ — T-033
page: BusinessCapabilitiesPage
route: /business-capabilities?view=tree
auth_required: true
permission_required: business-capabilities:read

on_load:
  action: GET /api/v1/business-capabilities/tree
  on_error: EmptyState with retry button

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  header:
    # Identique à §4.1 (PageHeader + ToggleButtonGroup avec view='tree')

  filters:
    # Identique à §4.1 (search + domainId)
    # Note: filtres non appliqués côté serveur sur /tree — filtrage client-side post-load

  body:
    component: MUI TreeView (from @mui/x-tree-view)
    loading_state: LoadingSkeleton
    empty_state: EmptyState
    props:
      defaultCollapseIcon: <ExpandMoreIcon />
      defaultExpandIcon: <ChevronRightIcon />
      defaultExpanded: [root node IDs (level 0)]
      onNodeSelect: openDrawer(nodeId)
    node_render:
      component: TreeItem (MUI)
      label_template: |
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography>{node.name}</Typography>
          <Typography variant="caption" color="text.secondary">L{node.level}</Typography>
          {node.criticality && <CriticalityChip level={node.criticality} size="small" />}
          <Chip label={node._count.applicationMappings} size="small" />
        </Box>
      recursive: true (children nested)

  drawer:
    # Identique à §4.1
```

---

### 4.3 `BusinessCapabilitiesPage` — Vue Matrix

```yaml
page: BusinessCapabilitiesPage
route: /business-capabilities?view=matrix
auth_required: true
permission_required: business-capabilities:read

on_load:
  action: GET /api/v1/business-capabilities/tree
  on_error: EmptyState with retry button

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  header:
    # Identique à §4.1 (PageHeader + ToggleButtonGroup avec view='matrix')

  filters:
    # Identique à §4.1 (search + domainId)
    # Filtrage client-side post-load

  body:
    component: BusinessCapabilityMatrix
    loading_state: LoadingSkeleton
    empty_state: EmptyState
    props:
      tree: treeData from GET /tree
      onNodeClick: openDrawer(nodeId)
    
    matrix_tile:
      layout: Grid imbriqué (L0 → L1 → L2)
      grid_breakpoints: xs=12, sm=6 (depth=0) ou 12 (depth>0), md=6 (tous depths — max 2 L0 par rangée)
      # T-034: fond neutre (blanc/paper), CriticalityChip remplace background_color
      # T-035: md=6 unifié → 2 colonnes L0 max en desktop (précédemment md=4 → 3 colonnes)
      content: |
        <Card sx={{ p: 2 }}>  {/* fond neutre — pas de backgroundColor */}
          <Typography variant="h6">{node.name}</Typography>
          {/* badge niveau L{node.level} supprimé — T-034 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {node.criticality && <CriticalityChip level={node.criticality} size="small" />}
            <Chip label={`${sumApplications(node)} apps`} size="small" />
          </Box>
          {node.children.length > 0 && (
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {node.children.map(child => <MatrixTile node={child} />)}
            </Grid>
          )}
        </Card>
      tooltip:
        component: MUI Tooltip
        trigger: hover
        content: |
          Breakdown lifecycle (chargé on-demand depuis GET /:id/applications):
          - Active: X
          - Sunset: Y
          - Planned: Z

  drawer:
    # Identique à §4.1
```

---

### 4.4 `BusinessCapabilityDrawer` — Side Panel Read-Only

```yaml
component: BusinessCapabilityDrawer
trigger: clic ligne table / nœud arbre / tuile matrix
width: 400px
anchor: right
read_only: true (PNS-02)

on_load:
  action: GET /api/v1/business-capabilities/:id
  parallel_action: GET /api/v1/business-capabilities/:id/applications (all pages pour breakdown)

zones:
  header:
    component: Box
    content: |
      <Typography variant="h6">{capability.name}</Typography>
      <Typography variant="caption" color="text.secondary">
        Niveau {capability.level}
      </Typography>

  breadcrumb:
    component: Breadcrumb hiérarchique cliquable
    format: |
      <Breadcrumbs separator="›">
        {hierarchyPath.map(ancestor => (
          <Link onClick={() => navigate(`/business-capabilities/${ancestor.id}`)}>
            {ancestor.name}
          </Link>
        ))}
        <Typography color="text.primary">{capability.name}</Typography>
      </Breadcrumbs>
    data_source: |
      Reconstruire depuis parent récursif:
      let path = [];
      let current = capability;
      while (current.parent) {
        path.unshift(current.parent);
        current = current.parent;
      }

  tabs:
    component: MUI Tabs
    tabs:
      - id: info
        label: t('businessCapabilities.drawer.tabs.info')
        content: |
          <Stack spacing={2}>
            <TextField label="Nom" value={capability.name} disabled fullWidth />
            <TextField label="Description" value={capability.description} disabled multiline rows={3} fullWidth />
            <Autocomplete value={capability.domain} disabled label="Domaine" />
            <Box>
              <Typography variant="caption">{t('businessCapabilities.form.criticality')}</Typography>
              {capability.criticality ? <CriticalityChip level={capability.criticality} /> : '—'}
            </Box>
            <Box>
              <Typography variant="caption">{t('businessCapabilities.form.technicalFit')}</Typography>
              {capability.technicalFit ? <TechnicalFitChip level={capability.technicalFit} /> : '—'}
            </Box>
            <TagChipList tags={capability.tags} entityType="business-capability" />
          </Stack>

      - id: applications
        label: t('businessCapabilities.drawer.tabs.applications')
        badge: capability._count.applicationMappings
        content: |
          <Box>
            <Typography variant="subtitle2">
              {t('businessCapabilities.drawer.applicationFootprint')}
            </Typography>
            <Typography variant="h4">{capability._count.applicationMappings}</Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="caption">
              {t('businessCapabilities.drawer.applicationsByLifecycle')}
            </Typography>
            <AppLifecycleBreakdown applications={applications} />
            
            <Divider sx={{ my: 2 }} />
            
            <MiniTable data={applications.slice(0, 5)} columns={[name, domain, owner, criticality]} />
            {applications.length > 5 && (
              <Typography variant="caption" color="text.secondary">
                +{applications.length - 5} autres applications
              </Typography>
            )}
          </Box>

  footer:
    actions:
      - component: Button
        props:
          variant: outlined
          disabled: !hasPermission('business-capabilities:write')
          label: t('businessCapabilities.drawer.editButton')
          onClick: navigate(`/business-capabilities/${capability.id}/edit`)
      - component: Button
        props:
          variant: text
          label: t('businessCapabilities.drawer.viewFullButton')
          onClick: navigate(`/business-capabilities/${capability.id}`)
```

---

### 4.5 `BusinessCapabilityNewPage`

```yaml
page: BusinessCapabilityNewPage
route: /business-capabilities/new
auth_required: true
permission_required: business-capabilities:write

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  breadcrumb:
    component: AppBreadcrumbs
    items:
      - label: t('businessCapabilities.form.breadcrumb.home')
        onClick: navigate('/')
      - label: t('businessCapabilities.form.breadcrumb.list')
        onClick: navigate('/business-capabilities')
      - label: t('businessCapabilities.form.breadcrumb.new')

  header:
    component: PageHeader
    props:
      title: t('businessCapabilities.form.createTitle')
      action: null

  body:
    component: BusinessCapabilityForm
    props:
      initialValues: { name: '', description: '', comment: '', parentId: null, domainId: null, criticality: null, technicalFit: null }
      isLoading: false
      error: null
      onCancel: navigate('/business-capabilities')
      onSubmit: POST /api/v1/business-capabilities

  on_submit_success:
    action: navigate('/business-capabilities/${createdEntity.id}')
    snackbar: t('businessCapabilities.snackbar.created') severity=success

  on_submit_409_CONFLICT:
    action: erreur inline champ name
    message: t('businessCapabilities.form.nameDuplicate')

  on_submit_400:
    action: erreur inline champ name
    message: t('businessCapabilities.form.nameRequired')

  form_rules:
    - save_button_disabled_while: isLoading === true
    - name_validation: non vide, non uniquement espaces (client-side avant submit)
```

---

### 4.6 `BusinessCapabilityDetailPage`

```yaml
page: BusinessCapabilityDetailPage
route: /business-capabilities/:id
auth_required: true
permission_required: business-capabilities:read

on_load:
  action: GET /api/v1/business-capabilities/:id
  on_404: navigate('/business-capabilities')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: md

zones:
  breadcrumb:
    component: AppBreadcrumbs
    items:
      - label: t('businessCapabilities.detail.breadcrumb.home')
        onClick: navigate('/')
      - label: t('businessCapabilities.detail.breadcrumb.list')
        onClick: navigate('/business-capabilities')
      - label: entity.name

  header:
    component: PageHeader
    props:
      title: entity.name
      subtitle: |
        Niveau {entity.level} · {entity.domain?.name ?? 'Sans domaine'}
      action:
        condition: hasPermission('business-capabilities:write')
        label: t('businessCapabilities.detail.editButton')
        onClick: navigate('/business-capabilities/${entity.id}/edit')
        icon: EditIcon

  body:
    loading_state: LoadingSkeleton
    fields:
      - label: t('businessCapabilities.list.columns.name')
        value: entity.name
      - label: t('businessCapabilities.form.description')
        value: entity.description ?? t('businessCapabilities.detail.noValue')
      - label: t('businessCapabilities.form.comment')
        value: entity.comment ?? t('businessCapabilities.detail.noValue')
      - label: t('businessCapabilities.form.domain')
        value: entity.domain?.name ?? '—'
      - label: t('businessCapabilities.form.parent')
        value: |
          {entity.parent ? (
            <Link onClick={() => navigate(`/business-capabilities/${entity.parent.id}`)}>
              {entity.parent.name}
            </Link>
          ) : 'Capacité racine'}
      - label: t('businessCapabilities.form.criticality')
        value: entity.criticality ? <CriticalityChip level={entity.criticality} /> : '—'
      - label: t('businessCapabilities.form.technicalFit')
        value: entity.technicalFit ? <TechnicalFitChip level={entity.technicalFit} /> : '—'
      - label: t('businessCapabilities.detail.tags')
        value: <TagChipList tags={entity.tags} entityType="business-capability" />
      - label: t('businessCapabilities.list.columns.createdAt')
        value: entity.createdAt formaté date locale FR

  footer:
    - component: MUI Button
      props:
        variant: outlined
        label: t('businessCapabilities.detail.backButton')
        onClick: navigate('/business-capabilities')
```

---

### 4.7 `BusinessCapabilityEditPage`

```yaml
page: BusinessCapabilityEditPage
route: /business-capabilities/:id/edit
auth_required: true
permission_required: business-capabilities:write

on_load:
  action: GET /api/v1/business-capabilities/:id
  parallel_action: GET /api/v1/business-capabilities/:id/applications (pour onglet Relations)
  on_404: navigate('/business-capabilities')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: md

zones:
  breadcrumb:
    component: AppBreadcrumbs
    items:
      - label: t('businessCapabilities.form.breadcrumb.home')
        onClick: navigate('/')
      - label: t('businessCapabilities.form.breadcrumb.list')
        onClick: navigate('/business-capabilities')
      - label: entity.name
        onClick: navigate(`/business-capabilities/${entity.id}`)
      - label: t('businessCapabilities.form.breadcrumb.edit')

  header:
    component: PageHeader
    props:
      title: t('businessCapabilities.form.editTitle')
      action: null

  tabs:
    component: MUI Tabs
    tabs:
      - id: general
        label: t('businessCapabilities.form.tabs.general')
        content: |
          <BusinessCapabilityForm
            initialValues={{
              name: entity.name,
              description: entity.description ?? '',
              comment: entity.comment ?? '',
              domainId: entity.domainId,
              criticality: entity.criticality,
              technicalFit: entity.technicalFit
            }}
            onSubmit={PATCH /api/v1/business-capabilities/:id (exclude parentId)}
            onCancel={navigate(`/business-capabilities/${id}`)}
          />

      - id: relations
        label: t('businessCapabilities.form.tabs.relations')
        content: |
          <Stack spacing={3}>
            <Section title={t('businessCapabilities.form.sections.hierarchy')}>
              <Autocomplete
                label={t('businessCapabilities.form.parent')}
                options={allCapabilities.filter(c => c.id !== entity.id && !isDescendant(c.id))}
                value={entity.parent}
                onChange={handleReparent}
                getOptionLabel={option => `${option.name} (L${option.level})`}
              />
              {reparentError && (
                <FormHelperText error>
                  {t('businessCapabilities.form.circularReference')}
                </FormHelperText>
              )}
            </Section>

            <Section title={t('businessCapabilities.form.sections.applications')}>
              <Typography variant="body2" color="text.secondary">
                {entity._count.applicationMappings} application(s) liée(s)
              </Typography>
              <MiniTable
                data={linkedApplications}
                columns={[name, domain, owner, criticality]}
                emptyMessage={t('businessCapabilities.form.noApplications')}
              />
              <Typography variant="caption" color="text.secondary">
                La liaison avec les applications se fait depuis la page Application.
              </Typography>
            </Section>
          </Stack>

      - id: audit
        label: t('businessCapabilities.form.tabs.audit')
        content: |
          <EmptyState
            title={t('businessCapabilities.form.audit.placeholder.title')}
            description={t('businessCapabilities.form.audit.placeholder.description')}
          />

  on_submit_success:
    action: navigate('/business-capabilities/${id}')
    snackbar: t('businessCapabilities.snackbar.updated') severity=success

  on_submit_400_CIRCULAR_REFERENCE:
    action: setReparentError(true) dans onglet Relations
    message: inline sous champ parentId

  on_submit_409_CONFLICT:
    action: erreur inline champ name dans onglet Général
    message: t('businessCapabilities.form.nameDuplicate')

  form_rules:
    - save_button_disabled_while: isLoading === true
    - name_validation: non vide, non uniquement espaces
    - parent_selection_excludes: entity itself + all descendants (recursive)
```

---

## 5. Composants à Générer

### Structure de fichiers

```
frontend/src/
├── pages/
│   └── business-capabilities/
│       ├── BusinessCapabilitiesPage.tsx          ← 2 vues (liste/matrix) + toggle
│       ├── BusinessCapabilityNewPage.tsx
│       ├── BusinessCapabilityDetailPage.tsx
│       └── BusinessCapabilityEditPage.tsx
├── components/
│   ├── shared/
│   │   └── AppBreadcrumbs.tsx                    ← ⭐ nouveau composant PNS-11
│   └── business-capabilities/
│       ├── BusinessCapabilityMatrix.tsx          ← tuiles imbriquées US13 (fond neutre + CriticalityChip)
│       ├── BusinessCapabilityDrawer.tsx          ← side panel PNS-02
│       ├── BusinessCapabilityForm.tsx            ← formulaire new/edit (onglet Général)
│       ├── CriticalityChip.tsx                   ← LOW/MEDIUM/HIGH/CRITICAL coloré
│       ├── TechnicalFitChip.tsx                  ← ADEQUATE/PARTIAL/INADEQUATE/LEGACY
│       └── AppLifecycleBreakdown.tsx             ← répartition apps par lifecycle
├── api/
│   └── businessCapabilities.ts                   ← hooks React Query
├── utils/
│   └── businessCapabilities.utils.ts             ← sumApplications, isDescendant, buildHierarchyPath
└── types/
    └── businessCapabilities.ts
```

### Props du Composant Form

```typescript
interface BusinessCapabilityFormProps {
  initialValues?: Partial<BusinessCapabilityFormValues>;
  onSubmit: (values: BusinessCapabilityFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  excludeParentId?: string; // pour exclure l'entité elle-même dans le select parent (Edit page)
}

interface BusinessCapabilityFormValues {
  name: string;
  description?: string;
  comment?: string;
  parentId?: string | null;
  domainId?: string | null;
  criticality?: CriticalityLevel | null;
  technicalFit?: TechnicalFitLevel | null;
}

interface BusinessCapabilityResponse {
  id: string;
  name: string;
  description?: string;
  comment?: string;
  level: number;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  domainId?: string | null;
  domain?: { id: string; name: string } | null;
  criticality?: CriticalityLevel | null;
  technicalFit?: TechnicalFitLevel | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    applicationMappings: number;
    children: number;
  };
  tags: EntityTagResponse[];
}

interface BusinessCapabilityTreeNode {
  id: string;
  name: string;
  level: number;
  domain?: { id: string; name: string } | null;
  criticality?: CriticalityLevel | null;
  technicalFit?: TechnicalFitLevel | null;
  _count: {
    applicationMappings: number;
    children: number;
  };
  children: BusinessCapabilityTreeNode[];
}

type CriticalityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type TechnicalFitLevel = 'ADEQUATE' | 'PARTIAL' | 'INADEQUATE' | 'LEGACY';
```

### Composant AppBreadcrumbs (PNS-11)

```typescript
// @/components/shared/AppBreadcrumbs.tsx
interface BreadcrumbItem {
  label: string;
  onClick?: () => void; // omis pour le dernier élément (courant)
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  return (
    <Breadcrumbs separator="›" sx={{ mb: 2 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast || !item.onClick) {
          return (
            <Typography key={index} color="text.primary">
              {item.label}
            </Typography>
          );
        }
        return (
          <Link
            key={index}
            component="button"
            underline="hover"
            onClick={item.onClick}
            sx={{ cursor: 'pointer', background: 'none', border: 'none', p: 0 }}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
```

---

## 6. Clés i18n — Section `businessCapabilities` à ajouter dans `fr.json` ⚠️

> À ajouter **manuellement** dans `src/i18n/locales/fr.json` avant de lancer la session OpenCode.

```json
"businessCapabilities": {
  "views": {
    "list": "Liste",
    "matrix": "Matrix"
  },
  "list": {
    "title": "Business Capabilities",
    "subtitle": "Cartographie des capacités métier de l'entreprise",
    "addButton": "Ajouter une capacité",
    "searchPlaceholder": "Rechercher une capacité...",
    "columns": {
      "name": "Nom",
      "level": "Niveau",
      "domain": "Domaine",
      "criticality": "Criticité",
      "technicalFit": "Maturité technique",
      "applicationsCount": "Applications",
      "actions": "Actions"
    },
    "filters": {
      "domain": "Domaine"
    },
    "emptyState": {
      "title": "Aucune capacité créée",
      "description": "Commencez par créer votre première capacité métier.",
      "cta": "Créer votre première capacité"
    }
  },
  "detail": {
    "noValue": "—",
    "tags": "Tags",
    "editButton": "Modifier",
    "backButton": "Retour",
    "breadcrumb": {
      "home": "Accueil",
      "list": "Business Capabilities"
    }
  },
  "form": {
    "createTitle": "Nouvelle Business Capability",
    "editTitle": "Modifier la Business Capability",
    "nameLabel": "Nom",
    "description": "Description",
    "comment": "Commentaire",
    "domain": "Domaine",
    "parent": "Capacité parent",
    "criticality": "Criticité",
    "technicalFit": "Maturité technique",
    "saveButton": "Enregistrer",
    "cancelButton": "Annuler",
    "nameRequired": "Le nom est obligatoire",
    "nameDuplicate": "Ce nom est déjà utilisé",
    "circularReference": "Impossible de définir ce parent (référence circulaire détectée)",
    "noApplications": "Aucune application liée",
    "tabs": {
      "general": "Général",
      "relations": "Relations",
      "audit": "Audit"
    },
    "sections": {
      "hierarchy": "Hiérarchie",
      "applications": "Applications liées"
    },
    "audit": {
      "placeholder": {
        "title": "Historique des modifications",
        "description": "Cette fonctionnalité sera disponible en Phase 2"
      }
    },
    "breadcrumb": {
      "home": "Accueil",
      "list": "Business Capabilities",
      "new": "Nouvelle capacité",
      "edit": "Modifier"
    }
  },
  "criticality": {
    "LOW": "Faible",
    "MEDIUM": "Moyenne",
    "HIGH": "Haute",
    "CRITICAL": "Critique"
  },
  "technicalFit": {
    "ADEQUATE": "Adéquat",
    "PARTIAL": "Partiel",
    "INADEQUATE": "Inadéquat",
    "LEGACY": "Legacy"
  },
  "drawer": {
    "tabs": {
      "info": "Informations",
      "applications": "Applications"
    },
    "hierarchy": "Hiérarchie",
    "applicationFootprint": "Empreinte applicative",
    "applicationsByLifecycle": "Répartition par cycle de vie",
    "editButton": "Modifier",
    "viewFullButton": "Voir la fiche complète"
  },
  "delete": {
    "confirmTitle": "Supprimer la capacité",
    "confirmMessage": "Êtes-vous sûr de vouloir supprimer \"{{name}}\" ?",
    "blockedMessage": "Cette capacité a {{childrenCount}} enfant(s) et {{applicationsCount}} application(s) liée(s) et ne peut pas être supprimée"
  },
  "snackbar": {
    "created": "Capacité créée avec succès",
    "updated": "Capacité mise à jour avec succès",
    "deleted": "Capacité supprimée avec succès"
  }
}
```

---

## 7. Règles Métier Frontend ⚠️

- **RM-BC-01 — Indentation par niveau dans la liste arborescente :**

  La colonne `name` est indentée visuellement en fonction du niveau de profondeur.

  ```typescript
  <Box sx={{ paddingLeft: `${row.level * 24}px` }}>
    {row.name}
  </Box>
  ```

- **RM-BC-02 — Expand/collapse dans la liste arborescente :**

  État local React géré par `useState<Set<string>>` contenant les IDs des nœuds déployés.

  ```typescript
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(data.filter(r => r.level === 0).map(r => r.id))
  );

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Masquer les lignes enfants si le parent est replié
  const visibleRows = data.filter(row => {
    if (row.level === 0) return true; // racines toujours visibles
    let current = row;
    while (current.parentId) {
      if (!expanded.has(current.parentId)) return false;
      current = data.find(r => r.id === current.parentId);
    }
    return true;
  });
  ```

- **RM-BC-03 — Agrégation récursive du nombre d'applications (US19) :**

  ```typescript
  // src/utils/businessCapabilities.utils.ts
  export function sumApplications(node: BusinessCapabilityTreeNode): number {
    return (
      node._count.applicationMappings +
      node.children.reduce((acc, child) => acc + sumApplications(child), 0)
    );
  }
  ```

- **RM-BC-04 — Coloration des tuiles matrix par criticality (US13) :**

  ```typescript
  function getCriticalityColor(criticality: CriticalityLevel | null, theme: Theme): string {
    switch (criticality) {
      case 'LOW':
        return theme.palette.success.light; // vert
      case 'MEDIUM':
        return theme.palette.warning.light; // jaune
      case 'HIGH':
        return theme.palette.error.light; // orange
      case 'CRITICAL':
        return theme.palette.error.dark; // rouge
      default:
        return theme.palette.grey[300]; // gris si null
    }
  }
  ```

- **RM-BC-05 — Exclusion des descendants dans le sélecteur parent (Edit page) :**

  Lors de l'édition, le sélecteur de parent doit exclure :
  1. L'entité elle-même
  2. Tous ses descendants (récursif)

  ```typescript
  // src/utils/businessCapabilities.utils.ts
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

  // Dans EditPage
  const selectableParents = allCapabilities.filter(
    c => !isDescendant(treeData, c.id, entity.id)
  );
  ```

- **RM-BC-06 — Formatage frontend des messages 409 DEPENDENCY_CONFLICT :**

  ```typescript
  // src/utils/businessCapabilities.utils.ts
  import { TFunction } from 'i18next';

  export function format409Message(
    t: TFunction,
    childrenCount: number,
    applicationsCount: number
  ): string {
    return t('businessCapabilities.delete.blockedMessage', {
      childrenCount,
      applicationsCount
    });
  }
  ```

- **RM-BC-07 — Reconstruction du breadcrumb hiérarchique dans le drawer :**

  ```typescript
  // src/utils/businessCapabilities.utils.ts
  export function buildHierarchyPath(
    capability: BusinessCapabilityResponse
  ): Array<{ id: string; name: string }> {
    const path: Array<{ id: string; name: string }> = [];
    let current = capability;
    
    while (current.parent) {
      path.unshift({ id: current.parent.id, name: current.parent.name });
      // Note: il faut charger récursivement les parents si parent.parent n'est pas populé
      // Alternativement, charger via GET /tree et reconstruire le path côté client
      current = current.parent as any; // ⚠️ simplifié — en pratique, charger /tree
    }
    
    return path;
  }
  ```

- **RM-BC-08 — Masquage conditionnel des actions d'écriture :**

  Les boutons et icônes d'écriture sont masqués si `hasPermission('business-capabilities:write')` est `false`.

  ```typescript
  const canWrite = hasPermission('business-capabilities:write'); // import depuis @/store/auth
  ```

- **RM-BC-09 — Tri des colonnes côté client :**

  ```typescript
  type SortField = 'name' | 'level' | 'createdAt' | 'criticality';
  type SortOrder = 'asc' | 'desc';
  ```

  Comportement null : valeurs `null` classées **en dernier** quelle que soit la direction de tri.

---

## 8. Câblage App.tsx — Manuel ⚠️

> À réaliser **manuellement** avant de lancer la session OpenCode.
> OpenCode ne génère pas ce fichier. Patron de référence : `FS-06-FRONT §8`.

```typescript
// App.tsx — routes Business Capabilities à ajouter

// Lecture : token requis
<Route path="/business-capabilities" element={<PrivateRoute />}>
  <Route index element={<BusinessCapabilitiesPage />} />
  <Route path=":id" element={<BusinessCapabilityDetailPage />} />
</Route>

// Écriture : token + permission business-capabilities:write
<Route path="/business-capabilities" element={<PrivateRoute permission="business-capabilities:write" />}>
  <Route path="new" element={<BusinessCapabilityNewPage />} />
  <Route path=":id/edit" element={<BusinessCapabilityEditPage />} />
</Route>
```

---

## 9. Session Gate — Frontend ⚠️

> Prérequis à valider **avant** de lancer la session OpenCode et de passer cette spec à `stable`.

- [ ] **FS-07-BACK au statut `done`** — gates G-01 à G-17 toutes cochées
- [ ] **T-019 amendment backend au statut `done`** — champs `criticality` et `technicalFit` disponibles dans l'API
- [ ] **API testée manuellement** — au moins `GET /business-capabilities` retourne `criticality` + `technicalFit`
- [ ] **API `/tree` testée** — retourne structure nested avec `criticality` + `technicalFit` par nœud
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **F-03 au statut `done`** — `TagChipList` disponible
- [ ] **Clés `businessCapabilities.*` ajoutées dans `fr.json`** (§6 de cette spec)
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01)
- [ ] **Câblage `App.tsx` réalisé manuellement** (§8 de cette spec)
- [ ] **Layout Contract §4 relu** — un bloc par page/vue, aucun composant F-01 manquant
- [ ] **FS-07-FRONT passé au statut `stable`** avant de lancer OpenCode

---

## 10. Tests Playwright — E2E UI ⚠️

> À remplir exhaustivement dans la tâche **T-015** (agent QA).
> OpenCode frontend ne génère PAS les tests Playwright UI — délégué à l'agent QA.

### Scope tests UI (T-015)

- [ ] Liste arborescente affiche indentation par niveau
- [ ] Expand/collapse fonctionnel sur nœuds parents
- [ ] Toggle 2 vues (liste / matrix) fonctionnel
- [ ] Vue matrix affiche tuiles imbriquées avec CriticalityChip (fond neutre)
- [ ] Drawer s'ouvre au clic sur ligne
- [ ] Drawer affiche breadcrumb hiérarchique cliquable
- [ ] Drawer affiche breakdown apps par lifecycle
- [ ] Création capacité racine → level 0
- [ ] Création capacité enfant → level auto-calculé
- [ ] Reparenting dans Edit → recalcul level
- [ ] Reparenting circulaire → erreur inline `CIRCULAR_REFERENCE`
- [ ] Suppression avec enfants → dialog bloqué avec compteurs
- [ ] Suppression avec apps liées → dialog bloqué avec compteurs
- [ ] Criticality chip affiché avec couleur correcte
- [ ] TechnicalFit chip affiché
- [ ] Breadcrumb PNS-11 sur Detail/Edit pages

---

## 11. Commande OpenCode — Frontend ⚠️

> Copier-coller intégralement en début de session OpenCode.
> Ajouter le contenu de FS-07-BACK §3 (Contrat API) + T-019 amendment à la suite.

```
Contexte projet ARK — Session Frontend FS-07-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v5 + react-i18next
Règles MUI obligatoires :
- MUI v5 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement sur tous les TextField
- Pas de MUI X DataGrid — utiliser MUI Table + TableSortLabel

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur dans les composants
- Hook : const { t } = useTranslation()
- Fichier source : src/i18n/locales/fr.json — clés businessCapabilities.* déjà présentes

RBAC frontend :
- hasPermission() importé depuis @/store/auth
- Vérifier avant TOUT rendu d'action d'écriture (bouton, icône, colonne)
- Jamais d'action d'écriture affichée inconditionnellement

Composants F-01 OBLIGATOIRES — ne jamais réinventer :
  import { PageHeader, ConfirmDialog, EmptyState, LoadingSkeleton, StatusChip } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'
  import { TagChipList } from '@/components/tags' (F-03)

  - AppShell      : wrapper racine — toujours présent
  - PageContainer : wrapper de contenu (maxWidth selon page)
  - PageHeader    : TOUT titre de page + action principale — jamais Box+Typography custom
  - ConfirmDialog : TOUTE suppression — jamais de dialog MUI inline custom
  - EmptyState    : TOUTE liste vide — jamais de Typography inline
  - LoadingSkeleton : TOUT état de chargement — jamais de CircularProgress spinner
  - TagChipList   : TOUS les tags — délègue déduplication F-03 RM-11

Composant PNS-11 à créer (première implémentation) :
  import { AppBreadcrumbs } from '@/components/shared'
  - AppBreadcrumbs : TOUS les breadcrumbs pages Detail/New/Edit — structure 3 niveaux
  - Props : items: Array<{ label: string; onClick?: () => void }>
  - Dernier item sans onClick = non cliquable (page courante)
  - Pattern de référence : voir §5 de cette spec

JWT : token en mémoire uniquement — jamais sessionStorage / localStorage
Routing : react-router-dom v6, navigate() depuis useNavigate()
Câblage App.tsx : déjà réalisé manuellement — ne pas générer

Pattern de référence frontend : module Applications (FS-06-FRONT) — s'y conformer pour les drawers et formulaires complexes.

Spécificités FS-07 (hiérarchie récursive) :

**1. Liste arborescente avec expand/collapse (RM-BC-02) :**
```typescript
const [expanded, setExpanded] = useState<Set<string>>(
  new Set(data.filter(r => r.level === 0).map(r => r.id))
);

const toggleExpand = (id: string) => {
  setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

// Masquer les lignes enfants si parent replié
const visibleRows = data.filter(row => {
  if (row.level === 0) return true;
  let current = row;
  while (current.parentId) {
    if (!expanded.has(current.parentId)) return false;
    current = data.find(r => r.id === current.parentId);
  }
  return true;
});
```

**2. Indentation par niveau (RM-BC-01) :**
```typescript
<Box sx={{ paddingLeft: `${row.level * 24}px`, display: 'flex', alignItems: 'center' }}>
  {row._count.children > 0 && (
    <IconButton size="small" onClick={toggleExpand(row.id)}>
      {expanded.has(row.id) ? <ExpandMoreIcon /> : <ChevronRightIcon />}
    </IconButton>
  )}
  <Link onClick={() => navigate(`/business-capabilities/${row.id}`)}>{row.name}</Link>
</Box>
```

~~**3. Vue MUI TreeView :**~~ _(supprimée — T-033)_

**4. Agrégation récursive (RM-BC-03) :**
```typescript
// src/utils/businessCapabilities.utils.ts
export function sumApplications(node: BusinessCapabilityTreeNode): number {
  return (
    node._count.applicationMappings +
    node.children.reduce((acc, child) => acc + sumApplications(child), 0)
  );
}
```

**5. Exclusion descendants dans sélecteur parent (RM-BC-05) :**
```typescript
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

// Dans EditPage
const selectableParents = allCapabilities.filter(
  c => !isDescendant(treeData, c.id, entity.id)
);
```

**6. Vue Matrix coloration (RM-BC-04) :**
```typescript
function getCriticalityColor(criticality: CriticalityLevel | null, theme: Theme): string {
  switch (criticality) {
    case 'LOW': return theme.palette.success.light;
    case 'MEDIUM': return theme.palette.warning.light;
    case 'HIGH': return theme.palette.error.light;
    case 'CRITICAL': return theme.palette.error.dark;
    default: return theme.palette.grey[300];
  }
}
```

**7. Breakdown applications par lifecycle (US06) :**
Charger `GET /:id/applications` avec pagination côté client (toutes les pages), puis agréger par `lifecycleStatus`.

Respecte impérativement le Layout Contract §4 de cette spec :
- Composant F-01 exact par zone
- Clé i18n exacte par label
- Condition RBAC exacte par action
- Breadcrumb PNS-11 sur toutes les pages Detail/New/Edit

Implémente la feature "Business Capabilities" frontend (FS-07-FRONT).
Génère : 4 pages React, 8 composants (Tree, Matrix, Drawer, Form, 2 Chips, LifecycleBreakdown, AppBreadcrumbs), businessCapabilities.ts API + types + utils.
Ne génère PAS le câblage App.tsx — déjà fait manuellement.
Ne génère PAS les tests Playwright UI — délégué à T-015 (agent QA).
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-07-FRONT.md ICI]
[COLLER LE CONTENU DE FS-07-BACK §3 (Contrat API OpenAPI) ICI]
[COLLER LE CONTENU DE T-019 AMENDMENT (nouveaux champs criticality + technicalFit dans DTOs) ICI]
```

---

## 12. Checklist de Validation Frontend

> À compléter après génération OpenCode, avant de passer FS-07-FRONT à `done`.

- [ ] Les 4 routes `/business-capabilities/*` fonctionnent depuis App.tsx
- [ ] Toggle 2 vues (liste/matrix) fonctionne avec persistence state (`?view=matrix`)
- [ ] Liste arborescente affiche indentation par niveau (`paddingLeft: level * 24px`)
- [ ] Expand/collapse fonctionne (icônes + masquage enfants)
- [ ] Vue matrix affiche tuiles imbriquées avec CriticalityChip (fond neutre, max 2 L0 par rangée)
- [ ] Drawer s'ouvre au clic sur ligne (hors nom et actions)
- [ ] Drawer affiche breadcrumb hiérarchique cliquable
- [ ] Drawer affiche breakdown apps par lifecycle (composant `AppLifecycleBreakdown`)
- [ ] `PageHeader` utilisé sur toutes les pages — aucun Box+Typography en remplacement
- [ ] `ConfirmDialog` utilisé pour la suppression — aucun dialog inline
- [ ] `EmptyState` affiché sur liste vide
- [ ] `LoadingSkeleton` affiché pendant les appels API
- [ ] `AppBreadcrumbs` utilisé sur Detail/New/Edit pages (PNS-11)
- [ ] `TagChipList` utilisé pour afficher les tags (F-03)
- [ ] `CriticalityChip` affiche couleurs correctes (LOW=vert, MEDIUM=jaune, HIGH=orange, CRITICAL=rouge)
- [ ] `TechnicalFitChip` affiche libellés corrects (ADEQUATE/PARTIAL/INADEQUATE/LEGACY)
- [ ] Bouton Add masqué si pas `business-capabilities:write`
- [ ] Colonne Actions masquée si pas `business-capabilities:write`
- [ ] Bouton Edit masqué sur DetailPage si pas `business-capabilities:write`
- [ ] Sélecteur parent exclut l'entité elle-même et ses descendants (RM-BC-05)
- [ ] Erreur `400 CIRCULAR_REFERENCE` affichée inline sur champ parentId
- [ ] Erreur `409 DEPENDENCY_CONFLICT` affiche compteurs enfants + apps dans ConfirmDialog
- [ ] Tri des colonnes fonctionnel — nulls en dernier
- [ ] Snackbar succès après create / update / delete
- [ ] Aucune string en dur dans les composants (`grep '"[A-Z]' src/pages/business-capabilities/`)
- [ ] Aucune erreur TypeScript strict
- [ ] `sumApplications()` calcule correctement le total récursif (RM-BC-03)
- [ ] `isDescendant()` empêche la sélection de descendants comme parent (RM-BC-05)
- [ ] `buildHierarchyPath()` reconstruit le breadcrumb hiérarchique (RM-BC-07)

---

## 13. Revue de Dette Technique *(gate de fin de sprint — obligatoire)* ⚠️

> À remplir **après** implémentation frontend, avant de clore le sprint complet.

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- '*.tsx'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées pour les items de ce sprint | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Items F-999 potentiellement impactés

- **Item 11 — Description Markdown** : Si différé en P1, vérifier cohérence avec FS-06-FRONT v1.1.
- **Nouveau pattern** : Hiérarchie récursive frontend (expand/collapse, agrégation) — si réutilisable pour futures entités, documenter dans AGENTS.md.

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 3 |
| **Date de revue** | *(à compléter après impl T-018)* |
| **Items F-999 fermés** | *(à compléter)* |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(ex : Item 24 — Pattern hiérarchie frontend)* |
| **NFR mis à jour** | NFR-GOV-005 → `covered` pour business_capabilities frontend |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | ✅ TD-1 / ✅ TD-2 / … |

---

_FS-07-FRONT v1.0 — ARK_
