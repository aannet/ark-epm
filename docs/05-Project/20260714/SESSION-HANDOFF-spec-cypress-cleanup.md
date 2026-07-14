# SESSION-HANDOFF — spec — Cypress → Playwright dans specs et docs produit

**Agent** : `spec`  
**Tâche** : T-128 — Spec — Mettre à jour les specs et docs produit pour remplacer Cypress par Playwright  
**Session** : `c4d5e6` (OpenCode)  
**Date** : 2026-07-14

---

## Résumé

Toutes les références actives à Cypress dans les specs et la documentation produit ont été remplacées par Playwright. Les mentions historiques (T-009, F-999 Item 22, FS-09) ont été conservées comme référence justifiée.

## Fichiers modifiés

### Spécifications

- `docs/03-Features-Spec/_templates/_template.md`
- `docs/03-Features-Spec/_templates/_template_front.md`
- `docs/03-Features-Spec/F-foundations/F02-i18n.md`
- `docs/03-Features-Spec/F-foundations/F03-Dimension-Tag-Foundation.md`
- `docs/03-Features-Spec/F-foundations/F99-Technical-Debt.md` (Item 22 coché ✅)
- `docs/03-Features-Spec/FS-01-Auth-RBAC/FS-01-Auth-RBAC.md`
- `docs/03-Features-Spec/FS-02-Domains/FS-02-Domains-front.md`
- `docs/03-Features-Spec/FS-03-Providers/FS-03-Providers-front.md`
- `docs/03-Features-Spec/FS-04-IT-Components/FS-04-IT-Components-front.md`
- `docs/03-Features-Spec/FS-05-Data-Objects/FS-05-Data-Objects-front.md`
- `docs/03-Features-Spec/FS-06-Applications/FS-06-Applications-front.md`
- `docs/03-Features-Spec/FS-09-Dependency-Graph/FS-09-Dependency-Graph-front.md`
- `docs/03-Features-Spec/FS-11-Omnisearch/FS-11-omnisearch-front.md`
- `docs/03-Features-Spec/FS-13-User-Settings/FS-13-FRONT.md`
- `docs/03-Features-Spec/P2/FS21-Tag-Dimensions-Administration.md`

### Documentation produit

- `docs/01-Product/ARK-Roadmap.md`
- `docs/01-Product/ARK-Personae.md`
- `RELEASE-NOTES.md`
- `todo.md`

## Règles appliquées

- Sections de tests renommées : `Tests Playwright — E2E Browser`.
- Suites de tests déplacées : `frontend/cypress/e2e/*.cy.ts` → `e2e/tests/*.spec.ts`.
- Helpers d'authentification : `cy.loginAsAdmin()` / `cy.loginAsReadOnly()` → `loginAsAdmin(page)` / `loginAsReadOnly(page)` depuis `e2e/fixtures/auth.fixture.ts`.
- Tags de checklists `[Cypress]` → `[Playwright]`.
- Commandes de validation : `npx playwright test e2e/tests/<file>.spec.ts`.
- Notes historiques conservées pour T-009 et F-999 Item 22.

## Validation

```bash
rtk grep -R -i cypress docs/03-Features-Spec/ docs/01-Product/ RELEASE-NOTES.md todo.md
```

Résultat : seules les références historiques demeurent (`F-99 Item 22`, `FS-09 note historique T-009`). Aucune référence active dans les specs et docs produit.

## Dépendances / tâches liées

- T-127 (arch) — done
- T-129 (qa) — nettoyage des artefacts techniques Cypress restants, en cours
- T-009 (qa) — migration Cypress → Playwright, en cours

## Prochaines actions

- `qa` exécute T-129 pour le lockfile, coverage dashboard et config MegaLinter.
- `qa` finalise T-009 (migration des tests Data Objects).

---

_Fin de session T-128 — ARK-EPM_
