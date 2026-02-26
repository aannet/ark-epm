# 
_Version 0.1 — Février 2026_

> **Contexte :** 1 développeur solo + OpenCode. Objectif : MVP livrable en < 3 mois. Ce document organise le travail en sprints de 2 semaines et précise pour chaque tâche ce qui doit être fait manuellement vs délégué à OpenCode.

---

## Conventions

|Icône|Signification|
|---|---|
|🧑‍💻 Manuel|À faire soi-même — décision d'architecture ou code transverse|
|🤖 OpenCode|Génération assistée — fournir le contexte listé|
|✅ Fait|Livrable déjà stable|

---

## Phase 0 — Fondations (Avant Sprint 1)

> Ces éléments sont transverses à tout le projet. Une erreur ici se propage partout. **OpenCode ne doit pas les toucher.**

|#|Tâche|Mode|Contexte / Notes|
|---|---|---|---|
|0.1|✅ `schema.sql` v0.4 — triggers d'audit inclus|✅ Fait|Stable. Référence SQL pour les triggers.|
|0.2|✅ `Brief application` v0.5|✅ Fait|Périmètre P1 validé.|
|0.3|Scaffolding NestJS (`npx @nestjs/cli new backend --strict`)|🧑‍💻 Manuel|Structure des dossiers par domaine (voir Setup §3)|
|0.4|`PrismaService` partagé + `npx prisma init`|🧑‍💻 Manuel|Un seul service injecté dans tous les modules — ne pas dupliquer|
|0.5|Middleware global `$executeRaw ark.current_user_id`|🧑‍💻 Manuel|Critique pour l'audit trail. Doit être en place avant tout module CRUD.|
|0.6|Configuration JWT + Passport (stratégies `local` et `jwt`)|🧑‍💻 Manuel|Guards NestJS transverses — base de tout le RBAC|
|0.7|`docker-compose.yml` fonctionnel — 3 services opérationnels|🧑‍💻 Manuel|Valider avec `docker-compose up -d` + connexion Prisma OK|
|0.8|Contrat OpenAPI `docs/openapi.yaml` — 6 objets P1|🧑‍💻 Manuel|**Bloquer tout développement OpenCode tant que ce contrat n'est pas stable.** C'est le brief d'OpenCode.|

---

## Sprint 1 — Backend : entités sans dépendances (S1–S2)

> Objectif : les 4 entités racines sont en base, exposées via API REST documentée et protégées par les guards JWT.

|#|Tâche|Mode|Contexte à fournir à OpenCode|
|---|---|---|---|
|1.1|Module `domains` — CRUD complet|🤖 OpenCode|Modèle Prisma `domains`, routes OpenAPI correspondantes|
|1.2|Module `providers` — CRUD complet|🤖 OpenCode|Modèle Prisma `providers`, routes OpenAPI, module `domains` comme exemple de pattern|
|1.3|Module `roles` + `permissions` — CRUD + liaison `role_permissions`|🤖 OpenCode|Modèles Prisma, routes OpenAPI|
|1.4|Module `users` — CRUD + hash Bcrypt à la création|🧑‍💻 Manuel|La logique de hash Bcrypt + l'endpoint `/auth/login` sont sensibles — ne pas déléguer|
|1.5|Vérification manuelle des guards RBAC|🧑‍💻 Manuel|Tester que chaque route bloque correctement un token invalide ou un rôle insuffisant|

**Livrable de fin de sprint :** API `/domains`, `/providers`, `/roles`, `/users` opérationnelles, documentées Swagger, testées manuellement.

---

## Sprint 2 — Backend : entités métier P1 (S3–S4)

> Objectif : les 5 entités métier cœur sont exposées. Les cas spéciaux (récursion, n:n) sont traités proprement.

|#|Tâche|Mode|Contexte à fournir à OpenCode|
|---|---|---|---|
|2.1|Module `it-components` — CRUD + liaison `app_it_component_map`|🤖 OpenCode|Modèles Prisma, routes OpenAPI, pattern module Sprint 1|
|2.2|Module `data-objects` — CRUD + liaison `app_data_object_map` (avec rôle)|🤖 OpenCode|Modèles Prisma, routes OpenAPI|
|2.3|Module `applications` — CRUD complet|🤖 OpenCode|Modèles Prisma, routes OpenAPI, dépendances `domains`, `providers`, `users`|
|2.4|Module `business-capabilities` — CRUD de base|🤖 OpenCode|Modèles Prisma, routes OpenAPI|
|2.5|Requête récursive `WITH RECURSIVE` pour l'arbre des capacités|🧑‍💻 Manuel|Écrire et tester la requête SQL directement en base, puis l'intégrer en `$queryRaw` dans le service NestJS|
|2.6|Module `interfaces` — CRUD + contrainte unidirectionnelle|🤖 OpenCode|Modèles Prisma, routes OpenAPI, note sur l'absence de contrainte UNIQUE globale|

