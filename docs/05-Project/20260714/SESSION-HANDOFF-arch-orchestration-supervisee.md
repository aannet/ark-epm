# SESSION HANDOFF — arch — Orchestration supervisée multi-runtime

Date : 2026-07-14
Tâche : T-125 — done

## Livré

- `docs/04-Tech/decisions/ADR-001-supervised-multi-runtime-orchestration.md`
  établit l'orchestrateur comme plan de contrôle non-mutant.
- `docs/04-Tech/agent-orchestration.md` définit la politique commune :
  qualification, plan, approbation explicite, un rôle métier à la fois,
  validations puis proposition de clôture.
- `opencode.json` contient `ark-orchestrator` en agent primaire. Il peut lancer
  `explore` automatiquement et demande confirmation avant chaque délégation
  ARK. Les six rôles métier sont maintenant des sous-agents, sans délégation
  récursive, avec édition et Bash soumis à approbation.
- `.claude/agents/` contient `ark-orchestrator` et les six rôles ARK. L'entrée
  Claude est `claude --agent ark-orchestrator`; les agents métier bloquent les
  opérations Git d'ajout, commit et push.
- Les commandes Claude `/ark-back`, `/ark-front`, `/ark-data`, `/ark-qa`,
  `/ark-arch` et `/ark-spec` sont conservées pour les sessions manuelles.

## Validations

- `opencode.json` est parseable.
- Les 7 frontmatters Claude et `tasks.yaml` sont parseables.
- `claude -p --agent ark-orchestrator "..."` retourne `ORCHESTRATOR_READY`.
- `opencode run --agent ark-orchestrator "..."` retourne `ORCHESTRATOR_READY`.

## Attention

- T-120 reste ouverte : le verrouillage de `tasks.yaml` n'est pas atomique.
  L'orchestrateur limite donc les délégations mutantes à une seule à la fois,
  mais ne prétend pas résoudre une course entre sessions externes.
- `.claude/settings.local.json` reste local et inchangé. Les interdictions Git
  sont placées dans les définitions de sous-agents pour prévaloir sur ses
  autorisations locales.
