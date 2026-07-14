# FS-13-FRONT — Espace Utilisateur (Settings + i18n EN) — Frontend

_Version 0.1 — 2026-05-18_

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-13-FRONT |
| **Titre** | Espace Utilisateur — Frontend |
| **Priorité** | P1 |
| **Statut** | `draft` *(devient `stable` uniquement après que FS-13-BACK est `done`)* |
| **Dépend de** | **FS-13-BACK** (gate bloquante), FS-01, F-02 |
| **Spec mère** | FS-13 Espace Utilisateur |
| **Estimé** | 2j |
| **Version** | 0.1 |

> ⚠️ Cette spec reste à `draft` tant que `FS-13-BACK` n'est pas au statut `done` et que toutes ses gates (G-01 à G-10) ne sont pas cochées.

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

- Crée la page `SettingsPage` à la route `/settings` avec un formulaire de sélection de langue
- Amende `TopBar` pour ajouter un avatar + dropdown utilisateur (nom, Paramètres, Déconnexion)
- Supprime le footer de la `Sidebar` (nom utilisateur + bouton déconnexion) au profit du dropdown TopBar
- Amende `types/auth.ts` pour ajouter `preferences: { language }` dans `UserResponse`
- Amende `store/auth.ts` pour exposer `getLanguage(): string` (fallback `"fr"`)
- Amende `i18n/index.ts` pour supporter le chargement dynamique de la langue et préparer l'anglais
- Crée `en.json` minimal (settings + common + nav) pour valider le mécanisme bilingue
- Ajoute les clés i18n `settings.*` et `nav.*` dans `fr.json` et `en.json`
- Amende `App.tsx` pour charger la langue utilisateur depuis `/auth/me` au montage
- Crée le hook `useUpdateMe()` React Query pour `PATCH /api/v1/users/me`

**Hors périmètre :**

- Backend API — couvert par FS-13-BACK
- Traduction anglaise complète (`en.json` exhaustif) — tâche séparée
- Autres paramètres utilisateur (thème, notifications, timezone, etc.) — P2
- Détection navigateur `Accept-Language` — P2
- Permission spécifique `users:settings` — P1 utilise JWT uniquement
- Page profil complet (photo, bio, etc.) — P2

---

## 2. User Stories

Voir `FS-13-userstories.md` — toutes les US sont P1.

Résumé des US implémentées dans cette spec :

- **US-01** : Avatar + dropdown dans TopBar (Paramètres, Déconnexion), suppression footer sidebar
- **US-02** : Page `/settings` avec Select langue (FR/EN), sauvegarde immédiate, mise à jour dynamique i18n
- **US-03** : Chargement automatique de la langue utilisateur au login/rechargement via `/auth/me`

---

## 3. Référence Contrat API

Le contrat API complet est défini dans **FS-13-BACK §3**. Ne pas le redéfinir ici.

| Méthode | Route | Résumé | Permission |
|---------|-------|--------|------------|
| `GET` | `/api/v1/auth/me` | Profil enrichi (preferences.language) | — |
| `POST` | `/api/v1/auth/login` | Login, user.preferences inclus | — |
| `POST` | `/api/v1/auth/refresh` | Refresh token, user.preferences inclus | — |
| `PATCH` | `/api/v1/users/me` | Modifier langue (self-update) | JWT uniquement |

Codes HTTP à gérer côté frontend :

