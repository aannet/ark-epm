# ARK — Non-Functional Requirements

_Version 0.3 — Mars 2026_

> **Usage :** Ce document recense l'ensemble des exigences non fonctionnelles (NFR) du projet ARK. Il est produit à partir du Brief v0.5, du Setup Technique v0.4, de F-999 (Technical Debt) et du schema.sql v0.4. Il est mis à jour à chaque sprint — un NFR ne change de statut que lorsqu'une gate de validation est passée.

> **Convention de statut :**
> - ✅ `covered` — implémenté et validé
> - ⚠️ `partial` — modèle en place, implémentation incomplète
> - ❌ `missing` — non encore implémenté
> - 🔵 `deferred` — hors périmètre P1, documenté pour P2

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | NFR |
| **Titre** | Non-Functional Requirements — ARK EPM |
| **Priorité** | P1 / P2 |
| **Statut** | `draft` |
| **Dépend de** | F-00, F-01, F-02, F-999, FS-01 |
| **Version** | 0.3 |
| **Mode** | 🟡 Manuel — référence vivante, mise à jour à chaque sprint |

---

## 1. Sécurité

### NFR-SEC-001 — Hachage des mots de passe

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Brief §5, Setup §3, FS-01 |
| **Gate** | Hash en base commençant par `$2b$` — vérifié en inspection directe |

Les mots de passe sont hachés avec Bcrypt (facteur de coût ≥ 10) avant tout stockage. Aucun mot de passe en clair ne transite dans l'API ni n'est persisté.

---

### NFR-SEC-002 — Token JWT en mémoire (anti-XSS)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | FS-01, F-999 Item 2 |
| **Gate** | DevTools → Application → Storage : aucun token JWT visible |

Le token JWT est stocké en mémoire React (ni `localStorage`, ni `sessionStorage`). Durée de validité : **15 minutes**. À expiration, l'intercepteur Axios vide le token et redirige vers `/login?reason=session_expired` avec message i18n `auth.session.expired`.

**Trade-off assumé :** reconnexion requise après 15 min d'inactivité. Documenté — pas un bug.

> **P2 :** si le retour terrain indique que 15 min est trop court, envisager 60 min ou refresh token via httpOnly cookie.

---

### NFR-SEC-003 — Absence de CSRF (par architecture)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | F-999 (analyse), FS-01 |
| **Gate** | Revue d'architecture — pas de cookies d'authentification |

Le CSRF est neutralisé structurellement : les JWT sont en mémoire et ne sont jamais envoyés automatiquement par le navigateur. Aucun mécanisme CSRF token supplémentaire requis.

---

### NFR-SEC-004 — RBAC global

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Brief §3, FS-01, F-00 RM-03 |
| **Gate** | Requête sans token → 401. Requête avec rôle insuffisant → 403 |

Chaque route API est protégée par `JwtAuthGuard` (global) et `@RequirePermission()`. Les permissions sont granulaires par objet métier (ex : `applications:write`). Les routes publiques sont explicitement marquées `@Public()`.

---

### NFR-SEC-005 — Droits différenciés par domaine

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Statut** | ⚠️ `partial` |
| **Source** | Brief §3.2, §5 |
| **Gate** | P2 — non applicable en MVP |

En P2, un utilisateur pourra avoir des rôles distincts selon le domaine métier. L'entité `Domain` est créée dès P1 pour préparer cette extension sans refactoring du schéma.

---

### NFR-SEC-006 — Anti-injection SQL (requêtes raw Prisma)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ⚠️ `partial` |
| **Source** | F-999 Item 8 |
| **Gate** | Revue manuelle de toutes les occurrences `$queryRaw` / `$executeRaw` avant merge |

Prisma paramétrise automatiquement les requêtes générées (`.findMany()`, `.create()`, etc.). Pour les requêtes raw, règle absolue :

