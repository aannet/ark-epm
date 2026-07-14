# SESSION HANDOFF — Sprint S5 — ARK-EPM

_Dernière mise à jour : 2026-07-14 — rafraîchi lors d'un audit de gouvernance croisé (3 revues IA), contre `tasks.yaml` réel._

> Rappel : ce fichier est un **résumé de sprint**, pas le coordinateur — `docs/05-Project/tasks.yaml` fait foi en cas de divergence. Seuls `spec`/`arch` modifient ce fichier racine (cf. `AGENTS.md` §"SESSION-HANDOFF — Règles multi-agent").

---

## Fait depuis la dernière mise à jour (2026-05-06 → 2026-07-14)

| ID | Tâche | Agent | Date |
|---|---|---|---|
| T-079 | Back — `@RequirePermissions` tags write/read (vuln. sécurité) | back | 2026-05-16 |
| T-098 | Arch — eslint-plugin-sonarjs MegaLinter | arch | 2026-05-04 |
| T-099 | Back — Fix injections ZAP Data Objects + DTOs | back | 2026-05-04 |
| T-101 | Back — Harmoniser validation injection tous DTOs | back | 2026-05-05 |
| T-102..T-106 | Spec + impl + tests FS-12 Dashboard (back, front, QA) | spec/back/front/qa | 2026-05-06 |
| T-108 | QA — Stabilisation complète Playwright UI | qa | 2026-05-06 |
| T-109 | Arch — Fix MegaLinter sonarjs + calibration jscpd | arch | 2026-05-06 |
| T-112, T-114 | Front — Polish Dashboard (layout, tooltips, contexte BC) | front | 2026-05-06 |
| T-113 | QA — Fix aggregate-coverage path mapping | qa | 2026-05-06 |
| T-115 | Spec — FS-13 Espace Utilisateur (userstories + BACK + FRONT) | spec | 2026-05-18 |
| T-116 | Back — Implémenter FS-13 (user_preferences + PATCH /users/me) | back | 2026-07-14 |

FS-12 Dashboard est **done** de bout en bout (spec → back → front → QA). FS-13 back est **done** ; le front reste à faire (T-117, voir ci-dessous).

---

## Tâches open prioritaires

| ID | Tâche | Agent | Priorité |
|---|---|---|---|
| T-117 | Front — FS-13 Espace Utilisateur (SettingsPage + avatar dropdown + i18n dynamique) | front | **high** — prête à démarrer |
| T-051 | Arch — Décision : traitement des interfaces manuelles (bloque évolution FS-08) | arch | medium |
| T-086 | Back — Gate FS-09 US-04 : traversal récursif BC (`WITH RECURSIVE`) | back | medium |
| T-100 | Arch — Audit global architecture + tech debt (S5) | arch | medium |
| T-110 | Arch — Intégrer le scan Vice au pipeline | arch | medium |
| T-111 | Arch — Finaliser l'analyse LLM phase 2 du reports dashboard | arch | medium |
| T-050 | QA — 3 tests API en échec non tracés | qa | medium |
| T-069 | QA — Déporter rapports Playwright vers `reports/playwright/` | qa | medium |
| T-078 | QA — Tests Playwright `/users` `/roles` `/permissions` | qa | medium |
| T-074 | Spec — Réévaluer la gestion des tags | spec | medium |
| T-077 | Front — Icônes officielles entités | front | medium |
| T-107 | QA — Review findings Cypress it-components | qa | low |

Backlog P2 (F-999-*, FS-09-P2) : voir `docs/05-Project/roadmap.yaml` et les entrées `sprint: P2` dans `tasks.yaml` (T-088 à T-097) — non repris ici pour éviter la duplication.

---

## Point d'attention — verrou potentiellement orphelin

**T-003** (Front — FS-09 Dependency Graph ReactFlow) est `in_progress` avec `session_active: "adcda9"` depuis 2026-05-03 (sprint S2), mais l'entrée `sessions[]` de cette tâche référence un id de session différent (`a1b2c3`). Ce verrou est probablement une session interrompue jamais libérée. À vérifier avant de le considérer comme un travail réellement en cours ; ne pas le débloquer sans confirmation qu'aucune session n'est active dessus.

---

## Contexte FS-13 Espace Utilisateur (courant)

Specs : `docs/03-Features-Spec/FS-13-User-Settings/` (`FS-13-BACK.md` done, `FS-13-FRONT.md` prêt)
Backend livré (T-116, commit) : migration `UserPreference` (1:1 users, `language` défaut `fr`), `PATCH /api/v1/users/me`, amendment login/refresh/`getProfile()` → `preferences.language`, backfill legacy.
Tests reportés à une tâche de suite (Jest unit + Playwright API) — non bloquants pour démarrer le front.

Scope front (T-117) :
- `SettingsPage` (`/settings`) — Select langue FR/EN, sauvegarde immédiate
- Avatar + dropdown dans `TopBar` (nom + Paramètres + Déconnexion), suppression du footer `Sidebar`
- `store/auth.ts` → helper `getLanguage()` ; `i18n/index.ts` → `changeLanguage()` dynamique
- Création `en.json` minimal (settings + common + nav)

---

## Contexte FS-09 Dependency Graph (résiduel)

Backend implémenté (T-087, done). Front `in_progress` (T-003) mais verrou probablement orphelin (voir ci-dessus). Gate résiduelle : T-086 (BC `WITH RECURSIVE`) — US-04 partiel acceptable P1.
