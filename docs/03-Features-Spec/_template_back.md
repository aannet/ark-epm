# ARK — Template Feature-Spec Backend

_Version 0.1 — Mars 2026_

> **Changelog v0.1 :** Création — split du template unifié v0.3 en deux templates distincts (back / front). Issu de la décision architecture de session OpenCode du Sprint FS-02. Ce template couvre la partie backend (NestJS + Prisma + tests Jest/Supertest). La partie frontend est couverte par `_template-front.md`.

> **Usage :** Ce template est le format standard des Feature-Specs **backend** ARK. Chaque spec est un document autonome, versionné, directement injectable dans OpenCode sans reformatage.
> - Nommer le fichier : `FS-<numéro>-<slug>-back.md` (ex: `FS-03-providers-back.md`)
> - La spec back est la **gate bloquante** avant toute session OpenCode frontend — elle doit être au statut `done` avant que la spec front passe à `stable`.
> - **Ne pas coder sans spec stabilisée au statut `stable`.**

---

## Comment utiliser ce template

1. Dupliquer ce fichier dans `docs/03-Features-Spec/`
2. Nommer : `FS-<numéro>-<slug>-back.md`
3. Remplir toutes les sections — les sections marquées ⚠️ sont bloquantes pour la génération
4. Passer au statut `stable` après validation
5. Lancer la session OpenCode avec la commande §8
6. Valider les gates §9 avant de débloquer la spec front correspondante

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-XX-BACK |
| **Titre** | [Nom de la feature] — Backend |
| **Priorité** | P1 / P2 / P3 |
| **Statut** | `draft` / `review` / `stable` / `done` |
| **Dépend de** | FS-01 *(+ autres specs backend si applicable — exclure F-02 i18n, purement frontend)* |
| **Spec mère** | FS-XX [slug] — spec de référence dont ce document est issu |
| **Spec front** | FS-XX-FRONT — bloquée tant que cette spec n'est pas `done` |
| **Estimé** | Nb de jours (backend seul) |
| **Version** | 0.1 |

---

## 1. Objectif & Périmètre ⚠️

> 3-5 phrases : ce que cette spec backend accomplit et ce qu'elle ne fait pas.

**Ce que cette spec fait :**


**Hors périmètre :**
- Frontend — couvert par `FS-XX-FRONT`
- *(autres exclusions spécifiques)*

---

## 2. Modèle Prisma ⚠️

> Bloc Prisma exact pour cette feature. Source de vérité TypeScript — OpenCode génère les types et requêtes à partir de ce bloc. Ce contrat est également référencé par la spec front.

```prisma
// Modèle Prisma de la feature
// Inclure les relations pertinentes
// Ne pas ajouter de champs non présents dans schema.sql
```

> **Notes :** *(contraintes spécifiques au modèle — ex: pas de updatedAt, enum custom, etc.)*

---

## 3. Contrat API (OpenAPI) ⚠️

> Contrat exhaustif de tous les endpoints. Format YAML OpenAPI 3.0.
> Ce contrat est la **source de vérité** référencée (pas recopiée) par la spec front.
> OpenCode génère les controllers NestJS à partir de ce contrat.

```yaml
paths:

  /api/v1/[ressource]:
    get:
      summary: Liste
      tags: [[Ressource]]
      security:
        - bearerAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/[Ressource]Response'
        '401':
          description: Non authentifié

    post:
      summary: Créer
      tags: [[Ressource]]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Create[Ressource]Dto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/[Ressource]Response'
        '400':
          description: Validation échouée
        '401':
          description: Non authentifié
        '403':
          description: Permission insuffisante
        '409':
          description: Conflit
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

  /api/v1/[ressource]/{id}:
    get:
      summary: Détail
      # ...
    patch:
      summary: Modifier
      # ...
    delete:
      summary: Supprimer
      # ...

components:
  schemas:
    [Ressource]Response:
      type: object
      properties:
        id:   { type: string, format: uuid }
        # ...

    Create[Ressource]Dto:
      type: object
      required: [name]
      properties:
        name: { type: string, minLength: 1, maxLength: 255 }
        # ...

    Update[Ressource]Dto:
      type: object
      properties:
        name: { type: string, minLength: 1, maxLength: 255 }
        # ...
```

---

## 4. Règles Métier Backend ⚠️

> Règles de logique métier pure non déductibles du schéma ou du contrat API.
> Inclure uniquement les règles backend : validation, unicité, suppression bloquée, droits API.
> Les règles UX/navigation purement frontend vont dans la spec front.

- **RM-01 — [Nom] :** Description. Code HTTP + code d'erreur attendu.

- **RM-02 — [Nom] :** Description.

- **RM-03 — Suppression bloquée si entités liées :**

