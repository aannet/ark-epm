# ADR-001 — Orchestration supervisée multi-runtime

Date : 2026-07-14
Statut : accepted

## Contexte

ARK-EPM possédait six rôles métier, mais aucun agent contrôleur capable de
qualifier une demande, vérifier les gates et coordonner une délégation. Les
configurations OpenCode et Claude Code ne fournissaient pas le même mécanisme
de sous-agents.

## Décision

Introduire `ark-orchestrator` comme plan de contrôle non-mutant commun aux
deux runtimes. Il prépare un plan, attend l'approbation explicite de
l'utilisateur, puis délègue un seul rôle métier à la fois.

Les rôles `arch`, `back`, `front`, `data`, `qa` et `spec` restent les seuls
propriétaires de tâches. Ils ne peuvent pas déléguer ni committer.

## Conséquences

- OpenCode : `ark-orchestrator` est primaire ; les rôles métier sont
  utilisables directement ou comme sous-agents, avec délégation demandant
  confirmation.
- Claude Code : `claude --agent ark-orchestrator` active la même politique ;
  les définitions projet sous `.claude/agents/` limitent les délégations aux
  six rôles ARK.
- Le verrouillage non atomique de `tasks.yaml` n'est pas résolu par cette ADR
  et demeure suivi par T-120.
