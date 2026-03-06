# ARK — Feature Spec FS-02-BACK : Domains (Backend)

_Version 1.1 — Mars 2026_

> **Changelog v1.1 :**
> - Statut `pending` → `draft` (alignement nomenclature ARK)
> - Suppression de F-02 des dépendances — F-02 est purement frontend, sans impact NestJS (correctif B1)
> - Commande OpenCode §8 enrichie avec les conventions critiques inline — ne plus pointer vers AGENTS.md par référence (correctif B3)
> - Gate §9 nettoyée — suppression de F-02, suppression des doublons avec §10 (correctif A4)
> - Checklist §10 recentrée sur la validation post-session uniquement (correctif A4)
> - Ajout gate de déblocage FS-02-FRONT explicite en fin de §9

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-02-BACK |
| **Titre** | Domains — API REST Backend |
| **Priorité** | P1 |
| **Statut** | `draft` |
| **Dépend de** | FS-01 |
| **Spec mère** | FS-02 Domains v0.10 |
| **Estimé** | 1 jour |
| **Version** | 1.1 |

---

## 1. Objectif

Implémenter l'API REST complète pour la gestion des Domaines métier : création, lecture, modification et suppression. Ce module est le **patron de référence backend** pour tous les modules suivants (FS-03 à FS-11).

