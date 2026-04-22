# Agentic Engineering : la double maturité

> VP Engineering & Head of Architecture — ARK-EPM  
> Public : développeurs (toutes technos)  
> Format : Markdown (Reveal.js / MARP)

---

## Accroche

On a commencé comme tout le monde.

Un agent généraliste, des prompts longs, du copier-coller.

4 mois plus tard, ce repository est tenu par une **équipe d'agents spécialisés** avec des rituels, des verrous et une mémoire partagée.

Ce n'est pas le produit qui prouve la maturité.

**C'est la démarche qui a permis de le construire.**

---

## Contexte — ARK-EPM en 30 secondes

Référentiel d'architecture d'entreprise (EA)

- Graphe de dépendances (ReactFlow)
- 11 entités métier (Applications, Domaines, Fournisseurs...)
- Import Excel, omnisearch, RBAC, i18n full-stack
- Stack : NestJS + Prisma + PostgreSQL / React + Vite + MUI v5

**Le déclencheur** : le fossé entre *"j'ai testé ChatGPT sur un endpoint"* et *"j'ai industrialisé une équipe d'agents"*.

---

## Narrative centrale

Deux axes de maturité à démontrer :

1. **Le produit livré** — preuve technique  
2. **La démarche de construction** — preuve organisationnelle

On va montrer que l'un ne va pas sans l'autre.

---

# AXE 1 — La maturité du produit

*"Ce qu'on a construit"*

> Un agent ne livre pas du bricolage.  
> Voici les exigences d'un produit professionnel, toutes satisfaites.

---

## La pile tech dans son ensemble

```
┌─────────────────────────────────────────┐
│  Frontend          │  React + Vite + TS   │
│  UI                │  MUI v5 + ReactFlow  │
│  Data Fetching     │  React Query + Axios │
│  Tests UI          │  Playwright + Cypress│
│  i18n              │  i18next (~800 clés) │
├─────────────────────────────────────────┤
│  API Contract      │  OpenAPI 3.0 (v1.4)  │
│  Backend           │  NestJS + Prisma ORM │
│  Auth              │  JWT + RBAC (4 modèles)│
│  DB                │  PostgreSQL 16       │
│  Tests API         │  Jest + Supertest + Playwright│
├─────────────────────────────────────────┤
│  Infra             │  Docker Compose (3 services) │
│  Sécurité          │  Semgrep + Trivy + ZAProxy   │
│  Orchestration     │  Makefile (393 lignes)       │
└─────────────────────────────────────────┘
```

🎬 **Démo 1 (statique)** : capture du `docker-compose.yml` — 3 services, healthchecks, volumes bind mount.

---

## Les chiffres du produit

| Pilier | Preuve | Métrique |
|--------|--------|----------|
| **Code source** | Backend NestJS + Frontend React/Vite | **27 700 lignes** TS/TSX |
| **Modèle de données** | Prisma, relations N:N polymorphes | **20 modèles** (11 métier + 9 infra) |
| **API Contract-first** | OpenAPI 3.0, v1.4.0 | **71 endpoints** REST |
| **Testing pyramid** | 5 couches | **310 cas de test** (171 e2e + 139 unit) |
| **Internationalisation** | Full-stack, clés normées | **~800 clés** `domain.page.element` |
| **Réinitialisabilité** | Seeds + `make db-reset-reseed` | < 10s |
| **DevSecOps** | SAST + DAST + Scan images | Intégré dans Makefile |
| **Documentation** | 5 zones numérotées | **34 219 lignes** Markdown (ratio doc/code **1,23**) |

**Ce n'est pas un POC.**

---

## 🎬 Démo 2 (live) — `make validate-backend`

```bash
$ make validate-backend
# Build NestJS
# Restart containers
# Génère token JWT
# Smoke test /health + /auth/me
# ✅ PASS en 12s
```

Point d'entrée unique pour tout agent : le Makefile (393 lignes).

---

# AXE 2 — La maturité de la démarche

*"Comment on l'a construit"*

> La vraie différence entre "j'utilise un LLM" et "je pratique l'agentic engineering".

