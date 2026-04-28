---
marp: true
theme: default
paginate: true
footer: "ARK-EPM — Système Documentaire — Avril 2026"
style: |
  section {
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 1.05rem;
  }
  section.title {
    text-align: center;
    justify-content: center;
  }
  h1 { color: #1a3c5e; border-bottom: 3px solid #3b82f6; padding-bottom: 0.3em; }
  h2 { color: #1a3c5e; }
  h3 { color: #2563eb; }
  code { background: #f1f5f9; border-radius: 4px; padding: 0.1em 0.35em; }
  pre { background: #f1f5f9; border-left: 4px solid #3b82f6; }
  table { font-size: 0.88rem; }
  th { background: #1a3c5e; color: white; }
  tr:nth-child(even) { background: #f0f4f8; }
  .legend { font-size: 0.78rem; color: #64748b; margin-top: 0.5em; }
  footer { font-size: 0.75rem; color: #94a3b8; }
---

<!-- _class: title -->

# Système Documentaire ARK-EPM

### Architecture, liaisons et gouvernance des agents IA

---

*Avril 2026 — v1.0*

---

## Les 6 agents — Domaines et responsabilités

| Agent | Domaine | Périmètre clé | Guide opérationnel |
|---|---|---|---|
| `arch` | Architecture | Stack, OpenAPI, Docker, ReactFlow | `AGENTS.md` racine |
| `back` | Backend NestJS | Controllers, services, DTOs, RBAC | `backend/AGENTS.md` |
| `data` | Données / Prisma | `schema.prisma`, migrations, seeds, triggers | `backend/AGENTS.md` |
| `front` | Frontend React | Composants MUI v9, pages, hooks, i18n | `frontend/AGENTS.md` |
| `qa` | Tests | Jest, Playwright, Cypress — **lecture seule** sur le code | `e2e/AGENTS.md` |
| `spec` | Documentation | Feature Specs, glossaire, roadmap | `docs/AGENTS.md` |

<p class="legend">
Règle fondamentale : <strong>un agent = un domaine</strong>.
En cas de chevauchement, <code>arch</code> arbitre.
</p>

---

## Hiérarchie des AGENTS.md

```
AGENTS.md  (racine)
│  ← gouvernance globale : agents, RACI, stack, conventions,
│    anti-patterns, rituels open/close session
│
├── backend/AGENTS.md       ← agents back + data
│   Modules NestJS · Prisma · migrations · triggers PostgreSQL
│   Checklist "nouvelle entité" · troubleshooting P2011 · Docker
│
├── frontend/AGENTS.md      ← agent front
│   Architecture src/ · MUI v9 · i18n fr.json · React Query
│   Zones de clic tableau · design tokens
│
├── e2e/AGENTS.md           ← agent qa
│   5 couches de test · fixtures · sélecteurs · règle bug→test
│
└── docs/AGENTS.md          ← agent spec
    Feature Specs FS-XX · cycle draft→done
    Split back/front obligatoire · gates de séquencement
```

<p class="legend">
Chaque guide opérationnel est <em>subordonné</em> au AGENTS.md racine.
<code>arch</code> n'a pas de fichier dédié — son périmètre est défini dans la racine.
</p>

---

## Liaisons entre agents — Qui lit quoi

```
┌──────────────────────────────────────────────────────────────┐
│                  AGENTS.md (racine)                          │
│         gouvernance · RACI · anti-patterns · rituels         │
└──────┬──────────┬──────────┬───────────┬──────────┬──────────┘
       │          │          │           │          │
       ▼          ▼          ▼           ▼          ▼
    back/       front/      e2e/        docs/
  AGENTS.md   AGENTS.md   AGENTS.md   AGENTS.md
       │          │                       │
       │    lit F01, F02    ┌─────────────┤
       │    DESIGN.md       │             │
       │    theme/index.ts  │             ▼
       │    fr.json         │     ARK-Glossary.md
       │                    │     ARK-NFR.md
       ▼                    │     F99-Technical-Debt.md
  openapi.yaml ◄────────────┘
  (arch R, back C)
```

**Gate de séquencement critique :**
`FS-XX-back.md → stable` est **prérequis** avant que `FS-XX-front.md` puisse atteindre `stable`

---

## Carte des documents — 5 zones

```
docs/
 ├── 01-Product/        PROPRIÉTÉ: spec + human
 │   ARK-Glossary.md ──► valide chaque nouvelle entité
 │   ARK-Roadmap.md · ARK-Personae.md · ARK-Product-Brief.md
 │
 ├── 02-Design/         PROPRIÉTÉ: arch + front
 │   DESIGN.md ──────► src/theme/index.ts  (tokens MUI)
 │
 ├── 03-Features-Spec/  PROPRIÉTÉ: spec
 │   F01-Design-System.md  ──► injecté dans tout spec front
 │   F02-i18n.md           ──► gate prérequis front
 │   F99-Technical-Debt.md ──► gate sprint-end
 │   FS-XX-back.md  ┐  pattern cible
 │   FS-XX-front.md ┘  (split obligatoire depuis S2)
 │
 ├── 04-Tech/           PROPRIÉTÉ: arch
 │   openapi.yaml ──► SOURCE DE VÉRITÉ contrat API
 │   ARK-NFR.md   ──► mis à jour chaque sprint par spec
 │
 └── 05-Project/        PROPRIÉTÉ: tous agents
     tasks.yaml ──────► coordinateur principal multi-agent
     <YYYYMMDD>/SESSION-HANDOFF-<agent>-<slug>.md
```

---

## Les 3 sources de vérité

```
         ┌──────────────────────┐
         │    schema.prisma     │
         │  SOURCE DE VÉRITÉ    │
         │   modèle de données  │
         └──────────┬───────────┘
                    │ génère
          ┌─────────┴──────────┐
          ▼                    ▼
   Prisma Client          schema.sql
   (backend)           (docs/04-Tech/)


         ┌──────────────────────┐
         │    openapi.yaml      │
         │  SOURCE DE VÉRITÉ    │
         │   contrat API        │
         └──────────┬───────────┘
              back implémente
              qa valide


         ┌──────────────────────┐
         │  fr.json             │  i18n
         │  src/theme/index.ts  │  design
         │  SOURCES DE VÉRITÉ   │
         │   UI                 │
         └──────────────────────┘
```

**Règle :** Toute modification `schema.prisma` → validée par `arch` avant migration.

---

## Cycle de vie d'une Feature Spec

```
  spec         spec          back           front          qa
   │            │             │              │              │
   ├─ crée      │             │              │              │
   │  FS-XX-back.md           │              │              │
   │  (draft)   │             │              │              │
   │            │             │              │              │
   ├──────────► review        │              │              │
   │            │             │              │              │
   ├──────────────────────► stable           │              │
   │                          │  ← gate      │              │
   │                          │  débloquée   │              │
   │            crée ◄────────┘              │              │
   │            FS-XX-front.md               │              │
   │            (draft)                      │              │
   │                                         │              │
   │            review ──────────────────► stable           │
   │                                         │              │
   │                                     implémente         │
   │                                     composants         │
   │                                         │  ──────────► tests
   │                                         │              │
   tasks.yaml ◄─────────────── done ◄────────┴──────────── pass
```

---

## Coordination multi-agent — `tasks.yaml`

```yaml
id: T-042
nom: "BC — Lifecycle tab frontend"
statut: in_progress
assigned_agent: front
session_active: b3d7a1        # ← verrou anti-collision
handoff_ref: "docs/05-Project/20260412/SESSION-HANDOFF-front-fs07.md"
sprint: S4
theme: "FS-07"
feature: "FS-07-FRONT"
sessions:
  - tool: OC
    id: b3d7a1
    nom: "implémentation lifecycle tab"
```

**Flux rituel :**

```
/ark-open-session                       /ark-close-session
      │                                        │
      ├─ lit tasks.yaml                        ├─ tâche → done
      ├─ filtre tâches disponibles             ├─ session_active → ~
      └─ pose verrou session_active            ├─ archive SESSION-HANDOFF
                                               └─ handoff_ref dans tasks.yaml
```

<p class="legend">
<code>tasks.yaml</code> = coordinateur principal en contexte multi-agent simultané.
<code>SESSION-HANDOFF.md</code> racine = doc sprint stable (modifiable uniquement par <code>arch</code> + <code>spec</code>).
</p>

---

## Tensions documentaires actuelles

### 1. Legacy "unified" FS-XX.md

Coexistence de fichiers dépréciés et de leur split back/front :

```
FS-03-Providers.md        ← legacy (ne plus modifier)
FS-03-Providers-back.md   ← cible
FS-03-Providers-front.md  ← cible
```
Même situation pour FS-04, FS-05, FS-06, FS-08.

---

### 2. Drift spec / code sur FS-05 et FS-07

`docs/AGENTS.md` déclare FS-05 (Data Objects) et FS-07 (Business Capabilities) en `draft`
→ mais le backend est implémenté.
**Risque :** désynchronisation entre spécification et implémentation réelle.

---

### 3. `SESSION-HANDOFF.md` racine vide

Fichier présent mais sans contenu — normal en l'absence de pivot de sprint,
mais à documenter lors du prochain pivot majeur (`arch` ou `spec`).

---

## Principes clés

```
┌─────────────────────────────────────────────────────────────┐
│  1. UN DOMAINE PAR AGENT                                    │
│     Chevauchement → arbitrage arch                          │
├─────────────────────────────────────────────────────────────┤
│  2. TRAÇABILITÉ OBLIGATOIRE                                 │
│     // AGENT-DECISION: [agent] — raison  dans le code       │
├─────────────────────────────────────────────────────────────┤
│  3. PRISMA = SOURCE DE VÉRITÉ données                       │
│     openapi.yaml = SOURCE DE VÉRITÉ API                     │
│     fr.json + theme/index.ts = SOURCE DE VÉRITÉ UI         │
├─────────────────────────────────────────────────────────────┤
│  4. GATE BACK → FRONT                                       │
│     FS-XX-back stable avant FS-XX-front stable              │
├─────────────────────────────────────────────────────────────┤
│  5. TASKS.YAML = COORDINATEUR                               │
│     Verrou session_active anti-collision multi-agent         │
│     Archive SESSION-HANDOFF par date + agent                │
└─────────────────────────────────────────────────────────────┘
```

<p class="legend">
Source : <code>AGENTS.md</code> (racine) · <code>backend/AGENTS.md</code> · <code>frontend/AGENTS.md</code> · <code>e2e/AGENTS.md</code> · <code>docs/AGENTS.md</code>
</p>

---

<!-- _class: title -->

# Workflow de travail & Mécanique des commandes

### `/ark-task-add` · `/ark-open-session` · `/ark-close-session`

---

## Workflow de travail — Vue d'ensemble

```
                   ┌─────────────────────────┐
                   │   SPEC rédige FS-XX      │
                   └────────────┬────────────┘
                                │
                                ▼
                     /ark-task-add
                   ┌─────────────────────────┐
                   │  tasks.yaml             │
                   │  T-NNN  statut: open    │
                   │  session_active: ~      │
                   └────────────┬────────────┘
                                │  agent disponible
                                ▼
                     /ark-open-session
                   ┌─────────────────────────┐
                   │  filtre tâches open     │
                   │  vérifie gates          │
                   │  verrou session_active  │
                   │  charge Feature Spec    │
                   └────────────┬────────────┘
                                │
                                ▼
                   ╔═════════════════════════╗
                   ║  TRAVAIL                ║
                   ║  code · spec · tests    ║
                   ╚════════════╤════════════╝
                                │
                                ▼
                     /ark-close-session
                   ┌──────────────┬──────────────────┐
                   │  done        │  non terminé      │
                   │  statut:done │  statut: open     │
                   │  date_res.   │  session_active:~ │
                   │  sessions[]  │  sessions[]       │
                   └──────┬───────┴──────────────────┘
                          │ si contexte à passer
                          ▼
             SESSION-HANDOFF-<agent>-<slug>.md
             docs/05-Project/<YYYYMMDD>/
```

---

## `/ark-task-add` — Mécanique

**Rôle :** Ajouter ou mettre à jour une tâche dans `tasks.yaml` avec déduplication sémantique.

```
┌── Étape 1 — Capture ────────────────────────────────────────┐
│  Syntaxe inline :                                           │
│    /ark-task-add [back] [bug] [FS-08] [S4] Desc de la tâche│
│                   ↑      ↑      ↑      ↑                    │
│                 agent  type  theme  sprint                  │
│  → Les tokens bracket pré-remplissent les champs           │
└─────────────────────────────────────────────────────────────┘

┌── Étape 2 — Déduplication ──────────────────────────────────┐
│  Scan sémantique de tasks.yaml :                            │
│  même entité + même bug + même intention ?                  │
│    A) UPDATE entrée existante                               │
│    B) CREATE nouvelle entrée                                │
└─────────────────────────────────────────────────────────────┘

┌── Étape 3 — Q&A unique ─────────────────────────────────────┐
│  Un seul prompt pour tous les champs manquants :            │
│  assigned_agent · type · theme · feature · sprint · notes   │
│  → 3 candidats inférés proposés par champ                  │
└─────────────────────────────────────────────────────────────┘

┌── Étape 4 — Écriture atomique ──────────────────────────────┐
│  4A : Append T-NNN (ID auto-incrémenté, padding 3 chiffres) │
│  4B : Update — JAMAIS sessions[] / statut / date_resolution │
│  Règle : ne jamais supprimer, ne jamais reformater          │
└─────────────────────────────────────────────────────────────┘
```

---

## `/ark-open-session` — Mécanique

**Rôle :** Rituel d'ouverture — identifier la tâche, poser le verrou, charger le contexte.

```
┌── Filtre tasks.yaml ────────────────────────────────────────┐
│                                                             │
│  assigned_agent = mon rôle                                  │
│  ET  statut: open                                           │
│  OU  statut: in_progress + session_active: ~                │
│                                                             │
│  EXCLU :  blocked · done · session_active ≠ ~              │
└─────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌── Vérification des gates ───────────────────────────────────┐
│  Lire notes.prérequis de la tâche choisie                  │
│  Si gate non levée → signaler, ne pas démarrer             │
└─────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌── Pose du verrou (2 champs UNIQUEMENT) ─────────────────────┐
│  statut:          in_progress                               │
│  session_active:  "<6-hex>"   ex: b3d7a1                    │
└─────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌── Chargement contexte ──────────────────────────────────────┐
│  FS-XX-back.md / FS-XX-front.md  (spec de la tâche)        │
│  handoff_ref → SESSION-HANDOFF-<agent>-<slug>.md            │
│  SESSION-HANDOFF.md (racine)                                │
└─────────────────────────────────────────────────────────────┘

Output standardisé :
  Agent    : front
  Tâche    : T-042 — BC Lifecycle tab
  Statut   : in_progress (session_active: b3d7a1)
  Gates OK : oui
  Contexte : FS-07-front.md · SESSION-HANDOFF-front-fs07.md

---

## `/ark-close-session` — Mécanique

**Rôle :** Rituel de clôture — libérer le verrou, journaliser, archiver si nécessaire.

```
┌── Étape 1 — Mise à jour tasks.yaml ────────────────────────┐
│                                                            │
│  Tâche terminée :                                          │
│    statut:          done                                   │
│    date_resolution: YYYY-MM-DD                             │
│    session_active:  ~                                      │
│                                                            │
│  Tâche non terminée :                                      │
│    statut:          open                                   │
│    session_active:  ~        ← libère le verrou            │
│                                                            │
│  Dans tous les cas — append sessions[] :                   │
│    - tool: OC  (OpenCode)  /  CL  (Claude Code)           │
│    - id:   6-hex de la session                             │
│    - nom:  description courte du travail effectué          │
│                                                            │
│  + créer T-NNN pour tout travail significatif non tracé    │
└────────────────────────────────────────────────────────────┘

┌── Étape 2 — Archive handoff (conditionnel) ────────────────┐
│                                                            │
│  Si contexte à transmettre à un autre agent :              │
│                                                            │
│  Créer :  docs/05-Project/<YYYYMMDD>/                      │
│             SESSION-HANDOFF-<agent>-<slug>.md              │
│  Contenu : ce qui a été fait · points d'attention ·        │
│            statut des gates                                │
│  Puis :   renseigner handoff_ref dans tasks.yaml           │
│                                                            │
│  Propriété SESSION-HANDOFF.md (racine) :                   │
│    back · front · data · qa  →  LECTURE SEULE             │
│    spec · arch               →  peuvent écrire            │
└────────────────────────────────────────────────────────────┘
```

---

## Coexistence `.claude/` vs `.opencode/`

Les trois commandes existent en double implémentation :

| | `.claude/commands/` | `.opencode/commands/` |
|---|---|---|
| Date injection | Déduite du contexte ou demandée | `` !`date +%Y-%m-%d` `` (shell live) |
| Tag session | `tool: CL` | `tool: OC` |
| Commandes présentes | 7 fichiers (+ `ark-back/front/data/qa`) | 3 fichiers (task + sessions) |

**Commandes disponibles :**

```
.claude/commands/                  .opencode/commands/
  ark-task-add.md        ◄────►     ark-task-add.md
  ark-open-session.md    ◄────►     ark-open-session.md
  ark-close-session.md   ◄────►     ark-close-session.md
  ark-back.md            (n/a)
  ark-front.md           (n/a)
  ark-data.md            (n/a)
  ark-qa.md              (n/a)
```

<p class="legend">
Les commandes <code>ark-back/front/data/qa</code> activent le rôle agent dans Claude Code.
Dans OpenCode, le rôle est sélectionné via les agents nommés directement.
</p>
