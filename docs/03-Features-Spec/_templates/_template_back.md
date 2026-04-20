# ARK — Template Feature-Spec Backend

_Version 0.4 — Mars 2026_

> **Changelog v0.4 :** Ajout exigence mise à jour `docs/04-Tech/openapi.yaml` — instruction §8, gate G-11, checklist §10. Conformité NFR-GOV-001 (API-first / OpenAPI) désormais traçable et déléguable à OpenCode.
>
> **Changelog v0.3 :** Ajout section §12 Données de seed standardisée. Enrichissement §7 (test audit trail obligatoire), §9 (gate G-XX audit trail), §10 (checklist audit trail). Template désormais exige explicitement la vérification NFR-SEC-009 pour toutes les specs backend.
>
> **Changelog v0.2 :** Ajout du pattern "FK entrantes Applications" — note dans §1 (Périmètre) et §4 (Règles Métier). Indique explicitement quand `FS-06-BACK` doit figurer dans les dépendances BACK et comment structurer les tests Supertest en conséquence. Issu de la décision de séquençage v0.9 de la Roadmap (FS-06-BACK remonté en Sprint 2).
>
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

> **Note FK entrantes :** Si cette entité expose `_count.applications`, `GET /[ressource]/:id/applications`, ou un onglet Relations liant des Applications, ajouter `FS-06-BACK` dans le champ `Dépend de` ci-dessus. Voir §1 et §4 pour le détail du pattern.

---

## 1. Objectif & Périmètre ⚠️

> 3-5 phrases : ce que cette spec backend accomplit et ce qu'elle ne fait pas.

**Ce que cette spec fait :**


**Hors périmètre :**
- Frontend — couvert par `FS-XX-FRONT`
- *(autres exclusions spécifiques)*

---

> **Pattern FK entrantes Applications :** Si cette entité est référencée par la table `applications` (FK directe ou table de jonction), distinguer deux niveaux d'implémentation :
>
> | Niveau | Contenu | Dépendance |
> |---|---|---|
> | **BACK sans Applications** | CRUD de base + `_count.applications = 0` hardcodé acceptable | `FS-01`, `F-03` seulement |
> | **BACK complet** | `_count.applications` réel + `GET /:id/applications` + test `DEPENDENCY_CONFLICT` avec données réelles | `FS-06-BACK` requis |
>
> **Décision P1 :** Toujours implémenter le niveau "BACK complet". La spec BACK doit donc lister `FS-06-BACK` en dépendance et ses tests Supertest doivent créer des Applications de test pour valider le blocage de suppression. Ne jamais simuler cette contrainte avec un mock — la tester avec des données réelles en base e2e.

---

## 2. Modèle BDD  ⚠️

### 2.1 Schema relationnel 

**Schéma BDD complet**

> Bloc datamodele en mode texte de la table et de ses relations


**Vue des relations globales**

> Bloc texte des relations entre l'entité et les autres tables


### 2.2 Modèle Prisma

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

> **Pattern FK entrantes — `_count.applications` :** Si `applications` est l'une des relations à vérifier dans `_count`, inclure `applications: true` dans le select ci-dessus et ajouter le cas d'erreur correspondant dans §5. Ce pattern nécessite que `FS-06-BACK` soit `done` pour être testé avec des données réelles (voir §7).

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
- [ ] `[Supertest]` `POST /api/v1/[ressource]` valide → audit_trail contient 1 ligne avec entity_type='[table]' et changed_by non NULL
- [ ] `[Supertest]` `POST /api/v1/[ressource]` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `POST /api/v1/[ressource]` sans `name` → `400`
- [ ] `[Supertest]` `POST /api/v1/[ressource]` name uniquement espaces → `400`
- [ ] `[Supertest]` `GET /api/v1/[ressource]/{id}` existant → `200`
- [ ] `[Supertest]` `GET /api/v1/[ressource]/{id}` inexistant → `404`
- [ ] `[Supertest]` `PATCH /api/v1/[ressource]/{id}` valide → `200`
- [ ] `[Supertest]` `PATCH /api/v1/[ressource]/{id}` nom dupliqué → `409` + `code: "CONFLICT"`
- [ ] `[Supertest]` `DELETE /api/v1/[ressource]/{id}` sans entités liées → `204`
- [ ] `[Supertest]` `DELETE /api/v1/[ressource]/{id}` avec entités liées → `409` + `code: "DEPENDENCY_CONFLICT"` + compteurs

> **FK entrantes — test `DEPENDENCY_CONFLICT` avec Applications :** Si `applications` figure dans les dépendances à vérifier avant suppression, le test Supertest correspondant doit :
> 1. Créer l'entité cible (`POST /[ressource]`)
> 2. Créer une Application liée (`POST /applications` avec `[ressource]Id` rempli) — **requiert `FS-06-BACK` `done`**
> 3. Tenter `DELETE /[ressource]/{id}` → vérifier `409` + `code: "DEPENDENCY_CONFLICT"`
>
> Ne pas simuler cette contrainte avec un mock Jest — la tester en base réelle via Supertest uniquement.