---

## Niveau 1 — Spec First

Template homemade, split back/front, gates de dépendance.

- **11 Feature Specs** : FS-01 Auth → FS-11 Omnisearch
- `_template_back.md` (503 lignes, v0.4) + `_template_front.md` (695 lignes, v0.1)
- **Gate** : la spec front ne passe `stable` que si la spec back est `done`

> *"On ne donne pas une mission vague à un agent. On lui donne un cahier des charges normé."*

---

## 🎬 Démo 3 (statique) — Template vs Implémenté

| Template `_template_back.md` | Spec `FS-07-BACK` |
|------------------------------|-------------------|
| §3 Audit Trail obligatoire (NFR-SEC-009) | `SET LOCAL ark.current_user_id` dans le service |
| §4 Pattern FK entrantes Applications | Relations `Application` → `BusinessCapability` |
| §5 Checklist gates G-01 à G-11 | Gates cochées, openapi mis à jour |

La spec est le **rail**. L'agent ne devine pas — il exécute un contrat.

---

## Niveau 2 — Gouvernance multi-agent

**6 agents** : `arch`, `back`, `front`, `data`, `qa`, `spec`

Tableau RACI (13 activités × 6 agents) :
- Qui est **R**esponsable, **C**onsulté, **I**nformé
- Agent `arch` = arbitre en cas de chevauchement

**1 380 lignes de gouvernance** réparties dans 5 fichiers `AGENTS.md`.

Règle d'or : *"Un agent = un domaine. Chevauchement → `arch` tranche."*

> *"Ce n'est pas un assistant, c'est une équipe projet avec des fiches de poste."*

---

## 🎬 Démo 4 (live) — `AGENTS.md` racine

```bash
$ cat AGENTS.md | head -n 30
# 9 règles générales
#   1. Un agent = un domaine
#   2. Traçabilité obligatoire : // AGENT-DECISION: [agent] — raison
#   3. Ne jamais supprimer de code sans audit
#   4. TypeScript strict
#   5. Prisma schema = source de vérité
#   6. Code first, explain later
#   7. Jamais de secrets commités
#   8. Langue code : anglais ; UI/docs : français
#   9. Ambiguïté → 1 question max, puis exécuter
```

Interdictions explicites : *front ne touche pas à Prisma, back ne fait pas de React.*

---

## Niveau 3 — Coordination simultanée

**Session Locking & Handoff**

- `tasks.yaml` = source de vérité du suivi (**14+ tâches** traçables)
- Verrouillage : `session_active: "e8c4a2"` → un agent ne prend une tâche que s'il la verrouille
- Rituels `/ark-open-session` → `/ark-close-session`
- Archives : `SESSION-HANDOFF-<agent>-<slug>.md` dans `docs/05-Project/<YYYYMMDD>/`

> *"Comment 3 agents travaillent en parallèle sans se marcher sur les pieds ? Avec un tableau Kanban et des fiches de passation."*

---

## 🎬 Démo 5 (live) — `tasks.yaml` + Handoff

```yaml
# tasks.yaml (extrait)
- id: T-047
  nom: "Backend — Implémenter filtrage search/domainId"
  statut: done
  assigned_agent: back
  session_active: ~
  handoff_ref: "docs/05-Project/20260421/SESSION-HANDOFF-back-t047.md"
  sessions:
    - tool: OC
      id: "d7e9f1"
      nom: "filtrage serveur + élagage arbre + clean front"
```

```bash
$ cat docs/05-Project/20260421/SESSION-HANDOFF-back-t047.md | wc -l
65
```

65 lignes de contexte technique transmis à l'agent suivant.

---

## Niveau 4 — Design as Code

**Google Stitch v1.0** — `DESIGN.md` (560 lignes)

- Tokens de couleur : *Indigo Blueprint #1A237E*
- Typographie : JetBrains Mono pour les IDs
- Layout : grid 8px, sidebar 240px
- Feedback : ArkAlert, ConfirmDialog, EmptyState

**Lu par tous les agents front.**

