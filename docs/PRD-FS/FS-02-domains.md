# ARK — Feature Spec FS-02 : Domains

_Version 0.4 — Février 2026_

> **Changelog v0.4 :** Section 7 restructurée — chaque cas de test étiqueté `[Jest]` / `[Supertest]` / `[Cypress]` / `[Manuel]`. Fichiers cibles précisés. Section 9 mise à jour pour inclure la génération des tests. Checklist section 10 complétée. Estimation mise à jour (1j → 1.5j).

> **Changelog v0.3 :** Structure de fichiers frontend ajoutée, comportement `404` sur `DomainEditPage` documenté.

> **Changelog v0.2 :** Pages indépendantes (liste / new / :id/edit). Approche vérification avant suppression documentée (Option A — _count Prisma).

> **Usage :** FS-02 est le **module de référence** du projet ARK. Implémenté et validé en premier — tests inclus. OpenCode s'en sert comme exemple de pattern pour toutes les features suivantes (FS-03 à FS-11).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-02 |
| **Titre** | Domains — CRUD complet backend + pages liste/new/edit React |
| **Priorité** | P1 |
| **Statut** | `draft` |
| **Dépend de** | FS-01 |
| **Estimé** | 1.5 jours |
| **Version** | 0.4 |

---

## 1. Objectif & Périmètre

**Ce que cette feature fait :**

FS-02 implémente la gestion complète des Domaines métier : création, lecture, modification et suppression via l'API REST, avec les pages React correspondantes. C'est intentionnellement la feature la plus simple du MVP : pas de relation n:n, pas de récursion, pas de règle métier complexe. Elle sert de module de référence pour tous les suivants — la qualité du code et des tests ici se propage dans tout le MVP.

**Ce qu'elle ne fait pas (hors périmètre) :**

- Pas de droits différenciés par domaine (P2)
- Pas de suppression en cascade — bloquée si entités liées (RM-03)
- Pas de pagination côté serveur en P1
- Pas de recherche / filtrage avancé en P1

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

> Note : `Domain` n'a pas de `updatedAt` — cohérent avec `schema.sql` v0.4. Ne pas l'ajouter.

---

## 3. Contrat API (OpenAPI) ⚠️

```yaml
paths:

  /domains:
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

  /domains/{id}:
    get:
      summary: Détail d'un domaine
      tags: [Domains]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DomainResponse'
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
          schema:
            type: string
            format: uuid
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

    delete:
      summary: Supprimer un domaine
      tags: [Domains]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Domaine supprimé
        '404':
          description: Domaine introuvable
        '409':
          description: Domaine utilisé par des entités liées

components:
  schemas:

    DomainResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time

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
```

---

## 4. Règles Métier Critiques ⚠️

- **RM-01 — Nom unique :** Deux domaines ne peuvent pas avoir le même nom. `409 Conflict` + `"Domain name already in use"`. Intercepter l'erreur Prisma `P2002`.

- **RM-02 — Nom non vide :** `name` obligatoire, non vide, non uniquement espaces. `@IsNotEmpty()`.