> **Audit trail — test obligatoire (NFR-SEC-009) :** Le trigger `fn_audit_trigger()` est actif sur toutes les tables métier. Tout `INSERT/UPDATE/DELETE` sans `SET LOCAL ark.current_user_id` positionné par le middleware génère un rollback silencieux (voir AGENTS.md §Troubleshooting). Ce test Supertest vérifie que l'audit context middleware est correctement câblé et que le trigger remplit bien le champ `changed_by`.
>
> Format du test : après un `POST /[ressource]` valide, requêter `audit_trail` sur `entity_type='[table]'` et `entity_id=[id_créée]` → vérifier `changed_by IS NOT NULL`.

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
- Tests DEPENDENCY_CONFLICT avec Applications : créer une Application réelle en base (POST /applications) dans le beforeEach du test — ne pas mocker

Documentation obligatoire (NFR-GOV-001) :
- À la fin de la session, recopier le contenu YAML de la section §3 (Contrat API) de cette spec dans le fichier `docs/04-Tech/openapi.yaml`
  en remplaçant la section `paths:` correspondante
  OU en ajoutant les nouveaux paths si l'entité n'existait pas
- Ne pas générer de documentation OpenAPI/Swagger automatique — le fichier YAML central est la source de vérité

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
| G-09 | Si FK vers applications : test `DEPENDENCY_CONFLICT` exécuté avec Application réelle en base | Vérifier le test Supertest §7 — pas de mock | ✅ Oui si applicable |
| G-10 | Audit trail actif | `POST /[ressource]` → vérifier ligne dans audit_trail (changed_by non NULL) | ✅ Oui |
| G-11 | `openapi.yaml` mis à jour | Paths `/[ressource]` présents dans `docs/04-Tech/openapi.yaml` (recopiés de §3) | ✅ Oui |

---

## 10. Checklist de Validation Post-Session

> À compléter après génération OpenCode, avant de cocher les gates §9.

- [ ] `POST` retourne `201` avec réponse complète conforme au schéma
- [ ] `POST` → audit_trail.changed_by non NULL (NFR-SEC-009)
- [ ] `DELETE` avec entités liées retourne `409` + `code: "DEPENDENCY_CONFLICT"`
- [ ] Toutes les réponses `409` incluent le champ `code` explicite (NFR-MAINT-001)
- [ ] `name` uniquement espaces → `400`
- [ ] Aucun `TODO / FIXME / HACK` non tracé
- [ ] Aucune erreur TypeScript strict
- [ ] Conventions `$executeRaw`, structure modules, mock Prisma respectées
- [ ] Si FK vers applications : test `DEPENDENCY_CONFLICT` avec Application créée réellement en base (pas mockée)
- [ ] `docs/04-Tech/openapi.yaml` mis à jour avec les paths de cette feature (NFR-GOV-001)

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

## 12. Données de Seed ⚠️

> Documenter ici les données de démonstration à insérer dans `backend/prisma/seed.ts`.
> Pattern obligatoire : vérifier existence avant insert (idempotent).
> S'assurer que ces données sont créées AVANT les seeds dépendants
> (ex: providers avant seed-applications).

### Pertinence

> Évaluer si un seed est utile pour cette entité :
> - ✅ **Utile** si l'entité est un référentiel sélectionnable dans un formulaire (ex: providers, domains)
> - ⚠️ **Optionnel** si l'entité est purement créée par l'utilisateur en production
> - ❌ **Inutile** si l'entité ne sera jamais pré-chargée (ex: données métier pures)

### Données de démonstration

> Lister les entrées à seeder avec leurs champs.
> 
> | # | Champ | Valeur | Description |
> |---|-------|--------|-------------|
> | 1 | `name` | "Entrée 1" | Contexte |
> | 2 | `name` | "Entrée 2" | Contexte |

### Bloc de code seed

> Bloc TypeScript prêt à copier dans seed.ts, avec pattern idempotent.

```typescript
// Insert sample [ressources] if they don't exist
const sample[Ressources] = [
  { name: 'Entrée 1', description: 'Contexte' },
  { name: 'Entrée 2', description: 'Contexte' },
];

for (const item of sample[Ressources]) {
  const existing = await prisma.[model].findUnique({ where: { name: item.name } });
  if (!existing) {
    await prisma.$executeRaw`INSERT INTO [table] (id, name, description) 
      VALUES (gen_random_uuid(), ${item.name}::varchar, ${item.description}::text)`;
    console.log(`✓ Created: ${item.name}`);
  }
}
console.log('Seed [ressources] completed');
```

> **Rappel F-999 Item 8 :** Utiliser le tagged template `$executeRaw` — jamais `$executeRawUnsafe` avec interpolation de string.

---

_Template Backend v0.4 — Projet ARK_