- ✅ **Autorisé :** tagged template `` await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}` ``
- ❌ **Interdit :** `Prisma.raw()` avec interpolation de string

Scope à surveiller : `audit-context.middleware.ts` et toute requête `WITH RECURSIVE` dans FS-07.

> Classé dans "Ce qu'il ne faut jamais déléguer à OpenCode" du Plan Sprint.

---

### NFR-SEC-007 — Anti-XSS frontend (React natif)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | F-999 Item 8 (note) |
| **Gate** | `grep -r "dangerouslySetInnerHTML" src/` doit retourner zéro résultat |

React échappe nativement toutes les valeurs rendues via JSX `{value}`. `dangerouslySetInnerHTML` est interdit dans tous les composants ARK — aucune raison métier ne justifie son usage. Aucun sanitizer externe requis.

---

### NFR-SEC-008 — Rate limiting

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ❌ `missing` |
| **Source** | F-999 Item 3 |
| **Gate** | 11 appels `POST /api/auth/login` en < 1 min → le 11e retourne `429` |

Implémenté via `@nestjs/throttler` :

| Route | Limite |
|---|---|
| `POST /api/auth/login` | 10 req/min/IP |
| `POST /api/auth/register` | 5 req/min/IP |
| `POST /api/import/excel` | 3 req/min/user |
| Toutes les autres | 100 req/min (défaut) |

---

### NFR-SEC-009 — Audit trail automatique

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | schema.sql §4-5, Brief §3.1, F-00 RM-02 |
| **Gate** | `INSERT` d'une application → `audit_trail.changed_by` non NULL |

Toute modification (INSERT / UPDATE / DELETE) sur les 7 tables métier P1 est tracée via triggers PostgreSQL autonomes. Le champ `changed_by` est renseigné via `SET LOCAL ark.current_user_id` positionné par le middleware NestJS avant chaque opération d'écriture.

---

### NFR-SEC-010 — CORS en production

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Statut** | ⚠️ `partial` |
| **Source** | F-999 Item 7 |
| **Gate** | Variable `CORS_ORIGIN` configurée dans `.env` production avant release |

En développement : CORS permissif (`*`). En production on-premise : restreindre à `CORS_ORIGIN` (variable d'environnement) dans `main.ts`.

---

## 2. Performance & Scalabilité

### NFR-PERF-001 — Cible utilisateurs

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Brief §4 |
| **Gate** | Architecture single-tenant validée |

MVP : 5 utilisateurs maximum. Cible : < 100 utilisateurs. Single-tenant — une instance Docker = une organisation. Pas d'optimisation multi-tenant requise.

---

### NFR-PERF-002 — Pagination normalisée des listes

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ❌ `missing` |
| **Source** | F-999 Item 4 |
| **Gate** | FS-02 (Domains) implémente ce contrat — sert de référence pour toutes les features suivantes |

Toutes les routes de liste utilisent `PaginationQueryDto` (`src/common/dto/pagination-query.dto.ts`) :

| Param | Type | Défaut | Max |
|---|---|---|---|
| `page` | integer | 1 | — |
| `limit` | integer | 20 | 100 |
| `sortBy` | string | `createdAt` | — |
| `sortOrder` | `asc` \| `desc` | `desc` | — |
| `search` | string | — | — |

Réponse standard : `{ data: [...], meta: { page, limit, total, totalPages } }`

---

### NFR-PERF-003 — Index PostgreSQL

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | schema.sql §6 |
| **Gate** | `\di` dans psql — index présents sur toutes les colonnes listées |

Index définis sur : `business_capabilities(parent_id)`, `interfaces(source_app_id)`, `interfaces(target_app_id)`, `applications(provider_id)`, `applications(domain_id)`, `applications(owner_id)`, `audit_trail(entity_type, entity_id)`, `audit_trail(occurred_at DESC)`.

---

### NFR-PERF-004 — Récursion WITH RECURSIVE validée

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ⚠️ `partial` |
| **Source** | Brief §3.1, F-00 G-11, Plan Sprint tâche 0.9 |
| **Gate** | Requête `WITH RECURSIVE` exécutée en SQL pur sur données réelles — gate avant FS-07 |

La hiérarchie Business Capabilities est récursive et illimitée en profondeur. La requête `WITH RECURSIVE` doit être écrite et testée manuellement en PostgreSQL avant d'être intégrée dans FS-07. L'UI peut afficher un avertissement au-delà de 5 niveaux sans blocage en base.

---

### NFR-PERF-005 — Indicateurs de performance des interfaces

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Statut** | ⚠️ `partial` |
| **Source** | Brief §3.2, schema.sql |
| **Gate** | P2 — colonnes présentes, alimentation différée |

Colonnes `latency_ms` (INTEGER) et `error_rate` (DECIMAL 5,2) présentes en base dès P1 (nullable). Alimentation et affichage différés en P2.

---

## 3. Disponibilité & Résilience

### NFR-DISP-001 — Déploiement Docker on-premise

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Brief §5, F-00 |
| **Gate** | `docker-compose up -d` démarre les 3 services sur machine vierge (Sprint 5) |

Déploiement via `docker-compose` — 3 services : PostgreSQL 16, backend NestJS, frontend React. Données persistées dans le volume `postgres_data`. Démarrage en une commande.

---

### NFR-DISP-002 — Séquence de démarrage sécurisée

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | F-00 §3.2 |
| **Gate** | `docker-compose ps` — backend démarre après `postgres (healthy)` |

Le backend NestJS démarre uniquement après que PostgreSQL répond au healthcheck (`pg_isready`). Prévient les crashs au démarrage sur machine lente ou à froid.

---

### NFR-DISP-003 — ErrorBoundary React global

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | F-01 §3.11 |
| **Gate** | Erreur simulée dans un composant → fallback affiché, pas de crash navigateur |

`ErrorBoundary` class component wrappant `main.tsx`. Affiche un fallback explicite avec bouton rechargement. Le détail technique (`error.message`) est masqué hors `NODE_ENV=development`.

---

### NFR-DISP-004 — Stratégie de backup PostgreSQL

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Statut** | 🔵 `deferred` |
| **Source** | — |
| **Gate** | P2 — à définir avec l'équipe IT cliente |

Hors périmètre ARK. Le volume Docker `postgres_data` est à sauvegarder par l'infrastructure on-premise cliente. ARK ne fournit pas de mécanisme de backup intégré en P1.

---

## 4. Maintenabilité

### NFR-MAINT-001 — Format d'erreur API normalisé

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ❌ `missing` |
| **Source** | F-999 Item 1 |
| **Gate** | Toutes les routes FS-01 et FS-02 retournent ce format — vérifié via Supertest |

Toutes les erreurs API respectent le contrat suivant, sans exception :

```json
{
  "statusCode": 404,
  "code": "DOMAIN_NOT_FOUND",
  "message": "Le domaine demandé n'existe pas.",
  "timestamp": "2026-03-03T10:00:00Z",
  "path": "/api/domains/uuid-inexistant"
}
```

Implémenté via `HttpExceptionFilter` global (`src/common/filters/http-exception.filter.ts`), enregistré dans `main.ts` via `app.useGlobalFilters()`.

**Codes standards :** `VALIDATION_ERROR` (422), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` / `*_NOT_FOUND` (404), `CONFLICT` (409), `DEPENDENCY_CONFLICT` (409), `INTERNAL_ERROR` (500).

