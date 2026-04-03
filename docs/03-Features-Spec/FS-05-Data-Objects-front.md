# ARK — Feature Spec FS-05-FRONT : Data Objects (Frontend)

_Version 0.1 — Avril 2026_

> **Changelog v0.1 :** Création initiale — module Data Objects frontend conforme template v0.1 et pattern PNS-02 (Side Drawer read-only + Page Détail). Intègre le champ `isSourceOfTruth` en Chip coloré, l'Autocomplete `type` (database/dataset/file), et l'onglet Applications avec colonne `role` (consumer/producer/owner). Filtres avancés (search, type, isSourceOfTruth). Cohérent avec FS-04-IT-Components-front et FS-06-Applications-front.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-05-FRONT |
| **Titre** | Data Objects — Pages React (Liste / Détail / New / Edit) |
| **Priorité** | P1 |
| **Statut** | `draft` *(devient `stable` uniquement après que FS-05-BACK est `done`)* |
| **Dépend de** | FS-01, F-02, **FS-05-BACK** (gate bloquante), **F-03** |
| **Spec mère** | FS-05 Data Objects v1.0 |
| **Estimé** | 0.5 jour |
| **Version** | 0.1 |

> ⚠️ Cette spec reste à `draft` tant que `FS-05-BACK` n'est pas au statut `done` et que toutes ses gates (G-01 à G-08) ne sont pas cochées.
>
> **Amendements backend pré-requis :** Deux modifications mineures à FS-05-BACK avant cette session frontend :
> - **A** Ajouter `type` et `isSourceOfTruth` comme query params à `GET /api/v1/data-objects` (filtres côté serveur)
> - **B** Ajouter le champ `role` dans la réponse de `GET /api/v1/data-objects/:id/applications` (colonne dans l'onglet)

---

## 1. Objectif & Périmètre ⚠️

> 3-5 phrases : ce que cette spec frontend accomplit et ce qu'elle ne fait pas.

**Ce que cette spec fait :**

Implémenter les pages React pour la gestion des Objets de Données (Data Objects) : liste avec filtres avancés (search, type, source of truth), drawer de consultation rapide read-only (PNS-02), page détail avec onglet applications liées et leurs rôles de liaison, page de formulaire unifiée création/modification. Ce module suit le pattern établi par FS-04-IT-Components-front tout en spécialisant l'UX pour les data objects (mise en avant du statut "source of truth" et du type de données).

**Hors périmètre :**
- Backend API — couvert par `FS-05-BACK`
- Data lineage (traçabilité des flux) — FS-09 (P2)
- Import Excel — FS-10 (P2)

---

## 2. User Stories

### Interactions Liste/Drawer (PNS-02)

#### US-01 — Consultation Rapide
En tant qu'utilisateur, je veux cliquer sur le corps d'une ligne du tableau (hors nom) pour ouvrir un Side Drawer, afin de consulter les métadonnées de l'objet de données sans perdre ma position dans la liste ni mes filtres actifs.

Critères d'acceptation:
* Clic sur Type, IsSourceOfTruth, Tags, Nb applications ou Actions → ouvre le drawer
* Drawer s'affiche depuis la droite (400px)
* État de la liste préservé (scroll, filtres)
* Drawer affiche (read-only) : nom, description, comment, type, isSourceOfTruth, tags, compteur applications

#### US-02 — Accès Direct Détail
En tant qu'utilisateur, je veux cliquer sur le nom de l'objet de données (lien hypertexte souligné) pour naviguer directement vers la Page Détail complète.

Critères d'acceptation:
* Nom affiché comme lien souligné (couleur texte normale, primaire au hover)
* Clic sur nom → navigation immédiate vers `/data-objects/:id`
* Le clic sur le nom ne déclenche pas l'ouverture du drawer (stopPropagation)

### Détail & Édition

#### US-03 — Page Détail
En tant qu'utilisateur, je veux voir le détail complet d'un objet de données avec tous ses champs et ses applications liées.

Critères d'acceptation:
* Page `/data-objects/:id` affiche : nom, description, comment, type, isSourceOfTruth, createdAt, updatedAt
* Onglet "Applications" : liste paginée des applications liées (20 / page) avec colonnes : nom, rôle, domaine, owner, criticality
* Bouton "Modifier" → `/data-objects/:id/edit` (disabled si pas `data-objects:write`)
* Bouton "Retour" → `/data-objects`

#### US-04 — Formulaire Création/Édition (Page unifiée)
En tant qu'utilisateur, je veux créer ou modifier un objet de données avec validation côté frontend.

Critères d'acceptation:
* Champs obligatoires marqués avec astérisque `*`
* `name` : obligatoire, unique (erreur inline 409 CONFLICT)
* `description`, `comment` : optionnels, TextArea
* `type` : optionnel, Autocomplete freeSolo (suggestions: database, dataset, file)
* `isSourceOfTruth` : optionnel, Checkbox
* `tags` : optionnel, DimensionTagInput de F-03
* Bouton "Enregistrer" désactivé si `isLoading`
* Bouton "Annuler" → retour liste (création) ou détail (édition)
* Post-création : navigation vers `/data-objects/:id` + Snackbar success
* Post-édition : reste sur `/data-objects/:id` + Snackbar success

### Filtres & Recherche

#### US-05 — Filtres et Tri
En tant qu'utilisateur, je veux filtrer et trier la liste des objets de données par multiple critères.

Critères d'acceptation:
* **Recherche** : textuelle sur le nom (debounce 300ms)
* **Filtre Type** : dropdown (database, dataset, file, tous)
* **Filtre Source of Truth** : toggle/dropdown (Oui, Non, Tous)
* **Tri** : nom (A→Z / Z→A), date création (ancien→récent)
* Filtres persistant lors du clic drawer/détail, restaurés au retour liste

#### US-06 — Actions Menu Dropdown
En tant qu'utilisateur, je veux accéder aux actions Modifier et Supprimer via un menu dropdown (⋮).

Critères d'acceptation:
* Colonne "Actions" : bouton IconButton avec MoreVertIcon (⋮)
* Menu dropdown : 2 items "Modifier" et "Supprimer"
* "Modifier" → navigation `/data-objects/:id/edit`
* "Supprimer" → ouvre ConfirmDialog
* Colonne absente si `!hasPermission('data-objects:write')`

#### US-07 — Suppression avec Gestion Dépendances
En tant qu'utilisateur, je veux supprimer un objet de données, mais être averti s'il est utilisé par des applications.

Critères d'acceptation:
* ConfirmDialog standard si aucune application liée
* Si `409 DEPENDENCY_CONFLICT` : message custom "Impossible de supprimer : cet objet est utilisé par [N] application(s)"
* Bouton "Confirmer" **disabled** sur DEPENDENCY_CONFLICT
* Lien "Voir les applications liées" redirige vers la page détail / onglet Applications
* Dialog reste ouvert — l'utilisateur ferme explicitement

---

## 3. Référence Contrat API

> Le contrat API complet est défini dans **FS-05-BACK §3**. Ne pas le redéfinir ici.
> La session OpenCode frontend doit recevoir FS-05-BACK §3 en contexte additionnel (voir commande §11).

Endpoints disponibles après validation de FS-05-BACK :

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/data-objects` | Liste (paginée, filtres, tri) | `data-objects:read` |
| `POST` | `/api/v1/data-objects` | Créer | `data-objects:write` |
| `GET` | `/api/v1/data-objects/:id` | Détail | `data-objects:read` |
| `PATCH` | `/api/v1/data-objects/:id` | Modifier | `data-objects:write` |
| `DELETE` | `/api/v1/data-objects/:id` | Supprimer | `data-objects:write` |
| `GET` | `/api/v1/data-objects/:id/applications` | Applications liées | `data-objects:read` |

**Amendements backend requis (pré-conditions Session Gate §9) :**

| # | Paramètre/champ | Modification | Raison |
|---|---|---|---|
| **A** | `GET /api/v1/data-objects` query params | Ajouter `type` (filter par type) et `isSourceOfTruth` (boolean filter) | Filtres avancés ListPage |
| **B** | `GET /api/v1/data-objects/:id/applications` response | Ajouter champ `role` (consumer/producer/owner) pour chaque application | Colonne Role dans l'onglet Applications |

Codes HTTP à gérer côté frontend :

| Code | Signification | Action frontend |
|------|--------------|-----------------|
| `200` / `201` | Succès | Snackbar + navigation selon contexte (voir §3) |
| `400` | Validation échouée | Erreur inline sur le champ concerné |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |
| `404` | Ressource introuvable | `navigate('/data-objects')` |
| `409` `CONFLICT` | Nom/valeur dupliqué(e) | Erreur inline `t('data-objects.form.nameDuplicate')` |
| `409` `DEPENDENCY_CONFLICT` | Suppression bloquée | Message formaté dans `ConfirmDialog` |

---

## 4. Layout Contract

### 4.1 `DataObjectListPage`

```yaml
page: DataObjectListPage
route: /data-objects
auth_required: true
permission_required: data-objects:read

layout:
  shell: AppShell            # import depuis '@/components/layout'
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  header:
    component: PageHeader    # import depuis '@/components/shared' — JAMAIS Box+Typography
    props:
      title: t('data-objects.list.title')
      subtitle: t('data-objects.list.subtitle')
      action:
        condition: hasPermission('data-objects:write')
        label: t('data-objects.list.addButton')
        onClick: navigate('/data-objects/new')
        icon: AddIcon

  filter_bar:
    component: MUI Box (flex row, gap 2)
    items:
      - TextField
          placeholder: t('data-objects.list.search')
          onChange: debounce(setSearch, 300)
          InputProps: SearchIcon (adornment)
      - FormControl
          label: t('data-objects.list.filterType')
          select: true
          value: filterType
          onChange: setFilterType
          items: ['', ...uniqueTypes]   # '' = Tous (database, dataset, file)
      - FormControl
          label: t('data-objects.list.filterSourceOfTruth')
          select: true
          value: filterSourceOfTruth
          onChange: setFilterSourceOfTruth
          items: ['', 'true', 'false']  # '' = Tous, 'true' = Oui, 'false' = Non

  body:
    component: MUI Table avec TableSortLabel
    loading_state: LoadingSkeleton             # import depuis '@/components/shared'
    empty_state: EmptyState                    # import depuis '@/components/shared'
    empty_state_props:
      title: t('data-objects.list.emptyState.title')
      description: t('data-objects.list.emptyState.description')
      action:
        condition: hasPermission('data-objects:write')
        label: t('data-objects.list.emptyState.cta')
        onClick: navigate('/data-objects/new')

    columns:
      - field: name
          header: t('data-objects.list.columns.name')
          sortable: true
          sort_null_behavior: null values last
          render: Link souligné → navigate('/data-objects/${row.id}')
          onClick_row: stopPropagation (ne déclenche pas le drawer)

      - field: type
          header: t('data-objects.list.columns.type')
          sortable: true
          sort_null_behavior: null values last
          render: plain text (nullable → '—')

      - field: isSourceOfTruth
          header: t('data-objects.list.columns.isSourceOfTruth')
          sortable: true
          render: Chip (color: success, label: 'Source officielle') si true, Chip (color: default, label: 'Non') si false

      - field: tags
          header: t('data-objects.list.columns.tags')
          sortable: false
          render: TagChipList (mode liste, maxVisible=3, deduplicateByDepth)

      - field: _count.applications
          header: t('data-objects.list.columns.applicationsCount')
          sortable: false
          render: texte numérique simple

      - field: actions
          header: t('data-objects.list.columns.actions')
          condition: hasPermission('data-objects:write')
          render: IconButton (MoreVertIcon) → Menu dropdown MUI
            items:
              - label: t('common.actions.edit')
                icon: EditIcon
                onClick: navigate('/data-objects/${row.id}/edit')
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
    component: DataObjectDrawer (read-only)
    condition: drawerOpen && selectedDataObjectId
    props:
      dataObject: selectedDataObject
      onClose: closeDrawer
      onNavigateDetail: navigate('/data-objects/:id')
      onNavigateEdit: navigate('/data-objects/:id/edit')

  dialogs:
    - id: confirm-delete
        component: ConfirmDialog   # import depuis '@/components/shared'
        trigger: delete menu item click
        props:
          title: t('data-objects.delete.confirmTitle')
          message: t('data-objects.delete.confirmMessage', { name: row.name })
          confirmLabel: t('common.actions.delete')
          severity: error
        on_confirm: DELETE /api/v1/data-objects/:id
        on_success: navigate('/data-objects', { state: { alert: success } })
        on_409_DEPENDENCY_CONFLICT:
          message: format409Message(t, applicationsCount)
          confirmButton: disabled
          link: t('data-objects.delete.viewApps') → navigate('/data-objects/:id', { tab: 'applications' })
```

---

### 4.2 `DataObjectDrawer` (Read-Only Side Drawer)

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
      - Typography variant="h6": t('data-objects.drawer.title')
      - IconButton: CloseIcon (color: text.secondary, onClick: onClose)

  body:
    component: Box (sx: { flex: 1, overflow: 'auto' })
    tabs:
      component: MUI Tabs
      items:
        - label: t('data-objects.drawer.tabInfo')
          content:
            component: Box (p: 2, display: flex, flexDirection: column, gap: 2)
            fields:
              - label: t('data-objects.drawer.nameLabel')
                value: dataObject.name (Typography variant="subtitle1" fontWeight=600)
              - label: t('data-objects.drawer.typeLabel')
                value: dataObject.type ?? '—'
              - label: t('data-objects.drawer.isSourceOfTruthLabel')
                value: Chip (color: success, label: 'Source officielle') si true, Chip (color: default, label: 'Non') si false
              - label: t('data-objects.drawer.descriptionLabel')
                value: dataObject.description ?? t('data-objects.detail.noValue')
                render: Typography body2, color text.secondary
              - label: t('data-objects.drawer.commentLabel')
                value: dataObject.comment ?? t('data-objects.detail.noValue')
                render: Typography body2, color text.secondary
              - label: t('data-objects.drawer.tagsLabel')
                value: TagChipList (deduplicateByDepth, masked empty dimensions)
              - label: t('data-objects.drawer.applicationsCountLabel')
                value: dataObject._count.applications

        - label: t('data-objects.drawer.tabApplications')
          content:
            component: ApplicationListInDrawer
            source: GET /api/v1/data-objects/:id/applications
            pagination: 5 items/page
            loading_state: LoadingSkeleton
            empty_state: EmptyState (t('data-objects.drawer.noApplications'))
            columns:
              - name (lien → /applications/:id)
              - role (consumer / producer / owner)
              - domain.name
              - owner (firstName + lastName)
              - criticality

  footer:
    component: Box (sx: { p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' })
    buttons:
      - label: t('data-objects.drawer.buttonEdit')
          variant: contained
          disabled: !hasPermission('data-objects:write')
          onClick: navigate('/data-objects/:id/edit')
      - label: t('data-objects.drawer.buttonViewDetail')
          variant: outlined
          onClick: navigate('/data-objects/:id')
```

---

### 4.3 `DataObjectDetailPage`

```yaml
page: DataObjectDetailPage
route: /data-objects/:id
auth_required: true
permission_required: data-objects:read

on_load:
  action: GET /api/v1/data-objects/:id
  on_404: navigate('/data-objects')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: md

zones:
  header:
    component: PageHeader
    props:
      title: dataObject.name
      action:
        condition: hasPermission('data-objects:write')
        label: t('data-objects.detail.editButton')
        onClick: navigate('/data-objects/${dataObject.id}/edit')
        icon: EditIcon

  body:
    loading_state: LoadingSkeleton
    component: MUI Tabs
    items:
      - label: t('data-objects.detail.tabInfo')
          content:
            component: Box (display: flex, flexDirection: column, gap: 2, pt: 2)
            fields:
              - label: t('data-objects.detail.typeLabel')
                value: dataObject.type ?? t('data-objects.detail.noValue')
              - label: t('data-objects.detail.isSourceOfTruthLabel')
                value: Chip (color: success, label: 'Source officielle') si true, Chip (color: default, label: 'Non') si false
              - label: t('data-objects.detail.descriptionLabel')
                value: dataObject.description ?? t('data-objects.detail.noValue')
              - label: t('data-objects.detail.commentLabel')
                value: dataObject.comment ?? t('data-objects.detail.noValue')
              - label: t('data-objects.detail.tagsLabel')
                value: TagChipList (deduplicateByDepth)
              - label: t('data-objects.detail.createdAtLabel')
                value: dataObject.createdAt (format date locale FR)
              - label: t('data-objects.detail.updatedAtLabel')
                value: dataObject.updatedAt (format date locale FR)

      - label: t('data-objects.detail.tabApplications')
          content:
            component: ApplicationListTable
            source: GET /api/v1/data-objects/:id/applications
            pagination: 20 items/page
            loading_state: LoadingSkeleton
            empty_state: EmptyState (t('data-objects.detail.noApplications'))
            columns:
              - name (lien → /applications/:id)
              - role (consumer / producer / owner)
              - domain.name
              - owner (firstName + lastName)
              - criticality

  footer:
    component: Box (sx: { display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' })
    buttons:
      - label: t('data-objects.detail.buttonBack')
          variant: outlined
          onClick: navigate('/data-objects')
      - label: t('data-objects.detail.buttonEdit')
          variant: contained
          disabled: !hasPermission('data-objects:write')
          onClick: navigate('/data-objects/:id/edit')
      - label: t('data-objects.detail.buttonDelete')
          variant: contained
          color: error
          disabled: !hasPermission('data-objects:write')
          onClick: openConfirmDelete

  dialogs:
    - id: confirm-delete
        component: ConfirmDialog
        props:
          title: t('data-objects.delete.confirmTitle')
          message: t('data-objects.delete.confirmMessage', { name: dataObject.name })
          confirmLabel: t('common.actions.delete')
          severity: error
        on_confirm: DELETE /api/v1/data-objects/:id
        on_success: navigate('/data-objects', { state: { alert: success } })
        on_409_DEPENDENCY_CONFLICT:
          message: format409Message(t, applicationsCount)
          confirmButton: disabled
```

---

### 4.4 `DataObjectFormPage` (Create & Edit — Page unifiée)

```yaml
page: DataObjectFormPage
route_create: /data-objects/new
route_edit: /data-objects/:id/edit
auth_required: true
permission_required: data-objects:write

on_load_edit:
  action: GET /api/v1/data-objects/:id
  on_404: navigate('/data-objects')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  header:
    component: PageHeader
    props:
      title: |
        mode === 'create'
          ? t('data-objects.form.createTitle')
          : t('data-objects.form.editTitle')
      action: null

  body:
    loading_state: LoadingSkeleton   # en mode edit, pendant le fetch initial
    component: MUI Box (component="form", display: flex, flexDirection: column, gap: 3)
    fields:
      - label: t('data-objects.form.nameLabel') *
          name: name
          component: TextField
          variant: outlined
          required: true
          fullWidth: true
          autoFocus: true
          maxLength: 255
          error_inline: true
          helperText_duplicate: t('data-objects.form.nameDuplicate')
          helperText_required: t('data-objects.form.nameRequired')

      - label: t('data-objects.form.typeLabel')
          name: type
          component: Autocomplete
          variant: outlined
          fullWidth: true
          required: false
          freeSolo: true
          options: ['database', 'dataset', 'file']
          placeholder: t('data-objects.form.typePlaceholder')

      - label: t('data-objects.form.isSourceOfTruthLabel')
          name: isSourceOfTruth
          component: FormControlLabel
          control: Checkbox
          label: t('data-objects.form.isSourceOfTruthCheckbox')

      - label: t('data-objects.form.descriptionLabel')
          name: description
          component: TextField
          variant: outlined
          multiline: true
          rows: 3
          fullWidth: true
          required: false
          maxLength: 2000

      - label: t('data-objects.form.commentLabel')
          name: comment
          component: TextField
          variant: outlined
          multiline: true
          rows: 3
          fullWidth: true
          required: false
          maxLength: 2000

      - label: t('data-objects.form.tagsLabel')
          name: tags
          component: DimensionTagInput   # import depuis '@/components/tags'
          required: false
          note: "Déduplication désactivée en édition (réalité des données)"

  footer:
    component: Box (sx: { display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 })
    buttons:
      - label: t('data-objects.form.buttonCancel')
          variant: outlined
          onClick: |
            mode === 'create'
              ? navigate('/data-objects')
              : navigate('/data-objects/:id')

      - label: t('data-objects.form.buttonSave')
          variant: contained
          type: submit
          disabled: isLoading || !isFormValid

  on_submit_create:
    action: POST /api/v1/data-objects
    on_success: navigate('/data-objects/${createdEntity.id}', { state: { alert: { severity: 'success', message: t('data-objects.alert.createSuccess') } } })
    on_409_CONFLICT: erreur inline champ name → t('data-objects.form.nameDuplicate')
    on_400: erreur inline champ name → t('data-objects.form.nameRequired')

  on_submit_edit:
    action: PATCH /api/v1/data-objects/:id
    on_success: navigate('/data-objects/:id', { state: { alert: { severity: 'success', message: t('data-objects.alert.updateSuccess') } } })
    on_409_CONFLICT: erreur inline champ name → t('data-objects.form.nameDuplicate')
    on_400: erreur inline champ name → t('data-objects.form.nameRequired')

  form_rules:
    - save_button_disabled_while: isLoading === true
    - name_validation: non vide, non uniquement espaces (client-side avant submit)
```

---

## 5. Clés i18n — Section `data-objects` à ajouter dans `fr.json` ⚠️

> À ajouter **manuellement** dans `src/i18n/locales/fr.json` avant de lancer la session OpenCode.

```json
"data-objects": {
  "list": {
    "title": "Objets de Données",
    "subtitle": "Gestion de vos sources et références de données métier",
    "addButton": "Nouveau objet",
    "search": "Rechercher par nom...",
    "filterType": "Type",
    "filterSourceOfTruth": "Source officielle",
    "columns": {
      "name": "Nom",
      "type": "Type",
      "isSourceOfTruth": "Source",
      "tags": "Tags",
      "applicationsCount": "Applications",
      "actions": "Actions"
    },
    "emptyState": {
      "title": "Aucun objet de données",
      "description": "Créez votre premier objet de données pour inventorier vos sources et référentiels.",
      "cta": "Créer un objet"
    }
  },

  "drawer": {
    "title": "Détails objet de données",
    "tabInfo": "Informations",
    "tabApplications": "Applications",
    "buttonEdit": "Modifier",
    "buttonViewDetail": "Voir la fiche complète",
    "nameLabel": "Nom",
    "typeLabel": "Type",
    "isSourceOfTruthLabel": "Source officielle",
    "descriptionLabel": "Description",
    "commentLabel": "Commentaire",
    "tagsLabel": "Tags",
    "applicationsCountLabel": "Applications liées",
    "noApplications": "Aucune application liée"
  },

  "detail": {
    "tabInfo": "Informations",
    "tabApplications": "Applications",
    "noValue": "—",
    "typeLabel": "Type",
    "isSourceOfTruthLabel": "Source officielle",
    "descriptionLabel": "Description",
    "commentLabel": "Commentaire",
    "tagsLabel": "Tags",
    "createdAtLabel": "Créé le",
    "updatedAtLabel": "Modifié le",
    "noApplications": "Aucune application liée à cet objet",
    "editButton": "Modifier",
    "buttonBack": "Retour",
    "buttonDelete": "Supprimer"
  },

  "form": {
    "createTitle": "Nouvel objet de données",
    "editTitle": "Modifier l'objet de données",
    "nameLabel": "Nom",
    "nameRequired": "Le nom est obligatoire",
    "nameDuplicate": "Ce nom d'objet existe déjà",
    "typeLabel": "Type",
    "typePlaceholder": "ex: database, dataset, file",
    "isSourceOfTruthLabel": "Source de vérité",
    "isSourceOfTruthCheckbox": "Cet objet est la source officielle des données",
    "descriptionLabel": "Description",
    "commentLabel": "Commentaire",
    "tagsLabel": "Tags dimensionnels",
    "buttonSave": "Enregistrer",
    "buttonCancel": "Annuler"
  },

  "delete": {
    "confirmTitle": "Supprimer l'objet de données",
    "confirmMessage": "Êtes-vous sûr de vouloir supprimer \"{{name}}\" ?",
    "blockedMessage": "Impossible de supprimer : cet objet est utilisé par {{count}} application(s)",
    "viewApps": "Voir les applications liées"
  },

  "alert": {
    "createSuccess": "Objet de données créé avec succès",
    "updateSuccess": "Objet de données modifié avec succès",
    "deleteSuccess": "Objet de données supprimé avec succès",
    "errors": {
      "serverError": "Erreur serveur — veuillez réessayer",
      "notFound": "Objet de données introuvable"
    }
  }
}
```

---

## 6. Composants à Générer

### Structure de fichiers

```
frontend/src/
├── pages/
│   └── data-objects/
│       ├── DataObjectListPage.tsx
│       ├── DataObjectDetailPage.tsx
│       ├── DataObjectFormPage.tsx         ← new + edit unifiés
│       └── useDataObjectsStore.ts         ← state local (filtres, drawer, sort)
├── components/
│   └── data-objects/
│       ├── DataObjectDrawer.tsx           ← read-only side drawer
│       ├── DataObjectForm.tsx             ← form partagé new/edit
│       ├── ApplicationListInDrawer.tsx    ← mini liste apps dans drawer (5/page)
│       └── ApplicationListTable.tsx       ← full table apps dans détail (20/page)
├── services/
│   └── api/
│       └── data-objects.api.ts            ← appels API (GET, POST, PATCH, DELETE)
├── utils/
│   └── data-objects.utils.ts              ← helpers (format409Message, formatDate)
└── types/
    └── data-object.ts
```

### Props du Composant Form

```typescript
interface DataObjectFormProps {
  initialValues?: Partial<DataObjectFormValues>;
  onSubmit: (values: DataObjectFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

interface DataObjectFormValues {
  name: string;
  type?: string;
  description?: string;
  comment?: string;
  isSourceOfTruth?: boolean;
  tags?: TagInput[];
}

interface DataObjectResponse {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  comment: string | null;
  isSourceOfTruth: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    applications: number;
  };
  tags: EntityTagResponse[];
}

interface ApplicationWithRole {
  id: string;
  name: string;
  role: 'consumer' | 'producer' | 'owner';
  domain: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  criticality: string | null;
  lifecycleStatus: string | null;
}
```

---

## 7. Règles Métier Frontend ⚠️

- **RM-01 — Droits requis :**

  `data-objects:read` pour lire (liste, détail, drawer). `data-objects:write` pour créer, modifier, supprimer.

  ```typescript
  const canWrite = hasPermission('data-objects:write'); // import depuis @/store/auth
  ```

- **RM-02 — Affichage `isSourceOfTruth` :**

  Utiliser un **Chip coloré** en tous les contextes (liste, drawer, détail) :
  - **True** : Chip (variant: filled, color: success, label: "Source officielle", size: small)
  - **False** : Chip (variant: outlined, color: default, label: "Non", size: small)

  En formulaire : Checkbox avec label "Cet objet est la source officielle des données".

- **RM-03 — Champ `type` :**

  Utiliser **MUI Autocomplete** avec freeSolo=true et suggestions ["database", "dataset", "file"]. Permet texte libre tout en guidant l'utilisateur.

- **RM-04 — Colonne `role` dans Applications :**

  Afficher le champ `role` (consumer/producer/owner) dans la liste des applications liées (drawer + détail). Format simple : texte ou Chip coloré (consumer=default, producer=warning, owner=success).

- **RM-05 — Drawer read-only :**

  Le drawer `DataObjectDrawer` est en lecture seule. Aucun champ n'est éditable inline. Toute modification passe par la Full Page via le bouton "Modifier" du footer.

- **RM-06 — Erreur 409 CONFLICT :**

  Afficher message inline sous le champ `name` dans le formulaire : `t('data-objects.form.nameDuplicate')`. Ne pas déclencher de Snackbar.

- **RM-07 — Erreur 409 DEPENDENCY_CONFLICT :**

  `ConfirmDialog` affiche le message formaté `format409Message(t, applicationsCount)` en remplacement du message initial. Le bouton "Confirmer" est `disabled`. Le dialog reste ouvert. Un lien "Voir les applications liées" navigue vers `/data-objects/:id` (onglet Applications). Aucun Snackbar dans ce cas.

  ```typescript
  // src/utils/data-objects.utils.ts — généré par OpenCode
  import { TFunction } from 'i18next';

  export function format409Message(t: TFunction, applicationsCount: number): string {
    return t('data-objects.delete.blockedMessage', { count: applicationsCount });
  }
  ```

- **RM-08 — Filtres persistants :**

  L'état des filtres (`search`, `filterType`, `filterSourceOfTruth`, `sortBy`, `sortOrder`, `page`) persiste dans `useDataObjectsStore` lors du clic sur une ligne (ouverture drawer) ou du clic sur le nom (navigation détail). Restaurés au retour sur la liste.

- **RM-09 — Déduplication tags :**
  - **En lecture (liste, drawer, détail)** : `TagChipList` applique `deduplicateByDepth()` avant rendu
  - **En édition (formulaire)** : `DimensionTagInput` ne déduplique pas (affiche la réalité des données)

- **RM-10 — Navigation post-create :**

  Après création d'un Data Object (`POST` 201), naviguer vers `/data-objects/:id` avec navigation state `{ alert: { severity: 'success', message: t('data-objects.alert.createSuccess') } }`.

- **RM-11 — Navigation post-edit :**

  Après modification (`PATCH` 200), naviguer vers `/data-objects/:id` avec navigation state `{ alert: { severity: 'success', message: t('data-objects.alert.updateSuccess') } }`.

- **RM-12 — Navigation post-delete :**

  Après suppression (`DELETE` 204), naviguer vers `/data-objects` avec navigation state `{ alert: { severity: 'success', message: t('data-objects.alert.deleteSuccess') } }`.

- **RM-13 — Tri des colonnes :**

  Tri server-side via les paramètres API `sortBy` / `sortOrder`. Valeurs `null` classées **en dernier** quelle que soit la direction. Colonnes triables : `name`, `type`, `isSourceOfTruth`, `createdAt`.

- **RM-14 — Recherche textuelle debounce :**

  API search sur `name` avec debounce 300ms. Réinitialise la pagination à la page 1 à chaque changement de filtre.

- **RM-15 — Format dates :**

  `createdAt` et `updatedAt` affichés en format locale FR (ex: "21 avril 2026"). Utiliser `Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })`.

---

## 8. Câblage App.tsx — Manuel ⚠️

> À réaliser **manuellement** avant de lancer la session OpenCode.
> OpenCode ne génère pas ce fichier. Patron de référence : `FS-04-IT-Components-front §8`.

```typescript
// App.tsx — routes Data Objects à ajouter

// Lecture : token requis
<Route path="/data-objects" element={<PrivateRoute />}>
  <Route index element={<DataObjectListPage />} />
  <Route path=":id" element={<DataObjectDetailPage />} />
</Route>

// Écriture : token + permission data-objects:write
<Route path="/data-objects" element={<PrivateRoute permission="data-objects:write" />}>
  <Route path="new" element={<DataObjectFormPage />} />
  <Route path=":id/edit" element={<DataObjectFormPage />} />
</Route>
```

> Ajouter également l'entrée Sidebar dans `AppShell` : label `t('data-objects.list.title')`, icon `StorageIcon` (ou `TableChartIcon`), href `/data-objects`.

---

## 9. Session Gate — Frontend ⚠️

> Prérequis à valider **avant** de lancer la session OpenCode et de passer cette spec à `stable`.

- [ ] **FS-05-BACK au statut `done`** — gates G-01 à G-08 toutes cochées
- [ ] **Amendement A : FS-05-BACK accepte query params `type` + `isSourceOfTruth`** — `GET /api/v1/data-objects?type=database&isSourceOfTruth=true`
- [ ] **Amendement B : `GET /api/v1/data-objects/:id/applications` inclut le champ `role`** — pour chaque app liée
- [ ] **API testée manuellement** — au moins `GET` et `POST /api/v1/data-objects` validés
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **F-03 au statut `done`** — `DimensionTagInput` et `TagChipList` disponibles
- [ ] **Clés `data-objects.*` ajoutées dans `fr.json`** (§5 de cette spec)
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01)
- [ ] **Câblage `App.tsx` réalisé manuellement** (§8 de cette spec)
- [ ] **Entrée Sidebar Data Objects ajoutée manuellement**
- [ ] **`cy.loginAsReadOnly()` et `cy.loginAsAdmin()`** disponibles dans `cypress/support/commands.ts`
- [ ] **Cypress opérationnel**
- [ ] **Layout Contract §4 relu** — un bloc par page, aucun composant F-01/F-03 manquant
- [ ] **FS-05-FRONT passé au statut `stable`** avant de lancer OpenCode

