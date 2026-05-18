# ARK — User Stories Espace Utilisateur (`/settings`)

_Version 1.0 — Mai 2026 — Statut : draft_

> **Changelog v1.0 :** Rédaction post-interview de design (13 questions). Scope P1 borné à la langue interface uniquement. Persistence DB via table `user_preferences` (1:1 `users`). Architecture i18n préparée pour l'anglais (tâche de traduction exhaustive différée). Navigation migrée depuis le footer de la sidebar vers un avatar dropdown dans la TopBar.

---

## Contexte & hypothèses structurantes

- **Personas couverts :** Tout utilisateur authentifié — Marc (AE), Thierry (CIO), admin, lecture seule
- **Ambition P1 :** Un seul paramètre utilisateur : la langue de l'interface (`fr` | `en`)
- **Page dédiée** : `/settings` — route indépendante dans le router React, accessible à tout user authentifié (JWT suffit, pas de permission spécifique)
- **Navigation** : Avatar + dropdown dans `TopBar` (nom user en header non cliquable + "Paramètres" + "Déconnexion"). Le footer de la sidebar (nom user + bouton déconnexion) est supprimé au profit de ce dropdown
- **Persistence** : Table `user_preferences` (1:1 avec `users`, clé étrangère `user_id`). Champs P1 : `language String @db.VarChar(10)` (pas enum Prisma — extensible sans migration)
- **Auto-creation** : Une row `user_preferences` est créée au `signup` avec `language = "fr"` (défaut). Les users existants avant le déploiement de FS-013 reçoivent une row via migration ou seed
- **Changement de langue** : Sauvegarde immédiate (`PATCH /api/v1/users/me`) dès que le dropdown change + mise à jour dynamique de l'UI (`i18n.changeLanguage()` + MUI `LocalizationProvider`) — pas de rechargement de page
- **Langue par défaut** : `"fr"` (comportement actuel). L'anglais (`"en"`) sera activable après livraison d'un `en.json` complet — tâche séparée
- **i18n P1** : `en.json` minimal livré (clés settings + common + nav) pour valider le mécanisme. Fallback FR sur clés manquantes
- **API backend** : `PATCH /api/v1/users/me` dans `UsersController` (self-update, pas de permission requise). `GET /api/v1/auth/me` enrichi avec `preferences: { language }` dans la réponse
- **Store auth** : Le store in-memory (`store/auth.ts`) expose `getLanguage()` (fallback `"fr"` si non défini)

---

## US-01 — Accéder à mon espace personnel

**En tant qu'utilisateur connecté,**
je souhaite accéder depuis un lien dans le header à mon espace personnel,
afin de pouvoir personnaliser mes réglages.

**Critères d'acceptation :**
- [ ] Un avatar (initiales ou icône `AccountCircle`) est affiché dans la `TopBar`, à droite de l'`Omnisearch`
- [ ] Au clic sur l'avatar, un `Menu` MUI s'ouvre avec :
  - Header non cliquable : prénom + nom de l'utilisateur (ou email si prénom/nom vides)
  - Item "Paramètres" → `navigate('/settings')`
  - Item "Déconnexion" → appelle `onLogout()`
- [ ] Le footer de la `Sidebar` (nom user + icône déconnexion) est supprimé — la déconnexion n'est accessible que via le dropdown
- [ ] Le menu se ferme au clic hors menu ou après sélection d'un item
- [ ] La route `/settings` est protégée par `PrivateRoute` (JWT requis, pas de permission spécifique)
- [ ] Si l'utilisateur n'est pas authentifié → redirection vers `/login`

---

## US-02 — Personnaliser la langue de l'interface

**En tant qu'utilisateur ayant accès à la page de réglages,**
je souhaite pouvoir modifier la langue par défaut de l'interface,
afin que l'application s'affiche dans la langue de mon choix.

**Critères d'acceptation :**
- [ ] La page `/settings` affiche un formulaire minimal avec un seul champ : `"Langue de l'interface"`
- [ ] Le champ est un `Select` MUI avec les options disponibles dynamiquement : les langues pour lesquelles un fichier i18n existe dans `src/i18n/locales/` (P1 : `fr`, `en`)
- [ ] L'option actuellement sélectionnée correspond à `preferences.language` du user connecté (fallback `"fr"` si non défini)
- [ ] Au changement de valeur dans le `Select` :
  - Appel immédiat `PATCH /api/v1/users/me` avec `{ language: "fr" | "en" }`
  - Mise à jour dynamique de la langue i18n (`i18n.changeLanguage()`) sans rechargement de page
  - Mise à jour de la locale MUI (`LocalizationProvider`) si applicable (dates, nombres)
- [ ] En cas de succès API : snackbar `t('settings.alert.saved')` (severity success)
- [ ] En cas d'erreur API : snackbar `t('settings.alert.error')` (severity error), langue inchangée en UI
- [ ] La page utilise `PageHeader` avec le titre `t('settings.page.title')`
- [ ] Aucun bouton "Sauvegarder" explicite — la sauvegarde est immédiate au changement de sélection
- [ ] Si l'utilisateur n'a pas encore de préférence (row `user_preferences` absente) → la valeur sélectionnée est `"fr"` et la sauvegarde crée la row

