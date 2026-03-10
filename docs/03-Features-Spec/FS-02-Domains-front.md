# ARK — Feature Spec FS-02-FRONT : Domains (Frontend)

_Version 1.3 — Mars 2026_

> **Changelog v1.3 (Delta Fixes) :**
> - Implémentation complète du système ArkAlert manquant
> - Correction i18n : `domains.snackbar.*` → `domains.alert.*` + ajout `domains.alert.errors.*`
> - Ajout `resolveAlertMessage` dans domain.utils.ts
> - Pages : navigation avec state alert, affichage ArkAlert sur toutes les pages
> - 409 DEPENDENCY_CONFLICT : message formaté + bouton confirmer désactivé
> - Tri : null values last sur description
> - Build TypeScript validé
>
> **Changelog v1.4 :**
> - Ajout dépendance F-03 (Dimension Tags Foundation)
> - DomainForm : ajout champ `comment` et composant `DimensionTagInput`
> - Layout Contract : ajout zone `tags` sur toutes les pages
> - i18n : ajout clés `domains.form.commentLabel` et tags
> - Conformité NFR-GOV-005 (champs socle + liaison tags)

> **Changelog v1.2 :**
> - Ajout du système de feedback utilisateur via `MUI Alert` (`Snackbar + Alert`) pour toutes les actions CUD
> - Feedbacks couverts : confirmation d'ajout (success), confirmation d'édition (success), confirmation de suppression (success), affichage d'erreur avec raison (error)
> - Nouveau composant partagé `ArkAlert` — wrapper `MUI Snackbar + Alert`, patron pour tous les modules
> - Ajout clés i18n `domains.alert.*` (succès) et `domains.alert.errors.*` (erreurs typées)
> - Clés `domains.snackbar.*` supprimées — remplacées par `domains.alert.*`
> - Nouvelle RM-09 (résolution des messages d'erreur par code HTTP)
> - Nouvelle RM-10 (comportement post-suppression) : `DELETE` réussi → `navigate('/domains')` + Alert success
> - Nouvelle RM-11 (cycle de vie des alertes) : success via navigation state, error via état local
> - Layout Contract §3 mis à jour : zone `alerts` ajoutée sur toutes les pages
> - Tests Cypress §9 enrichis : assertions sur l'affichage, le contenu et le comportement des alertes

> **Changelog v1.1 :** Layout Contract YAML ajouté (§3). Corrections B1–B5 et A1–A4.

> **Changelog v1.0 :** Création initiale.

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
| **Version** | 1.3 |

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
    # Alert reçue en navigation state depuis New/Edit/Delete
    - trigger: location.state?.alert
      component: ArkAlert
      position: sous PageHeader, au-dessus du tableau
      auto_dismiss: 5000ms
      on_mount: window.history.replaceState({}, '') pour effacer le state

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
    columns:
      - field: name
        header: t('domains.list.columns.name')
        sortable: true
        clickable: navigate('/domains/${row.id}')
      - field: description
        header: t('domains.list.columns.description')
        sortable: true
        sort_null_behavior: null values last
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
        # Remplace le message du dialog — ne ferme PAS le dialog
        message: format409Message(t, appCount, bcCount)
        confirm_button: masqué ou désactivé
      on_5xx:
        # Ferme le dialog, affiche Alert error sur la liste
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
    # Alert reçue en navigation state depuis New ou Edit
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
        value: domain.tags | formatTagsAsChips  # F-03 integration

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
    # Alert error locale — erreur 5xx sur submit
    - trigger: submitError state (local)
      component: ArkAlert
      severity: error
      position: sous PageHeader, au-dessus du formulaire
      auto_dismiss: false   # reste jusqu'à correction ou navigation
      message: resolveAlertMessage(t, status, code) — voir RM-09

  body:
    component: DomainForm
    props:
      initialValues: { name: '', description: '', comment: '', tags: [] }
      isLoading: false
      onCancel: navigate('/domains')
      onSubmit: POST /api/v1/domains
      availableDimensions: ['Geography', 'Brand', 'LegalEntity']  # From F-03 seed

  on_submit_success:
    # After domain created, save tags via F-03 API
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
    # Alert error locale — erreur 5xx sur submit
    - trigger: submitError state (local)
      component: ArkAlert
      severity: error
      position: sous PageHeader, au-dessus du formulaire
      auto_dismiss: false
      message: resolveAlertMessage(t, status, code) — voir RM-09

  body:
    loading_state: LoadingSkeleton
    component: DomainForm
    props:
      initialValues: { name: domain.name, description: domain.description ?? '', comment: domain.comment ?? '', tags: domain.tags }
      isLoading: false
      onCancel: navigate('/domains/${id}')
      onSubmit: PATCH /api/v1/domains/:id
      availableDimensions: ['Geography', 'Brand', 'LegalEntity']  # From F-03 seed

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
│   │   └── DomainForm.tsx
│   └── shared/
│       └── ArkAlert.tsx          ← NOUVEAU — wrapper MUI Snackbar + Alert
├── utils/
│   └── domain.utils.ts           ← format409Message() + resolveAlertMessage()
└── types/
    └── domain.ts
```

### DomainForm Props

```typescript
interface DomainFormProps {
  initialValues?: Partial<DomainFormValues>;
  onSubmit: (values: DomainFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;       // erreur inline champ name (400, 409 CONFLICT)
  availableDimensions?: string[];  // Tag dimension names from F-03
}

interface DomainFormValues {
  name: string;
  description: string;
  comment: string;        // NEW - NFR-GOV-005
  tags: TagValueResponse[]; // NEW - from F-03
}

interface DomainResponse {
  id: string;
  name: string;
  description: string | null;
  comment: string | null;   // NEW - NFR-GOV-005
  createdAt: string;
  updatedAt: string;        // NEW - NFR-GOV-005
  tags: EntityTagResponse[]; // NEW - from F-03
}
```

### ArkAlert Props

```typescript
// src/components/shared/ArkAlert.tsx
// Patron réutilisable pour tous les modules suivants — ne pas réimplémenter inline

interface ArkAlertProps {
  severity: 'success' | 'error' | 'warning' | 'info';
  message: string;
  open: boolean;
  onClose: () => void;
  autoDismiss?: number;   // ms — undefined = pas d'auto-dismiss
}

// Implémentation attendue :
// <Snackbar
//   open={open}
//   autoHideDuration={autoDismiss ?? null}
//   onClose={onClose}
//   anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
// >
//   <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
//     {message}
//   </Alert>
// </Snackbar>
```

### Transmission des alertes succès

```typescript
// Émetteur (DomainNewPage, DomainEditPage, DomainsListPage après delete)
navigate('/domains/' + id, {
  state: { alert: { severity: 'success', message: t('domains.alert.created') } }
});

// Récepteur (DomainDetailPage, DomainsListPage)
const location = useLocation();
const [alert, setAlert] = useState<{ severity: string; message: string } | null>(
  location.state?.alert ?? null
);

useEffect(() => {
  if (location.state?.alert) {
    window.history.replaceState({}, ''); // évite réaffichage au refresh
  }
}, []);
```

---

## 4.1 DimensionTagInput Integration (F-03)

All domain forms use the `DimensionTagInput` component from F-03 §6:

```typescript
// In DomainForm.tsx
import { DimensionTagInput } from '@/components/tags';

// Usage - Geography dimension
<DimensionTagInput
  dimensionId="uuid-geography"  // From seed (F-03 RM-07)
  dimensionName="Geography"
  entityType="domain"
  entityId={domainId}  // undefined for new domains
  value={values.tags.filter(t => t.dimensionName === 'Geography')}
  onChange={(tags) => setFieldValue('tags', [...values.tags.filter(t => t.dimensionName !== 'Geography'), ...tags])}
  multiple={true}
  color="#2196F3"
/>

// Usage - Brand dimension  
<DimensionTagInput
  dimensionId="uuid-brand"
  dimensionName="Brand"
  entityType="domain"
  entityId={domainId}
  value={values.tags.filter(t => t.dimensionName === 'Brand')}
  onChange={(tags) => setFieldValue('tags', [...values.tags.filter(t => t.dimensionName !== 'Brand'), ...tags])}
  multiple={true}
  color="#9C27B0"
/>
```

**Behavior:**
- On create: Tags stored in local state, saved after domain POST via `PUT /tags/entity/domain/{id}` (F-03 API)
- On edit: Immediate save via `PUT /tags/entity/domain/{id}` on each tag change (RM-11)
- Available dimensions: Geography, Brand, LegalEntity (seeded by F-03 RM-07)

---

## 5. Clés i18n — Section `domains` dans `fr.json` ⚠️

> À ajouter **manuellement** dans `src/i18n/locales/fr.json` avant la session OpenCode.
> ⚠️ Supprimer `domains.snackbar.*` si ces clés existent déjà — remplacées par `domains.alert.*`.

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
  const canWrite = hasPermission('domains:write'); // import depuis @/store/auth
  ```

- **RM-07 — Formatage des messages 409 DEPENDENCY_CONFLICT :**

  ```typescript
  // src/utils/domain.utils.ts — généré par OpenCode
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
  // src/utils/domain.utils.ts — généré par OpenCode
  export function resolveAlertMessage(
    t: TFunction,
    status: number,
    code?: string
  ): string {
    if (status === 404)   return t('domains.alert.errors.notFound');
    if (status >= 500)    return t('domains.alert.errors.serverError');
    return t('domains.alert.errors.unknown');
  }
  // Note : 400 et 409 CONFLICT ne passent PAS par cette fonction
  // → ils sont affichés en inline sur le champ name du DomainForm
  ```

- **RM-10 — Comportement post-suppression :**

  Après `DELETE /api/v1/domains/:id` réussi → toujours `navigate('/domains', { state: { alert: { severity: 'success', message: t('domains.alert.deleted') } } })`.
  Ne jamais rester sur la page courante après une suppression.

- **RM-11 — Cycle de vie des alertes :**

  | Type | Déclencheur | Transport | Auto-dismiss | Comportement |
  |------|-------------|-----------|--------------|--------------|
  | Success (create) | POST 201 | navigation state | 5000ms | Affiché sur `DomainDetailPage` |
  | Success (update) | PATCH 200 | navigation state | 5000ms | Affiché sur `DomainDetailPage` |
  | Success (delete) | DELETE 204 | navigation state | 5000ms | Affiché sur `DomainsListPage` |
  | Error (5xx) | any 5xx | useState local | aucun | Affiché sur la page courante, reste jusqu'à navigation |
  | Error (409 DEPENDENCY_CONFLICT) | DELETE 409 | dans ConfirmDialog | aucun | Remplace le message du dialog |
  | Inline (400 / 409 CONFLICT) | POST/PATCH 4xx | prop `error` du DomainForm | aucun | Sous le champ name, pas dans ArkAlert |

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

- [ ] **FS-02-BACK au statut `done`** — gates G-01 à G-08 toutes cochées
- [ ] **F-03 au statut `done`** — `DimensionTagInput` et API tags disponibles
- [ ] **API testée manuellement** — `GET` et `POST /api/v1/domains` validés, tags endpoint testé
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **Clés `domains.*` ajoutées dans `fr.json`** — y compris `domains.alert.*`, `domains.alert.errors.*`, `domains.form.commentLabel`, `domains.form.tagsLabel`
- [ ] **Clés `domains.snackbar.*` supprimées** de `fr.json` si elles existaient
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01)
- [ ] **`DimensionTagInput` exporté depuis `@/components/tags`** (F-03)
- [ ] **Câblage `App.tsx` réalisé manuellement** (§7)
- [ ] **`cy.loginAsReadOnly()`** créé dans `cypress/support/commands.ts`
- [ ] **Cypress opérationnel**
- [ ] **Layout Contract §3 relu** — zones `alerts` et `tags` présentes sur chaque page
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
- [ ] `[Cypress]` Clic sur une ligne → redirect vers `/domains/:id`
- [ ] `[Cypress]` `DomainDetailPage` affiche nom, description et date
- [ ] `[Cypress]` Créer un domaine → redirect vers `/domains/<new-id>` + Alert success contenant "Domaine créé avec succès"
- [ ] `[Cypress]` Alert success disparaît automatiquement après 5 secondes
- [ ] `[Cypress]` Alert success ne réapparaît pas après refresh de la page
- [ ] `[Cypress]` Cancel sur `DomainNewPage` → redirect vers `/domains`, pas d'Alert
- [ ] `[Cypress]` Modifier un domaine → redirect vers `/domains/:id` + Alert success contenant "Domaine mis à jour avec succès"
- [ ] `[Cypress]` Cancel sur `DomainEditPage` → redirect vers `/domains/:id`, pas d'Alert
- [ ] `[Cypress]` Supprimer un domaine sans entités liées → redirect vers `/domains` + Alert success contenant "Domaine supprimé avec succès" + domaine absent de la liste
- [ ] `[Cypress]` Cancel suppression → dialog fermé, domaine toujours présent, pas d'Alert

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
- Clés domains.* présentes dans fr.json — y compris domains.alert.* et domains.alert.errors.*
- Clés domains.snackbar.* supprimées — utiliser domains.alert.* uniquement

RBAC : hasPermission() importé depuis @/store/auth

Composants F-01 OBLIGATOIRES :
  import { PageHeader, ConfirmDialog, EmptyState, LoadingSkeleton } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'

Nouveau composant à générer dans cette session :
  src/components/shared/ArkAlert.tsx
  - Encapsule MUI Snackbar + Alert (https://mui.com/material-ui/react-alert/)
  - anchorOrigin : { vertical: 'top', horizontal: 'center' }
  - Props : severity, message, open, onClose, autoDismiss? (ms)
  - Générique et réutilisable — patron pour tous les modules suivants
  - Ne pas créer de Snackbar/Alert inline dans les pages

Gestion des alertes (RM-11) :
  Success → navigate state : navigate('/path', { state: { alert: { severity: 'success', message: t('...') } } })
  Récepteur lit location.state?.alert puis window.history.replaceState({}, '') en useEffect
  Error 5xx → useState local dans la page, pas d'auto-dismiss
  Inline (400, 409 CONFLICT) → prop error du DomainForm, pas dans ArkAlert

Post-suppression (RM-10) :
  DELETE réussi → navigate('/domains', { state: { alert: { severity: 'success', message: t('domains.alert.deleted') } } })
  NE PAS rester sur la page courante après DELETE

409 DEPENDENCY_CONFLICT dans ConfirmDialog :
  Remplacer le message du dialog par format409Message(t, appCount, bcCount)
  Masquer ou désactiver le bouton Confirmer

JWT : token en mémoire uniquement — jamais sessionStorage / localStorage
Routing : react-router-dom v6
Câblage App.tsx : déjà réalisé manuellement — ne pas le générer

Pattern de référence : ce module FS-02-FRONT est le patron de référence pour tous les suivants.
Respecter impérativement le Layout Contract §3 — composant F-01 exact, clé i18n exacte, zone alerts par page.

Génère : 4 pages React, DomainForm, ArkAlert, domain.utils.ts (format409Message + resolveAlertMessage), domain.ts, tests Cypress §9.
Ne génère PAS le câblage App.tsx.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-02-FRONT v1.2 ICI]
[COLLER LE CONTENU DE FS-02-BACK §3 (Contrat API OpenAPI) ICI]
```

---

## 11. Checklist de Validation Frontend

- [ ] Alert success affichée après create — message "Domaine créé avec succès" sur `DomainDetailPage`
- [ ] Alert success affichée après edit — message "Domaine mis à jour avec succès" sur `DomainDetailPage`
- [ ] Alert success affichée après delete — message "Domaine supprimé avec succès" sur `DomainsListPage`
- [ ] Suppression réussie → redirect vers `/domains` (jamais rester sur la page)
- [ ] Alert success auto-dismiss après 5000ms
- [ ] Alert success ne réapparaît pas après refresh (navigation state effacé)
- [ ] Alert error affichée sur 5xx — pas d'auto-dismiss, formulaire reste affiché
- [ ] Erreurs 400 et 409 CONFLICT affichées **inline** sur le champ name, pas en Alert
- [ ] 409 DEPENDENCY_CONFLICT affiché dans le `ConfirmDialog` via `format409Message()`
- [ ] `ArkAlert` utilisé systématiquement — aucun Snackbar/Alert inline custom dans les pages
- [ ] Bouton "Ajouter un domaine" masqué si pas `domains:write`
- [ ] Colonne "Actions" masquée si pas `domains:write`
- [ ] Bouton "Modifier" masqué sur détail si pas `domains:write`
- [ ] Tri des colonnes fonctionnel — nulls en dernier sur `description`
- [ ] Aucune string en dur dans les composants
- [ ] Aucune erreur TypeScript strict
- [ ] Tests Cypress §9 passent

---

_FS-02-FRONT v1.3 — ARK_