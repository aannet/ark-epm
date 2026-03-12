# ARK — Feature Spec FS-02-FRONT : Domains (Frontend)

_Version 1.6 — Mars 2026_

> **Changelog v1.6 (PNS-02 Side Drawer) :**
>
> - Implémentation du Side Drawer readonly pour la vue liste (PNS-02)
> - Modification comportement clic ligne : navigate → open drawer
> - Ajout composant `DomainDrawer.tsx` (read-only, 400px, anchor right)
> - Layout Contract §3.1 : ajout zone `drawer` + modification `row_click`
> - Tests Cypress §9 : nouveaux cas de test drawer
> - i18n : ajout clés `domains.drawer.*`

> **Changelog v1.5 (Alignement F-03 v0.4) :**
>
> - §3.1 `DomainsListPage` : ajout colonne `tags` avec `TagChipList` mode liste (`maxVisible=3`) + `deduplicateByDepth()` appliqué avant rendu
> - §3.2 `DomainDetailPage` : zone `tags` précisée — `TagChipList` mode drawer avec `deduplicateByDepth()` + dimensions vides masquées
> - §3.3 / §3.4 `DomainForm` : note explicite — `DimensionTagInput` n'applique **pas** `deduplicateByDepth()` (mode édition, réalité des données)
> - §4 Composants : clarification des imports — `DimensionTagInput` pour l'édition, `TagChipList` pour la lecture
> - §6 Règles Métier : ajout RM-12 (séparation lecture/édition des tags)
> - §8 Session Gate : ajout gate `TagChipList` exporté depuis `@/components/tags`
> - §9 Tests Cypress : ajout 3 cas de test déduplication et masquage dimensions vides
> - §10 Commande OpenCode : imports mis à jour, note déduplication

> **Changelog v1.4 :**
>
> - Ajout dépendance F-03 (Dimension Tags Foundation)
> - DomainForm : ajout champ `comment` et composant `DimensionTagInput`
> - Layout Contract : ajout zone `tags` sur toutes les pages
> - i18n : ajout clés `domains.form.commentLabel` et tags
> - Conformité NFR-GOV-005 (champs socle + liaison tags)

> **Changelog v1.3 (Delta Fixes) :**
>
> - Implémentation complète du système ArkAlert manquant
> - Correction i18n : `domains.snackbar.*` → `domains.alert.*` + ajout `domains.alert.errors.*`
> - Ajout `resolveAlertMessage` dans domain.utils.ts
> - Pages : navigation avec state alert, affichage ArkAlert sur toutes les pages
> - 409 DEPENDENCY_CONFLICT : message formaté + bouton confirmer désactivé

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-02-FRONT |
| **Titre** | Domains — Pages React (Liste / Détail / New / Edit) |
| **Priorité** | P1 |
| **Statut** | `done` |
| **Dépend de** | FS-01, F-02, **FS-02-BACK** (gate bloquante), **F-03** |
| **Estimé** | 1 jour |
| **Version** | 1.6 |

---

## 1. Objectif

Implémenter les pages React pour la gestion des Domaines : liste, détail, création, modification, suppression. Ce module est le **patron de référence frontend** pour tous les modules suivants (FS-03 à FS-11), y compris le système de feedback `ArkAlert`.

---

## 2. Référence Contrat API

Le contrat API complet est défini dans **FS-02-BACK §3**. Ne pas le redéfinir ici.

| Méthode | Route | Permission |
|---------|-------|------------|
| `GET` | `/api/v1/domains` | `domains:read` |
| `POST` | `/api/v1/domains` | `domains:write` |
| `GET` | `/api/v1/domains/:id` | `domains:read` |
| `PATCH` | `/api/v1/domains/:id` | `domains:write` |
| `DELETE` | `/api/v1/domains/:id` | `domains:write` |

Codes HTTP à gérer côté frontend :

| Code | Contexte | Action frontend |
|------|----------|-----------------|
| `200` / `201` | Succès | Navigate + Alert success (voir §3 zones `alerts`) |
| `400` | Validation | Erreur **inline** sur le champ name |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |
| `404` | Ressource introuvable | `navigate('/domains')` |
| `409` `CONFLICT` | Nom dupliqué | Erreur **inline** `t('domains.form.nameDuplicate')` |
| `409` `DEPENDENCY_CONFLICT` | Suppression bloquée | Message dans `ConfirmDialog` via `format409Message()` |
| `5xx` | Erreur serveur | Alert **error** `t('domains.alert.errors.serverError')` |

---

## 2.5 User Stories — Interactions Liste/Drawer (PNS-02)

### US-01 — Consultation Rapide
**En tant qu'utilisateur**, je veux cliquer sur le corps d'une ligne du tableau (hors nom) pour ouvrir un Side Drawer, afin de consulter les métadonnées du domaine sans perdre ma position dans la liste ni mes filtres actifs.