```typescript
async remove(id: string): Promise<void> {
  const entity = await this.prisma.[model].findUnique({
    where: { id },
    select: { _count: { select: { [relation]: true } } }
  });
  if (!entity) throw new NotFoundException('[Entity] not found');

  if (entity._count.[relation] > 0) {
    throw new ConflictException({
      code: 'DEPENDENCY_CONFLICT',
      message: `[Entity] is used by ${entity._count.[relation]} [relation](s)`
    });
  }
  await this.prisma.[model].delete({ where: { id } });
}
```

- **RM-04 — Droits requis :** `[domaine]:read` sur GET. `[domaine]:write` sur POST/PATCH/DELETE.

- **RM-05 — Pas de soft delete :** Suppression physique après vérification RM-03.

---

## 5. Comportements Backend par Cas d'Usage

> Format : "Quand [requête API] → [réponse HTTP]". Pas de comportements de navigation frontend ici.

**Nominal :**
- `GET /api/v1/[ressource]` authentifié → `200` avec tableau (vide = `[]`)
- `POST /api/v1/[ressource]` valide → `201` avec `[Ressource]Response`
- `PATCH /api/v1/[ressource]/{id}` existant + valide → `200` avec entité mise à jour
- `DELETE /api/v1/[ressource]/{id}` sans dépendances → `204`

**Erreurs :**
- `POST` sans `name` → `400`
- `POST` `name` uniquement espaces → `400`
- `POST` / `PATCH` nom dupliqué → `409` + `code: "CONFLICT"`
- `GET` / `PATCH` / `DELETE` UUID inexistant → `404`
- `DELETE` avec entités liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs dans `message`
- Toute route sans token → `401`
- Route `write` sans permission → `403`

---

## 6. Structure de Fichiers Backend

```
backend/src/[domaine]/
├── [domaine].module.ts
├── [domaine].controller.ts
├── [domaine].service.ts
├── [domaine].service.spec.ts      ← tests unit Jest
└── dto/
    ├── create-[domaine].dto.ts
    └── update-[domaine].dto.ts

backend/test/
└── FS-XX-[domaine].e2e-spec.ts    ← tests Supertest
```

---

## 7. Tests Backend ⚠️

> À remplir exhaustivement — OpenCode génère les tests à partir de cette section.

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable à OpenCode |
|---|---|---|---|
| Unit (services NestJS) | **Jest** | `src/[domaine]/[domaine].service.spec.ts` | ✅ Oui |
| API / contrat HTTP | **Supertest** | `test/FS-XX-[domaine].e2e-spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Supertest** | `test/FS-XX-[domaine].e2e-spec.ts` | ❌ **Manuel** |

> **Règle absolue :** Les tests RBAC ne sont jamais délégués à OpenCode.

### Tests Jest — Unit

> Un test = une méthode de service + un cas précis. Mock Prisma obligatoire.

- [ ] `[Jest]` `[Domaine]Service.findAll()` retourne un tableau
- [ ] `[Jest]` `[Domaine]Service.create()` retourne l'entité créée
- [ ] `[Jest]` `[Domaine]Service.create()` lève `ConflictException` sur erreur Prisma `P2002`
- [ ] `[Jest]` `[Domaine]Service.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `[Domaine]Service.remove()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `[Domaine]Service.remove()` lève `ConflictException` si entités liées
- [ ] `[Jest]` `[Domaine]Service.remove()` appelle `prisma.[model].delete()` si aucune entité liée

### Tests Supertest — Contrat API

> Un test = un endpoint + un cas (nominal ou erreur). Format `VERB /api/v1/[ressource]`.

- [ ] `[Supertest]` `GET /api/v1/[ressource]` authentifié → `200` avec tableau
- [ ] `[Supertest]` `GET /api/v1/[ressource]` liste vide → `200` avec `[]`
- [ ] `[Supertest]` `POST /api/v1/[ressource]` valide → `201` avec entité
- [ ] `[Supertest]` `POST /api/v1/[ressource]` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `POST /api/v1/[ressource]` sans `name` → `400`
- [ ] `[Supertest]` `POST /api/v1/[ressource]` name uniquement espaces → `400`
- [ ] `[Supertest]` `GET /api/v1/[ressource]/{id}` existant → `200`
- [ ] `[Supertest]` `GET /api/v1/[ressource]/{id}` inexistant → `404`
- [ ] `[Supertest]` `PATCH /api/v1/[ressource]/{id}` valide → `200`
- [ ] `[Supertest]` `PATCH /api/v1/[ressource]/{id}` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `DELETE /api/v1/[ressource]/{id}` sans entités liées → `204`
- [ ] `[Supertest]` `DELETE /api/v1/[ressource]/{id}` avec entités liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs

### Tests Sécurité / RBAC — Manuel ❌

> À écrire et valider à la main. Ne pas déléguer à OpenCode.

- [ ] `[Manuel]` `GET /api/v1/[ressource]` sans token → `401`
- [ ] `[Manuel]` `POST /api/v1/[ressource]` rôle sans `[domaine]:write` → `403`
- [ ] `[Manuel]` `PATCH /api/v1/[ressource]/{id}` rôle sans `[domaine]:write` → `403`
- [ ] `[Manuel]` `DELETE /api/v1/[ressource]/{id}` rôle sans `[domaine]:write` → `403`

---

## 8. Commande OpenCode — Backend ⚠️

> Copier-coller intégralement en début de session OpenCode.
> Ne pas remplacer les conventions par un pointeur vers AGENTS.md — OpenCode doit les recevoir inline.

```
Contexte projet ARK — Session Backend FS-XX-BACK :

