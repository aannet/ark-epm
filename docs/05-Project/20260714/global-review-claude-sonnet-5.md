# Global Review — Gouvernance multi-agents ARK-EPM

**Date** : 2026-07-14
**Réalisé par** : Claude Sonnet 5 (analyse à la demande de l'utilisateur)
**Type** : audit transverse — aucune modification appliquée par cette session, analyse uniquement

## Contexte

Audit complet du système de gouvernance multi-agents ARK-EPM : les 5 fichiers `AGENTS.md` (racine, backend, frontend, docs, e2e) et les 7 commandes `/ark-*` dans `.claude/commands/` (il n'y a pas de répertoire `.claude/skills/` sur ce projet — les "skills" ARK sont en réalité des slash-commands). Objectif : repérer les incohérences, les trous de couverture et la dette documentaire qui ralentissent réellement le travail, sans proposer de sur-ingénierie.

Périmètre couvert : 5× `AGENTS.md`, 7× `.claude/commands/ark-*.md`, `docs/05-Project/tasks.yaml` (52 tâches), `SESSION-HANDOFF.md` racine, 16 répertoires d'archive `docs/05-Project/<date>/`, absence de skills globaux `~/.claude/`.

---

## A. Bugs factuels confirmés (haute confiance — chaque point vérifié sur le disque, pas juste lu dans la doc)

### A1. `DESIGN.md` — chemin cassé dans 2 fichiers
`frontend/AGENTS.md` §2 et `docs/AGENTS.md` §1 (première version de l'arbre) disent tous deux **"DESIGN.md à la racine du projet"** et l'agent `front` est instruit de le charger en tout premier avant tout travail UI. Or `ls` confirme qu'**aucun `DESIGN.md` n'existe à la racine** — le fichier réel est à `docs/02-Design/DESIGN.md`.
**Impact** : la toute première instruction opérationnelle du guide `front` pointe vers un fichier inexistant. Risque concret de perte de temps ou d'implémentation sans les tokens de design.

### A2. Contradiction de version MUI (v5 vs v9)
`.claude/commands/ark-front.md` — le fichier chargé en tout premier à chaque `/ark-front` — dit **"MUI v5 exclusif"** (dans la description *et* dans les règles). Mais `AGENTS.md` racine, `frontend/AGENTS.md` et `CLAUDE.md` disent tous **MUI v9**, avec des règles v9-spécifiques déjà documentées (`slotProps.paper` au lieu de `PaperProps`, pas de `Grid` imbriqué, etc.).
**Impact** : c'est le fichier le plus court, le plus lu, le premier chargé — le plus susceptible d'influencer un agent vers des patterns v5 dépréciés qui casseraient silencieusement (props renommées entre v5 et v9).

### A3. `docs/AGENTS.md` §1 — section dupliquée et contradictoire
Le fichier contient **deux arborescences différentes** de `docs/` collées à la suite (une version "simple" se terminant par une note sur `DESIGN.md à la racine`, suivie d'une version "détaillée" qui référence `docs/02-Design/00-UI-Kit.md`). Vérification sur disque : `00-UI-Kit.md` **n'existe pas** — seuls `DESIGN.md` et `02-Navigation-Patterns.md` sont présents dans `docs/02-Design/`. Aucune des deux versions collées n'est donc exacte, et c'est un artefact d'édition manifeste (copier-coller non nettoyé).

### A4. `SESSION-HANDOFF.md` racine — périmé de plus de deux mois
Dernière mise à jour : **2026-05-06** (dernière tâche connue T-102). Aujourd'hui : **2026-07-14**. Pendant cet intervalle, `tasks.yaml` a avancé jusqu'à T-117 (FS-13 User Settings, livré aujourd'hui même côté back). Concrètement :
- Le document affiche encore **"Priorité absolue non résolue : T-079 — Vulnérabilité sécurité tags"** — vérifié dans `tasks.yaml` : **T-079 est `statut: done`** depuis longtemps (avant même T-098, sprint S4).
- Aucune trace de FS-12 (avancé depuis) ni FS-13 (nouveau).
- C'est le tout premier document chargé par `/ark-open-session` ("Contexte sprint actif"), alors qu'`AGENTS.md` dit explicitement que **`tasks.yaml` est "le coordinateur principal", pas `SESSION-HANDOFF.md`**. Le fichier racine n'est censé être touché que par `spec`/`arch` "lors d'un pivot de sprint" — mais visiblement personne ne l'a fait depuis deux mois malgré l'avancement réel du sprint S5.
**Impact** : chaque nouvelle session récupère en priorité un résumé obsolète, avec un risque concret de re-signaler un problème de sécurité déjà résolu, ou de manquer 15+ tâches de contexte récent.

### A5. Bug d'indentation du schéma YAML de `tasks.yaml`, dupliqué dans 3 fichiers
Le bloc "Schéma d'une entrée" — présent presque à l'identique dans `AGENTS.md` racine et `ark-close-session.md` — indente `feature:` et `priorité:` **sous** `type:`, suggérant une imbrication qui n'existe pas dans l'usage réel. Preuve : `tasks.yaml` lui-même et l'exemple "Cas A" de `ark-task-add.md` traitent ces deux champs comme des frères de `type`, au même niveau que `id`/`nom`/`statut`. Un agent qui suivrait littéralement ce schéma risquerait de générer du YAML mal formé.

---

## B. Trou structurel de couverture (logique d'attribution)

### B1. Les rôles `arch` et `spec` n'ont pas de commande d'activation
4 des 6 rôles définis dans `AGENTS.md` (`back`, `front`, `data`, `qa`) ont chacun un `/ark-xxx` dédié qui charge le bon guide opérationnel et rappelle les règles clés en un geste. **`arch` et `spec` n'en ont aucun** — vérifié : seuls 7 fichiers existent dans `.claude/commands/` (back, front, data, qa, open-session, close-session, task-add).

C'est significatif parce que ces deux rôles sont justement les plus structurants côté RACI :
- `spec` est **Responsable** de toute Feature Spec, et la règle est explicite : *"Nouvelle entité EA = créer la paire de specs **avant** le code"* — un rôle gatekeeper en amont de tout, mais sans rituel reproductible.
- `arch` est **Responsable** sur "Stack/dépendances/Docker" et "Contrat API/OpenAPI", et arbitre tout chevauchement entre agents (règle du §1). Sans skill dédié, son activation dépend de la mémoire de l'utilisateur pour charger `AGENTS.md` manuellement.

**Conséquence observable** : rien dans `/ark-back` ne renvoie vers une validation `arch` avant de toucher au contrat API, alors que le RACI dit `arch` = R sur ce point et `back` = C seulement. Cohérent avec l'historique réel (`git log`) : le dernier commit backend (FS-13) a mis à jour `openapi.yaml` directement, sans étape `arch` visible dans `tasks.yaml`. Soit la case RACI est aspirationnelle et jamais vraiment appliquée, soit elle est contournée faute d'outillage — dans les deux cas, ça vaut la peine d'être tranché explicitement plutôt que de rester une règle écrite mais non opérationnalisée.

---

## C. Ce qui fonctionne bien (à ne pas casser en corrigeant le reste)

- **Split back/front des specs** : décision documentée avec sa justification (signal/bruit pour un agent IA) — bon niveau de réflexion, pas de sur-ingénierie.
- **Convention d'archive `SESSION-HANDOFF-<agent>-<slug>.md`** : respectée à **100%** sur les 16 dossiers datés depuis avril 2026 (vérifié empiriquement) — seuls les 3 dossiers antérieurs à la formalisation (fin mars/début avril) ne suivent pas le pattern, ce qui est cohérent avec "Version 2.0 — Avril 2026" affichée en tête d'`AGENTS.md`.
- **`tasks.yaml` est réellement vivant** : 52 tâches, usage multi-outils cohérent (`tool: OC` et `tool: CL` mélangés), schéma globalement bien suivi dans la pratique (l'écart noté en A5 est dans la doc, pas dans l'usage).
- **Guides opérationnels `backend/AGENTS.md`, `e2e/AGENTS.md`** : denses et concrets, avec du troubleshooting réel issu d'incidents (P2011, cache Prisma) plutôt que de la théorie — bon niveau d'actionnabilité.
- **Registre "Anti-Patterns Learned"** : existe et semble effectivement consulté (GR3 respectée).

---

## D. Recommandations, classées par effort/impact

**Corrections ponctuelles (quelques minutes chacune, zéro ambiguïté)**
1. `ark-front.md` : remplacer "MUI v5" par "MUI v9" (2 occurrences) — (A2)
2. `frontend/AGENTS.md` + `docs/AGENTS.md` : corriger le chemin vers `docs/02-Design/DESIGN.md` — (A1)
3. `docs/AGENTS.md` §1 : supprimer la version dupliquée, ne garder qu'une arborescence exacte — (A3)
4. `AGENTS.md`, `ark-close-session.md` (et vérifier `ark-task-add.md`) : corriger l'indentation `feature`/`priorité` dans le bloc schéma — (A5)

**Impact moyen (nécessite une décision produit, pas juste une correction)**
5. Rafraîchir `SESSION-HANDOFF.md` racine, ou réévaluer son utilité : puisque `tasks.yaml` est déjà documenté comme "le coordinateur principal", ce second document crée exactement le risque de dérive observé en A4. Deux options : (a) l'alimenter réellement à chaque fin de sprint comme prévu, ou (b) le remplacer par une vue générée/dérivée de `tasks.yaml` pour éliminer le risque de désynchronisation.

**Structurel**
6. Créer `/ark-arch` et `/ark-spec` sur le modèle des 4 skills existants, pour que les 6 rôles définis dans `AGENTS.md` aient tous un rituel d'activation cohérent — referme le trou de B1.