---

### NFR-MAINT-002 — Politique de suppression par entité

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ❌ `missing` |
| **Source** | F-999 Item 5 |
| **Gate** | Suppression d'un Domain référencé → `409 DEPENDENCY_CONFLICT` avec compteur |

| Entité | Politique |
|---|---|
| `domains` | ❌ Blocage si applications rattachées |
| `providers` | ❌ Blocage si applications références |
| `applications` | ❌ Blocage si interfaces source/cible existantes |
| `business_capabilities` | ❌ Blocage si enfants ou applications mappées |
| `interfaces` | ✅ Hard delete autorisé |
| `data_objects` | ❌ Blocage si applications mappées |
| `it_components` | ❌ Blocage si applications mappées |
| `users` | 🟡 Soft delete via `is_active = false` (préserver `changed_by` audit trail) |

---

### NFR-MAINT-003 — Architecture modulaire NestJS

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Setup §3, F-00 |
| **Gate** | Structure de dossiers par domaine présente et cohérente |

Modules organisés par domaine métier. `PrismaModule` global unique — ne pas réimporter. `JwtAuthGuard` global — `@Public()` sur les routes publiques uniquement. Conventions documentées dans `AGENTS.md`.

---

### NFR-MAINT-004 — Migrations Prisma versionnées

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Setup §3, F-00 RM-05 |
| **Gate** | `prisma/migrations/` commité — migration `init` appliquée |

