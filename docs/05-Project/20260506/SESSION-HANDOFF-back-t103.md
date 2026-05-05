# SESSION HANDOFF — Back T-103 — FS-12 Dashboard Backend

_Date : 2026-05-06 — Agent : back — Session : c7f3a1_

---

## Ce qui a été fait

**T-103 terminée.** Implémentation complète FS-12-BACK — G-01 à G-11 validées.

---

## Fichiers créés / modifiés

### Créés
- `backend/prisma/migrations/20260506000000_add_user_domain_scope/migration.sql`
- `backend/src/home/home.module.ts`
- `backend/src/home/home.controller.ts`
- `backend/src/home/home.service.ts`
- `backend/src/home/dto/home-summary.dto.ts`
- `backend/src/home/home.service.spec.ts` (10 tests Jest)
- `e2e/tests/home/home-summary.api.spec.ts` (10 tests Playwright)

### Amendés
- `backend/prisma/schema.prisma` — modèle `UserDomainScope`, relations `User.domainScopes` + `Domain.userScopes`
- `backend/src/auth/auth.service.ts` — `getProfile()` → inclut `domainIds[]` + `domains[]`
- `backend/src/users/users.service.ts` — `CreateUserDto/UpdateUserDto` + `domainIds` + diff transactionnel + `findOne` enrichi
- `backend/src/applications/applications.service.ts` — méthode `countByDomains()`
- `backend/src/business-capabilities/business-capabilities.service.ts` — méthode `countCoveredByDomains()`
- `backend/src/app.module.ts` — import `HomeModule`
- `docs/04-Tech/openapi.yaml` — path `/home/summary`, schemas `HomeSummaryResponse`, amendments `UserResponse` + `CreateUserDto/UpdateUserDto`

---

## Gates validées

| Gate | Résultat |
|---|---|
| G-01 — Migration `user_domain_scope` | ✅ Table créée, FK + index |
| G-02 — `/auth/me` retourne `domainIds[]` + `domains[]` | ✅ Confirmé en live |
| G-03 — `/home/summary` → 200 structure complète | ✅ 5 zones peuplées |
| G-04 — lifecycleDistribution 5 statuts | ✅ Jest + Playwright |
| G-05 — Erreur partielle → champ null, HTTP 200 | ✅ Test Jest |
| G-06 — `PATCH /users/:id` domainIds diff atomique | ✅ Playwright |
| G-07 — Tests Jest | ✅ 10/10 |
| G-08 — Tests Playwright | ✅ 10/10 |
| G-09 — RBAC 401 sans token | ✅ Playwright |
| G-10 — Build TypeScript 0 erreur | ✅ `npm run build` propre |
| G-11 — openapi.yaml mis à jour | ✅ `/home/summary` + amendments |

---

## Points d'attention pour T-105 (front)

1. **`/auth/me` retourne maintenant `domainIds[]` + `domains[]`** — le store `auth.ts` peut les consommer directement.
2. **`GET /api/v1/home/summary`** — endpoint opérationnel, toujours 200.
3. **Convention 0 domaine = portée globale** — `domainIds: []` dans `/auth/me` signifie accès global.
4. **Structure réponse BFF** — voir `HomeSummaryResponse` dans `openapi.yaml` pour les types exacts.
5. **US-HOME-09** — `PATCH /api/v1/users/:id` accepte désormais `domainIds: string[]` pour assigner des domaines.

## Points d'attention pour T-104 (qa-back)

1. Fichier de départ : `e2e/tests/home/home-summary.api.spec.ts` (déjà 10 tests).
2. À compléter : scope domaine user avec domaines assignés vs user global.
3. Gate levée : T-103 done ✅.

---

## Tâches débloquées

| ID | Tâche | Agent | Gate |
|---|---|---|---|
| **T-104** | QA-back — Tests API FS-12 Dashboard | qa | T-103 ✅ |
| **T-105** | Front — Implémenter FS-12 Dashboard | front | T-103 ✅ |

---

_T-103 done — 2026-05-06 — Session c7f3a1_
