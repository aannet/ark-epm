# SESSION-HANDOFF — arch — Nettoyage gouvernance Cypress

**Date** : 2026-07-14  
**Tâche** : T-127 — Arch — Nettoyer les références Cypress dans la gouvernance et la stack  
**Statut** : done  
**Session** : OpenCode / 9a43c2

---

## Résumé

Nettoyage post-T-009 des références mortes à Cypress dans les fichiers de gouvernance et la stack technique. Playwright est désormais le seul framework E2E UI actif.

## Fichiers modifiés

- `AGENTS.md` (racine)
  - Périmètre QA : retiré « Cypress frontend »
  - Tableau Stack : remplacé « Jest + Playwright + Cypress » par « Jest + Playwright (API + e2e UI) »
  - Ajout commentaire `AGENT-DECISION: [arch]` sur le retrait Cypress
- `docs/AGENTS.md` — template spec front : remplacé Cypress par Playwright
- `opencode.json` — description + prompt de `ark-qa` : retiré Cypress
- `.claude/agents/ark-qa.md` — description + périmètre : retiré Cypress
- `.claude/commands/ark-qa.md` — description : retiré Cypress
- `docs/05-Project/README.md` — commande `/ark-qa` et tableau agents : retiré Cypress
- `docs/04-Tech/ARK-NFR.md` — exclusions MegaLinter : retiré `frontend/cypress/`
- `e2e/AGENTS.md` — stratégie de test : retiré la couche Cypress, checklist PR : Playwright UI uniquement
- `docs/05-Project/tasks.yaml` :
  - Création T-127 (arch), T-128 (spec), T-129 (qa)
  - Clôture anticipée de T-107 (obsolète après suppression Cypress)
  - Ouverture / clôture de T-127

## Tâches créées / mises à jour

- **T-127** — Arch — Nettoyer les références Cypress dans la gouvernance et la stack → **done**
- **T-128** — Spec — Mettre à jour les specs et docs produit pour remplacer Cypress par Playwright → **open**
- **T-129** — QA — Nettoyer les artefacts techniques Cypress (lockfile, coverage, linter config) → **open**
- **T-107** — QA — Review findings Cypress it-components → **done** (obsolète, couverte par T-129)

## Validation

```bash
rtk grep -Rin "[Cc]ypress" AGENTS.md docs/AGENTS.md opencode.json \
  .claude/agents/ark-qa.md .claude/commands/ark-qa.md \
  docs/05-Project/README.md docs/04-Tech/ARK-NFR.md e2e/AGENTS.md
# Seule sortie : la note AGENT-DECISION historique justifiée dans AGENTS.md.
```

## Prochaines étapes

1. **Déléguer T-128 à `spec`** : mettre à jour les specs front (`FS-06-Applications-front.md`, `F02-i18n.md`), la documentation produit (`ARK-Personae.md`, `ARK-Roadmap.md`, `RELEASE-NOTES.md`, `todo.md`) et la dette technique (`F99-Technical-Debt.md`) pour remplacer Cypress par Playwright.
2. **Déléguer T-129 à `qa`** : nettoyer `frontend/package-lock.json`, `docs/05-Project/test-coverage-dashboard/coverage-data.json` et vérifier `.gitignore`, `Makefile`, configs ESLint / MegaLinter.

## Références

- T-009 — Migration tests Cypress → Playwright (done)
- T-126 (done, tasks-done.yaml) — Ajout ouverture ciblée à ark-open-session (id déjà utilisé, nouvelle tâche arch créée en T-127)
