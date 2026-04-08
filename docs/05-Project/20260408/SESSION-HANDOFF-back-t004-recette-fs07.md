# SESSION-HANDOFF — back / T-004 / 2026-04-08

## Contexte session

- Agent : `back`
- Session ID : `1dde61`
- Tâche traitée : `T-004 — Bug — Tri par nom non fonctionnel sur GET /applications`
- Date : 2026-04-08
- Décision : ce n'était pas un bug backend, mais un défaut de test (pagination insuffisante).

## Ce qui a été fait

- Analyse : `ApplicationsService.findAll` applique correctement l'ordre côté backend.
- Reproduction : test Playwright `e2e/tests/applications/applications-pagination.api.spec.ts` ligne 50.
- Root cause : `GET /applications?sortBy=name&sortOrder=asc` sans `limit` (valeur par défaut `20`) ; avec 28+ applications en base,
  un nom `Zebra` peut être en dehors de la première page et non vérifiable dans le test.
- Correctif appliqué : changement de la requête test en
  `applications?sortBy=name&sortOrder=asc&limit=100`.
- Vérification : `rtk playwright test --project=api-backend tests/applications/applications-pagination.api.spec.ts --reporter=list`
  → **PASS (5) FAIL (0)**.

## Fichiers modifiés

- `e2e/tests/applications/applications-pagination.api.spec.ts`
- `docs/05-Project/tasks.yaml`

## Tâches et sessions

- `T-004` mis à `done` (date 2026-04-08), `session_active` libéré, ajout session `OC` `1dde61`.
- Nouvelle tâche créée : `T-024 — Recette FS-07-FRONT — Business Capabilities frontend`, assignée à `qa`.

## Points d'attention pour la suite

- L'implémentation FS-07-FRONT (T-018 + T-020) doit maintenant être recettée.
- La checklist de recette QA doit couvrir :
  - 3 vues (liste arborescente, tree, matrix)
  - toggle de vues et filtres
  - expand/collapse
  - drawer (PNS-02) + breadcrumbs (PNS-11)
  - chips criticality / technical fit
  - agrégation récursive dans matrix
  - gestion erreurs `400` / `409`
  - CRUD complet + i18n

## Gates

- Tâche T-004 clôturée (test API pagination OK).
- Recette front FS-07 à démarrer via `T-024`.
