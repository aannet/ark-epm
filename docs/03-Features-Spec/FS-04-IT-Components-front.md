# ARK — Feature Spec FS-04-FRONT : IT Components (Frontend)

_Version 1.0 — Mars 2026_

> **Changelog v1.0 :** Création — module IT Components frontend conforme template v0.1 et pattern PNS-02 (Side Drawer read-only + Page Détail). Filtres avancés (search, type, technology). Menu dropdown Actions. Onglet Relations Applications dans drawer et page détail. Gestion 409 DEPENDENCY_CONFLICT avec message custom. DimensionTagInput pour édition tags. Cohérent avec FS-03-Providers-front v1.0.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-04-FRONT |
| **Titre** | IT Components — Pages React (Liste / Détail / New / Edit) |
| **Priorité** | P1 |
| **Statut** | ✅ `done` |
| **Dépend de** | FS-01, F-02, **FS-04-BACK** (gate bloquante), **F-03** |
| **Spec mère** | FS-04 IT Components — spec de référence dont ce document est issu |
| **Estimé** | 0.5 jour |
| **Version** | 1.0 |

> ✅ FS-04-BACK est `done` — toutes les gates sont cochées. Frontend est pleinement fonctionnel.

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

Implémenter les pages React pour la gestion des Composants IT (IT Components) : liste avec filtres avancés (search, type, technology), drawer de consultation rapide read-only (PNS-02), page détail avec onglet applications liées, page de formulaire unifiée création/modification. Ce module suit le pattern établi par FS-03-Providers-front tout en spécialisant l'UX pour les composants IT (mise en avant de la technologie et du type).

**Hors périmètre :**
- Backend API — couvert par `FS-04-BACK`
- Inventaire automatique des composants (scan réseau) — P2
- Monitoring/métriques des composants (CPU, RAM) — hors périmètre ARK
- Badges d'urgence ou indicateurs visuels colorés par type — non requis en P1

---

## 2. User Stories

### Interactions Liste/Drawer (PNS-02)

#### US-01 — Consultation Rapide via Side Drawer
**En tant qu'utilisateur**, je veux cliquer sur le corps d'une ligne du tableau (hors nom) pour ouvrir un Side Drawer, afin de consulter rapidement les métadonnées du composant IT sans perdre ma position dans la liste ni mes filtres actifs.

**Critères d'acceptation :**
- Clic sur Technologie, Type, Tags, Nb applications ou Actions → ouvre le drawer (400px depuis la droite)
- État de la liste préservé (scroll, filtres, tri)
- Drawer affiche (read-only) : nom, description, comment, technology, type, tags, compteur applications
- Drawer inclut onglet "Applications" avec liste paginée des apps liées (5 items par page)

#### US-02 — Accès Direct Détail
**En tant qu'utilisateur**, je veux cliquer sur le nom du composant IT (lien hypertexte souligné) pour naviguer directement vers la page Détail complète.

**Critères d'acceptation :**
- Nom affiché comme lien souligné (couleur texte normale, primaire au hover)
- Clic sur nom → navigation immédiate vers `/it-components/:id`
- Le clic sur le nom ne déclenche pas l'ouverture du drawer (`stopPropagation`)

#### US-03 — Transition Drawer vers Détail
**En tant qu'utilisateur**, je veux trouver un bouton "Voir la fiche complète" dans le footer du Side Drawer.

**Critères d'acceptation :**
- Bouton positionné à droite dans le footer
- Variant `outlined`
- Navigation vers `/it-components/:id` au clic
- Ferme le drawer après navigation

#### US-04 — Transition Drawer vers Édition
**En tant qu'utilisateur**, je veux trouver un bouton "Modifier" dans le footer du Side Drawer.

**Critères d'acceptation :**
- Bouton positionné à gauche dans le footer (avant "Voir fiche")
- Variant `contained`
- **Grisé (disabled)** si l'utilisateur n'a pas la permission `it-components:write`
- Navigation vers `/it-components/:id/edit` au clic (si autorisé)

#### US-05 — Fermeture Drawer
**En tant qu'utilisateur**, je veux une croix grise dans le coin haut droit du drawer pour le fermer.

**Critères d'acceptation :**
- IconButton avec CloseIcon
- Couleur `text.secondary` (gris)
- Positionné à droite du titre
- Ferme le drawer au clic
- Le backdrop click et la touche Escape ferment aussi le drawer

### Navigation & Filtres

#### US-06 — Filtres et Tri
**En tant qu'utilisateur**, je veux filtrer et trier la liste des composants IT par multiple critères.

