# SESSION HANDOFF — QA T-104 — FS-12 Dashboard API

_Date : 2026-05-06 — Agent : qa — Session : 0e5d84_

---

## Ce qui a ete fait

**T-104 terminee.** Extension de la couverture API Playwright pour FS-12-BACK.

- Fichier teste et complete : `e2e/tests/home/home-summary.api.spec.ts`
- Cas ajoutes :
  - `GET /users/:id` contient `domainIds[]` et `domains[]`
  - Scope domaine utilisateur (`domainIds=[x]`) vs portee globale (`domainIds=[]`)
  - RBAC `403` avec token sans permission `applications:read`
  - Ajustement du test `401` sans token via fixtures `apiBaseUrl`/`apiVersion`
- Validation executee :
  - `rtk playwright test tests/home/home-summary.api.spec.ts --project=api-backend`
  - Resultat : **PASS (13) FAIL (0)**
- Commit session : `9f54c3c` (`test(FS-12): extend home summary API coverage (T-104)`)

---

## Points d'attention pour la suite

1. Le cas "erreur partielle -> champ null et HTTP 200" reste difficile a provoquer en test API black-box.
   Recommandation : couvrir ce comportement en test unitaire `HomeService` (fault injection/mocks Prisma).
2. Le pattern de creation role/user restreint pour verifier le `403` est reutilisable pour `T-106` (QA-front) si besoin de profils limites.
3. Une tache dediee de review QA a ete creee : `T-107` (findings Cypress hors scope FS-12).

---

## Gates validees / restantes

### Validees

- `GET /api/v1/home/summary` : 200 + structure attendue
- Scope domaine : user assigne vs user global
- RBAC : 401 sans token, 403 sans permission `applications:read`
- Contract FS-12 amendements user : `GET /auth/me` et `GET /users/:id` exposent `domainIds[]` + `domains[]`

### Restantes

- Verification explicite du scenario "sous-service en erreur -> champ null" au niveau API (necessite un mecanisme de fault injection)