**Critères d'acceptation:**
- Clic sur Description, Tags, Date ou Actions → ouvre le drawer
- Drawer s'affiche depuis la droite (400px)
- État de la liste préservé (scroll, filtres)

### US-02 — Accès Direct Détail
**En tant qu'utilisateur**, je veux cliquer sur le nom du domaine (lien hypertexte souligné) pour naviguer directement vers la Page Détail complète.

**Critères d'acceptation:**
- Nom affiché comme lien souligné (couleur texte normale, primaire au hover)
- Clic sur nom → navigation immédiate vers `/domains/:id`
- Le clic sur le nom ne déclenche pas l'ouverture du drawer (stopPropagation)

### US-03 — Transition Drawer vers Détail
**En tant qu'utilisateur**, je veux trouver un bouton "Voir la fiche complète" dans le footer du Side Drawer.

**Critères d'acceptation:**
- Bouton positionné à droite dans le footer
- Variant "outlined"
- Navigation vers `/domains/:id` au clic

### US-04 — Transition Drawer vers Édition
**En tant qu'utilisateur**, je veux trouver un bouton "Modifier" dans le footer du Side Drawer.

**Critères d'acceptation:**
- Bouton positionné à gauche dans le footer (avant "Voir fiche")
- Variant "contained"
- **Grisé (disabled)** si l'utilisateur n'a pas la permission `domains:write`
- Navigation vers `/domains/:id/edit` au clic (si autorisé)

### US-05 — Fermeture Drawer
**En tant qu'utilisateur**, je veux trouver une croix grise dans le coin haut droit du drawer.

**Critères d'acceptation:**
- IconButton avec CloseIcon
- Couleur `text.secondary` (gris)
- Positionné à droite du titre
- Ferme le drawer au clic
- Le backdrop click et Escape key ferment aussi le drawer

---

## 3. Layout Contract

### 3.1 `DomainsListPage`

```yaml
page: DomainsListPage
route: /domains
auth_required: true
permission_required: domains:read

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  header:
    component: PageHeader
    props:
      title: t('domains.list.title')
      subtitle: t('domains.list.subtitle')
      action:
        condition: hasPermission('domains:write')
        label: t('domains.list.addButton')
        onClick: navigate('/domains/new')
        icon: AddIcon

  alerts:
    - trigger: location.state?.alert
      component: ArkAlert
      position: sous PageHeader, au-dessus du tableau
      auto_dismiss: 5000ms
      on_mount: window.history.replaceState({}, '')

  body:
    component: MUI Table avec TableSortLabel
    loading_state: LoadingSkeleton
    empty_state: EmptyState
    empty_state_props:
      title: t('domains.list.emptyState.title')
      description: t('domains.list.emptyState.description')
      action:
        condition: hasPermission('domains:write')
        label: t('domains.list.emptyState.cta')
        onClick: navigate('/domains/new')
    row_click:
      action: open DomainDrawer (toutes cellules sauf 'name')
      handler: setSelectedDomainId(row.id)
      condition: clic hors cellule name
      preserve_state: [filters, scroll_position]
    columns:
      - field: name
        header: t('domains.list.columns.name')
        sortable: true
        component: Link (react-router-dom)
        component_props:
          to: '/domains/${row.id}'
          underline: always
          color: inherit  # texte normal
          hover_color: primary
        onClick: navigate('/domains/${row.id}')  # Navigation directe
        behavior: stopPropagation pour éviter d'ouvrir le drawer
      - field: description
        header: t('domains.list.columns.description')
        sortable: true
        sort_null_behavior: null values last
      - field: tags
        header: t('domains.list.columns.tags')
        sortable: false
        component: TagChipList
        component_props:
          tags: deduplicateByDepth(row.tags)   # RM-11 F-03 — déduplication avant rendu
          maxVisible: 3                         # badge "+X" si plus de 3 chips
          size: small
        # Note : deduplicateByDepth() importé depuis @/components/tags/DimensionTagInput.utils
        # La fonction reçoit row.tags (toutes dimensions confondues) — elle opère par dimension
      - field: createdAt
        header: t('domains.list.columns.createdAt')
        sortable: true
        format: date locale FR
      - field: actions
        header: t('domains.list.columns.actions')
        condition: hasPermission('domains:write')
        row_actions:
          - type: edit
            icon: EditIcon
            aria_label: t('common.actions.edit')
            onClick: navigate('/domains/${row.id}/edit')
          - type: delete
            icon: DeleteIcon
            aria_label: t('common.actions.delete')
            onClick: open confirm-delete dialog

  drawer:
    component: DomainDrawer
    trigger: clic sur corps de ligne (hors cellule name)
    props:
      domainId: string | null  # null = drawer fermé
      open: boolean
      onClose: () => void
    behavior:
      - GET /api/v1/domains/:id via useDomain() hook (avec enabled: !!domainId)
      - Affichage skeleton pendant chargement
      - Fermeture: bouton X (gris), backdrop click, Escape key
    layout:
      width: 400px
      anchor: right
      variant: temporary
    sections:
      header:
        layout: flex row, justify-content: space-between
        elements:
          - title: Typography h6 (nom du domaine), word-break: break-word
          - close_button:
              icon: CloseIcon
              color: text.secondary (gris)
              aria-label: t('domains.drawer.close')
              onClick: close drawer
      content:
        - Informations: Nom, Description, Commentaire (read-only)
        - Tags: Chips via TagChipList mode drawer (maxVisible: 10 + "Voir plus")
        - Métadonnées: Créé le, Modifié le (read-only)
      footer:
        layout: flex row, justify-content: flex-end, gap: 2
        buttons:
          - label: t('domains.drawer.edit')
            variant: contained
            onClick: navigate('/domains/${domainId}/edit')
            state:
              - disabled: !hasPermission('domains:write')  # grisé si pas permission
          - label: t('domains.drawer.viewFullDetails')
            variant: outlined
            onClick: navigate('/domains/${domainId}')
    permissions:
      - Tous les utilisateurs: drawer accessible (read-only)
      - Bouton Edit grisé (disabled) si pas de permission domains:write

  sort_state:
    default_field: name
    default_order: asc
    scope: client-side

  dialogs:
    - id: confirm-delete
      component: ConfirmDialog
      trigger: delete IconButton click
      props:
        title: t('domains.delete.confirmTitle')
        message: t('domains.delete.confirmMessage', { name: row.name })
        confirmLabel: t('common.actions.delete')
        severity: error
      on_confirm: DELETE /api/v1/domains/:id
      on_success:
        navigate: navigate('/domains', { state: { alert: { severity: 'success', message: t('domains.alert.deleted') } } })
      on_409_DEPENDENCY_CONFLICT:
        message: format409Message(t, appCount, bcCount)
        confirm_button: masqué ou désactivé
      on_5xx:
        alert: severity=error message=t('domains.alert.errors.serverError')
```

