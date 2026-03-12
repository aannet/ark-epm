# ARK — Template Feature-Spec Frontend

_Version 0.1 — Mars 2026_

> **Changelog v0.1 :** Création — split du template unifié v0.3 en deux templates distincts (back / front). Issu de la décision architecture de session OpenCode du Sprint FS-02. Ce template couvre la partie frontend (React + MUI v5 + i18n + Cypress). La partie backend est couverte par `_template-back.md`.

> **Usage :** Ce template est le format standard des Feature-Specs **frontend** ARK. Chaque spec est un document autonome, versionné, directement injectable dans OpenCode sans reformatage.
> - Nommer le fichier : `FS-<numéro>-<slug>-front.md` (ex: `FS-03-providers-front.md`)
> - Cette spec reste à `draft` tant que la spec back correspondante n'est pas au statut `done`.
> - La section §3 Layout Contract est **obligatoire** — une page sans contrat est un bug de spec, pas d'implémentation.
> - **Ne pas coder sans spec stabilisée au statut `stable`.**

---

## Comment utiliser ce template

1. Dupliquer ce fichier dans `docs/03-Features-Spec/`
2. Nommer : `FS-<numéro>-<slug>-front.md`
3. Remplir toutes les sections — les sections marquées ⚠️ sont bloquantes
4. Vérifier que `FS-XX-BACK` est au statut `done` (gates G-01 à G-08 cochées)
5. Passer au statut `stable`, réaliser le câblage App.tsx manuel (§7), ajouter les clés i18n (§5)
6. Lancer la session OpenCode avec la commande §10

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-XX-FRONT |
| **Titre** | [Nom de la feature] — Frontend |
| **Priorité** | P1 / P2 / P3 |
| **Statut** | `draft` *(devient `stable` uniquement après que FS-XX-BACK est `done`)* |
| **Dépend de** | **FS-XX-BACK** (gate bloquante), FS-01, F-02 |
| **Spec mère** | FS-XX [slug] — spec de référence dont ce document est issu |
| **Estimé** | Nb de jours (frontend seul) |
| **Version** | 0.1 |

> ⚠️ Cette spec reste à `draft` tant que `FS-XX-BACK` n'est pas au statut `done` et que toutes ses gates (G-01 à G-08) ne sont pas cochées.

---

## 1. Objectif & Périmètre ⚠️

> 3-5 phrases : ce que cette spec frontend accomplit et ce qu'elle ne fait pas.

**Ce que cette spec fait :**


**Hors périmètre :**
- Backend API — couvert par `FS-XX-BACK`
- *(autres exclusions spécifiques)*


---

## 2. User stories


> Par US - NOM: 
> En tant que XXX, je veux XXX, afin de XXXX
> Critères d'acceptations en liste simple et concise

### Liste 


### Interactions Liste/Drawer (PNS-02)

>>> Exemples 
#### US-01 — Consultation Rapide
En tant qu'utilisateur, je veux cliquer sur le corps d'une ligne du tableau (hors nom) pour ouvrir un Side Drawer, afin de consulter les métadonnées du domaine sans perdre ma position dans la liste ni mes filtres actifs.

Critères d'acceptation:
* Clic sur Description, Tags, Date ou Actions → ouvre le drawer
* Drawer s'affiche depuis la droite (400px)
* État de la liste préservé (scroll, filtres)

#### US-02 — Accès Direct Détail
En tant qu'utilisateur, je veux cliquer sur le nom du domaine (lien hypertexte souligné) pour naviguer directement vers la Page Détail complète.

Critères d'acceptation:
* Nom affiché comme lien souligné (couleur texte normale, primaire au hover)
* Clic sur nom → navigation immédiate vers /domains/:id
* Le clic sur le nom ne déclenche pas l'ouverture du drawer (stopPropagation)

### Detail 

### Création

### Edition 



---

## 3. Référence Contrat API

> Le contrat API complet est défini dans **FS-XX-BACK §3**. Ne pas le redéfinir ici.
> La session OpenCode frontend doit recevoir FS-XX-BACK §3 en contexte additionnel (voir commande §10).