Toute modification du schéma passe par `prisma migrate dev`. Les triggers PostgreSQL (audit trail) sont dans `schema.sql` versionné, appliqués via le volume Docker `./docs/04-Tech/schema.sql:/docker-entrypoint-initdb.d/schema.sql`. Ne jamais modifier la base manuellement.

---

### NFR-MAINT-005 — Documentation Swagger auto-générée

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Setup §3 |
| **Gate** | `GET /api/docs` accessible en développement |

Documentation OpenAPI/Swagger générée depuis les décorateurs NestJS via `@nestjs/swagger`. Accessible sur `/api/docs`. Cohérente avec le contrat `docs/04-Tech/openapi.yaml`.

---

## 5. Observabilité

### NFR-OBS-001 — Logging structuré JSON

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Setup §3, Brief §7 |
| **Gate** | Logs JSON visibles dans `docker-compose logs backend` |

Logging via Winston (`nest-winston`). Logs structurés JSON avec niveau, timestamp, module et message. Self-hostable, sans dépendance externe. Azure Application Insights explicitement exclu (Brief §7).

---

### NFR-OBS-002 — Audit trail en base

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | schema.sql §4, Brief §3.1 |
| **Gate** | Voir NFR-SEC-009 |

Voir NFR-SEC-009. L'interface UI de consultation de l'historique est différée en P2 (NFR-OBS-004).

---

### NFR-OBS-003 — Healthcheck endpoint

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Statut** | 🔵 `deferred` |
| **Source** | F-999 Item 6 |
| **Gate** | `GET /api/v1/health` → `{ "status": "ok", "db": "ok", "timestamp": "..." }` |

Exposé via `@nestjs/terminus`. Non authentifié. Utile pour les équipes IT on-premise. À implémenter en début de P2.

---

### NFR-OBS-004 — UI historique des changements

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Statut** | ⚠️ `partial` |
| **Source** | Brief §3.2 |
| **Gate** | P2 |

Modèle de données en place dès P1 (`audit_trail`). Interface utilisateur de consultation différée en P2.

---

## 6. Déployabilité

### NFR-DEPLOY-001 — Single-tenant

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Brief §5 |
| **Gate** | Architecture validée — pas de notion de tenant dans le schéma |

Une instance Docker = une organisation. Pas de support multi-tenant en P1 ni prévu en P2. Hors périmètre.

---

### NFR-DEPLOY-002 — Secrets via variables d'environnement

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | F-00 §3.1 |
| **Gate** | `.env` absent du repo git. `.env.example` présent et complet |

`.env` jamais commité (`.gitignore`). `.env.example` commité avec valeurs placeholder. Secrets critiques : `DB_PASSWORD`, `JWT_SECRET` (min 32 chars).

---

### NFR-DEPLOY-003 — Validation déploiement machine vierge

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ⚠️ `partial` |
| **Source** | Plan Sprint §Sprint 5, tâche 5.7 |
| **Gate** | `docker-compose up -d` sur machine sans historique → application fonctionnelle (Sprint 5) |

Gate de sortie du Sprint 5 — MVP. Simule le déploiement chez un client. Bloquant avant livraison.

---

### NFR-DEPLOY-004 — SSO SAML2

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Statut** | 🔵 `deferred` |
| **Source** | Brief §3.2, §5 |
| **Gate** | P2 — spec à rédiger |

