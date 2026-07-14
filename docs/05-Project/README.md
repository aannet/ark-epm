# ARK-EPM — Workflow Multi-Agent

> Guide opérationnel du suivi de tâches et de la coordination entre agents IA.  
> Ce dossier est la source de vérité du projet en cours de sprint.

---

## Vue d'ensemble

Deux systèmes coexistent et se complètent :

| Système | Fichier | Rôle | Qui écrit |
|---|---|---|---|
| **Task Ledger** | `tasks.yaml` | Source de vérité des tâches — coordination entre agents parallèles | Tous les agents |
| **Sprint Context** | `SESSION-HANDOFF.md` (racine) | Contexte riche de la feature critique du sprint | `spec` et `arch` uniquement |

En P2, ajoutez la couche de pilotage suivante :

- **`roadmap.yaml`** : périmètre fonctionnel par feature.
- **`roadmap-crosswalk.md`** : traçabilité obligatoire `roadmap id ↔ spec ↔ tâches`.
- **`tasks.yaml`** : exécution (qui, quoi, statut, priorités, verrous).

**Principe clé** : en multi-session simultanée, les agents se coordonnent via `tasks.yaml` (verrous `session_active`, statuts), pas via `SESSION-HANDOFF.md`.

---

## Schéma du workflow

```
┌──────────────────────────────────────────────────────────────────┐
│  Sprint  —  piloté par spec / arch                               │
│  SESSION-HANDOFF.md (racine)  ←  lecture seule pour back/front   │
└──────────────┬───────────────────────────────────────────────────┘
               │ lit
   ┌───────────┼────────────────┐
   ▼           ▼                ▼
Session back  Session front  Session qa
/ark-open     /ark-open      /ark-open
   │               │               │
   ├─ lit tasks.yaml, filtre assigned_agent: back/front/qa
   ├─ choisit tâche open
   ├─ statut → in_progress
   └─ session_active: a1b2c3 (verrou déclaratif)
   │               │               │
   │  travaille    │  travaille     │  travaille
   │               │               │
/ark-close    /ark-close     /ark-close
   │               │               │
   ├─ tasks.yaml ← statut: done, session_active: ~
   ├─ archive → docs/05-Project/YYYYMMDD/SESSION-HANDOFF-<agent>-<slug>.md
   └─ NE touche PAS SESSION-HANDOFF.md racine
```

**Archives de session** : `docs/05-Project/<YYYYMMDD>/SESSION-HANDOFF-<agent>-<slug>.md`

```
docs/05-Project/
├── 20260404/
│   └── SESSION-HANDOFF-FS05.md       ← archivé par spec en fin de session
├── 20260408/
│   ├── SESSION-HANDOFF-back-fs07.md  ← archivé par back
│   └── SESSION-HANDOFF-front-fs05.md ← archivé par front (parallèle)
├── tasks.yaml                         ← source de vérité tâches
├── roadmap.yaml                       ← source de vérité features/sprints (dashboard)
└── tasks-dashboard/
    └── index.html                     ← dashboard HTML standalone
```

---

## Slash Commands

| Commande | Outils | Description | Quand l'utiliser |
|---|---|---|---|
| `/ark-open-session [T-XXX]` | OC + CL | Sans argument, sélectionne la tâche prioritaire ; avec `T-XXX`, vérifie et verrouille cette seule tâche | Début de chaque session |
| `/ark-close-session` | OC + CL | Met à jour tasks.yaml (statuts, sessions[]), libère `session_active`, archive le handoff dans `docs/05-Project/` | Fin de chaque session |
| `/ark-task-add` | OC + CL | Ajout rapide d'une tâche avec détection de doublon et Q&A guidé (3 alternatives par champ) | Pense-bête tâches découvertes en cours de session |
| `/ark-back` | CL | Active le mode agent `back` — NestJS, controllers, services, DTOs | Session backend |
| `/ark-front` | CL | Active le mode agent `front` — React, MUI v9, hooks, i18n | Session frontend |
| `/ark-data` | CL | Active le mode agent `data` — Prisma schema, migrations, seeds | Session data |
| `/ark-qa` | CL | Active le mode agent `qa` — Jest, Playwright, Cypress | Session tests |

> Les agents nommés (`ark-back`, `ark-front`, `ark-data`, `ark-qa`) sont aussi disponibles dans OpenCode via `opencode.json`.

⚠️ Rappel pratique : la commande est bien `ark-task-add` (et non `ark-add-task`).