---

## 10. Tests Cypress — E2E Browser ⚠️

> À remplir exhaustivement — OpenCode génère les tests Cypress nominaux à partir de cette section.
> Assertions sur les **valeurs FR** de `fr.json` — jamais sur les clés.

### Parcours nominaux

- [ ] `[Cypress]` `DataObjectListPage` affiche la liste après login
- [ ] `[Cypress]` `DataObjectListPage` affiche `EmptyState` si aucun objet
- [ ] `[Cypress]` Tri par défaut sur `name` ascendant
- [ ] `[Cypress]` Clic sur en-tête colonne → tri inversé
- [ ] `[Cypress]` Clic sur une ligne (hors nom) → ouvre le drawer
- [ ] `[Cypress]` Clic sur le nom → redirect vers `/data-objects/:id`
- [ ] `[Cypress]` Drawer affiche onglet Informations + Applications
- [ ] `[Cypress]` Drawer ferme sur Escape
- [ ] `[Cypress]` Drawer ferme sur bouton close
- [ ] `[Cypress]` Filtrer par type fonctionne
- [ ] `[Cypress]` Filtrer par isSourceOfTruth fonctionne
- [ ] `[Cypress]` Recherche par nom avec debounce (300ms)
- [ ] `[Cypress]` `DataObjectDetailPage` affiche tous les champs
- [ ] `[Cypress]` Créer un objet → redirect vers `/data-objects/<new-id>` + snackbar succès
- [ ] `[Cypress]` Cancel sur `DataObjectNewPage` → redirect vers `/data-objects`
- [ ] `[Cypress]` Modifier un objet → reste sur `/data-objects/:id` + snackbar succès
- [ ] `[Cypress]` Cancel sur `DataObjectEditPage` → redirect vers `/data-objects/:id`
- [ ] `[Cypress]` Supprimer sans applications liées → disparaît de la liste + snackbar succès
- [ ] `[Cypress]` Cancel dans le dialog de suppression → dialog fermé, objet toujours présent