Remplacement de l'authentification locale par SSO SAML2 (protocole standard, non couplé à un fournisseur spécifique). Différé en P2.

---

## 7. Internationalisation

### NFR-I18N-001 — Langue française, zéro string en dur

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ⚠️ `partial` |
| **Source** | F-02 |
| **Gate** | `grep -r '"[A-Z]' src/components src/pages` — zéro résultat après relecture manuelle |

Toutes les strings visibles passent par `t('key')` (react-i18next). Fichier source : `src/i18n/locales/fr.json`. Langue unique FR en P1. Le rétrofittage des composants F-01 et FS-01 est inclus dans la tâche F-02.

---

### NFR-I18N-002 — Convention de nommage des clés

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ⚠️ `partial` |
| **Source** | F-02 §4 |
| **Gate** | Audit manuel des clés `fr.json` — structure `domaine.page.element` respectée |

Structure : `domaine.page.element` — ex : `domains.list.title`, `common.actions.save`. Les nouvelles clés sont ajoutées dans `fr.json` **en même temps** que le composant, jamais après.

---

### NFR-I18N-003 — Support multi-langue

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Statut** | ⚠️ `partial` |
| **Source** | F-02 §1 |
| **Gate** | P2 |

L'infrastructure i18next est en place. Ajout d'une langue = ajout d'un fichier `en.json` + sélecteur UI. Différé en P2.

---

## 8. Conformité & Gouvernance

### NFR-GOV-001 — API-first / OpenAPI

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ✅ `covered` |
| **Source** | Brief §2 O5, Setup §7 |
| **Gate** | `docs/04-Tech/openapi.yaml` à jour avant chaque sprint |

Toute interaction avec les données passe par l'API REST. Le frontend React est le premier consommateur. Documentation OpenAPI/Swagger incluse dès P1. Garantit l'ouverture à des intégrations futures sans refactoring.

---

### NFR-GOV-002 — Intégrité référentielle applicative

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ❌ `missing` |
| **Source** | F-999 Item 5 |
| **Gate** | Voir NFR-MAINT-002 |

Voir NFR-MAINT-002. Les suppressions bloquées retournent `409 DEPENDENCY_CONFLICT` avec le nombre de dépendances dans le message.

---

### NFR-GOV-003 — Import de données Excel

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ⚠️ `partial` |
| **Source** | Brief §3.1, §8 |
| **Gate** | Spécification format Excel validée avant Sprint 5 (tâche 5.1) |

Upload frontend + validation backend avant insertion pour les 6 entités P1. Format d'import et règles de validation à spécifier en tâche 5.1 (gate obligatoire avant FS-10). Aucune intégration externe requise.

---

### NFR-GOV-004 — Intégrations hors périmètre

| Champ | Valeur |
|---|---|
| **Priorité** | — |
| **Statut** | N/A |
| **Source** | Brief §7 |

Explicitement exclus : Azure Application Insights, CMDB (ServiceNow/iTop), JIRA/Azure DevOps, reporting BI/avancé, support multi-tenant, OKR/stratégie, data lineage, méta-modèle extensible, notifications.

---

### NFR-GOV-005 — Champs socle, liaison tags et triggers d'audit des entités métier principales

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Statut** | ⚠️ `partial` |
| **Source** | Brief §3.1, F-999, _template.md, schema.sql §4 |
| **Gate** | Revue `schema.prisma` + `schema.sql` avant chaque sprint CRUD — checklist §gate ci-dessous |

Toute table représentant un objet métier principal (Applications, Business Capabilities, Data Objects, Interfaces, IT Components, Providers, Domains) doit obligatoirement exposer les **5 champs socle**, la **liaison tags** et les **triggers d'audit trail** décrits ci-dessous.

> **Note sur `Domain` :** ✅ Domain est conforme NFR-GOV-005 depuis FS-02 v1.3. Champs socle présents (`updatedAt`, `comment`), liaison tags via `EntityTag` (F-03), trigger audit `trg_audit_domain` actif.

#### 5 champs socle obligatoires