**Critères d'acceptation :**
- **Recherche** : textuelle sur le nom (debounce 300ms)
- **Filtre Type** : dropdown (valeurs issues de l'API, ex: database, cache, messaging, web-server…)
- **Filtre Technology** : dropdown ou texte libre (valeurs issues de l'API)
- **Tri** : nom (A→Z / Z→A), date création (ancien→récent), type, technology
- Filtres persistant lors du clic drawer/détail, restaurés au retour liste

#### US-07 — Actions Menu Dropdown
**En tant qu'utilisateur**, je veux accéder aux actions Modifier et Supprimer via un menu dropdown (⋮).

**Critères d'acceptation :**
- Colonne "Actions" : bouton IconButton avec MoreVertIcon (⋮)
- Menu dropdown : 2 items "Modifier" et "Supprimer"
- "Modifier" → navigation `/it-components/:id/edit`
- "Supprimer" → ouvre ConfirmDialog
- Colonne absente si `!hasPermission('it-components:write')`

#### US-08 — Suppression avec Gestion Dépendances
**En tant qu'utilisateur**, je veux supprimer un composant IT, mais être averti s'il est utilisé par des applications.

**Critères d'acceptation :**
- ConfirmDialog standard si aucune application liée
- Si `409 DEPENDENCY_CONFLICT` : message custom "Impossible de supprimer : ce composant est utilisé par [N] application(s)"
- Bouton "Confirmer" **disabled** sur DEPENDENCY_CONFLICT
- Lien "Voir les applications liées" redirige vers la page détail / onglet Applications
- Dialog reste ouvert — l'utilisateur ferme explicitement

### Détail & Édition

#### US-09 — Page Détail
**En tant qu'utilisateur**, je veux voir le détail complet d'un composant IT avec tous ses champs et ses applications liées.

**Critères d'acceptation :**
- Page `/it-components/:id` affiche : nom, description, comment, technology, type, tags, createdAt, updatedAt
- Onglet "Applications" : liste paginée des applications liées (20 / page)
- Bouton "Modifier" → `/it-components/:id/edit` (disabled si pas `it-components:write`)
- Bouton "Supprimer" → ConfirmDialog (disabled si pas `it-components:write`)
- Bouton "Retour" → `/it-components`

#### US-10 — Formulaire Création/Édition (Page unifiée)
**En tant qu'utilisateur**, je veux créer ou modifier un composant IT avec validation côté frontend.

**Critères d'acceptation :**
- Champs obligatoires marqués avec astérisque `*`
- `name` : obligatoire, unique (erreur inline 409 CONFLICT)
- `description`, `comment` : optionnels, TextArea
- `technology` : optionnel, TextField libre (ex: "PostgreSQL 16")
- `type` : optionnel, TextField libre (ex: "database")
- `tags` : optionnel, DimensionTagInput de F-03
- Bouton "Enregistrer" désactivé si `isLoading`
- Bouton "Annuler" → retour liste (création) ou détail (édition)
- Post-création : navigation vers `/it-components/:id` + ArkAlert success
- Post-édition : reste sur `/it-components/:id` + ArkAlert success

#### US-11 — Messages d'Erreur
**En tant qu'utilisateur**, je veux recevoir des messages d'erreur clairs lors de validation.

**Critères d'acceptation :**
- `400` (validation) : erreur inline sur champ `name`
- `409 CONFLICT` : erreur inline `t('it-components.form.nameDuplicate')`
- `409 DEPENDENCY_CONFLICT` (delete) : ConfirmDialog avec message custom + bouton Confirmer disabled
- `401` / `403` : intercepteur Axios global → `/login` ou `/403`
- `404` : navigate `/it-components`
- `5xx` : ArkAlert error global

---

## 3. Référence Contrat API

Le contrat API complet est défini dans **FS-04-BACK §3**. Ne pas le redéfinir ici.

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/it-components` | Liste (paginée, filtres, tri) | `it-components:read` |
| `POST` | `/api/v1/it-components` | Créer | `it-components:write` |
| `GET` | `/api/v1/it-components/:id` | Détail | `it-components:read` |
| `PATCH` | `/api/v1/it-components/:id` | Modifier | `it-components:write` |
| `DELETE` | `/api/v1/it-components/:id` | Supprimer | `it-components:write` |
| `GET` | `/api/v1/it-components/:id/applications` | Applications liées | `it-components:read` |

Codes HTTP à gérer côté frontend :

| Code | Contexte | Action frontend |
|------|----------|-----------------|
| `200` / `201` | Succès | Navigate détail (create) ou liste (delete) + ArkAlert success |
| `400` | Validation | Erreur inline sur champ `name` |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |
| `404` | Ressource introuvable | `navigate('/it-components')` |
| `409` `CONFLICT` | Nom dupliqué | Erreur inline `t('it-components.form.nameDuplicate')` |
| `409` `DEPENDENCY_CONFLICT` | Suppression bloquée | Message custom dans `ConfirmDialog` + bouton Confirmer disabled |
| `5xx` | Erreur serveur | ArkAlert error `t('it-components.alert.errors.serverError')` |

Paramètres de query disponibles pour `GET /it-components` :

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page courante (défaut: 1) |
| `limit` | integer | Items par page (défaut: 20) |
| `sortBy` | string | `name` \| `createdAt` \| `type` \| `technology` |
| `sortOrder` | string | `asc` \| `desc` |
| `search` | string | Recherche textuelle sur le nom |
| `type` | string | Filtre par type de composant |
| `technology` | string | Filtre par technologie |

---

## 4. Layout Contract

### 4.1 `ITComponentListPage`

```yaml
page: ITComponentListPage
route: /it-components
auth_required: true
permission_required: it-components:read

layout:
  shell: AppShell            # import depuis '@/components/layout'
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  alert:
    component: ArkAlert      # import depuis '@/components/shared'
    condition: location.state.alert exists
    props:
      severity: location.state.alert.severity
      message: location.state.alert.message
      onClose: clearAlert

  header:
    component: PageHeader    # import depuis '@/components/shared' — JAMAIS Box+Typography
    props:
      title: t('it-components.list.title')
      subtitle: t('it-components.list.subtitle')
      action:
        condition: hasPermission('it-components:write')
        label: t('it-components.list.addButton')
        onClick: navigate('/it-components/new')
        icon: AddIcon

  filter_bar:
    component: MUI Box (flex row, gap 2)
    items:
      - TextField
          placeholder: t('it-components.list.search')
          onChange: debounce(setSearch, 300)
          InputProps: SearchIcon (adornment)
      - FormControl
          label: t('it-components.list.filterType')
          select: true
          value: filterType
          onChange: setFilterType
          items: ['', ...uniqueTypes]   # '' = Tous
      - FormControl
          label: t('it-components.list.filterTechnology')
          select: true
          value: filterTechnology
          onChange: setFilterTechnology
          items: ['', ...uniqueTechnologies]   # '' = Toutes

  body:
    component: MUI Table avec TableSortLabel
    loading_state: LoadingSkeleton             # import depuis '@/components/shared'
    empty_state: EmptyState                    # import depuis '@/components/shared'
    empty_state_props:
      title: t('it-components.list.emptyState.title')
      description: t('it-components.list.emptyState.description')
      action:
        condition: hasPermission('it-components:write')
        label: t('it-components.list.emptyState.cta')
        onClick: navigate('/it-components/new')

    columns:
      - field: name
          header: t('it-components.list.columns.name')
          sortable: true
          sort_null_behavior: null values last
          render: Link souligné → navigate('/it-components/${row.id}')
          onClick_row: stopPropagation (ne déclenche pas le drawer)

      - field: technology
          header: t('it-components.list.columns.technology')
          sortable: true
          sort_null_behavior: null values last
          render: plain text (nullable → '—')

      - field: type
          header: t('it-components.list.columns.type')
          sortable: true
          sort_null_behavior: null values last
          render: plain text (nullable → '—')

      - field: tags
          header: t('it-components.list.columns.tags')
          sortable: false
          render: TagChipList (mode liste, maxVisible=3, deduplicateByDepth)

      - field: _count.applications
          header: t('it-components.list.columns.applicationsCount')
          sortable: false
          render: texte numérique simple

      - field: actions
          header: t('it-components.list.columns.actions')
          condition: hasPermission('it-components:write')
          render: IconButton (MoreVertIcon) → Menu dropdown MUI
            items:
              - label: t('common.actions.edit')
                icon: EditIcon
                onClick: navigate('/it-components/${row.id}/edit')
              - label: t('common.actions.delete')
                icon: DeleteIcon
                onClick: openConfirmDelete(row)

  row_click:
    trigger: clic sur td (hors colonne name)
    action: openDrawer(row.id)

  pagination:
    component: MUI Pagination
    page_size: 20
    scope: server-side (via API params page + limit)
    show_total: true

  sort_state:
    default_field: name
    default_order: asc
    scope: server-side (API sortBy, sortOrder)

  drawer:
    component: ITComponentDrawer (read-only)
    condition: drawerOpen && selectedItComponentId
    props:
      itComponent: selectedItComponent
      onClose: closeDrawer
      onNavigateDetail: navigate('/it-components/:id')
      onNavigateEdit: navigate('/it-components/:id/edit')

  dialogs:
    - id: confirm-delete
        component: ConfirmDialog   # import depuis '@/components/shared'
        trigger: delete menu item click
        props:
          title: t('it-components.delete.confirmTitle')
          message: t('it-components.delete.confirmMessage', { name: row.name })
          confirmLabel: t('common.actions.delete')
          severity: error
        on_confirm: DELETE /api/v1/it-components/:id
        on_success: navigate('/it-components', { state: { alert: success } })
        on_409_DEPENDENCY_CONFLICT:
          message: format409Message(t, applicationsCount)
          confirmButton: disabled
          link: t('it-components.delete.viewApps') → navigate('/it-components/:id', { tab: 'applications' })
```

---

### 4.2 `ITComponentDrawer` (Read-Only Side Drawer)

```yaml
component: Drawer (MUI)
anchor: right
width: 400px
PaperProps:
  sx: { width: 400 }
backdrop: true
escapeKeyDown: true

zones:
  header:
    component: Box (flex, justifyContent: space-between, alignItems: center, p: 2)
    content:
      - Typography variant="h6": t('it-components.drawer.title')
      - IconButton: CloseIcon (color: text.secondary, onClick: onClose)

  body:
    component: Box (sx: { flex: 1, overflow: 'auto' })
    tabs:
      component: MUI Tabs
      items:
        - label: t('it-components.drawer.tabInfo')
          content:
            component: Box (p: 2, display: flex, flexDirection: column, gap: 2)
            fields:
              - label: t('it-components.drawer.nameLabel')
                value: itComponent.name (Typography variant="subtitle1" fontWeight=600)
              - label: t('it-components.drawer.technologyLabel')
                value: itComponent.technology ?? '—'
              - label: t('it-components.drawer.typeLabel')
                value: itComponent.type ?? '—'
              - label: t('it-components.drawer.descriptionLabel')
                value: itComponent.description ?? t('it-components.detail.noValue')
                render: Typography body2, color text.secondary
              - label: t('it-components.drawer.tagsLabel')
                value: TagChipList (deduplicateByDepth, masked empty dimensions)
              - label: t('it-components.drawer.applicationsCountLabel')
                value: itComponent._count.applications

        - label: t('it-components.drawer.tabApplications')
          content:
            component: ApplicationListInDrawer
            source: GET /api/v1/it-components/:id/applications
            pagination: 5 items/page
            loading_state: LoadingSkeleton
            empty_state: EmptyState (t('it-components.drawer.noApplications'))
            columns:
              - name (lien → /applications/:id)
              - domain.name
              - owner (firstName + lastName)
              - criticality

  footer:
    component: Box (sx: { p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' })
    buttons:
      - label: t('it-components.drawer.buttonEdit')
          variant: contained
          disabled: !hasPermission('it-components:write')
          onClick: navigate('/it-components/:id/edit')
      - label: t('it-components.drawer.buttonViewDetail')
          variant: outlined
          onClick: navigate('/it-components/:id')
```

---

### 4.3 `ITComponentDetailPage`

```yaml
page: ITComponentDetailPage
route: /it-components/:id
auth_required: true
permission_required: it-components:read

on_load:
  action: GET /api/v1/it-components/:id
  on_404: navigate('/it-components')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: md

zones:
  alert:
    component: ArkAlert
    condition: location.state.alert exists

  breadcrumb:
    component: MUI Breadcrumbs
    items:
      - label: t('it-components.detail.breadcrumb.home')
        onClick: navigate('/')
      - label: t('it-components.detail.breadcrumb.list')
        onClick: navigate('/it-components')
      - label: itComponent.name (current, non cliquable)

  header:
    component: Box (flex, justifyContent: space-between, alignItems: flex-start)
    content:
      - Typography variant="h4": itComponent.name
      - Badge: itComponent._count.applications (si > 0, couleur primary)

  body:
    loading_state: LoadingSkeleton
    component: MUI Tabs
    items:
      - label: t('it-components.detail.tabInfo')
          content:
            component: Box (display: flex, flexDirection: column, gap: 2, pt: 2)
            fields:
              - label: t('it-components.detail.technologyLabel')
                value: itComponent.technology ?? t('it-components.detail.noValue')
              - label: t('it-components.detail.typeLabel')
                value: itComponent.type ?? t('it-components.detail.noValue')
              - label: t('it-components.detail.descriptionLabel')
                value: itComponent.description ?? t('it-components.detail.noValue')
              - label: t('it-components.detail.commentLabel')
                value: itComponent.comment ?? t('it-components.detail.noValue')
              - label: t('it-components.detail.tagsLabel')
                value: TagChipList (deduplicateByDepth)
              - label: t('it-components.detail.createdAtLabel')
                value: itComponent.createdAt (format date locale FR)
              - label: t('it-components.detail.updatedAtLabel')
                value: itComponent.updatedAt (format date locale FR)

      - label: t('it-components.detail.tabApplications')
          content:
            component: ApplicationListTable
            source: GET /api/v1/it-components/:id/applications
            pagination: 20 items/page
            loading_state: LoadingSkeleton
            empty_state: EmptyState (t('it-components.detail.noApplications'))
            columns:
              - name (lien → /applications/:id)
              - domain.name
              - owner (firstName + lastName)
              - criticality
              - lifecycleStatus

  footer:
    component: Box (sx: { display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' })
    buttons:
      - label: t('it-components.detail.buttonBack')
          variant: outlined
          onClick: navigate('/it-components')
      - label: t('it-components.detail.buttonEdit')
          variant: contained
          disabled: !hasPermission('it-components:write')
          onClick: navigate('/it-components/:id/edit')
      - label: t('it-components.detail.buttonDelete')
          variant: contained
          color: error
          disabled: !hasPermission('it-components:write')
          onClick: openConfirmDelete

  dialogs:
    - id: confirm-delete
        component: ConfirmDialog
        props:
          title: t('it-components.delete.confirmTitle')
          message: t('it-components.delete.confirmMessage', { name: itComponent.name })
          confirmLabel: t('common.actions.delete')
          severity: error
        on_confirm: DELETE /api/v1/it-components/:id
        on_success: navigate('/it-components', { state: { alert: success } })
        on_409_DEPENDENCY_CONFLICT:
          message: format409Message(t, applicationsCount)
          confirmButton: disabled
```

---

### 4.4 `ITComponentFormPage` (Create & Edit — Page unifiée)

```yaml
page: ITComponentFormPage
route_create: /it-components/new
route_edit: /it-components/:id/edit
auth_required: true
permission_required: it-components:write

on_load_edit:
  action: GET /api/v1/it-components/:id
  on_404: navigate('/it-components')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  alert:
    component: ArkAlert
    condition: error 5xx

  breadcrumb:
    component: MUI Breadcrumbs
    items:
      - label: t('it-components.form.breadcrumb.home')
        onClick: navigate('/')
      - label: t('it-components.form.breadcrumb.list')
        onClick: navigate('/it-components')
      - label: |
          mode === 'create'
            ? t('it-components.form.breadcrumb.new')
            : itComponent.name

  header:
    component: PageHeader
    props:
      title: |
        mode === 'create'
          ? t('it-components.form.createTitle')
          : t('it-components.form.editTitle')
      action: null

  body:
    loading_state: LoadingSkeleton   # en mode edit, pendant le fetch initial
    component: MUI Box (component="form", display: flex, flexDirection: column, gap: 3)
    fields:
      - label: t('it-components.form.nameLabel') *
          name: name
          component: TextField
          variant: outlined
          required: true
          fullWidth: true
          autoFocus: true
          maxLength: 255
          error_inline: true
          helperText_duplicate: t('it-components.form.nameDuplicate')
          helperText_required: t('it-components.form.nameRequired')

      - label: t('it-components.form.technologyLabel')
          name: technology
          component: TextField
          variant: outlined
          fullWidth: true
          required: false
          maxLength: 255
          placeholder: t('it-components.form.technologyPlaceholder')

      - label: t('it-components.form.typeLabel')
          name: type
          component: TextField
          variant: outlined
          fullWidth: true
          required: false
          maxLength: 100
          placeholder: t('it-components.form.typePlaceholder')

      - label: t('it-components.form.descriptionLabel')
          name: description
          component: TextField
          variant: outlined
          multiline: true
          rows: 3
          fullWidth: true
          required: false
          maxLength: 2000

      - label: t('it-components.form.commentLabel')
          name: comment
          component: TextField
          variant: outlined
          multiline: true
          rows: 3
          fullWidth: true
          required: false
          maxLength: 2000

      - label: t('it-components.form.tagsLabel')
          name: tags
          component: DimensionTagInput   # import depuis '@/components/tags'
          required: false
          note: "Déduplication désactivée en édition (réalité des données)"

  footer:
    component: Box (sx: { display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 })
    buttons:
      - label: t('it-components.form.buttonCancel')
          variant: outlined
          onClick: |
            mode === 'create'
              ? navigate('/it-components')
              : navigate('/it-components/:id')

      - label: t('it-components.form.buttonSave')
          variant: contained
          type: submit
          disabled: isLoading || !isFormValid

  on_submit_create:
    action: POST /api/v1/it-components
    on_success: navigate('/it-components/${createdEntity.id}', { state: { alert: { severity: 'success', message: t('it-components.alert.createSuccess') } } })
    on_409_CONFLICT: erreur inline champ name → t('it-components.form.nameDuplicate')
    on_400: erreur inline champ name → t('it-components.form.nameRequired')
    on_5xx: ArkAlert error au-dessus du formulaire

  on_submit_edit:
    action: PATCH /api/v1/it-components/:id
    on_success: navigate('/it-components/:id', { state: { alert: { severity: 'success', message: t('it-components.alert.updateSuccess') } } })
    on_409_CONFLICT: erreur inline champ name → t('it-components.form.nameDuplicate')
    on_400: erreur inline champ name → t('it-components.form.nameRequired')
    on_5xx: ArkAlert error au-dessus du formulaire

  form_rules:
    - save_button_disabled_while: isLoading === true
    - name_validation: non vide, non uniquement espaces (client-side avant submit)
```

---

## 5. Clés i18n

Toutes les clés `it-components.*` à ajouter dans `frontend/src/i18n/locales/fr.json` :

```json
{
  "it-components": {
    "list": {
      "title": "Composants IT",
      "subtitle": "Gestion de l'infrastructure technique (serveurs, bases de données, middleware)",
      "addButton": "Nouveau composant",
      "search": "Rechercher par nom...",
      "filterType": "Type",
      "filterTechnology": "Technologie",
      "columns": {
        "name": "Nom",
        "technology": "Technologie",
        "type": "Type",
        "tags": "Tags",
        "applicationsCount": "Applications",
        "actions": "Actions"
      },
      "emptyState": {
        "title": "Aucun composant IT",
        "description": "Créez votre premier composant IT pour inventorier votre infrastructure technique.",
        "cta": "Créer un composant"
      }
    },

    "drawer": {
      "title": "Détails composant IT",
      "tabInfo": "Informations",
      "tabApplications": "Applications",
      "buttonEdit": "Modifier",
      "buttonViewDetail": "Voir la fiche complète",
      "nameLabel": "Nom",
      "technologyLabel": "Technologie",
      "typeLabel": "Type",
      "descriptionLabel": "Description",
      "tagsLabel": "Tags",
      "applicationsCountLabel": "Applications liées",
      "noApplications": "Aucune application liée"
    },

    "detail": {
      "breadcrumb": {
        "home": "Accueil",
        "list": "Composants IT"
      },
      "tabInfo": "Informations",
      "tabApplications": "Applications",
      "noValue": "—",
      "technologyLabel": "Technologie",
      "typeLabel": "Type",
      "descriptionLabel": "Description",
      "commentLabel": "Commentaire",
      "tagsLabel": "Tags",
      "createdAtLabel": "Créé le",
      "updatedAtLabel": "Modifié le",
      "noApplications": "Aucune application liée à ce composant",
      "buttonBack": "Retour",
      "buttonEdit": "Modifier",
      "buttonDelete": "Supprimer"
    },

    "form": {
      "breadcrumb": {
        "home": "Accueil",
        "list": "Composants IT",
        "new": "Nouveau composant"
      },
      "createTitle": "Nouveau composant IT",
      "editTitle": "Modifier le composant IT",
      "nameLabel": "Nom",
      "nameRequired": "Le nom est obligatoire",
      "nameDuplicate": "Ce nom de composant existe déjà",
      "technologyLabel": "Technologie",
      "technologyPlaceholder": "ex: PostgreSQL 16, Redis 7.2, Kubernetes 1.28",
      "typeLabel": "Type",
      "typePlaceholder": "ex: database, cache, messaging, web-server",
      "descriptionLabel": "Description",
      "commentLabel": "Commentaire",
      "tagsLabel": "Tags dimensionnels",
      "buttonSave": "Enregistrer",
      "buttonCancel": "Annuler"
    },

    "delete": {
      "confirmTitle": "Supprimer le composant IT",
      "confirmMessage": "Êtes-vous sûr de vouloir supprimer \"{{name}}\" ?",
      "blockedMessage": "Impossible de supprimer : ce composant est utilisé par {{count}} application(s)",
      "viewApps": "Voir les applications liées"
    },

    "alert": {
      "createSuccess": "Composant IT créé avec succès",
      "updateSuccess": "Composant IT modifié avec succès",
      "deleteSuccess": "Composant IT supprimé avec succès",
      "errors": {
        "serverError": "Erreur serveur — veuillez réessayer",
        "notFound": "Composant IT introuvable"
      }
    }
  }
}
```

---

## 6. Composants Importés & Architecture

### Composants F-01 (Design System)
```typescript
import { AppShell, PageContainer } from '@/components/layout'
import { PageHeader, EmptyState, LoadingSkeleton, ConfirmDialog, ArkAlert } from '@/components/shared'
```

### Composants F-03 (Tags)
```typescript
import { DimensionTagInput, TagChipList } from '@/components/tags'
// DimensionTagInput : édition tags (formulaire)
// TagChipList      : affichage tags (liste, drawer, détail) avec deduplicateByDepth()
```

### Composants MUI
- `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`
- `TableSortLabel`, `Pagination`
- `Drawer`, `Tabs`, `Tab`
- `TextField`, `FormControl`, `Select`, `MenuItem`
- `Button`, `IconButton` — icons : `Add`, `Edit`, `Delete`, `MoreVert`, `Close`, `Search`
- `Menu`, `Breadcrumbs`, `Link`
- `Typography`, `Box`, `Divider`

### Architecture de fichiers frontend

```
frontend/src/
├── pages/
│   └── it-components/
│       ├── ITComponentListPage.tsx
│       ├── ITComponentDetailPage.tsx
│       ├── ITComponentFormPage.tsx         ← new + edit unifiés
│       └── useITComponentsStore.ts         ← state local (filtres, drawer, sort)
│
├── components/
│   └── it-components/
│       ├── ITComponentDrawer.tsx           ← read-only side drawer
│       ├── ITComponentForm.tsx             ← form partagé new/edit
│       ├── ApplicationListInDrawer.tsx     ← mini liste apps dans drawer (5/page)
│       └── ApplicationListTable.tsx        ← full table apps dans détail (20/page)
│
├── services/
│   └── api/
│       └── it-components.api.ts            ← appels API (GET, POST, PATCH, DELETE)
│
└── utils/
    └── it-components.utils.ts              ← helpers (format409Message, formatDate)
```

### Types TypeScript

```typescript
// src/types/it-component.ts

interface ITComponentListItem {
  id: string;
  name: string;
  technology: string | null;
  type: string | null;
  createdAt: string;
  _count: { applications: number };
  tags: EntityTagResponse[];
}

interface ITComponentResponse extends ITComponentListItem {
  description: string | null;
  comment: string | null;
  updatedAt: string;
}

interface ITComponentFormValues {
  name: string;
  technology: string;
  type: string;
  description: string;
  comment: string;
  tags?: TagInput[];
}

interface EntityTagResponse {
  entityType: string;
  entityId: string;
  tagValue: {
    id: string;
    dimensionId: string;
    dimensionName: string;
    dimensionColor: string | null;
    path: string;
    label: string;
    depth: number;
    parentId: string | null;
  };
  taggedAt: string;
}
```

---

## 7. Règles Métier Frontend

- **RM-01 — Droits requis :**

  `it-components:read` pour lire (liste, détail, drawer). `it-components:write` pour créer, modifier, supprimer.
  Les boutons Edit et Delete sont `disabled` si `!hasPermission('it-components:write')` — ils ne sont jamais masqués sur les pages détail et drawer, seulement désactivés.
  La colonne Actions du tableau est masquée si `!hasPermission('it-components:write')`.
  Le bouton "+ Nouveau composant" est masqué si `!hasPermission('it-components:write')`.

  ```typescript
  const canWrite = hasPermission('it-components:write'); // import depuis @/store/auth
  ```

- **RM-02 — Drawer read-only :**

  Le drawer `ITComponentDrawer` est en lecture seule. Aucun champ n'est éditable inline. Toute modification passe par la Full Page via le bouton "Modifier" du footer.

- **RM-03 — Erreur 409 CONFLICT :**

  Afficher message inline sous le champ `name` dans le formulaire : `t('it-components.form.nameDuplicate')`. Ne pas déclencher d'ArkAlert.

- **RM-04 — Erreur 409 DEPENDENCY_CONFLICT :**

  `ConfirmDialog` affiche le message formaté `format409Message(t, applicationsCount)` en remplacement du message initial. Le bouton "Confirmer" est `disabled`. Le dialog reste ouvert. Un lien "Voir les applications liées" navigue vers `/it-components/:id` (onglet Applications). Aucune `ArkAlert` dans ce cas.

  ```typescript
  // src/utils/it-components.utils.ts
  import { TFunction } from 'i18next';

  export function format409Message(t: TFunction, applicationsCount: number): string {
    return t('it-components.delete.blockedMessage', { count: applicationsCount });
  }
  ```

- **RM-05 — Filtres persistants :**

  L'état des filtres (`search`, `filterType`, `filterTechnology`, `sortBy`, `sortOrder`, `page`) persiste dans `useITComponentsStore` lors du clic sur une ligne (ouverture drawer) ou du clic sur le nom (navigation détail). Restaurés au retour sur la liste.

- **RM-06 — Déduplication tags :**
  - **En lecture (liste, drawer, détail)** : `TagChipList` applique `deduplicateByDepth()` avant rendu
  - **En édition (formulaire)** : `DimensionTagInput` ne déduplique pas (affiche la réalité des données)

- **RM-07 — Navigation post-create :**

  Après création d'un IT Component (`POST` 201), naviguer vers `/it-components/:id` avec navigation state `{ alert: { severity: 'success', message: t('it-components.alert.createSuccess') } }`.

- **RM-08 — Navigation post-edit :**

  Après modification (`PATCH` 200), naviguer vers `/it-components/:id` avec navigation state `{ alert: { severity: 'success', message: t('it-components.alert.updateSuccess') } }`.

- **RM-09 — Navigation post-delete :**

  Après suppression (`DELETE` 204), naviguer vers `/it-components` avec navigation state `{ alert: { severity: 'success', message: t('it-components.alert.deleteSuccess') } }`.

- **RM-10 — Tri des colonnes :**

  Tri server-side via les paramètres API `sortBy` / `sortOrder`. Valeurs `null` classées **en dernier** quelle que soit la direction. Colonnes triables : `name`, `technology`, `type`, `createdAt`.

- **RM-11 — Recherche textuelle debounce :**

  API search sur `name` avec debounce 300ms. Réinitialise la pagination à la page 1 à chaque changement de filtre.

- **RM-12 — Format dates :**

  `createdAt` et `updatedAt` affichés en format locale FR (ex: "21 mars 2026"). Utiliser `Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })`.

---

## 8. Câblage App.tsx — Manuel ⚠️

> À réaliser **manuellement** avant de lancer la session OpenCode.
> OpenCode ne génère pas ce fichier.

```typescript
// App.tsx — routes IT Components à ajouter

// Lecture : token requis
<Route path="/it-components" element={<PrivateRoute />}>
  <Route index element={<ITComponentListPage />} />
  <Route path=":id" element={<ITComponentDetailPage />} />
</Route>

// Écriture : token + permission it-components:write
<Route path="/it-components" element={<PrivateRoute permission="it-components:write" />}>
  <Route path="new" element={<ITComponentFormPage mode="create" />} />
  <Route path=":id/edit" element={<ITComponentFormPage mode="edit" />} />
</Route>
```

> Ajouter également l'entrée Sidebar dans `AppShell` : label `t('it-components.list.title')`, icon `MemoryIcon` (ou `DeveloperBoardIcon`), href `/it-components`.

---

## 9. Session Gate — Frontend ⚠️

> Prérequis à valider **avant** de lancer la session OpenCode et de passer cette spec à `stable`.

- [ ] **FS-04-BACK au statut `done`** — gates G-01 à G-13 toutes cochées
- [ ] **API testée manuellement** — au moins `GET` et `POST /api/v1/it-components` validés (Postman/curl)
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **Clés `it-components.*` ajoutées dans `fr.json`** (§5 de cette spec)
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01)
- [ ] **Câblage `App.tsx` réalisé manuellement** (§8 de cette spec)
- [ ] **Entrée Sidebar IT Components ajoutée manuellement**
- [ ] **`cy.loginAsReadOnly()`** disponible dans `cypress/support/commands.ts`
- [ ] **Cypress opérationnel**
- [ ] **Layout Contract §4 relu** — un bloc par page, aucun composant F-01/F-03 manquant
- [ ] **FS-04-FRONT passé au statut `stable`** avant de lancer OpenCode

---

## 10. Tests Cypress — E2E Browser ⚠️

### Suite de tests `e2e/tests/04-it-components.spec.ts`

```typescript
describe('IT Components — PNS-02 (Drawer + Detail + Form)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/it-components');
  });

  describe('List Page', () => {
    it('should display IT components table with correct columns', () => {
      cy.get('table').should('be.visible');
      cy.contains('th', 'Nom').should('exist');
      cy.contains('th', 'Technologie').should('exist');
      cy.contains('th', 'Type').should('exist');
      cy.contains('th', 'Tags').should('exist');
      cy.contains('th', 'Applications').should('exist');
    });

    it('should display LoadingSkeleton during fetch', () => {
      cy.intercept('GET', '/api/v1/it-components*', (req) => {
        req.reply({ delay: 500, body: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
      }).as('slowFetch');
      cy.visit('/it-components');
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
      cy.wait('@slowFetch');
    });

    it('should display EmptyState when no IT components', () => {
      cy.intercept('GET', '/api/v1/it-components*', { body: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
      cy.visit('/it-components');
      cy.contains('Aucun composant IT').should('be.visible');
    });

    it('should open drawer on row click (not name)', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(1).click(); // Technologie — pas le nom
      });
      cy.get('[role="presentation"]').should('be.visible');
      cy.contains('Détails composant IT').should('exist');
    });

    it('should navigate to detail on name click (no drawer)', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.url().should('include', '/it-components/');
      cy.get('[role="presentation"]').should('not.exist');
    });

    it('should search IT components by name with debounce', () => {
      cy.get('input[placeholder*="Rechercher"]').type('PostgreSQL');
      cy.wait(500); // debounce 300ms + margin
      cy.get('table tbody tr').should('have.length.lessThan', 10);
    });

    it('should filter by type', () => {
      cy.get('[data-testid="filter-type"]').click();
      cy.get('[role="listbox"]').contains('database').click();
      cy.get('table tbody tr').each(row => {
        cy.wrap(row).find('td').eq(2).invoke('text').then(text => {
          expect(text.toLowerCase()).to.include('database');
        });
      });
    });

    it('should filter by technology', () => {
      cy.get('[data-testid="filter-technology"]').click();
      cy.get('[role="listbox"]').contains('Redis').click();
      cy.get('table tbody tr').each(row => {
        cy.wrap(row).find('td').eq(1).invoke('text').then(text => {
          expect(text.toLowerCase()).to.include('redis');
        });
      });
    });

    it('should sort by name ascending by default', () => {
      cy.get('table tbody tr').first().find('a').invoke('text').then(firstName => {
        cy.get('table tbody tr').last().find('a').invoke('text').then(lastName => {
          expect(firstName.localeCompare(lastName)).to.be.lessThan(1);
        });
      });
    });

    it('should toggle sort order on column header click', () => {
      cy.contains('th', 'Nom').click();
      cy.contains('th', 'Nom').click();
      cy.get('table tbody tr').first().find('a').invoke('text').then(text => {
        expect(text).to.be.a('string');
      });
    });

    it('should show Add button if hasPermission it-components:write', () => {
      cy.contains('button', 'Nouveau composant').should('be.visible');
    });

    it('should hide Add button if !hasPermission', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components');
      cy.contains('button', 'Nouveau composant').should('not.exist');
    });

    it('should hide Actions column if !hasPermission', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components');
      cy.contains('th', 'Actions').should('not.exist');
    });
  });

  describe('Side Drawer (PNS-02 — Read-Only)', () => {
    it('should display drawer with IT component info', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').should('be.visible').within(() => {
        cy.contains('Informations').should('exist');
        cy.contains('Applications').should('exist');
      });
    });

    it('should close drawer on close button click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.get('button[aria-label="close"]').click();
      });
      cy.get('[role="presentation"]').should('not.exist');
    });

    it('should close drawer on Escape key', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').should('be.visible');
      cy.get('body').type('{esc}');
      cy.get('[role="presentation"]').should('not.exist');
    });

    it('should show Applications tab in drawer with list', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('Applications').click();
        cy.get('table, [data-testid="empty-state"]').should('exist');
      });
    });

    it('should navigate to detail from "Voir la fiche complète" button', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('button', 'Voir la fiche complète').click();
      });
      cy.url().should('include', '/it-components/');
      cy.get('[role="presentation"]').should('not.exist');
    });

    it('should navigate to edit from "Modifier" button (admin)', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('button', 'Modifier').should('not.be.disabled').click();
      });
      cy.url().should('include', '/it-components/').and('include', '/edit');
    });

    it('should disable Edit button in drawer if !hasPermission', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components');
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('button', 'Modifier').should('be.disabled');
      });
    });

    it('should preserve filters after opening and closing drawer', () => {
      cy.get('input[placeholder*="Rechercher"]').type('PostgreSQL');
      cy.wait(400);
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.get('button[aria-label="close"]').click();
      });
      cy.get('input[placeholder*="Rechercher"]').should('have.value', 'PostgreSQL');
    });
  });

  describe('Detail Page', () => {
    it('should display full IT component details with all fields', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.url().should('include', '/it-components/');
      cy.contains('Informations').should('be.visible');
      cy.contains('Technologie').should('exist');
      cy.contains('Type').should('exist');
    });

    it('should show Applications tab with table', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('Applications').click();
      cy.get('table, [data-testid="empty-state"]').should('exist');
    });

    it('should display breadcrumb with correct links', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('Composants IT').should('be.visible');
      cy.contains('Accueil').should('be.visible');
    });

    it('should navigate back to list on "Retour" click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Retour').click();
      cy.url().should('include', '/it-components');
      cy.url().should('not.include', '/it-components/');
    });

    it('should navigate to edit on "Modifier" click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Modifier').click();
      cy.url().should('include', '/edit');
    });

    it('should open ConfirmDialog on "Supprimer" click', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').contains('Supprimer le composant IT').should('be.visible');
    });

    it('should redirect to /it-components on unknown UUID', () => {
      cy.visit('/it-components/00000000-0000-0000-0000-000000000000');
      cy.url().should('equal', Cypress.config('baseUrl') + '/it-components');
    });
  });

  describe('Form Page (Create/Edit)', () => {
    it('should display create form with empty fields', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.url().should('include', '/it-components/new');
      cy.contains('h4, h5, h6', 'Nouveau composant IT').should('be.visible');
      cy.get('input[name="name"]').should('have.value', '');
    });

    it('should disable Save button when name is empty', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.contains('button', 'Enregistrer').should('be.disabled');
    });

    it('should show inline error when name is empty on submit', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type(' ').clear();
      cy.contains('button', 'Enregistrer').click();
      cy.contains('Le nom est obligatoire').should('be.visible');
    });

    it('should show inline error on duplicate name (409 CONFLICT)', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type('PostgreSQL Primary'); // existant en seed
      cy.contains('button', 'Enregistrer').click();
      cy.contains('Ce nom de composant existe déjà').should('be.visible');
    });

    it('should create IT component and navigate to detail with success alert', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type('Test Component Cypress');
      cy.get('input[name="technology"]').type('Node.js 20');
      cy.get('input[name="type"]').type('runtime');
      cy.contains('button', 'Enregistrer').click();
      cy.url().should('include', '/it-components/');
      cy.url().should('not.include', '/new');
      cy.contains('Composant IT créé avec succès').should('be.visible');
    });

    it('should navigate to list on "Annuler" in create mode', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.contains('button', 'Annuler').click();
      cy.url().should('match', /\/it-components$/);
    });

    it('should pre-fill form in edit mode', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Modifier').click();
      cy.url().should('include', '/edit');
      cy.get('input[name="name"]').should('not.have.value', '');
    });

    it('should update IT component and navigate to detail with success alert', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Modifier').click();
      cy.get('input[name="technology"]').clear().type('PostgreSQL 17');
      cy.contains('button', 'Enregistrer').click();
      cy.url().should('include', '/it-components/');
      cy.url().should('not.include', '/edit');
      cy.contains('Composant IT modifié avec succès').should('be.visible');
    });

    it('should navigate to detail on "Annuler" in edit mode', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      const currentUrl = cy.url();
      cy.contains('button', 'Modifier').click();
      cy.contains('button', 'Annuler').click();
      cy.url().should('include', '/it-components/');
      cy.url().should('not.include', '/edit');
    });

    it('should redirect to /it-components on edit with unknown UUID', () => {
      cy.visit('/it-components/00000000-0000-0000-0000-000000000000/edit');
      cy.url().should('equal', Cypress.config('baseUrl') + '/it-components');
    });
  });

  describe('Delete & 409 DEPENDENCY_CONFLICT', () => {
    it('should delete IT component without apps and show success alert', () => {
      // Créer un composant sans liaisons puis le supprimer
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type('ToDelete Cypress Component');
      cy.contains('button', 'Enregistrer').click();
      cy.url().should('include', '/it-components/');
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'Supprimer').not('[disabled]').click();
      });
      cy.url().should('match', /\/it-components$/);
      cy.contains('Composant IT supprimé avec succès').should('be.visible');
    });

    it('should cancel delete dialog without deleting', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'Annuler').click();
      });
      cy.get('[role="dialog"]').should('not.exist');
      cy.url().should('include', '/it-components/');
    });

    it('should block delete if IT component used by apps (DEPENDENCY_CONFLICT)', () => {
      // Suppose que le premier composant du seed a des applications liées
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().click();
      });
      cy.contains('button', 'Supprimer').click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Impossible de supprimer').should('be.visible');
        cy.contains('button', 'Supprimer').should('be.disabled');
        cy.contains('Voir les applications liées').should('be.visible');
      });
    });
  });

  describe('Tags (F-03)', () => {
    it('should display tags in list with TagChipList', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(3).should('exist'); // colonne Tags
      });
    });

    it('should display tags in drawer', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('td').eq(2).click();
      });
      cy.get('[role="presentation"]').within(() => {
        cy.contains('Tags').should('exist');
      });
    });

    it('should allow adding tags in create form', () => {
      cy.contains('button', 'Nouveau composant').click();
      cy.get('input[name="name"]').type('Component With Tags Cypress');
      cy.contains('Tags dimensionnels').should('exist');
      // DimensionTagInput est présent
      cy.get('[data-testid="dimension-tag-input"]').should('exist');
    });
  });

  describe('Permissions (RBAC)', () => {
    it('should allow read access for read-only role', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components');
      cy.get('table').should('be.visible');
    });

    it('should redirect /it-components/new to /403 for read-only role', () => {
      cy.loginAsReadOnly();
      cy.visit('/it-components/new');
      cy.url().should('include', '/403');
    });

    it('should redirect /it-components/:id/edit to /403 for read-only role', () => {
      cy.loginAsReadOnly();
      cy.get('table tbody tr').first().within(() => {
        cy.get('a').first().invoke('attr', 'href').then(href => {
          cy.visit(`${href}/edit`);
        });
      });
      cy.url().should('include', '/403');
    });
  });
});
```

### Parcours nominaux — récapitulatif

- [ ] `[Cypress]` `ITComponentListPage` affiche la liste après login
- [ ] `[Cypress]` `ITComponentListPage` affiche `EmptyState` si aucun composant
- [ ] `[Cypress]` `LoadingSkeleton` affiché pendant le fetch
- [ ] `[Cypress]` Tri par défaut sur `name` ascendant
- [ ] `[Cypress]` Clic sur en-tête colonne → tri inversé
- [ ] `[Cypress]` Clic sur ligne (hors nom) → drawer ouvert
- [ ] `[Cypress]` Clic sur nom → navigate `/it-components/:id` + drawer fermé
- [ ] `[Cypress]` Drawer affiche onglets Info + Applications
- [ ] `[Cypress]` Drawer : bouton "Voir la fiche complète" → navigate détail
- [ ] `[Cypress]` Drawer : bouton "Modifier" (admin) → navigate edit
- [ ] `[Cypress]` Drawer : bouton "Modifier" disabled si pas `it-components:write`
- [ ] `[Cypress]` Drawer fermé par CloseIcon / Escape
- [ ] `[Cypress]` Filtres search + type + technology fonctionnels
- [ ] `[Cypress]` Filtres persistants après ouverture/fermeture drawer
- [ ] `[Cypress]` `ITComponentDetailPage` affiche tous les champs + onglet Applications
- [ ] `[Cypress]` Breadcrumb cliquable retour liste
- [ ] `[Cypress]` Créer composant → navigate détail + ArkAlert success
- [ ] `[Cypress]` Annuler création → retour liste
- [ ] `[Cypress]` Modifier composant → navigate détail + ArkAlert success
- [ ] `[Cypress]` Annuler édition → retour détail
- [ ] `[Cypress]` Supprimer sans apps → retour liste + ArkAlert success
- [ ] `[Cypress]` Annuler dialog suppression → dialog fermé, entité présente

### Parcours d'erreur

- [ ] `[Cypress]` Créer avec nom dupliqué → erreur inline `nameDuplicate`
- [ ] `[Cypress]` Créer sans nom → erreur inline `nameRequired`
- [ ] `[Cypress]` Supprimer composant utilisé → DEPENDENCY_CONFLICT dans dialog, bouton disabled
- [ ] `[Cypress]` `ITComponentDetailPage` UUID inexistant → redirect `/it-components`
- [ ] `[Cypress]` `ITComponentFormPage` edit UUID inexistant → redirect `/it-components`

### Droits UI

- [ ] `[Cypress]` Sans `it-components:write` sur ListPage → bouton Add absent
- [ ] `[Cypress]` Sans `it-components:write` sur ListPage → colonne Actions absente
- [ ] `[Cypress]` Sans `it-components:write` dans drawer → bouton Modifier disabled
- [ ] `[Manuel]` Sans `it-components:write` → `/it-components/new` redirige vers `/403`
- [ ] `[Manuel]` Sans `it-components:write` → `/it-components/:id/edit` redirige vers `/403`

---

## 11. Commande OpenCode — Frontend ⚠️

```
Contexte projet ARK — Session Frontend FS-04-FRONT :