### Parcours d'erreur

- [ ] `[Cypress]` Créer avec nom dupliqué → erreur inline
- [ ] `[Cypress]` Créer sans nom → erreur inline
- [ ] `[Cypress]` Créer avec nom uniquement espaces → erreur inline
- [ ] `[Cypress]` Modifier avec nom dupliqué → erreur inline
- [ ] `[Cypress]` Supprimer objet lié → message formaté dans le dialog + bouton Confirmer disabled
- [ ] `[Cypress]` `DataObjectEditPage` UUID inexistant → redirect vers `/data-objects`
- [ ] `[Cypress]` `DataObjectDetailPage` UUID inexistant → redirect vers `/data-objects`

### Droits UI

- [ ] `[Cypress]` Sans `data-objects:write` sur ListPage → bouton Add absent
- [ ] `[Cypress]` Sans `data-objects:write` sur ListPage → colonne Actions absente
- [ ] `[Cypress]` Sans `data-objects:write` sur DetailPage → bouton Edit disabled
- [ ] `[Cypress]` Sans `data-objects:write` dans Drawer → bouton Edit disabled
- [ ] `[Manuel]` Sans `data-objects:write` → `/data-objects/new` redirige vers `/403`
- [ ] `[Manuel]` Sans `data-objects:write` → `/data-objects/:id/edit` redirige vers `/403`