| Code | Signification | Action frontend |
|------|--------------|-----------------|
| `200` | Succès | Snackbar succès / langue mise à jour |
| `400` | Validation échouée | Snackbar erreur générique (champ unique, pas d'erreur inline complexe) |
| `401` | Non authentifié | Intercepteur Axios → `/login?reason=session_expired` |

---

## 4. Layout Contract

### 4.1 `SettingsPage`

```yaml
page: SettingsPage
route: /settings
auth_required: true
permission_required: — (JWT uniquement)

layout:
  shell: AppShell            # import depuis '@/components/layout'
  container: PageContainer
  container_props:
    maxWidth: sm

zones:
  header:
    component: PageHeader    # import depuis '@/components/shared' — JAMAIS Box+Typography
    props:
      title: t('settings.page.title')
      action: null           # pas d'action principale sur cette page

  body:
    component: SettingsForm  # formulaire inline (pas de composant séparé nécessaire pour 1 champ)
    props:
      initialLanguage: getLanguage()  # depuis store/auth.ts
      availableLanguages: ['fr', 'en']  # dynamique : clés de src/i18n/locales/
      isLoading: mutation.isPending
      onChange: (language) => mutation.mutate({ language })

    fields:
      - id: language
        component: FormControl + Select MUI
        label: t('settings.language.label')
        options:
          - value: 'fr'
            label: t('settings.language.fr')   # "Français"
          - value: 'en'
            label: t('settings.language.en')   # "English"
        helperText: t('settings.language.helperText')  # "La traduction anglaise est partielle."

  snackbars:
    - trigger: mutation success
      message: t('settings.alert.saved')
      severity: success
    - trigger: mutation error
      message: t('settings.alert.error')
      severity: error
```

---

## 5. Composants à Générer

### Structure de fichiers

```
frontend/src/
├── pages/
│   └── settings/
│       └── SettingsPage.tsx        # NOUVEAU
├── components/
│   └── layout/
│       ├── TopBar.tsx              # AMENDÉ (avatar + dropdown)
│       └── Sidebar.tsx             # AMENDÉ (suppression footer)
├── api/
│   └── users.ts                    # AMENDÉ (useUpdateMe hook)
├── store/
│   └── auth.ts                     # AMENDÉ (getLanguage helper)
├── types/
│   └── auth.ts                     # AMENDÉ (preferences dans UserResponse)
└── i18n/
    ├── index.ts                    # AMENDÉ (support dynamique EN)
    └── locales/
        ├── fr.json                 # AMENDÉ (clés settings.*)
        └── en.json                 # NOUVEAU (minimal)
```

### Props du Composant SettingsForm (inline dans SettingsPage)

```typescript
interface SettingsFormProps {
  initialLanguage: string;
  availableLanguages: string[];
  isLoading: boolean;
  onChange: (language: string) => void;
}
```

> **Note :** SettingsPage est une page simple (1 champ). Le formulaire peut être inline dans la page sans composant séparé si l'agent front le juge approprié. Si composant séparé : `components/settings/SettingsForm.tsx`.

---

## 6. Clés i18n — Section `settings` à ajouter dans `fr.json`

> À ajouter **manuellement** dans `src/i18n/locales/fr.json` avant de lancer la session OpenCode.

```json
{
  "settings": {
    "page": {
      "title": "Paramètres"
    },
    "language": {
      "label": "Langue de l'interface",
      "fr": "Français",
      "en": "English",
      "helperText": "La traduction anglaise est partielle — les textes non traduits s'affichent en français."
    },
    "alert": {
      "saved": "Paramètres enregistrés",
      "error": "Erreur lors de l'enregistrement des paramètres"
    }
  },
  "nav": {
    "settings": "Paramètres",
    "logout": "Déconnexion"
  }
}
```

### `en.json` minimal (P1)

> Créer `src/i18n/locales/en.json` avec les clés minimales pour valider le mécanisme.

```json
{
  "settings": {
    "page": {
      "title": "Settings"
    },
    "language": {
      "label": "Interface language",
      "fr": "Français",
      "en": "English",
      "helperText": "English translation is partial — untranslated text will display in French."
    },
    "alert": {
      "saved": "Settings saved",
      "error": "Error saving settings"
    }
  },
  "nav": {
    "settings": "Settings",
    "logout": "Logout",
    "home": "Home",
    "applications": "Applications",
    "businessCapabilities": "Business Capabilities",
    "interfaces": "Interfaces",
    "dataObjects": "Data Objects",
    "itComponents": "IT Components",
    "providers": "Providers",
    "domains": "Domains",
    "graph": "Dependency Graph"
  },
  "common": {
    "actions": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive"
    },
    "noData": "—",
    "user": "User"
  },
  "home": {
    "page": {
      "title": "Dashboard"
    }
  }
}
```

> **Convention :** `en.json` P1 est **minimal** — il couvre uniquement les clés nécessaires à la validation du mécanisme (settings + common + nav + home titre). Toutes les autres clés manquantes tomberont en fallback FR. La traduction exhaustive est une tâche séparée.

---

## 7. Règles Métier Frontend

- **RM-01 — Langue par défaut :** `getLanguage()` dans `store/auth.ts` retourne `user.preferences.language ?? "fr"`. Si `preferences` est `null` (user legacy), fallback `"fr"`.

- **RM-02 — Chargement au boot :** Dans `App.tsx` (ou le hook qui charge `/auth/me`), après réception du profil :
  ```typescript
  const lang = user.preferences?.language ?? 'fr';
  i18n.changeLanguage(lang);
  // Mettre à jour la locale MUI si applicable
  ```
  > L'app doit attendre la résolution de `/auth/me` avant d'initialiser i18n avec la langue, pour éviter un flash FR → EN au rechargement.

- **RM-03 — Changement dynamique :** Au `onChange` du Select langue :
  1. Appel `PATCH /api/v1/users/me` via `useUpdateMe()`
  2. On success : `i18n.changeLanguage(newLang)` + snackbar succès
  3. On error : snackbar erreur, langue i18n **inchangée**

- **RM-04 — Liste des langues disponibles :** Le Select doit lister dynamiquement les langues présentes dans `src/i18n/locales/`. En P1 : `["fr", "en"]` hardcodé est acceptable. En P2 : génération dynamique depuis les imports.

- **RM-05 — Suppression footer sidebar :** Le footer de `Sidebar.tsx` (lignes 118-147, Box avec nom user + IconButton logout) est supprimé intégralement. La déconnexion n'est accessible que via le dropdown TopBar.

- **RM-06 — Dropdown TopBar :** Le dropdown est un `Menu` MUI ancré sur l'avatar. Items :
  - Header non cliquable : `[prénom] [nom]` (ou email si vide)
  - Divider
  - "Paramètres" → `navigate('/settings')`
  - "Déconnexion" → `onLogout()`

---

## 8. Câblage App.tsx — Manuel

> À réaliser **manuellement** avant de lancer la session OpenCode.

```typescript
// App.tsx — route Settings à ajouter

// Settings : tout user authentifié
<Route path="/settings" element={<PrivateRoute />}>
  <Route index element={<SettingsPage />} />
</Route>
```

> **Note :** `PrivateRoute` sans permission spécifique (JWT suffit). Pas de `users:read` ou `users:write` requis.

---

## 9. Session Gate — Frontend

- [ ] **FS-13-BACK au statut `done`** — gates G-01 à G-10 toutes cochées
- [ ] **API testée manuellement** — au moins `GET /auth/me` et `PATCH /users/me` validés
- [ ] **F-02 au statut `done`** — `useTranslation()` disponible
- [ ] **Clés `settings.*` ajoutées dans `fr.json`** (§5 de cette spec)
- [ ] **`en.json` minimal créé** (§5 de cette spec)
- [ ] **`hasPermission()` exporté depuis `@/store/auth`** (FS-01)
- [ ] **Câblage `App.tsx` réalisé manuellement** (§7 de cette spec)
- [ ] **FS-13-FRONT passé au statut `stable`** avant de lancer OpenCode

---

## 10. Tests Playwright — E2E Browser

> Tests E2E UI de FS-13 écrits en **Playwright** (convention projet — voir T-009). Syntaxe : `page.goto`, `page.click`, `expect(...).toBeVisible()`.

### Parcours nominaux

- [ ] `[Playwright]` Page `/settings` accessible après login
- [ ] `[Playwright]` Avatar dropdown s'ouvre au clic
- [ ] `[Playwright]` Clic "Paramètres" dans le dropdown → navigation vers `/settings`
- [ ] `[Playwright]` La page affiche le Select avec la langue actuelle (FR par défaut)
- [ ] `[Playwright]` Changement de langue vers EN → la langue de l'interface bascule immédiatement
- [ ] `[Playwright]` Snackbar succès visible après changement de langue
- [ ] `[Playwright]` Rechargement de la page (F5) → la langue EN est conservée
- [ ] `[Playwright]` Clic "Déconnexion" dans le dropdown → retour à `/login`

### Parcours d'erreur

- [ ] `[Playwright]` `PATCH /users/me` en erreur (network failure) → snackbar erreur, langue inchangée

---

## 11. Commande OpenCode — Frontend

```
Contexte projet ARK — Session Frontend FS-13-FRONT :

Stack : React 18 + Vite + TypeScript strict + MUI v9 + react-i18next
Règles MUI obligatoires :
- MUI v9 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement sur tous les TextField / Select
- Pas de MUI X DataGrid — utiliser MUI Table + TableSortLabel
- Menu MUI pour le dropdown (pas de custom popup)

i18n :
- Toute string visible via t('clé') — JAMAIS de string en dur dans les composants
- Hook : const { t, i18n } = useTranslation()
- Fichier source : src/i18n/locales/fr.json — clés settings.* déjà présentes
- Fichier EN : src/i18n/locales/en.json — minimal déjà présent
- Fallback : fr.json est la source de vérité, en.json est partiel

RBAC frontend :
- hasPermission() importé depuis @/store/auth
- Cette feature n'a PAS de permission spécifique — tout user authentifié peut accéder à /settings

Composants F-01 OBLIGATOIRES — ne jamais réinventer :
  import { PageHeader, EmptyState, LoadingSkeleton } from '@/components/shared'
  import { AppShell, PageContainer } from '@/components/layout'

  - AppShell      : wrapper racine — toujours présent
  - PageContainer : wrapper de contenu (maxWidth selon page)
  - PageHeader    : TOUT titre de page — jamais Box+Typography custom

JWT : token en mémoire uniquement — jamais sessionStorage / localStorage
Routing : react-router-dom v6, navigate() depuis useNavigate()
Câblage App.tsx : déjà réalisé manuellement — ne pas générer

Pattern de référence frontend : module Users (FS-01-FRONT / FS-12-FRONT) — s'y conformer pour le style et les patterns.

Respecte impérativement le Layout Contract §3 de cette spec :
- Composant F-01 exact par zone
- Clé i18n exacte par label
- Pas de permission requise pour cette feature

Implémente la feature "Espace Utilisateur Settings" frontend (FS-13-FRONT).
Génère : SettingsPage, amendements TopBar/Sidebar/auth.ts/types/auth.ts/i18n/index.ts, useUpdateMe hook, en.json minimal.
Ne génère PAS le câblage App.tsx — déjà fait manuellement.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-13-FRONT.md ICI]
[COLLER LE CONTENU DE FS-13-BACK §3 (Contrat API OpenAPI) ICI]
```

---

## 12. Checklist de Validation Frontend

- [ ] Route `/settings` fonctionne depuis App.tsx
- [ ] `PageHeader` utilisé sur SettingsPage — aucun Box+Typography en remplacement
- [ ] Avatar + dropdown dans TopBar fonctionnel
- [ ] Footer supprimé de la Sidebar
- [ ] Déconnexion accessible uniquement via dropdown
- [ ] Select langue affiche FR et EN
- [ ] Changement de langue déclenche `PATCH /users/me` + `i18n.changeLanguage()`
- [ ] Snackbar succès après changement de langue
- [ ] Snackbar erreur si PATCH échoue
- [ ] Rechargement F5 restaure la langue choisie
- [ ] Aucune string en dur dans les composants (`grep '"[A-Z]' src/pages/settings/`)
- [ ] Aucune erreur TypeScript strict
- [ ] Tests Playwright nominaux passent

---

## 13. Revue de Dette Technique

### Gates TD

| # | Vérification | Commande / Action |
|---|--------------|-------------------|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- '*.tsx'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées pour les items de ce sprint | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|-------|--------|
| **Sprint** | S5 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | *(à compléter)* |
| **Items F-999 ouverts** | *(à compléter)* |
| **Nouveaux items F-999 créés** | *(à compléter)* |
| **NFR mis à jour** | *(à compléter)* |
| **TODOs résiduels tracés** | *(à compléter)* |
| **Statut gates TD** | *(à compléter)* |

---

_Feature-Spec Frontend FS-13-FRONT v0.1 — Projet ARK_