Endpoints disponibles après validation de FS-XX-BACK :

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/[ressource]` | Liste | `[domaine]:read` |
| `POST` | `/api/v1/[ressource]` | Créer | `[domaine]:write` |
| `GET` | `/api/v1/[ressource]/:id` | Détail | `[domaine]:read` |
| `PATCH` | `/api/v1/[ressource]/:id` | Modifier | `[domaine]:write` |
| `DELETE` | `/api/v1/[ressource]/:id` | Supprimer | `[domaine]:write` |

Codes HTTP à gérer côté frontend :

| Code | Signification | Action frontend |
|------|--------------|-----------------|
| `200` / `201` | Succès | Snackbar + navigation selon contexte (voir §3) |
| `400` | Validation échouée | Erreur inline sur le champ concerné |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |
| `403` | Permission insuffisante | Intercepteur Axios → `/403` |
| `404` | Ressource introuvable | `navigate('/[ressource]')` |
| `409` `CONFLICT` | Nom/valeur dupliqué(e) | Erreur inline `t('[domaine].form.[field]Duplicate')` |
| `409` `DEPENDENCY_CONFLICT` | Suppression bloquée | Message formaté dans `ConfirmDialog` |

---

## 4. Layout Contract

> Contrat de résolution des composants pour chaque page.
> OpenCode **doit** utiliser le composant F-01 indiqué — jamais réinventer avec Box+Typography custom.
> Générer un bloc par page. Supprimer les zones non applicables (dialogs, snackbars) si la page n'en a pas.

---

### 4.1 `[Domaine]ListPage`

```yaml
page: [Domaine]ListPage
route: /[ressource]
auth_required: true
permission_required: [domaine]:read

layout:
  shell: AppShell            # import depuis '@/components/layout'
  container: PageContainer
  container_props:
    maxWidth: xl

zones:
  header:
    component: PageHeader    # import depuis '@/components/shared' — JAMAIS Box+Typography
    props:
      title: t('[domaine].list.title')
      subtitle: t('[domaine].list.subtitle')   # null si pas de subtitle
      action:
        condition: hasPermission('[domaine]:write')   # absent si pas la permission
        label: t('[domaine].list.addButton')
        onClick: navigate('/[ressource]/new')
        icon: AddIcon

  body:
    component: MUI Table avec TableSortLabel
    loading_state: LoadingSkeleton             # import depuis '@/components/shared'
    empty_state: EmptyState                    # import depuis '@/components/shared'
    empty_state_props:
      title: t('[domaine].list.emptyState.title')
      description: t('[domaine].list.emptyState.description')
      action:
        condition: hasPermission('[domaine]:write')
        label: t('[domaine].list.emptyState.cta')
        onClick: navigate('/[ressource]/new')
    columns:
      - field: name
        header: t('[domaine].list.columns.name')
        sortable: true
        sort_null_behavior: null values last
        clickable: navigate('/[ressource]/${row.id}')
      - field: [autreChamp]
        header: t('[domaine].list.columns.[autreChamp]')
        sortable: true
      - field: createdAt
        header: t('[domaine].list.columns.createdAt')
        sortable: true
        format: date locale FR
      - field: actions
        header: t('[domaine].list.columns.actions')
        condition: hasPermission('[domaine]:write')
        row_actions:
          - type: edit
            icon: EditIcon
            aria_label: t('common.actions.edit')
            onClick: navigate('/[ressource]/${row.id}/edit')
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
      component: ConfirmDialog   # import depuis '@/components/shared' — JAMAIS dialog custom
      trigger: delete IconButton click
      props:
        title: t('[domaine].delete.confirmTitle')
        message: t('[domaine].delete.confirmMessage', { name: row.name })
        confirmLabel: t('common.actions.delete')
        severity: error
      on_confirm: DELETE /api/v1/[ressource]/:id
      on_success: navigate('/[ressource]') + snackbar t('[domaine].snackbar.deleted')
      on_409_DEPENDENCY_CONFLICT: remplacer message par format409Message(t, ...)

  snackbars:
    - trigger: delete success
      message: t('[domaine].snackbar.deleted')
      severity: success