---

## 11. Commande OpenCode — Frontend ⚠️

> Copier-coller intégralement en début de session OpenCode.
> Ajouter le contenu de FS-05-BACK §3 (Contrat API) à la suite.

```
Contexte projet ARK — Session Frontend FS-05-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v5 + react-i18next
Règles MUI obligatoires :
- MUI v5 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement sur tous les TextField
- Pas de MUI X DataGrid — utiliser MUI Table + TableSortLabel

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur dans les composants
- Hook : const { t } = useTranslation()
- Fichier source : src/i18n/locales/fr.json — clés data-objects.* déjà présentes

RBAC frontend :
- hasPermission() importé depuis @/store/auth
- Vérifier avant TOUT rendu d'action d'écriture (bouton, icône, colonne)
- Jamais d'action d'écriture affichée inconditionnellement

Composants F-01 OBLIGATOIRES — ne jamais réinventer :
  import { PageHeader, ConfirmDialog, EmptyState, LoadingSkeleton } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'

  - AppShell      : wrapper racine — toujours présent
  - PageContainer : wrapper de contenu (maxWidth selon page)
  - PageHeader    : TOUT titre de page + action principale — jamais Box+Typography custom
  - ConfirmDialog : TOUTE suppression — jamais de dialog MUI inline custom
  - EmptyState    : TOUTE liste vide — jamais de Typography inline
  - LoadingSkeleton : TOUT état de chargement — jamais de CircularProgress spinner

Composants F-03 OBLIGATOIRES — si applicable :
  import { DimensionTagInput, TagChipList } from '@/components/tags'
  - DimensionTagInput : édition tags en formulaire
  - TagChipList      : affichage tags (liste, drawer, détail) avec deduplicateByDepth()

JWT : token en mémoire uniquement — jamais sessionStorage / localStorage
Routing : react-router-dom v6, navigate() depuis useNavigate()
Câblage App.tsx : déjà réalisé manuellement — ne pas générer

Spécificités FS-05-FRONT :
- Side Drawer PNS-02 : clic sur ligne (hors nom) → drawer read-only
- Chip isSourceOfTruth : color=success (success 'Source officielle') ou default ('Non')
- Autocomplete type : freeSolo avec suggestions [database, dataset, file]
- Colonne role : afficher role (consumer/producer/owner) dans Applications liées
- Filtres ListPage : search (debounce 300ms) + filterType (dropdown) + filterSourceOfTruth (dropdown Tous/Oui/Non)
  → Nécessite amendements A+B backend (query params + champ role)

Pattern de référence frontend : module IT Components (FS-04-FRONT) — s'y conformer.

Respecte impérativement le Layout Contract §4 de cette spec :
- Composant F-01 exact par zone
- Clé i18n exacte par label
- Condition RBAC exacte par action

Implémente la feature "Data Objects" frontend (FS-05-FRONT).
Génère : pages React (4), DataObjectForm, data-objects.utils.ts, data-object.ts, tests Cypress nominaux.
Ne génère PAS le câblage App.tsx — déjà fait manuellement.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-05-FRONT.md ICI]
[COLLER LE CONTENU DE FS-05-BACK §3 (Contrat API OpenAPI) ICI]
```