| Champ Prisma | Type Prisma | Colonne SQL | Contrainte | Défaut |
|---|---|---|---|---|
| `name` | `String @db.VarChar(255)` | `name VARCHAR(255)` | `NOT NULL` | — |
| `description` | `String?` | `description TEXT` | nullable | `NULL` |
| `comment` | `String?` | `comment TEXT` | nullable | `NULL` |
| `createdAt` | `DateTime @default(now()) @map("created_at") @db.Timestamptz` | `created_at TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | `now()` |
| `updatedAt` | `DateTime @updatedAt @map("updated_at") @db.Timestamptz` | `updated_at TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | trigger `moddatetime` |

> **`comment` vs `description` :** `description` documente l'objet métier (visible dans le Side Drawer et la Full Page). `comment` est un champ libre pour les notes internes des architectes — visible **uniquement dans la Full Page, onglet Général**, jamais dans le Side Drawer ni les vues liste.

#### Liaison Tags (n:n polymorphique avec dimensions hiérarchiques)

> **Mise à jour v0.3 — Mars 2026 :** Le modèle de tags a été remplacé par F-03 (Dimension Tags Foundation). Ce nouveau modèle implémente des tags hiérarchiques polymorphes avec dimensions.

Le système de tags ARK repose sur trois tables :
- `tag_dimensions` : les catégories de tags (ex: Geography, Brand, LegalEntity)
- `tag_values` : les valeurs hiérarchiques au sein d'une dimension (ex: europe/france/paris)
- `entity_tags` : la table de jonction polymorphique reliant une entité à des valeurs de tag

**Principe :** La tagging relationship est gérée via la table de jonction polymorphique `entity_tags`. Aucune colonne supplémentaire n'est ajoutée aux entités de base (Application, IT_Component, etc.). Ce pattern évite N tables de jonction dédiées et permet une future API transverse `/tags/:id/entities` sans migration.

**Spécification complète :** Voir F-03 §2 (Modèle Prisma).

**Trade-off assumé :** pas de contrainte FK applicative sur `entity_id` (UUID libre) — la cohérence est garantie par le service NestJS (validation à l'écriture, nettoyage lors de la suppression de l'entité parente).

```sql
-- Tables de tags (voir F-03 pour schéma complet)
CREATE TABLE tag_dimensions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color       VARCHAR(7),   -- ex: "#1A237E"
  icon        VARCHAR(50),  -- nom d'icône lucide-react
  multi_value BOOLEAN DEFAULT true,
  entity_scope VARCHAR(50)[] DEFAULT '{}',
  sort_order   INTEGER DEFAULT 0,
  comment     TEXT,          -- notes internes (NFR-GOV-005)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tag_values (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID      NOT NULL REFERENCES tag_dimensions(id) ON DELETE CASCADE,
  path        VARCHAR(500) NOT NULL,  -- ex: "europe/france/paris"
  label       VARCHAR(255),            -- ex: "Paris" (casse préservée)
  parent_id   UUID,
  depth       SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dimension_id, path)
);

CREATE TABLE entity_tags (
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     UUID        NOT NULL,
  tag_value_id  UUID        NOT NULL REFERENCES tag_values(id) ON DELETE CASCADE,
  tagged_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  tagged_by     UUID,
  PRIMARY KEY (entity_type, entity_id, tag_value_id)
);
CREATE INDEX idx_entity_tags_lookup ON entity_tags (entity_type, entity_id);
CREATE INDEX idx_entity_tags_by_value ON entity_tags (tag_value_id);
```