---

### 3.2 `DomainDetailPage`

```yaml
page: DomainDetailPage
route: /domains/:id
auth_required: true
permission_required: domains:read

on_load:
  action: GET /api/v1/domains/:id
  on_404: navigate('/domains')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: md

zones:
  header:
    component: PageHeader
    props:
      title: domain.name
      action:
        condition: hasPermission('domains:write')
        label: t('domains.detail.editButton')
        onClick: navigate('/domains/${domain.id}/edit')
        icon: EditIcon

  alerts:
    - trigger: location.state?.alert
      component: ArkAlert
      position: sous PageHeader
      auto_dismiss: 5000ms
      on_mount: window.history.replaceState({}, '')

  body:
    loading_state: LoadingSkeleton
    fields:
      - label: t('domains.list.columns.name')
        value: domain.name
      - label: t('domains.list.columns.description')
        value: domain.description ?? t('domains.detail.noDescription')
      - label: t('domains.list.columns.comment')
        value: domain.comment ?? t('domains.detail.noComment')
      - label: t('domains.list.columns.createdAt')
        value: domain.createdAt formaté date locale FR
      - label: t('domains.list.columns.tags')
        component: TagChipList
        component_props:
          tags: deduplicateByDepth(domain.tags)   # RM-11 F-03 — déduplication avant rendu
          maxVisible: undefined                    # mode drawer — tous les chips affichés
          size: small
        # Comportement TagChipList mode drawer :
        # - Regroupement par dimensionId — label dimension en Typography variant="caption"
        # - flexWrap: 'wrap' — tous les chips visibles
        # - Dimensions sans tags masquées (RM-10 F-03) — le filtrage est fait sur deduplicateByDepth(domain.tags)
        # - Tooltip path complet sur chaque chip (t('tags.tooltip.fullPath'))
        # - Chips colorés via alpha(dimensionColor, 0.12)

  footer:
    - component: MUI Button
      props:
        variant: outlined
        label: t('domains.detail.backButton')
        onClick: navigate('/domains')
```

---

### 3.3 `DomainNewPage`