---

## US-03 — Appliquer mes réglages après connexion

**En tant qu'utilisateur qui se connecte,**
je souhaite que mes réglages personnels soient chargés automatiquement après l'authentification,
afin que l'interface soit conditionnée selon mes préférences dès le premier affichage.

**Critères d'acceptation :**
- [ ] Lors du login (`POST /api/v1/auth/login`), la réponse inclut déjà le user avec ses préférences (la réponse `user` du login est enrichie)
- [ ] Lors du rafraîchissement de token (`POST /api/v1/auth/refresh`), la réponse inclut également les préférences
- [ ] `GET /api/v1/auth/me` retourne `preferences: { language: string }` dans la réponse
- [ ] Au montage de `App.tsx` (ou dans le hook `useAuth`), après récupération du profil via `/auth/me` :
  - Si `user.preferences.language` est défini → `i18n.changeLanguage(language)`
  - Sinon → `i18n.changeLanguage("fr")` (fallback)
  - La locale MUI est synchronisée avec la langue i18n
- [ ] Le store auth (`store/auth.ts`) expose `getLanguage(): string` qui retourne `user.preferences.language ?? "fr"`
- [ ] Si l'utilisateur change sa langue dans `/settings` puis recharge la page (F5) → la langue choisie est restaurée grâce à `/auth/me` au boot
- [ ] Aucun flash de langue FR avant basculement — l'init i18n doit attendre la résolution de `/auth/me` avant de fixer `lng` (ou utiliser `fallbackLng` + `lng` dynamique)

---

## Décisions architecturales actées

| Décision | Choix retenu |
|---|---|
| Paramètre P1 | Langue interface uniquement |
| Page | `/settings` dédiée, route indépendante |
| Navigation | Avatar + dropdown TopBar (nom + Paramètres + Déconnexion). Suppression footer sidebar |
| Persistance | Table `user_preferences` 1:1 `users`, champ `language String @db.VarChar(10)` |
| Auto-creation | Row créée au signup avec `"fr"` par défaut |
| Changement langue | Sauvegarde immédiate + mise à jour dynamique i18n/MUI sans reload |
| Langue par défaut | `"fr"` (EN différé — tâche séparée) |
| Format DB | `String` (pas enum) — extensible sans migration Prisma |
| API self-update | `PATCH /api/v1/users/me` dans `UsersController`, pas de permission requise |
| Auth enrichi | `GET /api/v1/auth/me` retourne `preferences: { language }` |
| i18n EN P1 | `en.json` minimal (settings + common + nav). Traduction exhaustive différée |
| Store auth | `getLanguage()` expose la préférence avec fallback `"fr"` |
| Dropdown | Nom user en header non cliquable + Paramètres + Déconnexion |

---

## Dépendances techniques

| # | Sujet | Nature | Bloque |
|---|---|---|---|
| D-01 | Création table `user_preferences` + migration Prisma | Nouveau modèle | Toutes les US |
| D-02 | Enrichissement `GET /api/v1/auth/me` avec `preferences.language` | Amendment FS-01-BACK | US-03 |
| D-03 | Endpoint `PATCH /api/v1/users/me` (self-update) | Nouveau endpoint | US-02 |
| D-04 | Auto-creation row `user_preferences` au signup | Amendment auth/signup | US-03 (initial) |
| D-05 | Migration data : créer row `user_preferences` pour users existants (language = "fr") | Data migration | US-03 (users legacy) |
| D-06 | Page `/settings` React + route + Select langue | Nouveau frontend | US-01, US-02 |
| D-07 | Avatar dropdown dans `TopBar` + suppression footer sidebar | Amendment layout | US-01 |
| D-08 | Synchronisation i18n + MUI locale au boot et au changement | Amendment i18n | US-02, US-03 |
| D-09 | `en.json` minimal (settings + common + nav) | Nouveau fichier i18n | US-02 (validation EN) |

---

## Hors périmètre P1 (différé)

- Traduction anglaise complète (`en.json` exhaustif) — tâche séparée
- Autres paramètres utilisateur (thème, notifications, timezone, etc.)
- Sélecteur de langue dans la sidebar ou header (hors page settings)
- Détection navigateur `Accept-Language` pour la langue par défaut
- Permission spécifique `users:settings`
- Page profil complet (photo, bio, etc.)
- Changement de mot de passe depuis `/settings`
- Historique des modifications de préférences

---

## Notes d'implémentation (front)

- Le `Select` des langues doit lister les options dynamiquement : importer tous les fichiers de `src/i18n/locales/` et générer les options à partir des noms de fichier (ex: `["fr", "en"]`)
- Le label affiché pour chaque langue doit être via i18n : `t('settings.language.fr')` = "Français", `t('settings.language.en')` = "English"
- MUI `LocalizationProvider` (si utilisé pour dates) doit être synchronisé avec la langue i18n via `adapterLocale`
- Le store auth doit être mis à jour après `PATCH /api/v1/users/me` pour refléter la nouvelle langue sans rechargement