**Hors périmètre :** Frontend — couvert par `FS-02-FRONT` (bloquée tant que cette spec n'est pas `done`).

---

## 2. Modèle Prisma ⚠️

```prisma
model Domain {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @unique @db.VarChar(255)
  description String?
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  applications         Application[]
  businessCapabilities BusinessCapability[]

  @@map("domains")
}
```

> **Note** : `Domain` n'a pas de `updatedAt` — cohérent avec `schema.sql`. Ne pas l'ajouter.

---

## 3. Contrat API (OpenAPI) ⚠️

> Ce contrat est la **source de vérité** référencée par `FS-02-FRONT`. Ne pas le modifier sans bumper les deux specs.

```yaml
paths:

  /api/v1/domains:
    get:
      summary: Liste de tous les domaines
      tags: [Domains]
      security:
        - bearerAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/DomainResponse'
        '401':
          description: Non authentifié

    post:
      summary: Créer un domaine
      tags: [Domains]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateDomainDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DomainResponse'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '409':
          description: Nom de domaine déjà utilisé
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "CONFLICT" }
                  message:    { type: string }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

  /api/v1/domains/{id}:
    get:
      summary: Détail d'un domaine
      tags: [Domains]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DomainResponse'
        '401':
          description: Non authentifié
        '404':
          description: Domaine introuvable

    patch:
      summary: Modifier un domaine
      tags: [Domains]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateDomainDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DomainResponse'
        '404':
          description: Domaine introuvable
        '409':
          description: Nom de domaine déjà utilisé
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "CONFLICT" }
                  message:    { type: string }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

    delete:
      summary: Supprimer un domaine
      tags: [Domains]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '204':
          description: Domaine supprimé
        '404':
          description: Domaine introuvable
        '409':
          description: Domaine utilisé par des entités liées
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode: { type: integer, example: 409 }
                  code:       { type: string,  example: "DEPENDENCY_CONFLICT" }
                  message:    { type: string }
                  timestamp:  { type: string, format: date-time }
                  path:       { type: string }

components:
  schemas:

    DomainResponse:
      type: object
      properties:
        id:          { type: string, format: uuid }
        name:        { type: string }
        description: { type: string, nullable: true }
        createdAt:   { type: string, format: date-time }

    CreateDomainDto:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          example: "Finance"
        description:
          type: string
          nullable: true
          maxLength: 2000

    UpdateDomainDto:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
        description:
          type: string
          nullable: true
          maxLength: 2000
```

---

## 4. Règles Métier Backend ⚠️

- **RM-01 — Nom unique :** Deux domaines ne peuvent pas avoir le même nom. `409` + code `"CONFLICT"` + message `"Domain name already in use"`. Intercepter l'erreur Prisma `P2002` dans un try/catch ciblé — ne pas laisser remonter.

- **RM-02 — Nom non vide :** `name` obligatoire, non vide, non uniquement espaces. `@IsNotEmpty()` + `@Transform(() => value.trim())` avant validation. Les espaces uniquement sont rejetés comme vide → `400`.

- **RM-03 — Suppression bloquée si domaine utilisé :**

```typescript
async remove(id: string): Promise<void> {
  const domain = await this.prisma.domain.findUnique({
    where: { id },
    select: {
      _count: {
        select: { applications: true, businessCapabilities: true }
      }
    }
  });
  if (!domain) throw new NotFoundException('Domain not found');

  const total = domain._count.applications + domain._count.businessCapabilities;
  if (total > 0) {
    throw new ConflictException({
      code: 'DEPENDENCY_CONFLICT',
      message: `Domain is used by ${domain._count.applications} application(s) ` +
        `and ${domain._count.businessCapabilities} business capability(ies)`
    });
  }
  await this.prisma.domain.delete({ where: { id } });
}
```

- **RM-04 — Droits requis :** `domains:read` sur GET. `domains:write` sur POST/PATCH/DELETE.

- **RM-05 — Pas de soft delete :** Suppression physique après vérification RM-03.

---

## 5. Structure de Fichiers Backend

```
backend/src/domains/
├── domains.module.ts
├── domains.controller.ts
├── domains.service.ts
├── domains.service.spec.ts      ← tests unit Jest
└── dto/
    ├── create-domain.dto.ts
    └── update-domain.dto.ts

backend/test/
└── FS-02-domains.e2e-spec.ts    ← tests Supertest
```

---

## 6. Tests Backend ⚠️

### Tests Jest — Unit

- [ ] `[Jest]` `DomainsService.findAll()` retourne un tableau
- [ ] `[Jest]` `DomainsService.create()` retourne le domaine créé
- [ ] `[Jest]` `DomainsService.create()` lève `ConflictException` sur erreur Prisma `P2002`
- [ ] `[Jest]` `DomainsService.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `DomainsService.remove()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `DomainsService.remove()` lève `ConflictException` si des applications sont liées
- [ ] `[Jest]` `DomainsService.remove()` lève `ConflictException` si des business capabilities sont liées
- [ ] `[Jest]` `DomainsService.remove()` lève `ConflictException` si applications ET business capabilities liées
- [ ] `[Jest]` `DomainsService.remove()` appelle `prisma.domain.delete()` si aucune entité liée

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /api/v1/domains` authentifié → `200` avec tableau
- [ ] `[Supertest]` `GET /api/v1/domains` liste vide → `200` avec `[]`
- [ ] `[Supertest]` `GET /api/v1/domains` 15 domaines → `200` avec tableau de 15 éléments
- [ ] `[Supertest]` `POST /api/v1/domains` nom valide → `201` avec `DomainResponse`
- [ ] `[Supertest]` `POST /api/v1/domains` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `POST /api/v1/domains` sans `name` → `400`
- [ ] `[Supertest]` `POST /api/v1/domains` name uniquement espaces → `400`
- [ ] `[Supertest]` `GET /api/v1/domains/{id}` existant → `200`
- [ ] `[Supertest]` `GET /api/v1/domains/{id}` UUID inexistant → `404`
- [ ] `[Supertest]` `PATCH /api/v1/domains/{id}` description valide → `200`
- [ ] `[Supertest]` `PATCH /api/v1/domains/{id}` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `DELETE /api/v1/domains/{id}` sans entités liées → `204`
- [ ] `[Supertest]` `DELETE /api/v1/domains/{id}` avec applications liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs dans message
- [ ] `[Supertest]` `DELETE /api/v1/domains/{id}` avec business capabilities liées → `409` + compteurs dans message
- [ ] `[Supertest]` `DELETE /api/v1/domains/{id}` avec applications ET business capabilities liées → `409` + les deux compteurs dans message

### Tests Sécurité / RBAC — Manuel ❌

> À écrire et valider à la main. Ne pas déléguer à OpenCode.

- [ ] `[Manuel]` `GET /api/v1/domains` sans token → `401`
- [ ] `[Manuel]` `POST /api/v1/domains` avec rôle sans `domains:write` → `403`
- [ ] `[Manuel]` `PATCH /api/v1/domains/{id}` avec rôle sans `domains:write` → `403`
- [ ] `[Manuel]` `DELETE /api/v1/domains/{id}` avec rôle sans `domains:write` → `403`

---

## 7. Contraintes Techniques

- **Audit context :** Toute écriture en base passe par `await prisma.$executeRaw\`SET LOCAL ark.current_user_id = ${userId}\`` — convention F-00 RM-02.
- **Gestion erreur P2002 :** try/catch ciblé → `ConflictException({ code: 'CONFLICT', message: '...' })`. Ne pas laisser remonter l'erreur Prisma brute.
- **Pattern suppression :** Vérifier `_count` avant `delete` (RM-03) — jamais de hard delete silencieux.
- **Permissions :** `@RequirePermission('domains:read')` sur GET, `@RequirePermission('domains:write')` sur POST/PATCH/DELETE.
- **Validation DTO :** `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@MaxLength(255)` sur name, `@MaxLength(2000)` sur description.
- **Pas de `updatedAt`** sur le modèle Domain.
- **Mock Prisma dans les tests unit :** `jest.mock()` — ne pas dépendre d'une base réelle.
- **Requêtes raw :** Si usage de `$queryRaw` / `$executeRaw`, tagged template obligatoire — jamais de `Prisma.raw()` avec interpolation (F-999 Item 8).

---

## 8. Commande OpenCode — Backend ⚠️

> Copier-coller intégralement en début de session OpenCode. Ne pas remplacer par un pointeur vers AGENTS.md.

```
Contexte projet ARK — Session Backend FS-02-BACK :

Stack : NestJS strict mode + Prisma ORM + PostgreSQL 16 + TypeScript strict
Structure modules : src/<domaine>/<domaine>.module.ts / .controller.ts / .service.ts / dto/

Conventions obligatoires :
- Toute écriture en base : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global (APP_MODULE) — ne jamais le réimporter dans un module feature
- JwtAuthGuard est global — décorer avec @Public() les seules routes publiques
- @RequirePermission() disponible — utiliser pour chaque handler controller
- Format d'erreur standard : { statusCode, code, message, timestamp, path }
  → ConflictException({ code: 'CONFLICT', message: '...' }) pour P2002
  → ConflictException({ code: 'DEPENDENCY_CONFLICT', message: '...' }) pour suppression bloquée
- Vérification _count Prisma AVANT toute suppression — pattern RM-03 de cette spec
- P2002 intercepté dans un try/catch ciblé → ConflictException — ne jamais laisser remonter
- Requêtes raw : tagged template backtick uniquement — jamais Prisma.raw() avec interpolation
- Tests unit : jest.mock() sur PrismaService — pas de base réelle
- Fichier test e2e : backend/test/FS-02-domains.e2e-spec.ts

Ce module est le patron de référence pour tous les modules suivants (FS-03 à FS-11).
Soigne particulièrement la lisibilité et la cohérence — ce code sera copié comme exemple.

Implémente la feature "Domains" backend (FS-02-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTOs, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-02-BACK.md ICI]
```

---

## 9. Gate de Validation Backend ⚠️

> À valider **avant** de passer `FS-02-FRONT` au statut `stable`.
> FS-02-FRONT reste à `draft` tant que toutes ces gates ne sont pas cochées.

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | Migration Prisma appliquée | `\dt domains` en base → table présente | ✅ Oui |
| G-02 | Seed permissions | `domains:read` et `domains:write` en base | ✅ Oui |
| G-03 | Tests Jest passent | `npm run test -- --testPathPattern=domains` → 0 failed | ✅ Oui |
| G-04 | Tests Supertest passent | `npm run test:e2e -- --testPathPattern=FS-02` → 0 failed | ✅ Oui |
| G-05 | Tests RBAC manuels validés | Les 4 cas [Manuel] §6 vérifiés à la main | ✅ Oui |
| G-06 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-07 | Statut mis à jour | Passer `FS-02-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-08 | Revue TD backend | TD-1 à TD-6 du template vérifiés, F-999 mis à jour | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

> À compléter après génération et avant de cocher les gates §9.

- [ ] `POST /api/v1/domains` retourne `201` avec `DomainResponse` complet
- [ ] `DELETE` avec entités liées retourne `409` + `code: "DEPENDENCY_CONFLICT"`
- [ ] Toutes les réponses `409` incluent le champ `code` explicite (NFR-MAINT-001)
- [ ] `name` uniquement espaces → `400` (RM-02)
- [ ] Aucun `TODO / FIXME / HACK` non tracé dans le code livré
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions AGENTS.md respectées (pattern $executeRaw, structure modules)

---

_FS-02-BACK v1.1 — ARK_