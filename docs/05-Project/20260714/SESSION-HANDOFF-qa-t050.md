# SESSION-HANDOFF — qa — T-050 : 3 tests API en échec non tracés

**Agent** : `qa`
**Tâche** : T-050 — QA — 3 tests API en échec non tracés (applications-validation, domains-crud, it-components)
**Session** : `b2c3d4` (OpenCode)
**Date** : 2026-07-14
**Statut final** : done

---

## Résumé

Audit de l'état actuel des 3 tests API historiquement en échec référencés dans T-050.
Constat : **les 3 échecs sont déjà résolus** depuis le commit `0c7d666` (2026-05-04).
Aucune action de correction n'était nécessaire — il s'agissait de problèmes côté test,
pas de bugs backend. Tâche clôturée sans modification de code.

## Audit — état courant

Commande : `make test-api` (Playwright, projet `api-backend`).

```
Running 136 tests using 6 workers
  1 skipped
  135 passed (21.9s)
```

- **0 échec, 135 passed, 1 skipped** (stable, reproductible).
- Le seul test skipped est `data-objects-dependencies.api.spec.ts:52`
  (`test.skip(...)` explicite sur DELETE 409 DEPENDENCY_CONFLICT) — hors scope T-050.

## Vérification de stabilité (anti-flakiness)

Les 3 fichiers historiques exécutés en `--repeat-each=3` (24 tests × 3 = 72 runs) :

```
  72 passed (15.1s)
```

Aucun échec, aucun flaky. Les 3 tests sont déterministes.

## Classification des 3 échecs historiques

Tous les 3 = **test à corriger** (pas un bug backend). Corrigés dans le commit
`0c7d666` « fix(e2e+search): real login flow, paginated types, fixture aliases,
Ctrl+K capture » (2026-05-04, Alec ANNET).

### 1. `applications-validation.api.spec.ts:78` — 404 vs 400

- **Symptôme historique** : POST /applications avec `businessCapabilityId` inexistant
  renvoyait 400 (BAD_REQUEST) au lieu du 404 (NOT_FOUND) attendu.
- **Cause réelle** : le test utilisait un UUID au format **invalide**
  `00000000-0000-0000-0000-000000000000` (variant/version nil) qui échouait à la
  validation de format du DTO (→ 400 BAD_REQUEST) avant même la vérification
  d'existence en base.
- **Fix** : UUID remplacé par `00000000-0000-4000-8000-000000000000` (format
  valide v4, n'existe pas en base) → passe la validation de format, puis le
  service lève bien `NotFoundException` → 404.
- **Conclusion** : test bug, pas backend bug. Le contrat API (404 sur FK
  inexistant) était correct.

### 2. `domains-crud.api.spec.ts:5` — structure de réponse inattendue

- **Symptôme historique** : GET /domains échec intermittent ou structure inattendue.
- **Cause réelle** : le test désérialisait la réponse en `DomainResponse[]`
  (tableau nu) alors que l'API a évolué vers une enveloppe paginée
  `{ data: DomainResponse[], meta: {...} }`.
- **Fix** : typage `PaginatedResponse<DomainResponse>` et assertion sur
  `result.data` au lieu de `domains`.
- **Conclusion** : test obsolète vis-à-vis du contrat API paginé.

### 3. `it-components-crud.api.spec.ts:72` — DELETE sans dépendances

- **Symptôme historique** : possible 409 DEPENDENCY_CONFLICT résiduel (app liée
  non nettoyée).
- **Cause réelle** : la signature du test n'injectait pas la fixture `testData`,
  ce qui empêchait le cleanup/isolement correct des données.
- **Fix** : ajout de `testData` dans la signature du test
  `async ({ authenticatedRequest, testData })` pour bénéficier de
  l'isolation/cleanup des fixtures.
- **Conclusion** : test incomplet (fixture manquante), pas de bug backend.

## Renforcement ultérieur

Le commit `fad07bd` (T-101, 2026-07) « fix(validation): harden injection guards
on all entity DTOs » puis `9d97abf` (refactor) ont durci les guards de validation
sur tous les DTOs d'entité, consolidant le comportement 400 (format invalide) vs
404 (entité inexistante). Les 3 tests historiques restent verts après ce durcissement.

## Fichiers modifiés par cette session

**Aucun.** Aucun code source (backend, frontend, test) modifié — l'audit a
confirmé que tout était déjà résolu. Conforme au périmètre `qa` (ne pas modifier
le code source métier ; ici aucune modification même de test n'était requise).

## Validation

- `make test-api` → 135 passed, 1 skipped, 0 failed.
- 3 tests historiques stables sur 3 répétitions (72/72 passed).
- Aucun nouveau flaky.

## Prochaines étapes

Aucune. T-050 est entièrement résolue — clôturée en `done`.
Aucune tâche `back` à ouvrir (aucun bug backend identifié).

---

_Fin de session T-050 — ARK-EPM_