Stack : React 18 strict mode + Vite + TypeScript strict + MUI v5 + react-query
Structure : /frontend/src/(pages|components|services|utils|types)

Conventions obligatoires :
- Toute page : AppShell (layout racine) → PageContainer → composant contenu
- Toute liste : Table MUI + LoadingSkeleton + EmptyState + Pagination server-side
- Tous messages CUD : ArkAlert system (location.state.alert) — jamais console.log ou toast custom
- Tous droits : useAuth().hasPermission('it-components:action') — buttons disabled ou masqués selon contexte
- Erreurs API :
  → 400 (validation) : erreur inline champ name
  → 409 CONFLICT (nom dupliqué) : erreur inline t('it-components.form.nameDuplicate')
  → 409 DEPENDENCY_CONFLICT (delete bloqué) : ConfirmDialog message custom + bouton Confirmer disabled
  → 401/403 : intercepteur Axios global → /login ou /403
  → 404 : navigate('/it-components')
  → 5xx : ArkAlert error
- Tags : DimensionTagInput en édition, TagChipList en lecture avec deduplicateByDepth()
- Drawer (PNS-02) : 400px, anchor right, READ-ONLY, close button (Escape + backdrop), onglets Info+Applications, footer Edit+Voir détail
- Formulaire : page unifiée ITComponentFormPage (mode='create' | 'edit') — NE PAS créer deux composants séparés
- Filtres liste : search (debounce 300ms) + type (dropdown) + technology (dropdown) — server-side
- Tri : server-side via sortBy/sortOrder API params — nulls en dernier