---

## Règle de pilotage P2

Pour les tâches FS-09-P2 et F-999-* :

- Confirmer la présence de la ligne correspondante dans `roadmap-crosswalk.md` avant d'ouvrir la tâche.
- S'assurer que la tâche mentionne dans ses `notes` l'ID roadmap source.
- Si une tâche P2 est ajoutée sans mapping existant, ajouter d'abord la ligne croisée dans `roadmap-crosswalk.md` puis créer `tasks.yaml`.

---

## Agents et domaines

| Agent | `assigned_agent` | Domaine | Peut écrire `SESSION-HANDOFF.md` racine ? |
|---|---|---|---|
| Architecture | `arch` | Stack, dépendances, contrat API, docker-compose | **Oui** |
| Spec / Documentation | `spec` | Feature Specs, glossaire, roadmap, release notes | **Oui** |
| Backend | `back` | NestJS modules, controllers, services, DTOs, auth/RBAC | Non — archive dans `docs/05-Project/` |
| Frontend | `front` | React/MUI v9, pages, hooks, API client, i18n | Non — archive dans `docs/05-Project/` |
| Data | `data` | schema.prisma, migrations, seeds, triggers PostgreSQL | Non — archive dans `docs/05-Project/` |
| QA | `qa` | Tests Jest, Playwright API + e2e, Cypress frontend | Non — archive dans `docs/05-Project/` |

---

## tasks.yaml — Schéma

```yaml
- id: T-NNN                          # padding 3 chiffres, auto-incrémenté
  nom: "Description courte"
  statut: open | in_progress | done | blocked
  assigned_agent: back|front|data|qa|spec|arch
  session_active: ~                  # ~ = libre  /  6 hex = verrou session active
  handoff_ref: "chemin/vers/archive" # optionnel — contexte de la session précédente
  date_resolution: ~                 # ~ si non terminé  /  YYYY-MM-DD si done
  sprint: S1|S2|S3|S4
  theme: "FS-XX" | "QA" | "F-999"
  type: spec|decision|review|debt|impl|test|doc|poc
  feature: "FS-XX-BACK"
  priorité: high|medium|low
  sessions:
    - tool: OC|CL                    # OC = OpenCode  /  CL = Claude Code
      id: "a1b2c3"                   # 6 premiers hex de l'UUID de session
      nom: "description courte"
  notes: |
    Contexte libre, liens, commandes utiles...
```

### Statuts

| Statut | Signification | `session_active` |
|---|---|---|
| `open` | Prête à démarrer | `~` |
| `in_progress` | Travail en cours — session active | `6hex` |
| `done` | Terminée | `~` |
| `blocked` | Gate non levée — voir `notes` | `~` |

### Règles de modification

- Ne jamais supprimer une entrée existante
- Ne jamais reformater l'intégralité du fichier
- Modifier uniquement les entrées concernées
- Incrémenter l'ID depuis le dernier `T-NNN` existant

---

## roadmap.yaml — Schéma

Source de vérité des features par sprint, chargée par le dashboard en parallèle de `tasks.yaml`.  
Maintenu par les agents `spec` et `arch`. Référence canonique : `docs/01-Product/ARK-Roadmap.md`.

```yaml
sprints:
  - id: "S3"                              # P0 | S1 | S2 | S3 | S4 | S5 | P2
    nom: "Sprint 3 — Capacités métier"
    features:
      - id: "FS-07"                       # clé de jointure avec tasks.yaml (champ theme)
        nom: "Business Capabilities"
        back: stable                      # statut implémentation backend
        front: draft                      # statut implémentation frontend
```

### Statuts feature

| Statut | Signification |
|---|---|
| `done` | Implémenté, testé, mergé |
| `stable` | Spec validée — prête pour l'agent de développement |
| `in-progress` | Implémentation en cours |
| `draft` | Spec en cours ou non démarrée |
| `~` | Non applicable (ex : feature purement backend, front = `~`) |

### Lien avec tasks.yaml

Le dashboard calcule la progression de chaque feature en joinant sur le champ `theme` :

```
feature.id == "FS-07"  →  tasks où theme == "FS-07"  →  done/total = % progression
```

### Règles de modification

- Maintenu par `spec` et `arch` uniquement
- Mettre à jour les statuts `back`/`front` après chaque sprint ou changement d'état
- Ne pas supprimer de feature — passer à `done` si terminée
- Synchroniser avec `docs/01-Product/ARK-Roadmap.md` après chaque mise à jour