```yaml
page: DomainNewPage
route: /domains/new
auth_required: true
permission_required: domains:write

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  header:
    component: PageHeader
    props:
      title: t('domains.form.createTitle')
      action: null

  alerts:
    - trigger: submitError state (local)
      component: ArkAlert
      severity: error
      position: sous PageHeader, au-dessus du formulaire
      auto_dismiss: false
      message: resolveAlertMessage(t, status, code)

  body:
    component: DomainForm
    props:
      initialValues: { name: '', description: '', comment: '', tags: [] }
      isLoading: false
      onCancel: navigate('/domains')
      onSubmit: POST /api/v1/domains
      availableDimensions: ['Geography', 'Brand', 'LegalEntity']  # From F-03 seed
    # Note DimensionTagInput (mode édition) :
    # deduplicateByDepth() N'EST PAS appliquée ici — l'utilisateur voit la réalité des données.
    # Si l'utilisateur a posé [France] et [Paris], les deux chips sont affichés dans l'input.
    # L'incohérence visuelle avec le drawer (1 chip) est intentionnelle (F-03 RM-11).

  on_submit_success:
    - POST /api/v1/domains → get domainId
    - PUT /tags/entity/domain/{domainId} with collected tags (from form state)
    - navigate('/domains/${domainId}', { state: { alert: { severity: 'success', message: t('domains.alert.created') } } })

  on_submit_409_CONFLICT:
    action: erreur inline sur le champ name
    message: t('domains.form.nameDuplicate')

  on_submit_400:
    action: erreur inline sur le champ name
    message: t('domains.form.nameRequired')

  on_submit_5xx:
    action: afficher ArkAlert error au-dessus du formulaire (état local)
    message: t('domains.alert.errors.serverError')
```

---

### 3.4 `DomainEditPage`

```yaml
page: DomainEditPage
route: /domains/:id/edit
auth_required: true
permission_required: domains:write

on_load:
  action: GET /api/v1/domains/:id
  on_404: navigate('/domains')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  header:
    component: PageHeader
    props:
      title: t('domains.form.editTitle')
      action: null

  alerts:
    - trigger: submitError state (local)
      component: ArkAlert
      severity: error
      position: sous PageHeader, au-dessus du formulaire
      auto_dismiss: false
      message: resolveAlertMessage(t, status, code)

  body:
    loading_state: LoadingSkeleton
    component: DomainForm
    props:
      initialValues: { name: domain.name, description: domain.description ?? '', comment: domain.comment ?? '', tags: domain.tags }
      isLoading: false
      onCancel: navigate('/domains/${id}')
      onSubmit: PATCH /api/v1/domains/:id
      availableDimensions: ['Geography', 'Brand', 'LegalEntity']  # From F-03 seed
    # Note DimensionTagInput (mode édition) :
    # deduplicateByDepth() N'EST PAS appliquée ici — domain.tags est passé tel quel à DimensionTagInput.
    # L'utilisateur voit et peut supprimer explicitement chaque tag posé, y compris les ancêtres.
    # Ne pas filtrer les tags avant de les passer à initialValues.

  on_submit_success:
    navigate: navigate('/domains/${id}', { state: { alert: { severity: 'success', message: t('domains.alert.updated') } } })

  on_submit_409_CONFLICT:
    action: erreur inline sur le champ name
    message: t('domains.form.nameDuplicate')

  on_submit_5xx:
    action: afficher ArkAlert error au-dessus du formulaire (état local)
    message: t('domains.alert.errors.serverError')
```

---

## 4. Composants à Générer

### Structure de fichiers

```
frontend/src/
├── pages/
│   └── domains/
│       ├── DomainsListPage.tsx
│       ├── DomainNewPage.tsx
│       ├── DomainDetailPage.tsx
│       └── DomainEditPage.tsx
├── components/
│   ├── domains/
│   │   ├── DomainForm.tsx
│   │   └── DomainDrawer.tsx      # NEW — PNS-02 Side Drawer read-only
│   │   └── index.ts              # NEW — export { DomainForm, DomainDrawer }
│   └── shared/
│       └── ArkAlert.tsx
├── utils/
│   └── domain.utils.ts           ← format409Message() + resolveAlertMessage()
└── types/
    └── domain.ts
```

**Composants F-03 consommés (déjà générés par F-03, NE PAS régénérer) :**

```
frontend/src/components/tags/
├── DimensionTagInput.tsx          ← édition uniquement — pas de deduplicateByDepth()
├── DimensionTagInput.utils.ts     ← contient deduplicateByDepth() — importer depuis ici
├── TagChipList.tsx                ← lecture seule — appelle deduplicateByDepth() en interne
└── index.ts                       ← export { DimensionTagInput, TagChipList }
```

> ⚠️ `deduplicateByDepth()` est définie dans `DimensionTagInput.utils.ts` et appelée **en interne** par `TagChipList` avant chaque rendu. Les pages et composants hôtes n'ont pas à l'appeler eux-mêmes — passer `domain.tags` brut à `TagChipList` suffit. La notation `deduplicateByDepth(row.tags)` dans le Layout Contract §3 est illustrative du comportement interne de `TagChipList`, pas un appel explicite à faire dans les pages.

### Règle d'import par contexte