**Livrable de fin de sprint :** toutes les entités P1 exposées via API. La récursion des Business Capabilities est fonctionnelle et testée sur un jeu de données réel.

---

## Sprint 3 — POC graphe + Frontend CRUD (S5–S6)

> Objectif : valider la visualisation React Flow avant d'investir dans le frontend complet. Démarrer les écrans CRUD prioritaires.

|#|Tâche|Mode|Contexte à fournir à OpenCode|
|---|---|---|---|
|3.1|POC React Flow — graphe applications/interfaces sur données réelles|🧑‍💻 Manuel|**Ne pas déléguer.** Valider manuellement que React Flow tient la charge visuelle. Décision go/no-go sur la librairie.|
|3.2|Atelier filtres de vue — définir les dimensions (domaine, criticité, type)|🧑‍💻 Manuel|Livrable : liste des filtres validés, structure des props du composant graphe|
|3.3|Scaffolding Vite + React + dépendances P1|🧑‍💻 Manuel|Une seule fois, proprement (voir Setup §4)|
|3.4|Écran inventaire applicatif — liste + filtres|🤖 OpenCode|Structure des données API `/applications`, wireframe de l'écran|
|3.5|Écran fiche application — détail + entités liées|🤖 OpenCode|Routes API fiche + entités liées, wireframe|

**Livrable de fin de sprint :** décision validée sur React Flow (ou alternative). Les 2 écrans CRUD prioritaires sont fonctionnels en lecture.

---

## Sprint 4 — Import Excel + Frontend complet (S7–S8)

> Objectif : l'import des inventaires existants est opérationnel. Tous les écrans CRUD P1 sont livrés.

| #   | Tâche                                                               | Mode         | Contexte à fournir à OpenCode                                                                                  |
| --- | ------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| 4.1 | Spécification format Excel — mapping colonnes → modèle              | 🧑‍💻 Manuel | Livrable : document de mapping + règles de validation. Bloquer OpenCode tant que ce document n'est pas stable. |
| 4.2 | Backend : endpoint d'upload + validation + insertion                | 🤖 OpenCode  | Document de mapping, modèles Prisma cibles, règles de validation                                               |
| 4.3 | Frontend : composant d'upload Excel + retour d'erreurs              | 🤖 OpenCode  | Spec de l'endpoint upload, wireframe du composant                                                              |
| 4.4 | Écrans CRUD restants (domains, providers, capabilities, interfaces) | 🤖 OpenCode  | Pattern écrans Sprint 3, routes API correspondantes                                                            |
| 4.5 | Composant graphe de dépendances — intégration filtres               | 🤖 OpenCode  | Structure props validée en Sprint 3, liste des filtres de l'atelier                                            |

**Livrable de fin de sprint :** MVP fonctionnel. Import Excel opérationnel. Tous les écrans P1 livrés.

---

## Ce qu'il ne faut jamais déléguer à OpenCode

- **Migrations Prisma** (`prisma migrate dev`) — toujours relire le fichier de migration généré avant de l'appliquer. Une migration destructive sur une base de prod ne se rattrape pas.
- **Tests RBAC** — vérifier manuellement que chaque guard bloque les accès non autorisés. OpenCode génère des guards syntaxiquement corrects, pas nécessairement sémantiquement.
- **Middleware `ark.current_user_id`** — toute nouvelle route d'écriture doit être vérifiée manuellement pour s'assurer que le middleware est bien actif.
- **Requêtes `$queryRaw` et `$executeRaw`** — les relire ligne par ligne. Prisma ne valide pas ces requêtes à la compilation.

---

## Règles d'utilisation d'OpenCode

1. **Toujours fournir un exemple de module déjà validé** comme référence de pattern. OpenCode reproduit — il n'invente pas.
2. **Une tâche = un module = un prompt**. Ne pas demander plusieurs modules dans un seul prompt.
3. **Fournir le modèle Prisma ET les routes OpenAPI** pour chaque génération CRUD. Sans les deux, le code généré diverge du contrat.
4. **Relire systématiquement** les guards, les DTOs de validation et les relations Prisma générés avant d'intégrer.

---

_Document de travail v0.1 — À affiner après atelier de cadrage_