Cohérence UI garantie malgré les passages successifs d'agents différents.

> *"Pas besoin d'un designer humain à chaque session. Le design system est le designer."*

---

## 🎬 Démo 6 (statique) — Extraits `DESIGN.md`

```markdown
## §2 Color Palette
- `primary.main` : #1A237E (Indigo Blueprint)
- `secondary.main` : #007FFF (Azure Action)
- `error.main` : #D32F2F (Crimson Alert)

## §3 Typography
- IDs, UUIDs : JetBrains Mono, 12px, letter-spacing 0.5px
- H1 : Inter, 32px, font-weight 300

## §6 Business Components
- `ArkAlert` : severity "error" | "warning" | "info" | "success"
- `ConfirmDialog` : always two actions (Confirm + Cancel)
```

---

## Niveau 5 — Mémoire organisationnelle

**Anti-Patterns Learned** — registre vivant dans `AGENTS.md`

- *"Drawer : clarifier readonly vs éditable inline avant d'implémenter"*
- *"P2011 Null constraint violation sur ID → vérifier DEFAULT `gen_random_uuid()`"*
- *"Never `docker-compose down -v`"*
- *"Cache Prisma : `rm -rf node_modules/.prisma && npx prisma generate`"*

**Traçabilité des décisions** :
```typescript
// AGENT-DECISION: back — raison : performance N+1 sur tree query
// Utilisation de collectKeepIds() au lieu de filtrage Prisma natif
```

> *"Un agent qui repart à zéro à chaque session est un junior. Un agent qui lit les erreurs passées est un senior."*

---

## 🎬 Démo 7 (live) — Anti-Patterns + `AGENT-DECISION`

```bash
$ grep -n "AGENT-DECISION" backend/src/**/*.ts
backend/src/business-capabilities/business-capabilities.service.ts:42
  // AGENT-DECISION: back — collectKeepIds() pour éviter N+1
  // sur le filtrage de l'arbre hiérarchique
```

```bash
$ grep -A 3 "Anti-Patterns Learned" AGENTS.md
> Registre vivant des erreurs passées. Consulter avant toute intervention.
1. Drawer : readonly avec lien détail vs éditable inline
2. Zones de clic tableau : Nom = nav / Corps = drawer / Actions = edit-delete
3. Styling MUI : vérifier backgroundColor, color, z-index
```

---

# REX — Ce qu'on a appris

> La maturité ne se mesure pas à l'absence de problèmes, mais à la capacité à les identifier et les documenter.

Ce REX a été produit par un agent (Claude Code, session 2026-04-12) en auditant son propre système de gouvernance. **517 lignes d'honnêteté.**

---

## Hiérarchie AGENTS.md et liaisons

Le projet utilise **5 fichiers AGENTS.md** organisés en 2 niveaux :

```
AGENTS.md (racine, 229 lignes)
│  ← Gouvernance globale, RACI, conventions, anti-patterns, rituels
│
├── backend/AGENTS.md (427 lignes)  ← back + data
│   Lit : openapi.yaml, schema.prisma
│
├── frontend/AGENTS.md (339 lignes) ← front
│   Lit : DESIGN.md, F01-Design-System.md, F02-i18n.md, fr.json
│
├── e2e/AGENTS.md (214 lignes)    ← qa
│   Lit : specs des features à tester
│
└── docs/AGENTS.md (174 lignes)   ← spec
    Écrit : Feature Specs FS-XX, roadmap, glossaire
```

**Point clé** : Chaque agent charge **son guide + le racine**. Le spec est au centre — il rédige les contrats que tous les autres agents lisent.

---

## Cartographie documentaire — 5 zones

```
docs/
├── 01-Product/      ← spec + human (brief, roadmap, glossaire)
├── 02-Design/       ← arch + front (DESIGN.md, tokens)
├── 03-Features-Spec/ ← spec (COEUR DU WORKFLOW)
│   ├── F01-Design-System.md → injecté dans tout spec front
│   ├── F02-i18n.md → gate prérequis front
│   ├── F99-Technical-Debt.md → gate sprint-end
│   └── FS-XX-back.md / FS-XX-front.md ← split obligatoire
├── 04-Tech/         ← arch (openapi.yaml = SOURCE DE VÉRITÉ)
└── 05-Project/      ← tous agents (tasks.yaml = coordinateur)
```