| Contexte | Composant à utiliser | `deduplicateByDepth()` |
|----------|---------------------|------------------------|
| Formulaire (création / édition) | `DimensionTagInput` | ❌ Non appliquée |
| Colonne liste (tableau) | `TagChipList` (`maxVisible=3`) | ✅ Appliquée en interne |
| Vue détail / drawer | `TagChipList` (`maxVisible=undefined`) | ✅ Appliquée en interne |

### DomainForm Props

```typescript
interface DomainFormProps {
  initialValues?: Partial<DomainFormValues>;
  onSubmit: (values: DomainFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  availableDimensions?: string[];  // ['Geography', 'Brand', 'LegalEntity']
}

interface DomainFormValues {
  name: string;
  description: string;
  comment: string;
  tags: TagValueResponse[];   // tags bruts — pas de déduplication en édition (RM-12)
}

interface DomainResponse {
  id: string;
  name: string;
  description: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  tags: EntityTagResponse[];  // tous les entity_tags — sans filtrage backend (FS-02-BACK §5.1)
}
```

### ArkAlert Props

```typescript
interface ArkAlertProps {
  severity: 'success' | 'error' | 'warning' | 'info';
  message: string;
  open: boolean;
  onClose: () => void;
  autoDismiss?: number;
}
```

---

## 4.1 DimensionTagInput Integration (F-03)

Tous les formulaires de domaine utilisent `DimensionTagInput` depuis F-03 §6.

```typescript
// In DomainForm.tsx
import { DimensionTagInput } from '@/components/tags';
// ⚠️ NE PAS importer TagChipList dans DomainForm — réservé aux vues lecture

// Usage — Geography dimension (mode édition, pas de déduplication)
<DimensionTagInput
  dimensionId="uuid-geography"
  dimensionName="Geography"
  dimensionColor="#2196F3"
  entityType="domain"
  entityId={domainId}    // undefined en mode création
  value={values.tags.filter(t => t.dimensionName === 'Geography')}
  onChange={(tags) => setFieldValue('tags', [
    ...values.tags.filter(t => t.dimensionName !== 'Geography'),
    ...tags
  ])}
  multiple={true}
/>
```

**Comportement sur create :** Tags stockés en state local → sauvegardés via `PUT /tags/entity/domain/{id}` après le POST du domaine.

**Comportement sur edit :** Chaque `onChange` déclenche immédiatement `PUT /tags/entity/domain/{id}`.

---

## 5. Clés i18n — Section `domains` dans `fr.json` ⚠️

> À ajouter **manuellement** dans `src/i18n/locales/fr.json` avant la session OpenCode.

```json
"domains": {
  "list": {
    "title": "Domaines",
    "subtitle": "Gestion des domaines métier",
    "addButton": "Ajouter un domaine",
    "columns": {
      "name": "Nom",
      "description": "Description",
      "comment": "Commentaire",
      "createdAt": "Créé le",
      "tags": "Tags",
      "actions": "Actions"
    },
    "emptyState": {
      "title": "Aucun domaine créé",
      "description": "Commencez par créer votre premier domaine.",
      "cta": "Créer votre premier domaine"
    }
  },
  "detail": {
    "noDescription": "—",
    "noComment": "Aucun commentaire",
    "editButton": "Modifier",
    "backButton": "Retour"
  },
  "form": {
    "createTitle": "Nouveau domaine",
    "editTitle": "Modifier le domaine",
    "nameLabel": "Nom",
    "descriptionLabel": "Description",
    "commentLabel": "Commentaire interne",
    "tagsLabel": "Tags",
    "saveButton": "Enregistrer",
    "cancelButton": "Annuler",
    "nameRequired": "Le nom est obligatoire",
    "nameDuplicate": "Ce nom de domaine est déjà utilisé"
  },
  "delete": {
    "confirmTitle": "Supprimer le domaine",
    "confirmMessage": "Êtes-vous sûr de vouloir supprimer le domaine \"{{name}}\" ?",
    "blockedMessage": "Ce domaine est utilisé par {{apps}} application(s) et {{bcs}} capacité(s) métier et ne peut pas être supprimé"
  },
  "alert": {
    "created": "Domaine créé avec succès",
    "updated": "Domaine mis à jour avec succès",
    "deleted": "Domaine supprimé avec succès",
    "errors": {
      "serverError": "Une erreur serveur est survenue. Veuillez réessayer.",
      "notFound": "Ce domaine n'existe plus.",
      "unknown": "Une erreur inattendue est survenue."
    }
  }
}
```

---

## 6. Règles Métier Frontend

- **RM-06 — Masquage conditionnel des actions d'écriture :**

  ```typescript
  const canWrite = hasPermission('domains:write');
  ```

- **RM-07 — Formatage des messages 409 DEPENDENCY_CONFLICT :**

  ```typescript
  export function format409Message(t: TFunction, appCount: number, bcCount: number): string {
    return t('domains.delete.blockedMessage', { apps: appCount, bcs: bcCount });
  }
  ```