```

---

### 4.2 `[Domaine]DetailPage`

```yaml
page: [Domaine]DetailPage
route: /[ressource]/:id
auth_required: true
permission_required: [domaine]:read

on_load:
  action: GET /api/v1/[ressource]/:id
  on_404: navigate('/[ressource]')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: md

zones:
  header:
    component: PageHeader
    props:
      title: entity.name
      action:
        condition: hasPermission('[domaine]:write')
        label: t('[domaine].detail.editButton')
        onClick: navigate('/[ressource]/${entity.id}/edit')
        icon: EditIcon

  body:
    loading_state: LoadingSkeleton
    fields:
      - label: t('[domaine].list.columns.name')
        value: entity.name
      - label: t('[domaine].list.columns.[autreChamp]')
        value: entity.[autreChamp] ?? t('[domaine].detail.noValue')
      - label: t('[domaine].list.columns.createdAt')
        value: entity.createdAt formaté date locale FR

  footer:
    - component: MUI Button
      props:
        variant: outlined
        label: t('[domaine].detail.backButton')
        onClick: navigate('/[ressource]')
```

---

### 4.3 `[Domaine]NewPage`

```yaml
page: [Domaine]NewPage
route: /[ressource]/new
auth_required: true
permission_required: [domaine]:write

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  header:
    component: PageHeader
    props:
      title: t('[domaine].form.createTitle')
      action: null

  body:
    component: [Domaine]Form
    props:
      initialValues: { name: '', [autreChamp]: '' }
      isLoading: false
      error: null
      onCancel: navigate('/[ressource]')
      onSubmit: POST /api/v1/[ressource]

  on_submit_success:
    action: navigate('/[ressource]/${createdEntity.id}')
    snackbar: t('[domaine].snackbar.created') severity=success

  on_submit_409_CONFLICT:
    action: erreur inline champ name
    message: t('[domaine].form.nameDuplicate')

  on_submit_400:
    action: erreur inline champ name
    message: t('[domaine].form.nameRequired')

  form_rules:
    - save_button_disabled_while: isLoading === true
    - name_validation: non vide, non uniquement espaces (client-side avant submit)
```

---

### 4.4 `[Domaine]EditPage`

```yaml
page: [Domaine]EditPage
route: /[ressource]/:id/edit
auth_required: true
permission_required: [domaine]:write

on_load:
  action: GET /api/v1/[ressource]/:id
  on_404: navigate('/[ressource]')

layout:
  shell: AppShell
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  header:
    component: PageHeader
    props:
      title: t('[domaine].form.editTitle')
      action: null

  body:
    loading_state: LoadingSkeleton
    component: [Domaine]Form
    props:
      initialValues: { name: entity.name, [autreChamp]: entity.[autreChamp] ?? '' }
      isLoading: false
      error: null
      onCancel: navigate('/[ressource]/${id}')
      onSubmit: PATCH /api/v1/[ressource]/:id

  on_submit_success:
    action: reste sur /[ressource]/:id + refresh GET
    snackbar: t('[domaine].snackbar.updated') severity=success

  on_submit_409_CONFLICT:
    action: erreur inline champ name
    message: t('[domaine].form.nameDuplicate')

  form_rules:
    - save_button_disabled_while: isLoading === true
    - name_validation: non vide, non uniquement espaces
```

---

## 5. Composants à Générer

### Structure de fichiers

```
frontend/src/
├── pages/
│   └── [domaine]/
│       ├── [Domaine]ListPage.tsx
│       ├── [Domaine]NewPage.tsx
│       ├── [Domaine]DetailPage.tsx
│       └── [Domaine]EditPage.tsx
├── components/
│   └── [domaine]/
│       └── [Domaine]Form.tsx
├── utils/
│   └── [domaine].utils.ts      ← helpers spécifiques (ex: format409Message) — généré par OpenCode
└── types/
    └── [domaine].ts