```prisma
-- Voir F-03 §2 pour le schéma Prisma complet
-- Modèle TagDimension : suit les 5 champs socle (name, description, comment, createdAt, updatedAt)
-- Modèle TagValue : structure hiérarchique, pas de champs socle
model TagDimension {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @unique @db.VarChar(255)
  description String?
  comment     String?  @db.Text
  color       String?  @db.VarChar(7)
  icon        String?  @db.VarChar(50)
  multiValue  Boolean  @default(true) @map("multi_value")
  entityScope String[] @default([]) @map("entity_scope")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  values TagValue[]

  @@map("tag_dimensions")
}

model TagValue {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  dimensionId String   @map("dimension_id") @db.Uuid
  path        String   @db.VarChar(500)
  label       String   @db.VarChar(255)
  parentId    String?  @map("parent_id") @db.Uuid
  depth       Int      @default(0) @db.SmallInt
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  dimension  TagDimension @relation(fields: [dimensionId], references: [id], onDelete: Cascade)
  parent     TagValue?    @relation("TagValueHierarchy", fields: [parentId], references: [id])
  children   TagValue[]   @relation("TagValueHierarchy")
  entityTags EntityTag[]

  @@unique([dimensionId, path])
  @@map("tag_values")
}

model EntityTag {
  entityType String   @map("entity_type") @db.VarChar(50)
  entityId   String   @map("entity_id") @db.Uuid
  tagValueId String   @map("tag_value_id") @db.Uuid
  taggedAt   DateTime @default(now()) @map("tagged_at") @db.Timestamptz
  taggedById String?  @map("tagged_by") @db.Uuid

  tagValue TagValue @relation(fields: [tagValueId], references: [id], onDelete: Cascade)

  @@id([entityType, entityId, tagValueId])
  @@index([entityType, entityId], name: "idx_entity_tags_lookup")
  @@index([tagValueId], name: "idx_entity_tags_by_value")
  @@map("entity_tags")
}
```

#### Triggers d'audit trail obligatoires

Chaque table métier principale doit avoir un trigger `AFTER INSERT OR UPDATE OR DELETE` vers `fn_audit_trail()`, identique au pattern `schema.sql §4` :

```sql
CREATE TRIGGER trg_audit_[entity]
  AFTER INSERT OR UPDATE OR DELETE ON [entity_table]
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trail();
```

Le champ `changed_by` est alimenté via `SET LOCAL ark.current_user_id` positionné par `AuditContextMiddleware` (RM-02 — écrit manuellement, jamais délégué à OpenCode).

#### Gate de validation (checklist par sprint CRUD)

```bash
# 1. Champs socle présents
\d [entity_table]
# → colonnes name, description, comment, created_at, updated_at visibles

# 2. Trigger d'audit actif
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = '[entity_table]';
# → trg_audit_[entity] présent

# 3. Tags liables
SELECT * FROM entity_tags WHERE entity_type = '[entity_type]' LIMIT 1;
# → requête s'exécute sans erreur (table présente, index actif)
```

---

## 9. Tableau de synthèse — Couverture P1