**Les 3 sources de vérité** :
1. `schema.prisma` → modèle de données
2. `openapi.yaml` → contrat API
3. `fr.json` + `theme/index.ts` → UI

---

## Cycle de vie d'une Feature Spec

```
  spec           spec           back          front          qa
   │              │              │              │              │
   ├─ crée        │              │              │              │
   │  FS-XX-back.md (draft)     │              │              │
   │              │              │              │              │
   ├────────────► review        │              │              │
   │              │              │              │              │
   ├──────────────────────► stable           │              │
   │                          │  ← GATE débloquée           │
   │              crée ◄────────┘              │              │
   │              FS-XX-front.md              │              │
   │              (draft)                     │              │
   │                          │              │              │
   │              review ──────────────────► stable         │
   │                                         │              │
   │                                     implémente         │
   │                                     composants         │
   │                                         │ ──────────► tests
   │                                         │              │
   tasks.yaml ◄────────────────── done ◄────────┴──────────── pass
```

**La gate formelle** : `FS-XX-back → stable` est **prérequis** avant que `FS-XX-front` puisse atteindre `stable`.

---

## Tensions documentaires — L'honnêteté

| Tension | Sévérité | Détail |
|---------|----------|--------|
| **Drift spec/code** | Moyenne | FS-05 et FS-07 en `draft` alors que le backend est implémenté |
| **Specs en attente** | Haute | 2 specs (FS-09 Dependency Graph, FS-10 Import Excel) nécessitent une rédaction |
| **SESSION-HANDOFF.md racine vide** | Moyenne | Le sprint context n'est pas capitalisé au niveau sprint |

> *"On ne présente pas un système parfait. On présente un système qui s'améliore."*

---

## Recommandations priorisées

| # | Recommandation | Sévérité | Action concrète |
|---|---------------|----------|-----------------|
| R1 | Rédiger FS-09 et FS-10 | **Haute** | Finaliser les specs bloquantes |
| R2 | Automatiser tasks→tasks-done | Moyenne | Skill `/ark-archive-done` |
| R3 | Alimenter SESSION-HANDOFF.md racine | Moyenne | Arch/spec met à jour à chaque fin de sprint |
| R4 | Mettre à jour specs après implémentation | Moyenne | Vérification dans le rituel de clôture |
| R5 | Fragmenter F99-Technical-Debt.md | Moyenne | Transformer items actifs en tâches tasks.yaml |

---

## Slide clé REX

> **"Le spec first ne fonctionne que si les specs sont tenues à jour."**
>
> Notre drift spec/code est le signe que nous avons franchi le palier 3 (Orchestration) mais que le palier 4 (Industrialisation) exige encore de la discipline.

---

# Synthèse

## Les 4 paliers de l'Agentic Engineering

| Palier | Ce que ARK-EPM a atteint |
|--------|--------------------------|
| **0 — Prompting** | ❌ Jamais été là |
| **1 — Assistance** | S1 — Solo agent, prompts ad-hoc |
| **2 — Délégation** | S1-S2 — Spec first, templates normatifs |
| **3 — Orchestration** | S2-S3 — RACI, split back/front |
| **4 — Industrialisation** | S3-S4 — Session locking, handoff, anti-patterns |

---

## Slide clé

ARK-EPM n'est pas un projet **"avec de l'IA"**.

C'est un projet **"par des agents IA"**.

---

# Takeaways — Le craft de la session

> L'agent n'a pas de mémoire. **Vous êtes son système nerveux.**

---

## Les 8 commandements du craft

1. **Testez** : chaque gate doit être vérifiable (`make test-...`). Si ce n'est pas testable, ce n'est pas spécifié.

2. **Explorez** : *"Sky is the limit"* — les agents peuvent aller plus loin que vous ne pensez, mais il faut leur donner la carte (`AGENTS.md`, `DESIGN.md`).