```

### Props du Composant Form

```typescript
interface [Domaine]FormProps {
  initialValues?: Partial<[Domaine]FormValues>;
  onSubmit: (values: [Domaine]FormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

interface [Domaine]FormValues {
  name: string;
  // autres champs
}

interface [Domaine]Response {
  id: string;
  name: string;
  // autres champs
  createdAt: string;
}
```

> Form : champs `name` (TextField variant="outlined", obligatoire) + champs optionnels. Bouton Save désactivé si `isLoading`. Erreur inline sous le champ si `error !== null`.

---

## 6. Clés i18n — Section `[domaine]` à ajouter dans `fr.json` ⚠️

> À ajouter **manuellement** dans `src/i18n/locales/fr.json` avant de lancer la session OpenCode.

```json
"[domaine]": {
  "list": {
    "title": "[Titre de la liste]",
    "subtitle": "[Sous-titre]",
    "addButton": "Ajouter [un/une] [entité]",
    "columns": {
      "name": "Nom",
      "createdAt": "Créé le",
      "actions": "Actions"
    },
    "emptyState": {
      "title": "Aucun(e) [entité] créé(e)",
      "description": "Commencez par créer votre premier(ère) [entité].",
      "cta": "Créer votre premier(ère) [entité]"
    }
  },
  "detail": {
    "noValue": "—",
    "editButton": "Modifier",
    "backButton": "Retour"
  },
  "form": {
    "createTitle": "Nouveau(elle) [entité]",
    "editTitle": "Modifier [l'/le/la] [entité]",
    "nameLabel": "Nom",
    "saveButton": "Enregistrer",
    "cancelButton": "Annuler",
    "nameRequired": "Le nom est obligatoire",
    "nameDuplicate": "Ce nom est déjà utilisé"
  },
  "delete": {
    "confirmTitle": "Supprimer [l'/le/la] [entité]",
    "confirmMessage": "Êtes-vous sûr de vouloir supprimer \"{{name}}\" ?",
    "blockedMessage": "Cette entité est utilisée par {{count}} objet(s) lié(s) et ne peut pas être supprimée"
  },
  "snackbar": {
    "created": "[Entité] créé(e) avec succès",
    "updated": "[Entité] mis(e) à jour avec succès",
    "deleted": "[Entité] supprimé(e) avec succès"
  }
}
```

---

## 7. Règles Métier Frontend ⚠️

- **RM-06 — Masquage conditionnel des actions d'écriture :**

  Les boutons et icônes d'écriture sont masqués si `hasPermission('[domaine]:write')` est `false`. Ce masquage est **complémentaire** à la protection backend. Voir Layout Contract §3 pour le détail par page.

  ```typescript
  const canWrite = hasPermission('[domaine]:write'); // import depuis @/store/auth
  ```

- **RM-07 — Formatage frontend des messages 409 DEPENDENCY_CONFLICT :**

  ```typescript
  // src/utils/[domaine].utils.ts — généré par OpenCode
  import { TFunction } from 'i18next';

  export function format409Message(t: TFunction, /* compteurs */ count: number): string {
    const n = count === 0 ? 'no' : count;
    return t('[domaine].delete.blockedMessage', { count: n });
  }
  ```

  > `format409Message` est **généré par OpenCode** dans cette session — ne pas le créer manuellement.

- **RM-08 — Tri des colonnes côté client :** *(si applicable)*

  ```typescript
  type SortField = 'name' | 'createdAt'; // étendre selon les colonnes de la feature
  type SortOrder = 'asc' | 'desc';
  ```

  Comportement null : valeurs `null` classées **en dernier** quelle que soit la direction de tri.

*(Ajouter ici les RM spécifiques à la feature — navigation post-save, comportements conditionnels, etc.)*

---

## 8. Câblage App.tsx — Manuel ⚠️

> À réaliser **manuellement** avant de lancer la session OpenCode.
> OpenCode ne génère pas ce fichier. Patron de référence : `FS-02-FRONT §7`.

```typescript
// App.tsx — routes [Domaine] à ajouter

// Lecture : token requis
<Route path="/[ressource]" element={<PrivateRoute />}>
  <Route index element={<[Domaine]ListPage />} />
  <Route path=":id" element={<[Domaine]DetailPage />} />
</Route>

// Écriture : token + permission [domaine]:write
<Route path="/[ressource]" element={<PrivateRoute permission="[domaine]:write" />}>
  <Route path="new" element={<[Domaine]NewPage />} />
  <Route path=":id/edit" element={<[Domaine]EditPage />} />
</Route>
```

---

## 9. Session Gate — Frontend ⚠️

> Prérequis à valider **avant** de lancer la session OpenCode et de passer cette spec à `stable`.

- [ ] **FS-XX-BACK au statut `done`** — gates G-01 à G-08 toutes cochées
- [ ] **API testée manuellement** — au moins `GET` et `POST /api/v1/[ressource]` validés
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **Clés `[domaine].*` ajoutées dans `fr.json`** (§5 de cette spec)
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01)
- [ ] **Câblage `App.tsx` réalisé manuellement** (§7 de cette spec)
- [ ] **`cy.loginAsReadOnly()`** créé dans `cypress/support/commands.ts`
- [ ] **Cypress opérationnel**
- [ ] **Layout Contract §3 relu** — un bloc par page, aucun composant F-01 manquant
- [ ] **FS-XX-FRONT passé au statut `stable`** avant de lancer OpenCode

---

## 10. Tests Cypress — E2E Browser ⚠️

> À remplir exhaustivement — OpenCode génère les tests Cypress nominaux à partir de cette section.
> Assertions sur les **valeurs FR** de `fr.json` — jamais sur les clés.

### Parcours nominaux

- [ ] `[Cypress]` `[Domaine]ListPage` affiche la liste après login
- [ ] `[Cypress]` `[Domaine]ListPage` affiche `EmptyState` si aucune entité
- [ ] `[Cypress]` Tri par défaut sur `name` ascendant
- [ ] `[Cypress]` Clic sur en-tête colonne → tri inversé
- [ ] `[Cypress]` Clic sur une ligne → redirect vers `/[ressource]/:id`
- [ ] `[Cypress]` `[Domaine]DetailPage` affiche les champs attendus
- [ ] `[Cypress]` Créer une entité → redirect vers `/[ressource]/<new-id>` + snackbar succès
- [ ] `[Cypress]` Cancel sur `[Domaine]NewPage` → redirect vers `/[ressource]`
- [ ] `[Cypress]` Modifier une entité → reste sur `/[ressource]/:id` + snackbar succès
- [ ] `[Cypress]` Cancel sur `[Domaine]EditPage` → redirect vers `/[ressource]/:id`
- [ ] `[Cypress]` Supprimer sans entités liées → disparaît de la liste + snackbar succès
- [ ] `[Cypress]` Cancel dans le dialog de suppression → dialog fermé, entité toujours présente

### Parcours d'erreur

- [ ] `[Cypress]` Créer avec nom dupliqué → erreur inline
- [ ] `[Cypress]` Créer sans nom → erreur inline
- [ ] `[Cypress]` Créer avec nom uniquement espaces → erreur inline
- [ ] `[Cypress]` Modifier avec nom dupliqué → erreur inline
- [ ] `[Cypress]` Supprimer entité liée → message formaté dans le dialog
- [ ] `[Cypress]` `[Domaine]EditPage` UUID inexistant → redirect vers `/[ressource]`
- [ ] `[Cypress]` `[Domaine]DetailPage` UUID inexistant → redirect vers `/[ressource]`

### Droits UI

- [ ] `[Cypress]` Sans `[domaine]:write` sur ListPage → bouton Add absent
- [ ] `[Cypress]` Sans `[domaine]:write` sur ListPage → colonne Actions absente
- [ ] `[Cypress]` Sans `[domaine]:write` sur DetailPage → bouton Edit absent
- [ ] `[Manuel]` Sans `[domaine]:write` → `/[ressource]/new` redirige vers `/403`
- [ ] `[Manuel]` Sans `[domaine]:write` → `/[ressource]/:id/edit` redirige vers `/403`

---

## 11. Commande OpenCode — Frontend ⚠️

> Copier-coller intégralement en début de session OpenCode.
> Ajouter le contenu de FS-XX-BACK §3 (Contrat API) à la suite.

```
Contexte projet ARK — Session Frontend FS-XX-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v5 + react-i18next
Règles MUI obligatoires :
- MUI v5 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement sur tous les TextField
- Pas de MUI X DataGrid — utiliser MUI Table + TableSortLabel

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur dans les composants
- Hook : const { t } = useTranslation()
- Fichier source : src/i18n/locales/fr.json — clés [domaine].* déjà présentes

RBAC frontend :
- hasPermission() importé depuis @/store/auth
- Vérifier avant TOUT rendu d'action d'écriture (bouton, icône, colonne)
- Jamais d'action d'écriture affichée inconditionnellement

Composants F-01 OBLIGATOIRES — ne jamais réinventer :
  import { PageHeader, ConfirmDialog, EmptyState, LoadingSkeleton, StatusChip } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'

  - AppShell      : wrapper racine — toujours présent
  - PageContainer : wrapper de contenu (maxWidth selon page)
  - PageHeader    : TOUT titre de page + action principale — jamais Box+Typography custom
  - ConfirmDialog : TOUTE suppression — jamais de dialog MUI inline custom
  - EmptyState    : TOUTE liste vide — jamais de Typography inline
  - LoadingSkeleton : TOUT état de chargement — jamais de CircularProgress spinner

JWT : token en mémoire uniquement — jamais sessionStorage / localStorage
Routing : react-router-dom v6, navigate() depuis useNavigate()
Câblage App.tsx : déjà réalisé manuellement — ne pas générer

Pattern de référence frontend : module Domains (FS-02-FRONT) — s'y conformer.

Respecte impérativement le Layout Contract §3 de cette spec :
- Composant F-01 exact par zone
- Clé i18n exacte par label
- Condition RBAC exacte par action

Implémente la feature "[TITRE]" frontend (FS-XX-FRONT).
Génère : pages React (4), [Domaine]Form, [domaine].utils.ts, [domaine].ts, tests Cypress nominaux.
Ne génère PAS le câblage App.tsx — déjà fait manuellement.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-XX-FRONT.md ICI]
[COLLER LE CONTENU DE FS-XX-BACK §3 (Contrat API OpenAPI) ICI]
```

---

## 12. Checklist de Validation Frontend

> À compléter après génération OpenCode, avant de passer FS-XX-FRONT à `done`.

- [ ] Les 4 routes `/[ressource]/*` fonctionnent depuis App.tsx
- [ ] `PageHeader` utilisé sur toutes les pages — aucun Box+Typography en remplacement
- [ ] `ConfirmDialog` utilisé pour la suppression — aucun dialog inline
- [ ] `EmptyState` affiché sur liste vide
- [ ] `LoadingSkeleton` affiché pendant les appels API
- [ ] Bouton Add masqué si pas `[domaine]:write`
- [ ] Colonne Actions masquée si pas `[domaine]:write`
- [ ] Bouton Edit masqué sur DetailPage si pas `[domaine]:write`
- [ ] Tri des colonnes fonctionnel — nulls en dernier
- [ ] Snackbar succès après create / update / delete
- [ ] Aucune string en dur dans les composants (`grep '"[A-Z]' src/pages/[domaine]/`)
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
| **Sprint** | *(ex : Sprint 2)* |
| **Date de revue** | *(date)* |
| **Items F-999 fermés** | *(ex : Item 5)* |
| **Items F-999 ouverts** | *(ex : Item 8 — reste pending)* |
| **Nouveaux items F-999 créés** | *(ex : Item 11)* |
| **NFR mis à jour** | *(ex : NFR-PERF-001 → covered)* |
| **TODOs résiduels tracés** | *(ex : 2 TODOs → issues #12, #13)* |
| **Statut gates TD** | ✅ TD-1 / ✅ TD-2 / ❌ TD-3 / … |

---

_Template Frontend v0.1 — Projet ARK_