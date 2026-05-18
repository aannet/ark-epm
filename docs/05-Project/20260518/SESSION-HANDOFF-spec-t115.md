# SESSION-HANDOFF — Spec — T-115 — FS-13 Espace Utilisateur

_Date : 2026-05-18 — Agent : spec (OpenCode)_

---

## Résumé

Rédaction complète des specs FS-13 (Espace Utilisateur Settings + i18n EN) suite à interview de design (13 questions avec décisions structurantes).

## Livrables produits

| Fichier | Description |
|---|---|
| `docs/03-Features-Spec/FS-13-User-Settings/FS-13-userstories.md` | 3 User Stories (US-01 à US-03) + décisions architecturales actées |
| `docs/03-Features-Spec/FS-13-User-Settings/FS-13-BACK.md` | Spec backend (Prisma, API, tests, gates G-01 à G-10) |
| `docs/03-Features-Spec/FS-13-User-Settings/FS-13-FRONT.md` | Spec frontend (Layout Contract, i18n keys, en.json minimal, tests Playwright) |

## Décisions clés verrouillées

| # | Décision |
|---|---|
| Paramètre P1 | Langue interface uniquement |
| Page | `/settings` dédiée, route indépendante |
| Navigation | Avatar + dropdown TopBar (nom + Paramètres + Déconnexion), suppression footer sidebar |
| Persistance | Table `user_preferences` 1:1 `users`, champ `language String @db.VarChar(10)` |
| Auto-creation | Row créée au signup avec `"fr"` par défaut |
| Changement langue | Sauvegarde immédiate + mise à jour dynamique i18n sans reload |
| Langue par défaut | `"fr"` (EN différé — tâche séparée) |
| API self-update | `PATCH /api/v1/users/me` dans `UsersController`, pas de permission requise |
| Auth enrichi | `GET /api/v1/auth/me` retourne `preferences: { language }` |
| i18n EN P1 | `en.json` minimal (settings + common + nav). Traduction exhaustive différée |
| Store auth | `getLanguage()` expose la préférence avec fallback `"fr"` |
| Dropdown | Nom user en header non cliquable + Paramètres + Déconnexion |

## Dépendances techniques identifiées

| # | Sujet | Nature |
|---|---|---|
| D-01 | Création table `user_preferences` + migration Prisma | Nouveau modèle |
| D-02 | Enrichissement `GET /api/v1/auth/me` avec `preferences.language` | Amendment FS-01-BACK |
| D-03 | Endpoint `PATCH /api/v1/users/me` (self-update) | Nouveau endpoint |
| D-04 | Auto-creation row `user_preferences` au signup | Amendment auth/signup |
| D-05 | Migration data : créer row `user_preferences` pour users existants | Data migration |
| D-06 | Page `/settings` React + route + Select langue | Nouveau frontend |
| D-07 | Avatar dropdown dans `TopBar` + suppression footer sidebar | Amendment layout |
| D-08 | Synchronisation i18n + MUI locale au boot et au changement | Amendment i18n |
| D-09 | `en.json` minimal (settings + common + nav) | Nouveau fichier i18n |

## Gates backend à valider

- G-01 : Migration Prisma `user_preferences`
- G-02 : Migration data legacy (users existants)
- G-03 : Tests Jest users
- G-04 : Tests Supertest FS-13
- G-05 : Tests RBAC manuels
- G-06 : Build TS 0 error
- G-07 : Statut FS-13-BACK → done
- G-08 : Revue TD backend
- G-09 : Audit trail PATCH /users/me
- G-10 : openapi.yaml mis à jour

## Prochaine étape

1. **Agent `data`** : exécuter D-01 (migration Prisma `user_preferences`) + D-05 (migration data legacy)
2. **Agent `back`** : implémenter FS-13-BACK (D-02 à D-04, tests, gates G-01 à G-10)
3. **Agent `front`** : implémenter FS-13-FRONT (bloqué jusqu'à FS-13-BACK done)

---

_Archive de session spec — T-115 — FS-13 Espace Utilisateur_