3. **Itérez** : vos templates, vos règles, vos prompts. La spec v0.4 est meilleure que la v0.1 parce qu'on a appris des échecs.

4. **Travaillez votre session** : le prompt engineering n'est pas un hack, c'est une compétence. Chaque session est un contrat à négocier avec un contexte limité.

5. **Maîtrisez votre conso de token** : compactez votre contexte. Un `AGENTS.md` de 229 lignes vaut mieux que 10 prompts de 2 000 tokens.

---

## Les 8 commandements (suite)

6. **Évitez le drift slope** : la dérive entre sessions est réelle et silencieuse. La spec est le rail, le handoff est le garde-fou.

7. **Chaque session redémarre de zéro mémoire** : l'agent n'a pas de cerveau persistant entre vos prompts. **Vous devez gérer la mémoire vous-même.**

8. **Le handoff est votre mémoire artificielle** : écrivez-le comme si un autre vous — ou un autre agent — devait reprendre demain matin sans rien savoir.

---

## 🎬 Démo 8 (statique) — Compactage de session

| ❌ Prompt généraliste | ✅ Rituel `ark-open-session` |
|---------------------|------------------------------|
| "Implémente un CRUD Applications avec NestJS et Prisma, utilise class-validator, gère l'auth JWT, la pagination, les filtres, l'audit trail, et mets à jour openapi.yaml..." (~3 000 tokens) | 1. Lire `tasks.yaml` 2. Filtrer tâches `statut: open` 3. Poser verrou `session_active` 4. Lire `SESSION-HANDOFF` associé (~50 tokens de boot) |

**50 tokens** pour booter un agent avec tout le contexte nécessaire.

---

# Q&A & Appel à l'action

**Pour vos projets**
> *"Commencez par un `AGENTS.md` et un template de spec. Le reste vient naturellement."*

**Pour l'avenir**
> Le prochain palier ? L'agent `arch` qui planifie lui-même les tâches dans `tasks.yaml`...

**Questions ?**

---

## Références

| Élément | Chemin | Lignes |
|---------|--------|--------|
| Gouvernance agents | `AGENTS.md` | 229 |
| Guide backend | `backend/AGENTS.md` | 426 |
| Guide frontend | `frontend/AGENTS.md` | 338 |
| Guide QA | `e2e/AGENTS.md` | 213 |
| Guide specs | `docs/AGENTS.md` | 174 |
| Contrat API | `docs/04-Tech/openapi.yaml` | 3 055 |
| Schema données | `backend/prisma/schema.prisma` | 357 |
| Design system | `docs/02-Design/DESIGN.md` | 560 |
| Template spec back | `docs/03-Features-Spec/_templates/_template_back.md` | 503 |
| Template spec front | `docs/03-Features-Spec/_templates/_template_front.md` | 695 |
| Makefile | `Makefile` | 393 |
| Suivi des tâches | `docs/05-Project/tasks.yaml` | 284 |
| REX Workflow multi-agent | `docs/05-Project/REX/ark-rex-workflow.md` | 517 |
| Système documentaire | `docs/05-Project/REX/ark-doc-system.md` | 502 |

---

## Récapitulatif des démos

| # | Titre | Type | Fichier / Commande |
|---|-------|------|--------------------|
| 1 | Pile tech — Docker Compose | Statique | `docker-compose.yml` |
| 2 | `make validate-backend` | **Live** | Terminal |
| 3 | Spec template vs implémentée | Statique | `_template_back.md` vs `FS-07-BACK` |
| 4 | Gouvernance `AGENTS.md` | **Live** | `cat AGENTS.md` |
| 5 | Session locking & handoff | **Live** | `tasks.yaml` + `SESSION-HANDOFF` |
| 6 | Design System as Code | Statique | `DESIGN.md` |
| 7 | Anti-Patterns & traçabilité | **Live** | `AGENTS.md` + `grep AGENT-DECISION` |
| 8 | Compactage de session | Statique | Split-screen |

---

*Présentation générée le 2026-04-22 — ARK-EPM*
