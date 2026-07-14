# SESSION HANDOFF — arch — Ouverture ciblée optionnelle

Date : 2026-07-14
Tâche : T-126 — done

## Livré

- `.claude/commands/ark-open-session.md` et
  `.opencode/commands/ark-open-session.md` acceptent maintenant l'argument
  optionnel `T-XXX`.
- Sans argument, le flux manuel est inchangé : filtrage par rôle puis sélection
  de la tâche disponible la plus prioritaire.
- Avec `T-XXX`, le rituel vérifie exclusivement la tâche ciblée : existence,
  rôle, statut, verrou, contrôles P2 et gates. Toute erreur arrête le rituel
  sans modifier `tasks.yaml`.
- Les commandes relisent la tâche immédiatement avant de poser le verrou et
  affichent `Mode : automatique | ciblé` dans leur sortie.
- Les délégations de `ark-orchestrator` transmettent désormais l'instruction
  d'ouvrir la tâche ciblée.
- Les rôles OpenCode sont passés de `mode: subagent` à `mode: all`, afin de
  rester utilisables directement tout en demeurant délégables. Leur permission
  `task: deny` conserve l'interdiction de délégation récursive.

## Validations

- JSON OpenCode et YAML de `tasks.yaml` parseables.
- Claude : `claude -p --agent ark-back "/ark-open-session T-999"` refuse
  l'ID absent sans écriture.
- OpenCode : `opencode run --agent ark-back --command ark-open-session T-999`
  utilise bien `ark-back` et refuse l'ID absent sans fallback ni écriture.

## Usage

```text
/ark-open-session          # flux manuel, sélection automatique
/ark-open-session T-117    # flux supervisé, tâche exacte
```