- **RM-08 — Tri des colonnes côté client :**

  ```typescript
  type SortField = 'name' | 'description' | 'createdAt';
  type SortOrder = 'asc' | 'desc';
  ```

  Valeurs `null` sur `description` classées **en dernier** quelle que soit la direction.

- **RM-09 — Résolution des messages d'erreur par code HTTP :**

  ```typescript
  export function resolveAlertMessage(t: TFunction, status: number, code?: string): string {
    if (status === 404)   return t('domains.alert.errors.notFound');
    if (status >= 500)    return t('domains.alert.errors.serverError');
    return t('domains.alert.errors.unknown');
  }
  // 400 et 409 CONFLICT → inline sur le champ name, PAS via cette fonction
  ```

- **RM-10 — Comportement post-suppression :**

  Après `DELETE` réussi → toujours `navigate('/domains', { state: { alert: ... } })`. Ne jamais rester sur la page courante.

- **RM-11 — Cycle de vie des alertes :**

  | Type | Déclencheur | Transport | Auto-dismiss | Comportement |
  |------|-------------|-----------|--------------|--------------|
  | Success (create) | POST 201 | navigation state | 5000ms | Affiché sur `DomainDetailPage` |
  | Success (update) | PATCH 200 | navigation state | 5000ms | Affiché sur `DomainDetailPage` |
  | Success (delete) | DELETE 204 | navigation state | 5000ms | Affiché sur `DomainsListPage` |
  | Error (5xx) | any 5xx | useState local | aucun | Affiché sur la page courante, reste jusqu'à navigation |
  | Error (409 DEPENDENCY_CONFLICT) | DELETE 409 | dans ConfirmDialog | aucun | Remplace le message du dialog |
  | Inline (400 / 409 CONFLICT) | POST/PATCH 4xx | prop `error` du DomainForm | aucun | Sous le champ name, pas dans ArkAlert |

- **RM-12 — Séparation lecture / édition des tags (F-03 RM-11) :**

  > Cette règle est critique pour la cohérence avec F-03. Ne pas la contourner.

  - **Mode lecture** (`DomainsListPage` colonne tags, `DomainDetailPage`) → `TagChipList` — `deduplicateByDepth()` appliquée **en interne** par le composant. Passer `domain.tags` brut.
  - **Mode édition** (`DomainForm` via `DimensionTagInput`) → `deduplicateByDepth()` **non appliquée**. L'utilisateur voit la réalité des données stockées (`entity_tags`). Si `[France]` et `[Paris]` sont tous deux posés, les deux chips sont affichés.
  - L'incohérence visuelle entre le drawer (1 chip dédupliqué) et la Full Page (2 chips réels) est **intentionnelle** — documentée dans F-03 §6.

---

## 7. Câblage App.tsx — Manuel ⚠️

> À réaliser **manuellement** avant de lancer la session OpenCode.

```typescript
// Lecture : token requis
<Route path="/domains" element={<PrivateRoute />}>
  <Route index element={<DomainsListPage />} />
  <Route path=":id" element={<DomainDetailPage />} />
</Route>

// Écriture : token + permission domains:write
<Route path="/domains" element={<PrivateRoute permission="domains:write" />}>
  <Route path="new" element={<DomainNewPage />} />
  <Route path=":id/edit" element={<DomainEditPage />} />
</Route>
```

---

## 8. Session Gate — Frontend ⚠️

- [ ] **FS-02-BACK au statut `done`** — gates G-01 à G-09 toutes cochées
- [ ] **F-03 au statut `done`** — `DimensionTagInput`, `TagChipList` et API tags disponibles
- [ ] **`TagChipList` exporté depuis `@/components/tags`** (F-03) — vérifié dans `index.ts`
- [ ] **`deduplicateByDepth()` exportée depuis `@/components/tags/DimensionTagInput.utils`** (F-03)
- [ ] **API testée manuellement** — `GET /api/v1/domains/:id` retourne `depth` et `dimensionColor` dans les tags
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **Clés `domains.*` ajoutées dans `fr.json`** — y compris `domains.alert.*`, `domains.form.commentLabel`, `domains.form.tagsLabel`
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01)
- [ ] **Câblage `App.tsx` réalisé manuellement** (§7)
- [ ] **`cy.loginAsReadOnly()`** créé dans `cypress/support/commands.ts`
- [ ] **Cypress opérationnel**
- [ ] **Layout Contract §3 relu** — zones `tags` précisées sur chaque page avec le bon mode `TagChipList`
- [ ] **FS-02-FRONT passé au statut `stable`** avant de lancer OpenCode

---

## 9. Tests Cypress — E2E Browser

> Assertions sur les valeurs FR de `fr.json` — jamais sur les clés.

### Parcours nominaux