| ID | Titre court | Catégorie | P1/P2 | Statut |
|---|---|---|---|---|
| NFR-SEC-001 | Hachage Bcrypt | Sécurité | P1 | ✅ `covered` |
| NFR-SEC-002 | JWT mémoire / TTL 15min | Sécurité | P1 | ✅ `covered` |
| NFR-SEC-003 | Absence CSRF | Sécurité | P1 | ✅ `covered` |
| NFR-SEC-004 | RBAC global | Sécurité | P1 | ✅ `covered` |
| NFR-SEC-005 | Droits par domaine | Sécurité | P2 | ⚠️ `partial` |
| NFR-SEC-006 | Anti-injection SQL raw | Sécurité | P1 | ⚠️ `partial` |
| NFR-SEC-007 | Anti-XSS React natif | Sécurité | P1 | ✅ `covered` |
| NFR-SEC-008 | Rate limiting | Sécurité | P1 | ❌ `missing` |
| NFR-SEC-009 | Audit trail triggers | Sécurité | P1 | ✅ `covered` |
| NFR-SEC-010 | CORS production | Sécurité | P2 | ⚠️ `partial` |
| NFR-PERF-001 | Scalabilité 5→100 users | Performance | P1 | ✅ `covered` |
| NFR-PERF-002 | Pagination normalisée | Performance | P1 | ❌ `missing` |
| NFR-PERF-003 | Index PostgreSQL | Performance | P1 | ✅ `covered` |
| NFR-PERF-004 | WITH RECURSIVE validée | Performance | P1 | ⚠️ `partial` |
| NFR-PERF-005 | Indicateurs interfaces | Performance | P2 | ⚠️ `partial` |
| NFR-DISP-001 | Docker on-premise | Disponibilité | P1 | ✅ `covered` |
| NFR-DISP-002 | Séquence démarrage Docker | Disponibilité | P1 | ✅ `covered` |
| NFR-DISP-003 | ErrorBoundary React | Disponibilité | P1 | ✅ `covered` |
| NFR-DISP-004 | Stratégie backup | Disponibilité | P2 | 🔵 `deferred` |
| NFR-MAINT-001 | Format erreur normalisé | Maintenabilité | P1 | ❌ `missing` |
| NFR-MAINT-002 | Politique suppression | Maintenabilité | P1 | ❌ `missing` |
| NFR-MAINT-003 | Architecture modulaire | Maintenabilité | P1 | ✅ `covered` |
| NFR-MAINT-004 | Migrations Prisma | Maintenabilité | P1 | ✅ `covered` |
| NFR-MAINT-005 | Swagger auto-généré | Maintenabilité | P1 | ✅ `covered` |
| NFR-OBS-001 | Logging JSON Winston | Observabilité | P1 | ✅ `covered` |
| NFR-OBS-002 | Audit trail base | Observabilité | P1 | ✅ `covered` |
| NFR-OBS-003 | Healthcheck endpoint | Observabilité | P2 | 🔵 `deferred` |
| NFR-OBS-004 | UI historique changements | Observabilité | P2 | ⚠️ `partial` |
| NFR-DEPLOY-001 | Single-tenant | Déployabilité | P1 | ✅ `covered` |
| NFR-DEPLOY-002 | Secrets via .env | Déployabilité | P1 | ✅ `covered` |
| NFR-DEPLOY-003 | Test machine vierge | Déployabilité | P1 | ⚠️ `partial` |
| NFR-DEPLOY-004 | SSO SAML2 | Déployabilité | P2 | 🔵 `deferred` |
| NFR-I18N-001 | Zéro string en dur | i18n | P1 | ⚠️ `partial` |
| NFR-I18N-002 | Convention clés i18n | i18n | P1 | ⚠️ `partial` |
| NFR-I18N-003 | Multi-langue | i18n | P2 | ⚠️ `partial` |
| NFR-GOV-001 | API-first / OpenAPI | Gouvernance | P1 | ✅ `covered` |
| NFR-GOV-002 | Intégrité référentielle | Gouvernance | P1 | ❌ `missing` |
| NFR-GOV-003 | Import Excel | Gouvernance | P1 | ⚠️ `partial` |
| NFR-GOV-004 | Intégrations exclues | Gouvernance | — | N/A |
| NFR-GOV-005 | Champs socle + tags + audit trigger | Gouvernance | P1 | ✅ `covered` |

**Bilan P1 (31 NFR) :**
- ✅ Couverts : 17
- ⚠️ Partiels : 8
- ❌ Manquants : 5 (tous dans F-999 — à implémenter avant Sprint 2)
- 🔵 Différés P2 : 5

---

## 10. Journal des modifications

| Date | NFR | Modification | Auteur |
|---|---|---|---|
| 2026-03-08 | NFR-GOV-005 | Remplacement du modèle de tags plat par le modèle hiérarchique dimensionnel (F-03). Ajout champs socle sur TagDimension (comment, updatedAt). Référence F-03 — v0.3 | Alec |
| 2026-03-08 | NFR-GOV-005 | Ajout champs socle obligatoires (name, description, comment, created_at, updated_at), liaison tags polymorphique, triggers audit — v0.2 | Alec |
| 2026-03-08 | NFR-GOV-005 | Domain marqué comme conforme suite à FS-02 v1.3 (champs socle, tags via F-03, audit trigger) | OpenCode |
| 2026-03-03 | Tous | Création initiale v0.1 — 38 NFR, 8 catégories | Alec |

---

_Document de travail ARK NFR v0.3 — à mettre à jour à chaque sprint_