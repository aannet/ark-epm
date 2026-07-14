# SESSION HANDOFF — arch — Croisement des 3 revues de gouvernance

Date : 2026-07-14
Contexte : synthèse des 3 audits de gouvernance (`global-review-gpt56terra.md`, `global-review-claude-sonnet-5.md`, `global-review-kimi27code.md`) puis exécution des corrections consensuelles sans ambiguïté.

## Fait cette session

**Corrections factuelles (déjà appliquées, aucune décision requise)**
- `.claude/commands/ark-front.md` + `opencode.json` : MUI v5 → v9 (2 occurrences), ajout des règles `slotProps.*`.
- `opencode.json` : ajout des agents `ark-arch` et `ark-spec` (manquants — 4/6 rôles seulement étaient activables).
- `.claude/commands/ark-arch.md` et `ark-spec.md` : créés sur le modèle des 4 commandes existantes.
- `frontend/AGENTS.md` + `docs/AGENTS.md` : chemin corrigé vers `docs/02-Design/DESIGN.md` (le fichier n'existe pas à la racine).
- `docs/AGENTS.md` §1 : arborescence dupliquée/contradictoire fusionnée en une seule version exacte (vérifiée sur disque — `00-UI-Kit.md` n'existe pas).
- `docs/AGENTS.md` §3 : table "Specs existantes" recalculée contre `tasks.yaml` — FS-07 (back done/front draft), FS-08 (done), FS-09 (back done/front in_progress), FS-11/FS-12/FS-13 ajoutées (absentes de la table).
- `AGENTS.md` racine + `ark-close-session.md` : schéma YAML corrigé (`feature`/`priorité`/`sessions` étaient indentés comme enfants de `type`, contrairement à l'usage réel).
- `SESSION-HANDOFF.md` racine : entièrement rafraîchi contre `tasks.yaml` (était périmé depuis 2026-05-06 ; affichait encore T-079 comme priorité non résolue alors que `done` depuis le 2026-05-16).

**Décisions structurelles non tranchées — ajoutées comme tâches `arch` dans `tasks.yaml`**

Ces points nécessitent un arbitrage produit/architecture, pas une simple correction. Créées en `type: decision`, `assigned_agent: arch` :

| ID | Sujet | Priorité |
|---|---|---|
| T-118 | Remplacer le gate "back done avant front stable" par un gate "contrat API stable" | high |
| T-119 | Redistribuer le RACI tests entre implémenteurs et QA | high |
| T-120 | Verrouillage non atomique de `tasks.yaml` (risque de collision multi-session) | high |
| T-121 | Assouplir la validation `arch` systématique des migrations Prisma locales | medium |
| T-122 | Conditions d'autorisation de suppression de code sans confirmation | medium |
| T-123 | Remplacer les commentaires `AGENT-DECISION` par des ADR courtes | low |

Chaque tâche contient le constat, la proposition à valider, et l'impact documentaire si validée.

## Volontairement non fait (déféré)

- **Compression des guides (`caveman-compress`)** proposée par une des 3 revues : écartée. Elle écraserait les guides sources sans résoudre le vrai problème (duplication, infos périssables). À traiter via T-121/T-123 et un futur passage de simplification documentaire, pas par compression automatique.
- **Déclarer Playwright comme unique framework E2E UI** : prématuré, Cypress est toujours présent (`frontend/package.json`) et sa migration est un chantier ouvert (T-009, déjà existant dans `tasks.yaml` — pas dupliqué).
- **Créer 5 nouveaux skills ARK** proposés par une revue : non fait, jugé prématuré tant que les incohérences de base ne sont pas validées à l'usage.
- **Corriger le verrou orphelin T-003** (`session_active` ≠ id de session loggée) : signalé dans `SESSION-HANDOFF.md` et T-120, mais non modifié — pas de confirmation qu'aucune session n'est réellement active dessus.

## Points d'attention pour la suite

- T-118 à T-123 sont des tâches de type `decision`, sans `sprint` assigné : à trier lors du prochain rituel `/ark-open-session` par un agent `arch`.
- Si T-118 (gate contrat API) est validé, `docs/AGENTS.md` §2 (Séquencement) devra être réécrit en conséquence.
- Si T-119 (RACI QA) est validé, `AGENTS.md` §3 (RACI) et `e2e/AGENTS.md` devront être mis à jour ensemble pour rester cohérents.