- [ ] `[Cypress]` `DomainsListPage` affiche la liste après login
- [ ] `[Cypress]` `DomainsListPage` affiche l'`EmptyState` si aucun domaine
- [ ] `[Cypress]` Tri par défaut sur `name` ascendant
- [ ] `[Cypress]` Clic sur en-tête "Nom" inverse le tri
- [ ] `[Cypress]` Clic sur en-tête "Créé le" trie par date croissante
- [ ] `[Cypress]` Clic sur une ligne → ouvre DomainDrawer (pas de navigation)
- [ ] `[Cypress]` DomainDrawer affiche nom, description, tags, dates (read-only)
- [ ] `[Cypress]` DomainDrawer affiche skeleton pendant chargement
- [ ] `[Cypress]` Clic bouton "Voir la fiche complète" dans drawer → navigate vers `/domains/:id`
- [ ] `[Cypress]` Clic bouton X ou backdrop → drawer fermé, reste sur liste
- [ ] `[Cypress]` Touche Escape → drawer fermé
- [ ] `[Cypress]` DomainDrawer accessible pour tous les rôles (read-only)
- [ ] `[Cypress]` `DomainDetailPage` affiche nom, description et date
- [ ] `[Cypress]` Créer un domaine → redirect vers `/domains/<new-id>` + Alert success contenant "Domaine créé avec succès"
- [ ] `[Cypress]` Alert success disparaît automatiquement après 5 secondes
- [ ] `[Cypress]` Alert success ne réapparaît pas après refresh de la page
- [ ] `[Cypress]` Cancel sur `DomainNewPage` → redirect vers `/domains`, pas d'Alert
- [ ] `[Cypress]` Modifier un domaine → redirect vers `/domains/:id` + Alert success contenant "Domaine mis à jour avec succès"
- [ ] `[Cypress]` Cancel sur `DomainEditPage` → redirect vers `/domains/:id`, pas d'Alert
- [ ] `[Cypress]` Supprimer un domaine sans entités liées → redirect vers `/domains` + Alert success contenant "Domaine supprimé avec succès" + domaine absent de la liste
- [ ] `[Cypress]` Cancel suppression → dialog fermé, domaine toujours présent, pas d'Alert

### Tags — rendu et déduplication (F-03 v0.4)

- [ ] `[Cypress]` `DomainsListPage` — domaine avec 5 tags → colonne "Tags" affiche 3 chips + badge "+2"
- [ ] `[Cypress]` `DomainsListPage` — domaine avec tags ancêtre (`europe/france`) ET descendant (`europe/france/paris`) tous deux posés → colonne "Tags" affiche uniquement `Paris` (déduplication `deduplicateByDepth()`)
- [ ] `[Cypress]` `DomainDetailPage` — domaine avec tags ancêtre + descendant → section Tags affiche uniquement le descendant (déduplication en mode drawer)
- [ ] `[Cypress]` `DomainDetailPage` — dimension sans tags (ex : LegalEntity vide) → section de cette dimension absente du drawer
- [ ] `[Cypress]` `DomainEditPage` — domaine avec tags ancêtre + descendant → `DimensionTagInput` affiche les **deux** chips (pas de déduplication en mode édition)

### Parcours d'erreur

- [ ] `[Cypress]` Créer avec nom dupliqué → erreur inline sous le champ "Nom", **aucune Alert visible**
- [ ] `[Cypress]` Créer sans nom → erreur inline sous le champ "Nom", aucune Alert
- [ ] `[Cypress]` Créer avec nom uniquement espaces → erreur inline sous le champ "Nom"
- [ ] `[Cypress]` Modifier avec nom dupliqué → erreur inline sous le champ "Nom", **aucune Alert visible**
- [ ] `[Cypress]` Supprimer un domaine lié → message formaté visible dans le `ConfirmDialog` (contient "application(s)" et "capacité(s)"), bouton Confirmer absent ou désactivé
- [ ] `[Cypress]` Erreur 500 simulée sur création → Alert error contenant "Une erreur serveur est survenue" visible au-dessus du formulaire, formulaire toujours affiché
- [ ] `[Cypress]` Alert error sur 500 ne disparaît pas automatiquement
- [ ] `[Cypress]` `DomainEditPage` UUID inexistant → redirect vers `/domains`
- [ ] `[Cypress]` `DomainDetailPage` UUID inexistant → redirect vers `/domains`

### Droits UI

- [ ] `[Cypress]` Sans `domains:write` sur `DomainsListPage` → bouton "Ajouter un domaine" absent
- [ ] `[Cypress]` Sans `domains:write` sur `DomainsListPage` → colonne "Actions" absente
- [ ] `[Cypress]` Sans `domains:write` sur `DomainDetailPage` → bouton "Modifier" absent
- [ ] `[Manuel]` Sans `domains:write` → `/domains/new` redirige vers `/403`
- [ ] `[Manuel]` Sans `domains:write` → `/domains/:id/edit` redirige vers `/403`

