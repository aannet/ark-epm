# ARK — Roadmap des Feature-Specs P1

_Version 0.2 — Février 2026_

> **Changelog v0.2 :** Ajout de la référence au plan de sprint unifié v0.3. Terminologie mise à jour (OpenCode au lieu de Claude Code).
>
> **Voir aussi :** [Plan Sprint MVP v0.3](./ARK-Plan-Sprint-MVP-v0.3.md) — Détail des tâches manuelles vs OpenCode par sprint.

---

## Règle de statut

| Statut | Signification |
|---|---|
| `draft` | Spec en cours de rédaction |
| `review` | Spec complète, en attente de validation |
| `stable` | Spec validée — prête pour OpenCode |
| `in-progress` | Implémentation en cours |
| `done` | Implémentée, testée, mergée |

---

## Roadmap P1 — Découpage vertical par feature

### Fondation (Phase 0 — manuel, pas de spec Claude Code)

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| F-00 | Scaffolding projet — NestJS + Prisma + Docker + JWT + PrismaService + middleware `ark.current_user_id` | — | `draft` | 2j |

> F-00 est réalisé manuellement. Pas de Feature-Spec OpenCode — c'est le socle sur lequel toutes les specs s'appuient.

---

### Sprint 1 — Auth & RBAC end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-01 | **Auth & RBAC** — Login email/password, JWT, gestion des rôles et permissions, guards NestJS, écran login React | F-00 | `draft` | 3j |

**Périmètre FS-01 :**
- Backend : `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Backend : CRUD `/roles`, `/permissions`, `/users` (protégés)
- Frontend : écran Login + gestion du token JWT en mémoire
- Hors périmètre : SSO SAML2 (P2), droits par domaine (P2)

---

### Sprint 2 — Entités racines end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-02 | **Domains** — CRUD complet backend + écran liste/détail React | FS-01 | `draft` | 1j |
| FS-03 | **Providers** — CRUD complet backend + écran liste/détail React | FS-01 | `draft` | 1j |
| FS-04 | **IT Components** — CRUD + liaison `app_it_component_map` + écran | FS-01 | `draft` | 1.5j |
| FS-05 | **Data Objects** — CRUD + liaison `app_data_object_map` (avec rôle) + écran | FS-01 | `draft` | 1.5j |

> FS-02 et FS-03 sont les features les plus simples — elles servent de **modules de référence** pour OpenCode sur tous les suivants. Les produire en premier et les valider soigneusement.

---

### Sprint 3 — Applications & Capacités end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-06 | **Applications** — CRUD complet + liaisons `domains`/`providers`/`users` + écran inventaire + fiche détail | FS-02, FS-03, FS-01 | `draft` | 3j |
| FS-07 | **Business Capabilities** — CRUD + récursion `WITH RECURSIVE` + écran arbre hiérarchique | FS-02, FS-01 | `draft` | 3j |

> FS-07 contient le cas le plus complexe du projet : la requête `WITH RECURSIVE` doit être écrite et testée manuellement en SQL avant d'être intégrée dans la spec. Prévoir 0.5j de R&D SQL pur avant de rédiger la spec.

---

### Sprint 4 — Graphe de dépendances end-to-end

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-08 | **Interfaces** — CRUD unidirectionnel Source→Cible + règles métier + écran liste | FS-06 | `draft` | 2j |
| FS-09 | **Dependency Graph POC** — endpoint `/graph` dédié + composant React Flow + filtres (domaine, criticité, type) | FS-08, FS-06 | `draft` | 3j |

> FS-09 est la feature la plus risquée visuellement. Le POC React Flow (valider la librairie sur données réelles) doit précéder la rédaction de la spec — ne pas rédiger FS-09 avant que le POC soit concluant.

---

### Sprint 5 — Import & Finalisation MVP

| ID | Feature | Dépend de | Statut | Estimé |
|---|---|---|---|---|
| FS-10 | **Import Excel** — upload frontend + validation backend + insertion en base pour les 6 entités P1 | FS-06, FS-07, FS-08 | `draft` | 3j |
| FS-11 | **Navigation & UX transverse** — menu, breadcrumb, gestion des erreurs globale, écran 404, loading states | FS-06 | `draft` | 2j |

---

## Vue synthétique — dépendances

```
F-00 (Fondation)
  └── FS-01 (Auth & RBAC)
        ├── FS-02 (Domains)
        │     └── FS-06 (Applications)
        │           ├── FS-08 (Interfaces)
        │           │     └── FS-09 (Dependency Graph)
        │           └── FS-10 (Import Excel)
        ├── FS-03 (Providers)
        │     └── FS-06 (Applications)
        ├── FS-04 (IT Components)
        ├── FS-05 (Data Objects)
        └── FS-07 (Business Capabilities)
              └── FS-10 (Import Excel)
```

---

## Ordre de rédaction des specs recommandé

Travailler à rebours depuis la feature la plus risquée :

| Ordre | Spec | Pourquoi |
|---|---|---|
| 1 | **FS-09** (Dependency Graph) | La plus risquée visuellement — valider le POC React Flow d'abord, puis rédiger la spec |
| 2 | **FS-07** (Business Capabilities) | La plus complexe techniquement — valider la requête `WITH RECURSIVE` en SQL avant de rédiger |
| 3 | **FS-01** (Auth & RBAC) | Bloque tout le reste — à stabiliser tôt |
| 4 | **FS-02** (Domains) | Module de référence pour OpenCode — doit être exemplaire |
| 5 | **FS-06** (Applications) | Feature centrale du MVP — la plus riche en règles métier |
| 6-11 | Reste des specs | Dans l'ordre du tableau roadmap |

---

## Checklist avant de lancer la première session OpenCode

- [ ] F-00 terminé (scaffolding fonctionnel, `docker-compose up` OK)
- [ ] FS-01 au statut `stable`
- [ ] FS-02 au statut `stable` (servira de module de référence)
- [ ] POC React Flow concluant (avant FS-09)
- [ ] Requête `WITH RECURSIVE` testée en base (avant FS-07)

---

_Document de travail v0.2 — Réconcilié avec Plan Sprint MVP v0.3_