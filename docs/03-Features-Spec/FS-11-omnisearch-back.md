# ARK — FS-11 Omnisearch — Backend Spec

> **Changelog v0.1 :** Création — spec pour endpoint de recherche transverse sur les 7 entités EA (applications, domains, business capabilities, providers, IT components, data objects, interfaces).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-11-BACK |
| **Titre** | Omnisearch — Backend |
| **Priorité** | P1 |
| **Statut** | `done` |
| **Dépend de** | FS-01, FS-02-BACK, FS-03-BACK, FS-04-BACK, FS-05-BACK, FS-06-BACK, FS-07-BACK, FS-08-BACK |
| **Spec mère** | FS-11 — Navigation & UX transverse |
| **Spec front** | FS-11-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | 0.5j |
| **Version** | 0.1 |

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette spec fait :**

Expose un endpoint unique de recherche transverse (`/api/v1/search`) permettant de rechercher une chaîne de caractères dans le nom et la description de toutes les entités EA du catalogue (7 types). Retourne une liste plate de résultats triée par pertinence, prête à être consommée par le composant de recherche global du frontend.

**Hors périmètre :**
- Frontend — couvert par `FS-11-FRONT`
- Recherche avancée (filtres, facets, scoring complexe) — P2
- Indexation full-text PostgreSQL (tsvector) — P2, recherche LIKE pour MVP
- Recherche dans les relations (ex: trouver une BC via le nom d'une app liée) — hors périmètre

---

## 2. Modèle BDD ⚠️

> Pas de nouvelle table. L'Omnisearch interroge les 7 tables existantes via requêtes parallèles Prisma.

### Tables concernées

| Entité | Table | Champs searchables |
|---|---|---|
| Application | `applications` | `name` (priorité haute), `description` (priorité basse) |
| Domain | `domains` | `name`, `description` |
| Business Capability | `business_capabilities` | `name`, `description` |
| Provider | `providers` | `name`, `description` |
| IT Component | `it_components` | `name`, `description` |
| Data Object | `data_objects` | `name`, `description` |
| Interface | `interfaces` | `name`, `description` |

> **Note :** `interfaces` est inclus malgré FS-08-FRONT en `draft` car la table existe et FS-08-BACK est `done`. Le clic sur un résultat interface depuis le frontend affichera un placeholder ou un drawer minimal jusqu'à l'implémentation complète de FS-08-FRONT.

---

## 3. Contrat API (OpenAPI) ⚠️

```yaml
paths:

  /api/v1/search:
    get:
      summary: Recherche transverse sur toutes les entités EA
      tags: [Search]
      security:
        - bearerAuth: []
      parameters:
        - name: q
          in: query
          required: true
          description: Terme de recherche (min 2 caractères)
          schema:
            type: string
            minLength: 2
            maxLength: 100
            example: "CRM"
        - name: types
          in: query
          required: false
          description: Types d'entités à inclure (tous par défaut si absent)
          schema:
            type: array
            items:
              type: string
              enum: [application, domain, businessCapability, provider, itComponent, dataObject, interface]
            example: ["application", "domain"]
        - name: limit
          in: query
          required: false
          description: Nombre maximum de résultats retournés (défaut 20, max 50)
          schema:
            type: integer
            minimum: 1
            maximum: 50
            default: 20
            example: 20
      responses:
        '200':
          description: Liste de résultats triés par pertinence
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    maxItems: 50
                    items:
                      $ref: '#/components/schemas/SearchResultItem'
                  meta:
                    type: object
                    properties:
                      total:
                        type: integer
                        description: Nombre total de résultats (avant limit)
                        example: 34
                      query:
                        type: string
                        example: "CRM"
                      types:
                        type: array
                        items:
                          type: string
                        example: ["application", "domain", "businessCapability", "provider", "itComponent", "dataObject", "interface"]
                      limit:
                        type: integer
                        example: 20
        '400':
          description: Requête invalide (q manquant, trop court, ou types invalide)
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                    example: 400
                  code:
                    type: string
                    example: "SEARCH_QUERY_INVALID"
                  message:
                    type: string
                    example: "Le terme de recherche doit contenir au moins 2 caractères"
        '401':
          description: Non authentifié

components:
  schemas:
    SearchResultItem:
      type: object
      properties:
        id:
          type: string
          format: uuid
          description: ID de l'entité
          example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        type:
          type: string
          enum: [application, domain, businessCapability, provider, itComponent, dataObject, interface]
          description: Type d'entité pour la navigation frontend
          example: "application"
        name:
          type: string
          description: Nom de l'entité (match highlighté côté client)
          example: "CRM Salesforce"
        description:
          type: string
          nullable: true
          description: Description tronquée (max 150 caractères)
          example: "Application CRM principale pour la gestion des clients..."
        score:
          type: integer
          minimum: 1
          maximum: 10
          description: Score de pertinence (10 = match exact name, 5 = name contient, 1 = description contient)
          example: 10
        meta:
          type: object
          nullable: true
          description: Métadonnées contextuelles selon le type
          properties:
            domainName:
              type: string
              nullable: true
              description: Nom du domaine parent (pour Application, BC, Domain)
            criticality:
              type: string
              nullable: true
              enum: [LOW, MEDIUM, HIGH, CRITICAL]
              description: Niveau de criticité (pour Application, BC, Interface)
            lifecycleStatus:
              type: string
              nullable: true
              description: Statut de cycle de vie (pour Application uniquement)
```

---

## 4. Règles Métier Backend ⚠️

- **RM-01 — Terme de recherche minimal :** `q` doit contenir au moins 2 caractères non-espace. Sinon → `400 SEARCH_QUERY_INVALID`.

- **RM-02 — Pertinence du scoring :**
  - Score 10 : match exact sur `name` (case-insensitive)
  - Score 9 : `name` commence par le terme recherché
  - Score 5 : `name` contient le terme recherché
  - Score 1 : `description` contient le terme recherché
  - Les résultats sont triés par score décroissant, puis par nom alphabétique

- **RM-03 — Filtre par types :** Si `types` fourni, limiter la recherche aux tables correspondantes. Types invalides → ignorés silencieusement (pas d'erreur).

- **RM-04 — Limit et pagination :** Pas de pagination offset-based. Le `limit` contrôle uniquement la taille de la réponse finale. Les requêtes parallèles sur chaque table utilisent `limit * 2` pour garantir un résultat diversifié avant le tri global.

- **RM-05 — Pas d'audit trail sur GET :** La recherche est une opération de lecture pure — pas de trace en `audit_trail` (contrairement aux mutations POST/PATCH/DELETE).

- **RM-06 — Permission :** Tout utilisateur authentifié (`JwtAuthGuard`) peut accéder à l'endpoint. Pas de permission spécifique `search:read` requise.

---

## 5. Comportements Backend par Cas d'Usage

**Nominal :**
- `GET /api/v1/search?q=CRM` authentifié → `200` avec tableau de résultats triés par pertinence
- `GET /api/v1/search?q=CRM&types[]=application&types[]=domain` → résultats filtrés aux types demandés
- `GET /api/v1/search?q=CRM&limit=5` → maximum 5 résultats retournés

**Erreurs :**
- `q` manquant → `400 SEARCH_QUERY_INVALID`
- `q` avec 1 caractère seulement → `400 SEARCH_QUERY_INVALID`
- `q` avec espaces uniquement → `400 SEARCH_QUERY_INVALID`
- `types` contient valeur invalide (ex: `foo`) → ignoré silencieusement
- Token invalide → `401`

**Edge cases :**
- Aucun résultat → `200` avec `data: []` et `meta.total: 0`
- Recherche avec caractères spéciaux SQL (`%`, `_`) → échappés automatiquement par Prisma `contains: ...`

---

## 6. Structure de Fichiers Backend

```
backend/src/search/
├── search.module.ts
├── search.controller.ts
├── search.service.ts
├── search.service.spec.ts      ← tests unit Jest
└── dto/
    └── query-search.dto.ts

backend/test/
└── FS-11-search.e2e-spec.ts    ← tests Supertest
```

---

## 7. Tests Backend ⚠️

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable à OpenCode |
|---|---|---|---|
| Unit (service NestJS) | **Jest** | `src/search/search.service.spec.ts` | ✅ Oui |
| API / contrat HTTP | **Supertest** | `test/FS-11-search.e2e-spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Supertest** | `test/FS-11-search.e2e-spec.ts` | ❌ **Manuel** |

### Tests Jest — Unit

- [ ] `[Jest]` `SearchService.search()` retourne un tableau vide si aucun résultat
- [ ] `[Jest]` `SearchService.search()` retourne des résultats triés par score décroissant
- [ ] `[Jest]` `SearchService.search()` filtre par types si `types` fourni
- [ ] `[Jest]` `SearchService.search()` lève `BadRequestException` si `q` < 2 caractères
- [ ] `[Jest]` `SearchService.search()` combine correctement les résultats de 7 tables
- [ ] `[Jest]` `SearchService.calculateScore()` retourne 10 pour match exact
- [ ] `[Jest]` `SearchService.calculateScore()` retourne 5 pour substring match

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /api/v1/search?q=test` authentifié → `200` avec `data` array
- [ ] `[Supertest]` `GET /api/v1/search?q=test` liste vide → `200` avec `data: []`
- [ ] `[Supertest]` `GET /api/v1/search?q=ab` (min 2 chars) → `200`
- [ ] `[Supertest]` `GET /api/v1/search?q=a` (1 char) → `400 SEARCH_QUERY_INVALID`
- [ ] `[Supertest]` `GET /api/v1/search?q=  ` (espaces) → `400 SEARCH_QUERY_INVALID`
- [ ] `[Supertest]` `GET /api/v1/search?q=test&types[]=application` → résultats uniquement applications
- [ ] `[Supertest]` `GET /api/v1/search?q=test&types[]=invalid` → types invalides ignorés, autres types retournés
- [ ] `[Supertest]` `GET /api/v1/search?q=test&limit=5` → max 5 résultats
- [ ] `[Supertest]` `GET /api/v1/search?q=test` résultats contiennent champs obligatoires (id, type, name, score)
- [ ] `[Supertest]` `GET /api/v1/search?q=CRM` match exact name CRM → score 10 en premier
- [ ] `[Supertest]` `GET /api/v1/search?q=NomInexistant` → `200` avec `meta.total: 0`

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `GET /api/v1/search?q=test` sans token → `401`
- [ ] `[Manuel]` Tout utilisateur authentifié (même rôle readonly) peut chercher → `200`

---

## 8. Commande OpenCode — Backend ⚠️

```
Contexte projet ARK — Session Backend FS-11-BACK :

Stack : NestJS strict mode + Prisma ORM + PostgreSQL 16 + TypeScript strict
Structure modules : src/search/search.module.ts / .controller.ts / .service.ts / dto/

Conventions obligatoires :
- PrismaModule est global (APP_MODULE) — ne jamais le réimporter dans un module feature
- JwtAuthGuard est global — décorer avec @Public() les seules routes publiques (ici aucune, search est protégé)
- Format d'erreur standard : { statusCode, code, message, timestamp, path }
  → BadRequestException({ code: 'SEARCH_QUERY_INVALID', message: '...' }) pour q invalide
- Pas d'audit trail sur GET search (lecture pure)
- Requêtes parallèles : Promise.all([prisma.table1.findMany(...), prisma.table2.findMany(...)])
- Tests unit : jest.mock() sur PrismaService — pas de base réelle
- Fichier test e2e : backend/test/FS-11-search.e2e-spec.ts

Pattern de référence NestJS : module Domains (FS-02-BACK) — s'y conformer pour la structure et le style.

Implémente la feature "Omnisearch" backend (FS-11-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTO, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-11-BACK.md ICI]
```

---

## 9. Gate de Validation Backend ⚠️

| # | Gate | Vérification | Bloquant |
|---|---|---|---|
| G-01 | Module Search enregistré | `SearchModule` importé dans `app.module.ts` | ✅ Oui |
| G-02 | Tests Jest passent | `npm run test -- --testPathPattern=search` → 0 failed | ✅ Oui |
| G-03 | Tests Supertest passent | `npm run test:e2e -- --testPathPattern=FS-11` → 0 failed | ✅ Oui |
| G-04 | Tests RBAC manuels validés | Cas [Manuel] §7 vérifiés à la main | ✅ Oui |
| G-05 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-06 | Statut mis à jour | Passer `FS-11-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-07 | Revue TD backend | TD-1 à TD-6 vérifiés, F-999 mis à jour | ✅ Oui |
| G-08 | `openapi.yaml` mis à jour | Path `/search` présent dans `docs/04-Tech/openapi.yaml` | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

- [ ] `GET /api/v1/search?q=test` retourne `200` avec réponse conforme au schéma
- [ ] Score de pertinence correctement calculé (10/9/5/1)
- [ ] Résultats triés par score décroissant
- [ ] Paramètre `types` filtre correctement
- [ ] Limite `limit` respectée
- [ ] Erreur `400 SEARCH_QUERY_INVALID` pour `q` < 2 caractères
- [ ] Toute réponse `400` inclut le champ `code` explicite
- [ ] Aucun `TODO / FIXME / HACK` non tracé
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions Prisma, structure modules, mock Prisma respectées
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec le path `/search` (NFR-GOV-001)

---

## 11. Revue de Dette Technique *(gate de fin de sprint — obligatoire)* ⚠️

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées pour les items de ce sprint | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour (`missing` → `covered` / `partial`) | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Résultat de la Revue

| Champ | Valeur |
|---|---|
| **Sprint** | S4 |
| **Date de revue** | *(à compléter)* |
| **Items F-999 fermés** | — |
| **Items F-999 ouverts** | — |
| **Nouveaux items F-999 créés** | — |
| **NFR mis à jour** | — |
| **TODOs résiduels tracés** | — |
| **Statut gates TD** | *(à cocher)* |

---

_ARK — FS-11-BACK v0.1 — 2026-04-19_