---

## 12. Checklist de Validation Frontend

> À compléter après génération OpenCode, avant de passer FS-05-FRONT à `done`.

- [ ] Les 4 routes `/data-objects/*` fonctionnent depuis App.tsx
- [ ] `PageHeader` utilisé sur toutes les pages — aucun Box+Typography en remplacement
- [ ] `ConfirmDialog` utilisé pour la suppression — aucun dialog inline
- [ ] `EmptyState` affiché sur liste vide
- [ ] `LoadingSkeleton` affiché pendant les appels API
- [ ] Bouton Add masqué si pas `data-objects:write`
- [ ] Colonne Actions masquée si pas `data-objects:write`
- [ ] Bouton Edit disabled sur DetailPage/Drawer si pas `data-objects:write`
- [ ] Chip isSourceOfTruth affiché partout (liste, drawer, détail, formulaire)
- [ ] Autocomplete type fonctionne avec freeSolo + suggestions
- [ ] Colonne role affichée dans l'onglet Applications (drawer + détail)
- [ ] Tri des colonnes fonctionnel — nulls en dernier
- [ ] Filtres type + isSourceOfTruth fonctiels
- [ ] Snackbar succès après create / update / delete
- [ ] Drawer se ferme sur Escape + close button
- [ ] Aucune string en dur dans les composants (`grep '"[A-Z]' src/pages/data-objects/`)
- [ ] Aucune erreur TypeScript strict
- [ ] Tests Cypress nominaux passent

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

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | Sprint 3 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | *(à compléter)* |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(à compléter)* |
| **NFR mis à jour** | *(à compléter)* |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | ✅ TD-1 / ✅ TD-2 / ✅ TD-3 / ✅ TD-4 / ✅ TD-5 / ✅ TD-6 |

---

_FS-05-FRONT v0.1 — ARK_