Imports obligatoires :
- import { AppShell, PageContainer } from '@/components/layout'
- import { PageHeader, EmptyState, LoadingSkeleton, ConfirmDialog, ArkAlert } from '@/components/shared'
- import { TagChipList, DimensionTagInput } from '@/components/tags'
- import { format409Message } from '@/utils/it-components.utils'

Pattern de référence frontend : module Providers (FS-03-FRONT) — s'y conformer pour structure, drawer, ArkAlert, filtres.
Pattern de référence secondaire : module Domains (FS-02-FRONT).

Câblage App.tsx : déjà réalisé manuellement — NE PAS générer.

Respecte impérativement le Layout Contract §4 de cette spec :
- Composant F-01 exact par zone
- Clé i18n exacte par label
- Condition RBAC exacte par action
- Drawer en lecture seule uniquement

Implémente la feature "IT Components" frontend (FS-04-FRONT).
Génère :
  - 3 pages React (ITComponentListPage, ITComponentDetailPage, ITComponentFormPage)
  - ITComponentDrawer.tsx (read-only)
  - ITComponentForm.tsx (composant form partagé)
  - ApplicationListInDrawer.tsx (pagination 5/page)
  - ApplicationListTable.tsx (pagination 20/page)
  - useITComponentsStore.ts (state filtres + drawer)
  - it-components.api.ts (service API)
  - it-components.utils.ts (format409Message, formatDate)
  - src/types/it-component.ts
  - e2e/tests/04-it-components.spec.ts (tests Cypress §10)