---

## 10. Commande OpenCode — Frontend

```
Contexte projet ARK — Session Frontend FS-02-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v5 + react-i18next
Règles MUI obligatoires :
- MUI v5 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement
- Pas de MUI X DataGrid — MUI Table + TableSortLabel

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur
- Clés domains.* présentes dans fr.json — y compris domains.alert.* et domains.form.commentLabel
- Clés domains.snackbar.* supprimées — utiliser domains.alert.* uniquement

RBAC : hasPermission() importé depuis @/store/auth

Composants F-01 OBLIGATOIRES :
  import { PageHeader, ConfirmDialog, EmptyState, LoadingSkeleton } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'

Composants F-03 OBLIGATOIRES (déjà générés — NE PAS régénérer) :
  import { DimensionTagInput, TagChipList } from '@/components/tags'
  import { deduplicateByDepth } from '@/components/tags/DimensionTagInput.utils'

  Règle d'usage CRITIQUE (RM-12) :
  - DimensionTagInput  → formulaires uniquement (création / édition) — PAS de deduplicateByDepth()
  - TagChipList        → vues lecture uniquement (liste, détail/drawer) — deduplicateByDepth() appliquée EN INTERNE par TagChipList, ne pas l'appeler explicitement dans les pages
  - TagChipList mode liste   : maxVisible=3, size="small"
  - TagChipList mode drawer  : maxVisible=undefined (tous les chips), regroupement par dimension

Nouveau composant à générer dans cette session :
  src/components/shared/ArkAlert.tsx
  - Encapsule MUI Snackbar + Alert
  - anchorOrigin : { vertical: 'top', horizontal: 'center' }
  - Props : severity, message, open, onClose, autoDismiss? (ms)

Gestion des alertes (RM-11) :
  Success → navigate state
  Error 5xx → useState local, pas d'auto-dismiss
  Inline (400, 409 CONFLICT) → prop error du DomainForm

Post-suppression (RM-10) :
  DELETE réussi → navigate('/domains', { state: { alert: ... } })

409 DEPENDENCY_CONFLICT dans ConfirmDialog :
  Remplacer le message, masquer ou désactiver le bouton Confirmer

JWT : token en mémoire uniquement
Routing : react-router-dom v6
Câblage App.tsx : déjà réalisé manuellement — ne pas le générer

Génère : 4 pages React, DomainForm, ArkAlert, domain.utils.ts, domain.ts, tests Cypress §9.
Ne génère PAS le câblage App.tsx.
Ne génère PAS les composants tags (DimensionTagInput, TagChipList) — déjà présents via F-03.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-02-FRONT v1.5 ICI]
[COLLER LE CONTENU DE FS-02-BACK §3 (Contrat API OpenAPI) ICI]
```

---

## 11. Checklist de Validation Frontend

- [ ] Alert success affichée après create — "Domaine créé avec succès" sur `DomainDetailPage`
- [ ] Alert success affichée après edit — "Domaine mis à jour avec succès" sur `DomainDetailPage`
- [ ] Alert success affichée après delete — "Domaine supprimé avec succès" sur `DomainsListPage`
- [ ] Suppression réussie → redirect vers `/domains`
- [ ] Alert success auto-dismiss après 5000ms
- [ ] Alert success ne réapparaît pas après refresh
- [ ] Alert error affichée sur 5xx — pas d'auto-dismiss, formulaire reste affiché
- [ ] Erreurs 400 et 409 CONFLICT affichées **inline** sur le champ name
- [ ] 409 DEPENDENCY_CONFLICT affiché dans le `ConfirmDialog` via `format409Message()`
- [ ] `ArkAlert` utilisé systématiquement — aucun Snackbar/Alert inline custom
- [ ] Colonne "Tags" sur `DomainsListPage` — `TagChipList` mode liste, max 3 chips + badge "+X"
- [ ] Déduplication active sur `DomainsListPage` — ancêtre + descendant → seul le descendant affiché
- [ ] Déduplication active sur `DomainDetailPage` — idem, mode drawer
- [ ] Dimensions vides masquées sur `DomainDetailPage` (RM-10 F-03)
- [ ] `DomainEditPage` — `DimensionTagInput` affiche ancêtre ET descendant sans déduplication (RM-12)
- [ ] Bouton "Ajouter un domaine" masqué si pas `domains:write`
- [ ] Colonne "Actions" masquée si pas `domains:write`
- [ ] Bouton "Modifier" masqué sur détail si pas `domains:write`
- [ ] Tri des colonnes fonctionnel — nulls en dernier sur `description`
- [ ] Aucune string en dur dans les composants
- [ ] Aucune erreur TypeScript strict
- [ ] Tests Cypress §9 passent

---

_FS-02-FRONT v1.5 — ARK_