- **RM-03 — Suppression bloquée si domaine utilisé (Option A — _count Prisma) :**

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
    throw new ConflictException(
      `Domain is used by ${domain._count.applications} application(s) ` +
      `and ${domain._count.businessCapabilities} business capability(ies)`
    );
  }
  await this.prisma.domain.delete({ where: { id } });
}
```

- **RM-04 — Droits requis :** `domains:write` sur POST/PATCH/DELETE. `domains:read` sur GET.

- **RM-05 — Pas de soft delete :** Suppression physique après vérification RM-03.

---

## 5. Comportement Attendu par Cas d'Usage

**Nominal :**
- `GET /domains` token valide → `200` tableau (vide `[]` si aucun)
- `POST /domains` `{ name: "Finance" }` → `201` domaine créé
- `PATCH /domains/{id}` `{ description: "..." }` → `200` domaine mis à jour
- `DELETE /domains/{id}` sans entités liées → `204`

**Erreurs :**
- `POST /domains` nom existant → `409` + `"Domain name already in use"`
- `POST /domains` sans `name` → `400`
- `DELETE /domains/{id}` 3 applications liées → `409` + `"Domain is used by 3 application(s) and 0 business capability(ies)"`
- `GET /domains/{id}` UUID inexistant → `404` + `"Domain not found"`
- `POST /domains` sans token → `401`
- `POST /domains` sans `domains:write` → `403`

---

## 6. Composants Frontend

**Routes React :**

| Route | Composant | Description |
|---|---|---|
| `/domains` | `DomainsListPage` | Tableau, bouton "Nouveau domaine" |
| `/domains/new` | `DomainNewPage` | Page de création |
| `/domains/:id/edit` | `DomainEditPage` | Page d'édition pré-remplie |

**Composant partagé `DomainForm` :**

```typescript
interface DomainFormProps {
  initialValues?: Partial<DomainFormValues>;
  onSubmit: (values: DomainFormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

interface DomainFormValues {
  name: string;
  description: string;
}

interface DomainResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}
```

**Structure de fichiers frontend :**

```
frontend/src/
├── pages/
│   └── domains/
│       ├── DomainsListPage.tsx
│       ├── DomainNewPage.tsx
│       └── DomainEditPage.tsx
├── components/
│   └── domains/
│       └── DomainForm.tsx
└── types/
    └── domain.ts
```

**Comportements UX :**
- `DomainsListPage` : MUI Dialog de confirmation avant suppression, message `409` si domaine utilisé
- `DomainNewPage` / `DomainEditPage` : erreur inline sur nom dupliqué, bouton désactivé pendant chargement
- `DomainEditPage` : si `GET /domains/:id` → `404`, rediriger vers `/domains`
- Snackbar MUI après création / modification / suppression réussie

---

## 7. Tests ⚠️

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable |
|---|---|---|---|
| Unit services | Jest | `src/domains/domains.service.spec.ts` | ✅ OpenCode |
| Contrat API | Supertest | `test/domains.e2e-spec.ts` | ✅ OpenCode |
| Sécurité / RBAC | Supertest | `test/domains.e2e-spec.ts` | ❌ **Manuel** |
| E2E browser | Cypress | `cypress/e2e/domains.cy.ts` | ✅ OpenCode (nominaux) |

### Tests Jest — Unit

- [ ] `[Jest]` `DomainsService.create()` retourne le domaine créé
- [ ] `[Jest]` `DomainsService.create()` lève `ConflictException` sur erreur Prisma `P2002`
- [ ] `[Jest]` `DomainsService.remove()` lève `ConflictException` si des applications sont liées
- [ ] `[Jest]` `DomainsService.remove()` lève `ConflictException` si des business capabilities sont liées
- [ ] `[Jest]` `DomainsService.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `DomainsService.remove()` appelle `prisma.domain.delete()` si aucune entité liée

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /domains` authentifié → `200` avec tableau
- [ ] `[Supertest]` `GET /domains` liste vide → `200` avec `[]`
- [ ] `[Supertest]` `POST /domains` nom valide → `201` avec domaine créé
- [ ] `[Supertest]` `POST /domains` nom dupliqué → `409`
- [ ] `[Supertest]` `POST /domains` sans `name` → `400`
- [ ] `[Supertest]` `GET /domains/{id}` existant → `200`
- [ ] `[Supertest]` `GET /domains/{id}` UUID inexistant → `404`
- [ ] `[Supertest]` `PATCH /domains/{id}` description valide → `200`
- [ ] `[Supertest]` `DELETE /domains/{id}` sans entités liées → `204`
- [ ] `[Supertest]` `DELETE /domains/{id}` avec applications liées → `409` + message avec compteurs

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `GET /domains` sans token → `401`
- [ ] `[Manuel]` `POST /domains` avec rôle sans `domains:write` → `403`
- [ ] `[Manuel]` `DELETE /domains/{id}` avec rôle sans `domains:write` → `403`
- [ ] `[Manuel]` `PATCH /domains/{id}` avec rôle sans `domains:write` → `403`

### Tests Cypress — E2E Browser

- [ ] `[Cypress]` `DomainsListPage` affiche la liste après login
- [ ] `[Cypress]` Créer un domaine via `DomainNewPage` → apparaît dans la liste
- [ ] `[Cypress]` Modifier un domaine via `DomainEditPage` → mis à jour dans la liste
- [ ] `[Cypress]` Supprimer un domaine sans entités liées → disparaît de la liste
- [ ] `[Cypress]` Tentative de suppression d'un domaine utilisé → message d'erreur `409` visible dans l'UI
- [ ] `[Cypress]` `DomainEditPage` UUID inexistant → redirection vers `/domains`

---

## 8. Contraintes Techniques

- **Ce module est le patron de référence :** Structure, nommage, gestion d'erreurs, tests — tout doit être exemplaire.
- **Structure de fichiers backend cible :**
```
src/domains/
├── domains.module.ts
├── domains.controller.ts
├── domains.service.ts
├── domains.service.spec.ts   ← tests unit Jest
└── dto/
    ├── create-domain.dto.ts
    └── update-domain.dto.ts
test/
└── domains.e2e-spec.ts       ← tests Supertest
```
- **Prisma :** Toute écriture passe par `$executeRaw ark.current_user_id`.
- **Gestion erreur P2002 :** try/catch ciblé → `ConflictException`. Ne pas laisser remonter.
- **Suppression :** Pattern `_count` avant `delete` (RM-03) — à reproduire dans tous les modules.
- **`@RequirePermission()` :** `domains:read` sur GET, `domains:write` sur POST/PATCH/DELETE.
- **Validation DTO :** `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@MaxLength(255)`.
- **Pas de `updatedAt`** sur Domain.
- **Mock Prisma dans les tests unit :** Ne pas dépendre d'une base réelle.
- **Cypress :** Utiliser `cy.login()` depuis `commands.ts` en `beforeEach`.

---

## 9. Commande OpenCode

```
Contexte projet ARK (conventions dans AGENTS.md) :
- Stack : NestJS strict + Prisma + PostgreSQL 16 + React + TypeScript strict
- Toute écriture en base passe par : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global — ne pas le réimporter
- JwtAuthGuard est global — @Public() sur les routes publiques uniquement
- Guards de permission : @RequirePermission('domains:read') et @RequirePermission('domains:write')
- Intercepter l'erreur Prisma P2002 → ConflictException
- Vérifier via _count Prisma avant toute suppression (pattern RM-03)
- Ce module est le patron de référence pour tous les modules suivants
- Stack de test :
  * Unit : Jest — src/domains/domains.service.spec.ts
  * API : Supertest — test/domains.e2e-spec.ts
  * E2E browser : Cypress — cypress/e2e/domains.cy.ts
  * cy.login() disponible dans cypress/support/commands.ts
  * Tests marqués [Manuel] : NE PAS générer

Implémente la feature "Domains" (FS-02) en respectant strictement le contrat ci-dessous.
Génère le code de production ET les tests [Jest], [Supertest] et [Cypress] définis en section 7.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE CETTE SPEC ICI]
```

---

## 10. Checklist de Validation Avant Génération

- [ ] FS-01 au statut `done` — `JwtAuthGuard` global, `@RequirePermission()` disponible
- [ ] **Jest + Supertest opérationnels (G-12 de F-00)**
- [ ] **Cypress opérationnel, `cy.login()` disponible (G-13 de F-00)**
- [ ] `schema.prisma` contient le modèle `Domain` avec ses relations inverses
- [ ] Migration Prisma appliquée — table `domains` présente en base
- [ ] Seed contient les permissions `domains:read` et `domains:write`
- [ ] Spec relue — aucune règle implicite non documentée

---

_Feature Spec FS-02 v0.4 — Projet ARK — Module de référence — Document de travail_

> **Probabilité que cette spec couvre l'intégralité des besoins Domains P1 sans ajustement majeur : ~93%.** Point d'incertitude résiduel : l'interface exacte du guard `@RequirePermission()` dépend de FS-01 — vérifier avant de lancer OpenCode.