Stack : NestJS strict mode + Prisma ORM + PostgreSQL 16 + TypeScript strict
Structure modules : src/<domaine>/<domaine>.module.ts / .controller.ts / .service.ts / dto/

Conventions obligatoires :
- Toute écriture en base : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global (APP_MODULE) — ne jamais le réimporter dans un module feature
- JwtAuthGuard est global — décorer avec @Public() les seules routes publiques
- @RequirePermission() disponible — utiliser sur chaque handler controller
- Format d'erreur standard : { statusCode, code, message, timestamp, path }
  → ConflictException({ code: 'CONFLICT', message: '...' }) pour P2002
  → ConflictException({ code: 'DEPENDENCY_CONFLICT', message: '...' }) pour suppression bloquée
- Vérification _count Prisma AVANT toute suppression — pattern RM-03 de cette spec
- P2002 intercepté dans un try/catch ciblé → ConflictException — ne jamais laisser remonter l'erreur Prisma brute
- Requêtes raw : tagged template backtick uniquement — jamais Prisma.raw() avec interpolation
- Tests unit : jest.mock() sur PrismaService — pas de base réelle
- Fichier test e2e : backend/test/FS-XX-[domaine].e2e-spec.ts

Pattern de référence NestJS : module Domains (FS-02-BACK) — s'y conformer pour la structure et le style.

Implémente la feature "[TITRE]" backend (FS-XX-BACK) en respectant strictement le contrat ci-dessous.
Génère : module NestJS complet (controller, service, DTOs, module) + tests Jest unit + tests Supertest.
Ne génère PAS les tests marqués [Manuel].
Ne génère PAS de code frontend.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE FS-XX-BACK.md ICI]
```

---

## 9. Gate de Validation Backend ⚠️

> À valider **avant** de passer la spec front correspondante au statut `stable`.
> La spec `FS-XX-FRONT` reste à `draft` tant que toutes ces gates ne sont pas cochées.

| # | Gate | Vérification | Bloquant |
|---|------|--------------|----------|
| G-01 | Migration Prisma appliquée | Table présente en base | ✅ Oui |
| G-02 | Seed permissions | `[domaine]:read` et `[domaine]:write` en base | ✅ Oui |
| G-03 | Tests Jest passent | `npm run test -- --testPathPattern=[domaine]` → 0 failed | ✅ Oui |
| G-04 | Tests Supertest passent | `npm run test:e2e -- --testPathPattern=FS-XX` → 0 failed | ✅ Oui |
| G-05 | Tests RBAC manuels validés | Les cas [Manuel] §7 vérifiés à la main | ✅ Oui |
| G-06 | Aucune erreur TypeScript | `npm run build` → 0 error | ✅ Oui |
| G-07 | Statut mis à jour | Passer `FS-XX-BACK` à `done` dans cet en-tête | ✅ Oui |
| G-08 | Revue TD backend | TD-1 à TD-6 vérifiés, F-999 mis à jour | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

> À compléter après génération OpenCode, avant de cocher les gates §9.

- [ ] `POST` retourne `201` avec réponse complète conforme au schéma
- [ ] `DELETE` avec entités liées retourne `409` + `code: "DEPENDENCY_CONFLICT"`
- [ ] Toutes les réponses `409` incluent le champ `code` explicite (NFR-MAINT-001)
- [ ] `name` uniquement espaces → `400`
- [ ] Aucun `TODO / FIXME / HACK` non tracé
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions `$executeRaw`, structure modules, mock Prisma respectées

---

## 11. Revue de Dette Technique *(gate de fin de sprint — obligatoire)* ⚠️

> À remplir **après** implémentation backend, avant de clore la partie backend du sprint.

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
| **Sprint** | *(ex : Sprint 2)* |
| **Date de revue** | *(date)* |
| **Items F-999 fermés** | *(ex : Item 5)* |
| **Items F-999 ouverts** | *(ex : Item 8 — reste pending)* |
| **Nouveaux items F-999 créés** | *(ex : Item 11)* |
| **NFR mis à jour** | *(ex : NFR-SEC-005 → covered)* |
| **TODOs résiduels tracés** | *(ex : 2 TODOs → issues #12, #13)* |
| **Statut gates TD** | ✅ TD-1 / ✅ TD-2 / ❌ TD-3 / … |

---

_Template Backend v0.1 — Projet ARK_