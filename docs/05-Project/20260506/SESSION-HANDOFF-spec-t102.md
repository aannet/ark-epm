# SESSION HANDOFF — Spec T-102 — FS-12 Dashboard

_Date : 2026-05-06 — Agent : spec_

---

## Ce qui a été fait

**T-102 terminée.** Deux fichiers de spec opérationnelle rédigés :

1. `docs/03-Features-Spec/FS-12-Dashboard/FS-12-dashboard-back.md` — **draft v0.1**
2. `docs/03-Features-Spec/FS-12-Dashboard/FS-12-dashboard-front.md` — **draft v0.1**

Les deux specs suivent le format de référence FS-09 (en-tête, objectif/périmètre, modèle BDD, contrat API, règles métier, structure fichiers, tests, gates, checklist post-session, revue TD).

---

## Décisions architecturales prises dans les specs

### Backend
- `HomeService` injecte `PrismaService` directement — pas d'import inter-modules (évite dépendances circulaires)
- `UserDomainScope` : table de présence pure N:N, pas de champ `role` en P1
- Convention : 0 domaine = portée globale (`domainFilter = domainIds.length > 0 ? { domainId: { in: domainIds } } : {}`)
- Ordre implémentation obligatoire : D-01 → D-02 → D-04/D-05 → D-06 → D-03
- Permission réutilisée : `applications:read` (pas de nouvelle permission)

### Frontend
- ⚠️ **Correction critique** : les user stories mentionnaient "AuthContext" mais le projet utilise un **store in-memory** (`frontend/src/store/auth.ts`). La spec FS-12-FRONT s'appuie sur le store exclusivement.
- `KpiTile` : nouveau composant (pas d'amendment de `KpiCard` existant — rétrocompatibilité)
- `EmptyState` US-HOME-08 : CTAs gérés directement dans `HomePage` (pas d'amendment du composant partagé)
- `WelcomeBanner` : données du store uniquement, 0 appel API

---

## Points d'attention pour T-103 (back)

1. **Commencer par D-01** — la migration `user_domain_scope` débloque tout le reste.
2. **D-02 avant le frontend** — l'agent front (T-105) a besoin que `/auth/me` retourne `domainIds[]`.
3. **HomeService : PrismaService direct** — ne pas importer `ApplicationsModule` etc. dans `HomeModule`.
4. Valider les gates G-01 et G-02 avant de passer aux amendments (D-04, D-05, D-06, D-03).
5. Mettre à jour `docs/04-Tech/openapi.yaml` avec le path `/home/summary` (gate G-11).

## Points d'attention pour T-105 (front)

1. **Câblage App.tsx manuel avant session** — route `/` + routes `/users` (voir spec §9).
2. **Clés i18n `home.*` et `users.*` à ajouter dans `fr.json` avant session** (spec §7).
3. `UserResponse` dans `types/auth.ts` à amender avec `domainIds` + `domains` (spec §4).
4. `getDomainIds()` et `getDomains()` à exporter depuis `store/auth.ts` (spec §4).
5. `App.tsx` `useEffect` à amender pour appeler `getMe()` au montage (spec §4.3).

---

## Gates validées / restantes

| Spec | Statut | Gates |
|---|---|---|
| FS-12-BACK | draft | G-01..G-11 à valider en session T-103 |
| FS-12-FRONT | draft (bloquée sur FS-12-BACK done) | Gates Session à valider en session T-105 |

---

## Prochaines tâches FS-12

| ID | Tâche | Agent | Priorité | Gate |
|---|---|---|---|---|
| **T-103** | Back — Implémenter FS-12 Dashboard backend | back | high | T-102 ✅ |
| **T-104** | QA-back — Tests API FS-12 | qa | medium | T-103 |
| **T-105** | Front — Implémenter FS-12 Dashboard | front | high | T-103 |
| **T-106** | QA-front — Tests e2e FS-12 | qa | medium | T-105 |