---

## SESSION-HANDOFF — Règles de propriété

### Fichier racine `SESSION-HANDOFF.md`

Document de sprint **stable**, pas un baton de session à rotation rapide.

```
Propriété exclusive : spec  /  arch
Tous les autres agents : lecture seule
```

Mis à jour uniquement lors d'un **pivot de sprint** ou d'une **nouvelle feature critique**.

### Convention d'archive

À la clôture de session (`/ark-close-session`), si du contexte doit être transmis :

```
docs/05-Project/<YYYYMMDD>/SESSION-HANDOFF-<agent>-<slug>.md
```

Le chemin est ensuite référencé dans `tasks.yaml` via le champ `handoff_ref` de la tâche concernée.

### Workflow multi-agent simultané

```
back (FS-07)                     front (FS-05)
  /ark-open-session                /ark-open-session
  T-011 → in_progress              T-010 → in_progress
  session_active: a1b2c3           session_active: d4e5f6

  [travail]                        [travail]

  /ark-close-session               /ark-close-session
  T-011 → done, session: ~         T-010 → done, session: ~
  archive: 20260408/               archive: 20260408/
    SESSION-HANDOFF-back-fs07.md     SESSION-HANDOFF-front-fs05.md

  ← NE touche PAS le root →        ← NE touche PAS le root →
```

---

## Dashboard & Rapports

### Lancer le dashboard

Servir depuis la **racine du projet** (requis pour que les chemins relatifs fonctionnent) :

```bash
npx serve .
# → Dashboard : http://localhost:<port>/docs/05-Project/tasks-dashboard/
# → Rapport   : http://localhost:<port>/e2e/reports/html/
```

### Fichiers chargés

Le dashboard charge les deux fichiers en parallèle au démarrage :

| Fichier | Onglet | Rôle |
|---|---|---|
| `../tasks.yaml` | Tasks | Liste des tâches, filtres, compteurs |
| `../roadmap.yaml` | Roadmap | Structure sprints/features, statuts back/front |

Si `roadmap.yaml` est absent ou inaccessible, l'onglet Tasks continue de fonctionner normalement.

### Onglet Tasks

Tableau de toutes les tâches avec filtres : Statut · Sprint · Type · Agent · Feature · Recherche.  
Statuts affichés : ✅ done / 🔄 in_progress / 🚫 blocked / ⬜ open.

### Onglet Roadmap

Deux sous-vues accessibles via le toggle **Kanban / Grille** :

**Kanban** — colonnes par sprint (P0 → S5 + P2), scroll horizontal.  
Chaque carte feature affiche les badges `BACK` / `FRONT` (done/stable/in-progress/draft) et une barre de progression calculée depuis `tasks.yaml`.

**Grille** — tableau structuré, lignes groupées par sprint.  
Colonnes : Feature · Sprint · Back · Front · Nb tâches · Progression (%).

La progression est calculée par jointure `feature.id == task.theme` → tâches `done` / total.

### Rapport Playwright

Le lien **Playwright Report ↗** dans le header pointe vers `e2e/reports/html/index.html`.

```bash
make test-api   # exécute les tests API et génère le rapport HTML
make test-api-report    # ouvre le rapport dans le navigateur (port dédié Playwright)
```

---

## Rituel de session — Référence rapide

### Ouverture (`/ark-open-session [T-XXX]`)

1. Sans argument : lire `SESSION-HANDOFF.md`, filtrer les tâches disponibles de ton rôle et sélectionner la plus prioritaire.
2. Avec `T-XXX` : vérifier exclusivement cette tâche (rôle, statut, verrou) sans sélectionner d'alternative.
3. Vérifier les gates (prérequis dans `notes`).
4. Relire la tâche juste avant la pose du verrou : `statut: in_progress` + `session_active: <6hex>`.

### Clôture (`/ark-close-session`)

1. Mettre à jour les tâches touchées dans `tasks.yaml` (`done` ou `open`, `session_active: ~`)
2. Ajouter l'entrée `sessions[]` avec `tool`, `id`, `nom`
3. Si contexte à transmettre → créer `docs/05-Project/<date>/SESSION-HANDOFF-<agent>-<slug>.md`
4. Référencer l'archive dans `handoff_ref` de la tâche

---

*Maintenu par l'équipe humaine avec support de l'Agent Architecture.*