Ne génère PAS le câblage App.tsx — déjà fait manuellement.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-04-IT-Components-front.md ICI]
[COLLER LE CONTENU DE FS-04-BACK §3 (Contrat API OpenAPI) ICI]
```

---

## 12. Checklist de Validation Post-Session

- [ ] Les 4 routes `/it-components/*` fonctionnent depuis App.tsx
- [ ] `PageHeader` utilisé sur toutes les pages — aucun Box+Typography en remplacement
- [ ] `ConfirmDialog` utilisé pour la suppression — aucun dialog inline
- [ ] `EmptyState` affiché sur liste vide
- [ ] `LoadingSkeleton` affiché pendant les appels API
- [ ] Bouton Add masqué si pas `it-components:write`
- [ ] Colonne Actions masquée si pas `it-components:write`
- [ ] Bouton Edit/Delete disabled sur DetailPage si pas `it-components:write`
- [ ] Bouton Edit disabled dans le drawer si pas `it-components:write`
- [ ] Drawer read-only — aucun champ éditable inline
- [ ] Onglet Applications dans drawer (5/page) et détail (20/page)
- [ ] Tri server-side fonctionnel — nulls en dernier
- [ ] Filtres search + type + technology server-side fonctionnels
- [ ] Filtres persistants lors de navigation drawer/détail et retour
- [ ] Snackbar/ArkAlert succès après create / update / delete
- [ ] 409 CONFLICT → erreur inline `nameDuplicate` (pas d'ArkAlert)
- [ ] 409 DEPENDENCY_CONFLICT → dialog message custom + bouton disabled
- [ ] Post-create → navigate détail + ArkAlert success
- [ ] Post-edit → navigate détail + ArkAlert success
- [ ] Post-delete → navigate liste + ArkAlert success
- [ ] Annuler create → liste, Annuler edit → détail
- [ ] Tags : DimensionTagInput en form, TagChipList lecture avec deduplicateByDepth
- [ ] Aucune string en dur dans les composants
- [ ] Aucune erreur TypeScript strict (`npm run build` → 0 error)
- [ ] Tests Cypress nominaux passent
- [ ] Conventions AGENTS.md respectées
- [ ] Aucun `TODO / FIXME / HACK` non tracé

---

## 13. Revue de Dette Technique *(gate de fin de sprint — obligatoire)* ⚠️

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- 'frontend/**/*.tsx'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 |
| TD-3 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md §React/Frontend |
| TD-4 | Composants F-01 réutilisés max | Vérifier imports depuis `@/components/(layout\|shared\|tags)` |
| TD-5 | Pas de CSS custom | Tout via MUI `sx={{}}` ou theme tokens |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 2 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 impactés** | *(à compléter)* |
| **NFR mis à jour** | *(à compléter)* |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

_FS-04-FRONT v1.0 — ARK_
