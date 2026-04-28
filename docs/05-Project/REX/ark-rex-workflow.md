# REX ARK-EPM — Gouvernance documentaire & workflow multi-agents

> Date : 2026-04-12  
> Périmètre : Système de gouvernance IA (AGENTS.md), cartographie documentaire, flow de suivi (tasks.yaml / dashboard / commandes ark), cohabitation OpenCode + Claude Code  
> Auteur : Claude Code (session REX)

---

## Sommaire

1. [Axe 1 — Gouvernance : structure des AGENTS.md](#axe-1--gouvernance--structure-des-agentsmd)
2. [Axe 2 — Cartographie documentaire et liaisons](#axe-2--cartographie-documentaire-et-liaisons)
3. [Axe 3 — Flow de travail : tasks.yaml, dashboard, commandes ark](#axe-3--flow-de-travail--tasksyaml-dashboard-commandes-ark)
4. [Axe 4 — Cohabitation OpenCode + Claude Code](#axe-4--cohabitation-opencode--claude-code)
5. [Bilan consolidé](#bilan-consolidé)
6. [Recommandations priorisées](#recommandations-priorisées)

---

## Axe 1 — Gouvernance : structure des AGENTS.md

### 1.1 Hiérarchie des fichiers AGENTS.md

Le projet utilise **5 fichiers AGENTS.md** organisés en 2 niveaux :

```
AGENTS.md (racine, 229 lignes)          ← Gouvernance globale, RACI, conventions
├── docs/AGENTS.md (175 lignes)          ← Agent spec : workflow specs, checklist
├── backend/AGENTS.md (427 lignes)       ← Agent back : NestJS, Prisma, DTOs, auth
├── frontend/AGENTS.md (339 lignes)      ← Agent front : React, MUI v9, i18n, hooks
└── e2e/AGENTS.md (214 lignes)           ← Agent qa : Jest, Playwright, Cypress
```

**Logique de découpe** : le fichier racine définit les règles transverses et délègue les guides opérationnels aux sous-domaines. Un agent charge son AGENTS.md de domaine + le racine au démarrage.

### 1.2 Contenu du AGENTS.md racine

| Section | Contenu | Lignes |
|---------|---------|--------|
| §1 Principes généraux | 9 règles invariantes (un domaine, traçabilité, TypeScript strict, Prisma source vérité, code first, no secrets, lang code=EN, lang UI=FR) | ~15 |
| §2 Agents | Périmètre + "Ne fait PAS" + renvoi vers AGENTS.md de domaine pour chaque agent | ~60 |
| §3 RACI | Matrice 6 activités × 6 agents (Responsable / Consulté / Informé) | ~12 |
| §4 Stack & Conventions | Tableau tech (NestJS/Prisma/React/MUI), naming (PascalCase/camelCase/snake_case/kebab-case), commandes Makefile | ~30 |
| §5 Anti-Patterns Learned | Registre vivant : Drawer, zones de clic tableau, cache VSCode/navigateur/Prisma, P2011 Null constraint | ~20 |
| §Task Log | Schéma YAML tasks, 4 statuts, rituels ouverture/clôture, format ID T-NNN, règles modification | ~50 |
| §SESSION-HANDOFF | Propriété fichier racine (spec/arch uniquement), convention archive datée, workflow multi-agent simulané | ~40 |

### 1.3 Matrice RACI en pratique

| Activité | arch | back | front | data | qa | spec |
|----------|------|------|-------|------|----|------|
| Stack / Docker | **R** | C | C | C | I | I |
| Contrat API / openapi.yaml | **R** | C | I | I | I | I |
| Schema Prisma | C | I | I | **R** | I | I |
| Migration / seed | I | C | I | **R** | I | I |
| Module NestJS CRUD | C | **R** | I | C | I | I |
| Auth / JWT / RBAC | C | **R** | C | I | I | I |
| Composant React / Page | I | I | **R** | I | I | I |
| i18n / Theme MUI | I | I | **R** | I | I | I |
| Tests (toutes couches) | I | C | C | I | **R** | I |
| Feature Spec | C | C | C | C | I | **R** |

### 1.4 Points forts

- **Périmètre "Ne fait PAS" explicite** : chaque agent sait non seulement ce qu'il fait, mais aussi ce qu'il ne touche pas — réduit les conflits d'édition entre agents parallèles.
- **Anti-Patterns Learned** : registre vivant des erreurs passées, consulté en début de session — mémoire collective inter-agents.
- **Verrou déclaratif `session_active`** : pattern élégant sans mutex fichier ni coordination synchrone (cf. Axe 3).
- **RACI clair** : évite les zones grises sur qui valide quoi (arch valide le contrat API, data valide le schema).

### 1.5 Points d'attention

- **Densité du fichier racine** : 229 lignes incluant YAML schema, workflow multi-agent, RACI — risque de surcharge cognitive à chaque session. Envisager un découpage §Task Log → `docs/05-Project/README.md` exclusivement.
- **SESSION-HANDOFF.md racine vide** : la règle est bien documentée (spec/arch can modify) mais le fichier lui-même est vide dans le repo. Le sprint context n'est pas capitalisé au niveau sprint — seules les archives sessions le sont.
- **docs/AGENTS.md duplique** partiellement les conventions de nommage du racine — risque de dérive si l'un est mis à jour sans l'autre.

---

## Axe 2 — Cartographie documentaire et liaisons

### 2.1 Les 5 zones documentaires

```
docs/
├── 01-Product/       (5 fichiers)   Vision, Roadmap, Glossaire, Personas, Templates release
├── 02-Design/        (2 fichiers)   Google Stitch tokens, Navigation patterns (PNS-01 à PNS-11)
├── 03-Features-Spec/ (32 fichiers)  Specs features split back/front + Foundations
├── 04-Tech/          (4 fichiers)   Architecture, NFR, openapi.yaml, schema.sql
└── 05-Project/       (~25 fichiers) Task ledger, roadmap, archives session, dashboard, REX
```

### 2.2 Les 3 sources de vérité absolues

| Source | Fichier | Propriétaire | Portée |
|--------|---------|--------------|--------|
| **Modèle de données** | `backend/prisma/schema.prisma` | data | Tables, colonnes, relations, enums DB |
| **Contrat API** | `docs/04-Tech/openapi.yaml` (85.6K) | arch | Endpoints, schemas request/response |
| **Labels UI + tokens** | `frontend/src/i18n/locales/fr.json` + theme | front | Toutes les chaînes affichées, couleurs, typo |

Ces 3 fichiers sont les seules sources pouvant être considérées comme "à jour" sans vérification croisée. Tout le reste peut dériver.

### 2.3 Structure des Feature Specs (03-Features-Spec/)

```
Foundations/
├── F00-Scaffolding.md          ← Setup projet
├── F01-Design-System.md        ← Composants MUI partagés (référencé par tous les front)
├── F02-i18n.md                 ← Conventions i18n (format clé domain.page.element)
├── F03-Dimension-Tag-Foundation.md  ← Système de tags polymorphique
└── F99-Technical-Debt.md (54K) ← Registre dette technique (items 1–23)

Core Features (split back/front depuis Sprint S2) :
├── FS-01-Auth-RBAC.md          ← Spec unifiée (exception — auth transverse)
├── FS-02-Domains-{back,front}.md
├── FS-03-Providers-{back,front}.md
├── FS-04-IT-Components-{back,front}.md
├── FS-05-Data-Objects-{back,front}.md      (draft — spec non stable)
├── FS-06-Applications-{back,front}.md      (done)
├── FS-07-Business-Capabilities-{back,front}.md  (done)
│   └── P2/FS-07-P2-Lifecycle-front.md      (stable 2026-04-12)
├── FS-08-Interfaces-{back,front}.md        (back done, front draft)
├── FS-09-Dependency-Graph.md               (VIDE — 0 octets, T-003 bloqué)
└── FS-10-Import-Excel.md                   (VIDE — 0 octets)

Templates :
├── _template.md           ← Routeur de spec (v0.4)
├── _template_back.md      ← Template spec backend (22K)
└── _template_front.md     ← Template spec frontend (24K)
```

### 2.4 Cycle de vie d'une Feature Spec

```
                    SPEC BACK                          SPEC FRONT
                       │                                   │
                    draft                               draft
                       │                                   │
  Agent spec rédige ──►│◄── peer review                    │◄── peer review
                       │                                   │
                    review                              review
                       │                                   │
  Spec stable ?  ─────►│ stable ────┐                      │
                        │           │                    ⚠️ GATE : back stable requis
                        │    Agent back implémente          │
                        │           │                    stable
                        │        done ──────────────────────►│
                        │                                   │
                        │                            Agent front implémente
                        │                                   │
                        │                                done
                        │                                   │
                        └──────── Feature complète ─────────┘
```

**La gate formelle** : une spec front ne peut passer `stable` (et donc être implémentée) que si la spec back correspondante est `done`. Cette règle est documentée dans `docs/AGENTS.md` et dans les notes des tâches bloquées.

### 2.5 Graphe de références croisées

```
AGENTS.md (racine)
  → backend/AGENTS.md, frontend/AGENTS.md, e2e/AGENTS.md, docs/AGENTS.md

Toutes les specs front référencent :
  → F01-Design-System.md (composants partagés)
  → F02-i18n.md (conventions clés)
  → DESIGN.md (tokens Google Stitch)
  → 02-Navigation-Patterns.md (patterns UX)

Toutes les specs back référencent :
  → FS-01-Auth-RBAC.md (permissions <resource>:read/write)
  → openapi.yaml (contrat à respecter)

tasks.yaml référence :
  → Specs via le champ `feature` (ex: "FS-07-FRONT-P2")
  → Archives via `handoff_ref` (ex: "docs/05-Project/20260412/SESSION-HANDOFF-data-t052-lifecycle.md")

SESSION-HANDOFF archives référencent :
  → Fichiers modifiés (paths exacts)
  → Tâches créées (T-NNN)
  → Gates débloquées
```

### 2.6 Statut feature matrix (2026-04-12)

| Feature | Back | Front | Bloquant |
|---------|------|-------|----------|
| FS-01 Auth | done | — | — |
| FS-02 Domains | done | done | — |
| FS-03 Providers | done | done | — |
| FS-04 IT Components | done | done | — |
| FS-05 Data Objects | draft | draft | T-049 (liaison apps) |
| FS-06 Applications | done | done | — |
| FS-07 Business Capabilities | done | done | — |
| FS-07-P2 Lifecycle | done | **in_progress** (T-053) | — |
| FS-08 Interfaces | done | draft | T-051 (décision manuelle) |
| FS-09 Dependency Graph | **VIDE** | blocked (T-003) | Spec à rédiger |
| FS-10 Import Excel | **VIDE** | — | Spec à rédiger |

### 2.7 Points forts

- **Split back/front des specs** : évite les specs monolithiques de 100K+, permet la parallélisation des agents.
- **Templates complets** (22K et 24K) : standardisent la qualité — un agent spec suit le même plan sur chaque feature.
- **Gates formelles** : la règle back→front est claire et tracée dans tasks.yaml via les champs `notes` et `handoff_ref`.
- **Séparation zones** : chaque zone docs/ a un propriétaire naturel — peu d'ambiguïté sur où créer un fichier.

### 2.8 Points d'attention

- **2 specs vides** (FS-09, FS-10) : bloquent des tâches d'implémentation, visibles dans le dashboard. Un ticket "spec empty" bloque un ticket "impl" depuis plusieurs sprints (T-003 depuis S2).
- **Dérive spec/code** : FS-05 et FS-07 sont partiellement en `draft` alors que l'implémentation est avancée. Les specs ne sont pas toujours mises à jour après coup.
- **F99-Technical-Debt.md à 54K** : fichier très volumineux avec items numérotés. Risque qu'il ne soit pas relu systématiquement entre sessions — certains items (ex: Item 22, Item 24) sont découverts par accident lors d'autres tâches.
- **openapi.yaml non versionné** avec les features : difficile de savoir à quelle version de spec correspond le contrat API sans recouper avec git log.

---

## Axe 3 — Flow de travail : tasks.yaml, dashboard, commandes ark

### 3.1 Architecture du système de suivi

```
┌────────────────────────────────────────────────────────────────┐
│                     SOURCES DE DONNÉES                          │
│                                                                  │
│   tasks.yaml (tâches actives)     tasks-done.yaml (archive)     │
│   ├─ 53 entrées T-001→T-053       ├─ 46 entrées T-001→T-046     │
│   ├─ statuts : open/in_progress/  └─ toutes en statut done      │
│   │            done/blocked                                      │
│   └─ session_active locking                                      │
│                                                                  │
│   roadmap.yaml (features × sprints)                             │
│   └─ statuts back/front par feature (P0, S1–S5, P2)            │
└──────────────────────┬─────────────────────────────────────────┘
                       │ (chargement fetch HTTP)
                       ▼
┌────────────────────────────────────────────────────────────────┐
│         DASHBOARD HTML (tasks-dashboard/index.html)            │
│                                                                  │
│  Vue Tasks   : table filtrable                                   │
│    Filtres : statut / sprint / type / agent / feature / texte  │
│    Colonnes : ID, nom, sprint, thème, type, agent, sessions,   │
│               date résolution, notes                            │
│                                                                  │
│  Vue Roadmap : kanban features × sprints                        │
│    Colonnes : P0, S1, S2, S3, S4, S5, P2                       │
│    Cartes : feature + statut back/front + % avancement          │
│                                                                  │
│  Lancement : make project-dashboard → http://localhost:4000/    │
│              docs/05-Project/tasks-dashboard/                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│              COMMANDES ARK (skills Claude Code)                 │
│                                                                  │
│  /ark-task-add                                                   │
│    Dédup sémantique → Q&A guidé → auto-incrément T-NNN          │
│    Règle : jamais supprimer, jamais reformater                   │
│                                                                  │
│  /ark-open-session                                               │
│    Lit tasks.yaml + SESSION-HANDOFF                             │
│    Filtre tâches disponibles pour l'agent courant               │
│    Vérifie gates/prérequis                                       │
│    Pose verrou : session_active: <6hex>                          │
│                                                                  │
│  /ark-close-session                                              │
│    Met à jour tasks.yaml (statut, sessions[], date_resolution)  │
│    Libère : session_active: ~                                    │
│    Archive SESSION-HANDOFF → docs/05-Project/<YYYYMMDD>/        │
│    Crée nouvelles tâches si travail généré                       │
│                                                                  │
│  /ark-front, /ark-back, /ark-data, /ark-qa                      │
│    Active le contexte de domaine (AGENTS.md de domaine)         │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Cycle de vie complet d'une tâche

```
1. CRÉATION
   /ark-task-add "description"
       ↓
   Scan dédup → Q&A (agent, type, sprint, thème, feature)
       ↓
   Entrée dans tasks.yaml : statut: open, session_active: ~

2. OUVERTURE DE SESSION
   /ark-open-session
       ↓
   Lecture tasks.yaml → filtre par agent + statut open
       ↓
   Choix tâche → statut: in_progress, session_active: f3a9c1

3. IMPLÉMENTATION
   Agent travaille (code / spec / tests / data)
       ↓
   Référence à la tâche dans les commits :
   git commit -m "feat(back): T-040 — FS-08 Interfaces module"

4. CLÔTURE
   /ark-close-session
       ↓
   tasks.yaml :
     statut: done
     date_resolution: YYYY-MM-DD
     session_active: ~
     sessions: [{tool: CL, id: f3a9c1, nom: "description"}]
     handoff_ref: "docs/05-Project/YYYYMMDD/SESSION-HANDOFF-<agent>-<slug>.md"
       ↓
   Archive SESSION-HANDOFF créée si contexte à transmettre

5. ARCHIVAGE (manuel, périodique)
   Tâches done → déplacées dans tasks-done.yaml
   tasks.yaml allégé pour les nouvelles sessions
```

### 3.3 Convention SESSION-HANDOFF

```
docs/05-Project/
├── SESSION-HANDOFF.md       ← SPRINT CONTEXT (spec/arch only)
│                               Doc stable, pas un relay de session
│                               Actuellement vide — non alimenté
│
└── <YYYYMMDD>/
    ├── SESSION-HANDOFF-back-t040-fs08.md
    ├── SESSION-HANDOFF-data-t052-lifecycle.md
    ├── SESSION-HANDOFF-spec-t017-fs07-lifecycle.md
    └── SESSION-HANDOFF-front-fs07-phase1.md
        (pattern : <agent>-<slug>.md)
```

**Contenu type d'un SESSION-HANDOFF** :
- Résumé de ce qui a été fait (statut, fichiers modifiés)
- Résultats de validation (tests passés/échoués)
- Gates débloquées / créées
- Tâches dérivées créées (T-NNN)
- Contexte à transmettre à l'agent suivant

### 3.4 Métriques de suivi (2026-04-12)

| Statut | tasks.yaml | tasks-done.yaml | Total |
|--------|-----------|-----------------|-------|
| done | 22 | 46 | **68** |
| in_progress | 1 | — | 1 |
| open | 5 | — | 5 |
| blocked | 2 | — | 2 |
| **Total** | **53** | **46** | **99** |

**Chaîne de gate visible dans tasks.yaml** :  
`T-017 (spec, done)` → `T-052 (data, done)` → `T-053 (front, in_progress)`  
Tracée via `handoff_ref` dans chaque entrée.

### 3.5 Archives SESSION-HANDOFF par période

| Période | Sessions archivées | Agents actifs |
|---------|-------------------|---------------|
| 2026-03-29 | 5 fichiers (sprint S1-S2) | back, front |
| 2026-03-31 | 1 (sprint S2 context) | spec |
| 2026-04-04 | 1 (FS-05) | front |
| 2026-04-08 | 7 fichiers | back (×3), front (×3), qa (×1) |
| 2026-04-09 | 1 (Playwright FS-07) | qa |
| 2026-04-12 | 4 fichiers | spec (×2), back (×1), data (×1) |
| **Total** | **19 archives** | — |

### 3.6 Points forts

- **Verrou déclaratif `session_active`** : pas de mutex fichier, pas de coordination synchrone. Un agent lit la valeur et sait si la tâche est libre. Simple et efficace.
- **tasks-done.yaml** : découplage entre ledger actif (compact) et historique complet. Évite la dégradation des performances du dashboard sur des centaines d'entrées.
- **Dashboard HTML zero-dependency** : `make project-dashboard` suffit — pas de Node.js à installer, pas de build, pas de backend. Accessible immédiatement.
- **Chaîne de gate tracée** : `handoff_ref` permet de remonter la chaîne T-017→T-052→T-053 sans chercher dans git log.
- **Déduplication sémantique** dans `/ark-task-add` : évite la prolifération de tâches doublon (ex: T-043 → renommé T-047 lors d'une consolidation).

### 3.7 Points d'attention

- **Migration tasks→tasks-done manuelle** : aucun mécanisme automatique. Risque de désynchronisation si une tâche est marquée `done` dans tasks.yaml mais jamais archivée dans tasks-done.yaml. Le dashboard charge les deux fichiers donc affiche potentiellement des doublons en transition.
- **Dashboard nécessite un serveur HTTP** : `fetch()` échoue silencieusement si ouvert en `file://`. Nécessite `make project-dashboard` — une erreur courante pour les nouveaux.
- **`session_active` non enforced mécaniquement** : si deux agents ouvrent la même tâche sans coordination, le second écrase le verrou du premier. Repose entièrement sur la discipline des agents.
- **`roadmap.yaml` maintenu séparément** : les statuts features dans roadmap.yaml (back: done / front: draft) peuvent diverger des statuts réels dans tasks.yaml. Double source partielle.
- **SESSION-HANDOFF.md racine vide** : la règle de propriété est bien documentée mais le fichier est vide. Le "sprint context" existe implicitement dans les commits et handoffs datés, mais n'est pas formalisé au niveau sprint.

---

## Axe 4 — Cohabitation OpenCode + Claude Code

### 4.1 Deux outils, un seul workflow

Le projet est piloté en parallèle par **deux outils IA** : OpenCode (`OC`) et Claude Code (`CL`). Les deux sont utilisés de façon interchangeable, sans distinction de rôle ou de type de session — un agent peut être exécuté dans l'un ou l'autre selon le contexte du moment.

```
Humain
  │
  ├─── OpenCode (OC)       ──┐
  │    sessions longues,      │  Lit / écrit
  │    agents nommés          ├──► tasks.yaml  (source de vérité partagée)
  │                           │
  └─── Claude Code (CL)   ──┘
       skills /ark-*,
       sessions ponctuelles
```

**Ce qui rend la cohabitation possible** : `tasks.yaml` est la source de vérité unique. Les deux outils lisent et écrivent dans le même fichier selon les mêmes conventions (schéma YAML, verrou `session_active`, format `sessions[]`). Aucune synchronisation inter-outils n'est nécessaire.

### 4.2 Traçabilité : le champ `tool` dans sessions[]

Chaque session est enregistrée avec son outil d'origine :

```yaml
sessions:
  - tool: OC          # OpenCode
    id: "d4a1f2"
    nom: "schema lifecycleStatus + DTOs + service + db push"
  - tool: CL          # Claude Code
    id: "f3a9c1"
    nom: "impl LifecycleStepper + onglet Lifecycle BC"
```

C'est **le seul endroit** où l'outil est tracé. Le SESSION-HANDOFF archive, les commits, et roadmap.yaml ne distinguent pas OC de CL.

### 4.3 Asymétrie des rituels

Les skills `/ark-open-session`, `/ark-close-session`, `/ark-task-add` sont des **skills Claude Code** (fichiers `.claude/commands/`). OpenCode ne les exécute pas comme des slash commands — il suit les mêmes rituels, mais via ses propres mécanismes (agents nommés, prompts système).

En pratique, les rituels sont équivalents dans les deux outils : les deux lisent tasks.yaml, posent le verrou `session_active`, et écrivent les résultats selon le même schéma. La gouvernance est dans **les fichiers** (AGENTS.md, tasks.yaml), pas dans l'outil — c'est ce qui rend la cohabitation robuste.

### 4.4 Frictions connues

Aucune friction constatée entre OpenCode et Claude Code sur ce projet.

Le principal risque théorique reste le **verrou non enforced mécaniquement** (cf. §3.7) : si deux sessions (une OC, une CL) ouvrent la même tâche simultanément, le second écrit écrase le premier. Ce risque est identique avec deux sessions du même outil — il n'est pas spécifique à la cohabitation OC/CL.

### 4.5 Points forts

- **Indépendance de l'outil** : la gouvernance repose sur des fichiers texte (Markdown, YAML), pas sur des APIs propriétaires — les deux outils peuvent lire et écrire sans adaptation.
- **Traçabilité fine** : le champ `tool: OC|CL` dans `sessions[]` permet de retrouver quel outil a produit quel résultat.
- **Flexibilité opérationnelle** : l'humain choisit l'outil selon son contexte (interface disponible, préférence du moment) sans impact sur le workflow.

### 4.6 Points d'attention

- **Seul `sessions[]` tracke l'outil** : les SESSION-HANDOFF archives, les commits git et roadmap.yaml ne portent pas cette information. Impossible de reconstituer "quelle part du projet a été faite en OC vs CL" sans analyser tasks.yaml/tasks-done.yaml.
- **Skills ark uniquement dans Claude Code** : si le workflow évolue pour s'appuyer davantage sur les skills (ex: nouveaux rituels), OpenCode devra maintenir une équivalence fonctionnelle à la main. Risque de divergence si les skills sont enrichis sans mise à jour des prompts OpenCode correspondants.

---

## Bilan consolidé

### Ce qui fonctionne bien

| # | Point fort | Impact |
|---|------------|--------|
| 1 | RACI clair + périmètre "Ne fait PAS" | Peu de conflits d'édition entre agents parallèles |
| 2 | Gates formelles back→front | Aucune implémentation front sur spec unstable |
| 3 | Split back/front des specs | Parallélisation possible (ex: 4 agents le 2026-04-08) |
| 4 | Verrou `session_active` déclaratif | Coordination multi-agents sans infrastructure |
| 5 | `tasks-done.yaml` archive séparée | Ledger actif compact, historique préservé |
| 6 | SESSION-HANDOFF archives datées | Contexte inter-sessions préservé avec traçabilité |
| 7 | Anti-Patterns Learned dans AGENTS.md | Mémoire collective persistée entre sessions |
| 8 | Dashboard HTML self-contained | Visibilité projet sans infra dédiée |

### Ce qui mérite attention

| # | Point d'attention | Sévérité | Axe |
|---|-------------------|----------|-----|
| 1 | 2 specs vides (FS-09, FS-10) bloquent des tâches depuis S2 | Haute | Axe 2 |
| 2 | Migration tasks→tasks-done manuelle | Moyenne | Axe 3 |
| 3 | SESSION-HANDOFF.md racine vide | Moyenne | Axe 3 |
| 4 | Dérive spec/code (FS-05, FS-07 partiellement draft) | Moyenne | Axe 2 |
| 5 | F99-Technical-Debt.md trop volumineux (54K) | Moyenne | Axe 2 |
| 6 | `session_active` non enforced | Basse | Axe 3 |
| 7 | `roadmap.yaml` double source partielle | Basse | Axe 3 |
| 8 | AGENTS.md racine dense (229 lignes) | Basse | Axe 1 |

---

## Recommandations priorisées

### R1 — Rédiger les specs FS-09 et FS-10 (Haute)

**Problème** : T-003 est bloqué depuis S2 faute de spec FS-09. FS-10 est dans le même état.  
**Action** : Agent `spec` rédige `FS-09-Dependency-Graph.md` (back + front) à partir de l'existant ReactFlow dans la stack. Même approche pour FS-10.  
**Bénéfice** : Débloque T-003, ouvre le sprint FS-09.

### R2 — Automatiser la migration tasks→tasks-done (Moyenne)

**Problème** : Migration manuelle, risque de désynchronisation et d'oubli.  
**Action** : Ajouter dans `/ark-close-session` une étape qui déplace automatiquement dans tasks-done.yaml toutes les tâches `done` de plus de N jours dans tasks.yaml, ou créer un skill `/ark-archive-done`.  
**Bénéfice** : Ledger actif toujours compact, cohérence garantie.

### R3 — Alimenter SESSION-HANDOFF.md racine à chaque fin de sprint (Moyenne)

**Problème** : Le fichier est vide — le contexte sprint est dispersé dans les archives datées et les commits.  
**Action** : Définir une convention : agent `spec` ou `arch` met à jour SESSION-HANDOFF.md (racine) à la clôture de chaque sprint avec : features terminées, en cours, gates actives, prochaines priorités.  
**Bénéfice** : Point d'entrée unique pour tout nouvel agent arrivant en milieu de sprint.

### R4 — Mettre à jour les specs après implémentation (Moyenne)

**Problème** : FS-05 et FS-07 ont des sections encore en `draft` alors que l'implémentation a progressé.  
**Action** : Ajouter dans le rituel de clôture une vérification : "la spec correspondante reflète-t-elle l'état réel du code ?". Si non, créer une tâche `spec` de mise à jour.  
**Bénéfice** : Évite la dérive spec/code qui se creuse sprint après sprint.

### R5 — Fragmenter F99-Technical-Debt.md (Moyenne)

**Problème** : 54K dans un seul fichier, difficile à tenir à jour et à consulter systématiquement.  
**Action** : Extraire chaque item F-999 dans une tâche tasks.yaml dédiée (type: debt), ou limiter F99 aux items non trackés et créer des tâches pour les items actifs.  
**Bénéfice** : Dette visible dans le dashboard, assignable à un agent, trackable.

### R6 — Ajouter un `make dashboard-check` (Basse)

**Problème** : Dashboard silencieusement vide si ouvert en file://.  
**Action** : Ajouter dans le Makefile une target `dashboard-check` qui vérifie que le serveur tourne avant d'ouvrir le dashboard, ou afficher une alerte visuelle dans index.html si fetch() échoue.  
**Bénéfice** : Réduction des "pourquoi le dashboard est vide ?" en début de session.

### R7 — Consolider roadmap.yaml dans tasks.yaml (Basse)

**Problème** : Deux fichiers maintiennent des statuts features (roadmap.yaml: back/front status ; tasks.yaml: tâches dérivées).  
**Action** : Calculer le statut feature dans roadmap.yaml dynamiquement depuis tasks.yaml (ex: feature back=done si toutes les tâches impl/back sont done), ou abandonner roadmap.yaml comme source de statut et le garder uniquement pour la structure sprint.  
**Bénéfice** : Une seule source de vérité pour les statuts.

---

*REX rédigé par Claude Code (session 2026-04-12) — à relire et enrichir par l'équipe humaine.*
