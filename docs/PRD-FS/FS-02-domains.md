# ARK — Feature Spec FS-02 : Domains

_Version 0.7 — Mars 2026_

> **Changelog v0.7 :**
> - Dépendance F-02 (i18n Foundation) ajoutée dans l'en-tête
> - RM-06 : snippets mis à jour — strings remplacées par `t('key')`
> - RM-07 : `format409Message()` refactorisée — accepte `t` comme paramètre, utilise l'interpolation i18next
> - §5 : messages d'erreur/succès remplacés par les clés `fr.json` correspondantes
> - §6 : strings UX remplacées par clés i18n — section clés `fr.json` module `domains.*` ajoutée
> - §8 : contrainte i18n ajoutée, signature `format409Message(t, apps, bcs)` documentée
> - §9 : bloc contexte OpenCode enrichi avec convention i18n (F-02 §12)
> - §10 : checklist mise à jour — F-02 terminé + clés `domains.*` dans `fr.json`

> **Changelog v0.6 :**
> - Route `/domains/:id` ajoutée — composant `DomainDetailPage` (lecture seule + bouton Edit conditionnel)
> - Comportement post-save modifié : après création → redirect `/domains/:id` ; après édition → reste sur `/domains/:id`
> - Comportement Cancel modifié : Cancel sur Edit → retour `/domains/:id` ; Cancel sur New → retour `/domains`
> - RM-07 ajouté — formatage frontend des messages 409 : compteur à 0 affiché comme "no"
> - RM-06 étendu — bouton "Edit" conditionnel sur `DomainDetailPage`
> - Section 3 : route `GET /domains/{id}` déjà présente — aucun changement API
> - Section 5 : comportements nominaux mis à jour (post-save)
> - Section 6 : 4 routes, structure fichiers étendue, câblage App.tsx mis à jour
> - Section 7 : tests Cypress mis à jour — DomainDetailPage, 404 detail, read-only detail, cy.loginAsReadOnly()
> - Section 8 : contrainte cy.loginAsReadOnly() ajoutée
> - Section 9 : commande OpenCode mise à jour
> - Section 10 : checklist mise à jour

> **Changelog v0.5 :** Deux trous identifiés dans la couverture des droits frontend comblés :
> (1) Câblage `App.tsx` avec `PrivateRoute permission="domains:write"` sur les routes `/domains/new` et `/domains/:id/edit`.
> (2) Règle UX RM-06 ajoutée — bouton "Add Domain" et icônes edit/delete masqués si `domains:write` absent.
> Tests Cypress et Manuel correspondants ajoutés en section 7. Checklist section 10 mise à jour.

> **Changelog v0.4 :** Section 7 restructurée — chaque cas de test étiqueté `[Jest]` / `[Supertest]` / `[Cypress]` / `[Manuel]`. Fichiers cibles précisés. Section 9 mise à jour. Checklist complétée. Estimation mise à jour (1j → 1.5j).

> **Changelog v0.3 :** Structure de fichiers frontend ajoutée, comportement `404` sur `DomainEditPage` documenté.

> **Changelog v0.2 :** Pages indépendantes (liste / new / :id/edit). Approche vérification avant suppression documentée (Option A — _count Prisma).

> **Usage :** FS-02 est le **module de référence** du projet ARK. Implémenté et validé en premier — tests inclus. OpenCode s'en sert comme exemple de pattern pour toutes les features suivantes (FS-03 à FS-11).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-02 |
| **Titre** | Domains — CRUD complet backend + pages liste/détail/new/edit React |
| **Priorité** | P1 |
| **Statut** | `draft` |
| **Dépend de** | FS-01, F-02 |
| **Estimé** | 2 jours |
| **Version** | 0.7 |

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

- **RM-06 — Masquage conditionnel des actions d'écriture dans l'UI :** ⚠️ *Introduit v0.5, étendu v0.6*

  Les actions d'écriture sont masquées côté frontend si l'utilisateur n'a pas la permission `domains:write`. Ce masquage est **complémentaire** à la protection backend — il ne s'y substitue pas. S'applique à `DomainsListPage` **et** `DomainDetailPage`.

  ```typescript
  const canWrite = hasPermission('domains:write'); // store auth FS-01
  const { t } = useTranslation();

  // DomainsListPage — bouton "Add Domain" conditionnel
  <PageHeader
    title={t('domains.list.title')}
    action={canWrite ? {
      label: t('domains.list.addButton'),
      onClick: () => navigate('/domains/new'),
      icon: <AddIcon />,
    } : undefined}
  />

  // DomainsListPage — icônes edit/delete conditionnelles par ligne
  {canWrite && (
    <>
      <IconButton aria-label={t('common.actions.edit')} onClick={() => navigate(`/domains/${row.id}/edit`)}>
        <EditIcon />
      </IconButton>
      <IconButton aria-label={t('common.actions.delete')} onClick={() => handleDeleteClick(row)}>
        <DeleteIcon />
      </IconButton>
    </>
  )}

  // DomainDetailPage — bouton "Edit" conditionnel
  {canWrite && (
    <Button
      variant="contained"
      onClick={() => navigate(`/domains/${domain.id}/edit`)}
      startIcon={<EditIcon />}
    >
      {t('domains.detail.editButton')}
    </Button>
  )}
  ```

- **RM-07 — Formatage frontend des messages 409 :** ⚠️ *Nouveau v0.6, mis à jour v0.7*

  Le backend retourne des entiers bruts dans le message `ConflictException`. Le frontend transforme les compteurs à zéro en `"no"` avant affichage via i18n. La fonction `format409Message()` accepte `t` comme premier paramètre pour respecter la convention i18n (F-02).

  ```typescript
  // Utilitaire de formatage — à placer dans src/utils/domain.utils.ts
  import { TFunction } from 'i18next';

  export function format409Message(t: TFunction, appCount: number, bcCount: number): string {
    const apps = appCount === 0 ? 'no' : appCount;
    const bcs  = bcCount  === 0 ? 'no' : bcCount;
    return t('domains.delete.blockedMessage', { apps, bcs });
  }

  // Extraction des compteurs depuis le message backend :
  // "Domain is used by 3 application(s) and 0 business capability(ies)"
  // → parser les deux entiers, appliquer format409Message(t, appCount, bcCount)
  ```

  > Le parsing du message backend est fragile. Alternative plus robuste : enrichir la `ConflictException` backend avec un champ `details: { applications: number, businessCapabilities: number }` dans le corps de la réponse 409 — à considérer si le parsing devient un problème.

---

## 5. Comportement Attendu par Cas d'Usage

**Nominal :**
- `GET /domains` token valide → `200` tableau (vide `[]` si aucun, sans pagination)
- `GET /domains` 15 domaines → `200` tableau de 15 éléments, aucun mécanisme de pagination
- `POST /domains` `{ name: "Finance" }` → `201` domaine créé → frontend redirige vers `/domains/<new-id>`
- `GET /domains/{id}` → `200` détail du domaine
- `PATCH /domains/{id}` `{ description: "..." }` → `200` domaine mis à jour → frontend reste sur `/domains/{id}`
- `DELETE /domains/{id}` sans entités liées → `204` → frontend retire le domaine de la liste

**Post-save frontend :** ⚠️ *Modifié v0.6*
- Après `POST /domains` réussi → `navigate('/domains/' + createdDomain.id)` + snackbar `t('domains.snackbar.created')`
- Après `PATCH /domains/{id}` réussi → rester sur `/domains/{id}` + rafraîchir les données + snackbar `t('domains.snackbar.updated')`
- Après `DELETE /domains/{id}` réussi → `navigate('/domains')` + snackbar `t('domains.snackbar.deleted')`
- Cancel sur `DomainNewPage` → `navigate('/domains')`
- Cancel sur `DomainEditPage` → `navigate('/domains/' + id)`

**Erreurs :**
- `POST /domains` nom existant → `409` + erreur inline `t('domains.form.nameDuplicate')`
- `POST /domains` sans `name` → `400` + erreur inline `t('domains.form.nameRequired')`
- `PATCH /domains/{id}` nom existant → `409` + erreur inline `t('domains.form.nameDuplicate')`
- `DELETE /domains/{id}` 3 apps liées, 0 BC → `409` → UI affiche `format409Message(t, 3, 0)` → `t('domains.delete.blockedMessage', { apps: 3, bcs: 'no' })`
- `DELETE /domains/{id}` 0 apps, 4 BC → `409` → UI affiche `format409Message(t, 0, 4)` → `t('domains.delete.blockedMessage', { apps: 'no', bcs: 4 })`
- `DELETE /domains/{id}` 2 apps, 4 BC → `409` → UI affiche `format409Message(t, 2, 4)` → `t('domains.delete.blockedMessage', { apps: 2, bcs: 4 })`
- `GET /domains/{id}` UUID inexistant → `404` → frontend redirige vers `/domains`
- `POST /domains` sans token → `401`
- `POST /domains` sans `domains:write` → `403`

**Droits frontend :**
- Utilisateur sans `domains:write` sur `DomainsListPage` → bouton "Add Domain" absent, icônes edit/delete absentes
- Utilisateur sans `domains:write` sur `DomainDetailPage` → bouton "Edit" absent
- Utilisateur sans `domains:write` naviguant vers `/domains/new` → redirigé vers `/403` par `PrivateRoute`
- Utilisateur sans `domains:write` naviguant vers `/domains/:id/edit` → redirigé vers `/403` par `PrivateRoute`

---

## 6. Composants Frontend ⚠️

**Routes React :**

| Route | Composant | Guard | Description |
|---|---|---|---|
| `/domains` | `DomainsListPage` | `PrivateRoute` (token seul) | Tableau, bouton "Add Domain" conditionnel |
| `/domains/new` | `DomainNewPage` | `PrivateRoute permission="domains:write"` | Page de création — bloquée si pas `domains:write` |
| `/domains/:id` | `DomainDetailPage` | `PrivateRoute` (token seul) | Fiche lecture seule — bouton "Edit" conditionnel |
| `/domains/:id/edit` | `DomainEditPage` | `PrivateRoute permission="domains:write"` | Page d'édition — bloquée si pas `domains:write` |

**Câblage `App.tsx` :** ⚠️ *À implémenter manuellement — patron de référence pour tous les modules*

```typescript
// App.tsx — routes Domains

// Lecture : token requis, pas de permission spécifique
<Route path="/domains" element={<PrivateRoute />}>
  <Route index element={<DomainsListPage />} />
  <Route path=":id" element={<DomainDetailPage />} />
</Route>

// Écriture : token + permission domains:write requis
// → redirect /403 automatique via PrivateRoute si permission absente
<Route path="/domains" element={<PrivateRoute permission="domains:write" />}>
  <Route path="new" element={<DomainNewPage />} />
  <Route path=":id/edit" element={<DomainEditPage />} />
</Route>
```

**Comportement de `DomainDetailPage` :**

```typescript
// DomainDetailPage — comportements attendus :
// - Charge GET /domains/:id au montage
// - Si 404 → navigate('/domains')
// - Affiche : name, description (ou "—" si null), createdAt formaté
// - Bouton "Edit" visible uniquement si hasPermission('domains:write')
//   → onClick: navigate('/domains/:id/edit')
// - Bouton "Back" → navigate('/domains')
```

**Composant partagé `DomainForm` :**

```typescript
interface DomainFormProps {
  initialValues?: Partial<DomainFormValues>;
  onSubmit: (values: DomainFormValues) => Promise<void>;
  onCancel: () => void;   // ← appelé avec navigate('/domains') sur New,
                          //    navigate('/domains/:id') sur Edit
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
│       ├── DomainDetailPage.tsx      ← nouveau v0.6
│       └── DomainEditPage.tsx
├── components/
│   └── domains/
│       └── DomainForm.tsx
├── utils/
│   └── domain.utils.ts               ← format409Message() — nouveau v0.6
└── types/
    └── domain.ts
```

**Comportements UX :**
- `DomainsListPage` : clic sur une ligne → navigate(`/domains/${row.id}`)
- `DomainsListPage` : MUI Dialog de confirmation avant suppression avec message `t('domains.delete.confirmMessage', { name })`
- `DomainsListPage` : message 409 affiché via `format409Message(t, appCount, bcCount)` (RM-07) si suppression bloquée
- `DomainsListPage` : bouton `t('domains.list.addButton')` et icônes edit/delete rendus uniquement si `hasPermission('domains:write')` (RM-06)
- `DomainDetailPage` : bouton `t('domains.detail.editButton')` rendu uniquement si `hasPermission('domains:write')` (RM-06)
- `DomainDetailPage` : description `null` affichée comme `t('domains.detail.noDescription')` (valeur : `"—"`)
- `DomainDetailPage` : si `GET /domains/:id` → `404`, rediriger vers `/domains`
- `DomainNewPage` : après save réussi → redirect vers `/domains/<new-id>` + snackbar `t('domains.snackbar.created')`
- `DomainNewPage` : bouton Cancel → navigate('/domains')
- `DomainEditPage` : après save réussi → reste sur `/domains/:id` + rafraîchit les données + snackbar `t('domains.snackbar.updated')`
- `DomainEditPage` : bouton Cancel → navigate(`/domains/${id}`)
- `DomainEditPage` : si `GET /domains/:id` → `404` au chargement, rediriger vers `/domains`
- Erreur inline `t('domains.form.nameDuplicate')` sur nom dupliqué (create et edit), bouton Save désactivé pendant chargement
- Erreur inline `t('domains.form.nameRequired')` si champ nom vide à la soumission

**Clés `fr.json` — section `domains` à ajouter :** ⚠️ *Nouveau v0.7*

```json
"domains": {
  "list": {
    "title": "Domaines",
    "subtitle": "Gestion des domaines métier",
    "addButton": "Ajouter un domaine",
    "columns": {
      "name": "Nom",
      "description": "Description",
      "createdAt": "Créé le",
      "actions": "Actions"
    },
    "emptyState": {
      "title": "Aucun domaine créé",
      "description": "Commencez par créer votre premier domaine.",
      "cta": "Créer votre premier domaine"
    }
  },
  "detail": {
    "noDescription": "—",
    "editButton": "Modifier",
    "backButton": "Retour"
  },
  "form": {
    "createTitle": "Nouveau domaine",
    "editTitle": "Modifier le domaine",
    "nameLabel": "Nom",
    "descriptionLabel": "Description",
    "saveButton": "Enregistrer",
    "cancelButton": "Annuler",
    "nameRequired": "Le nom est obligatoire",
    "nameDuplicate": "Ce nom de domaine est déjà utilisé"
  },
  "delete": {
    "confirmTitle": "Supprimer le domaine",
    "confirmMessage": "Êtes-vous sûr de vouloir supprimer le domaine \"{{name}}\" ?",
    "blockedMessage": "Ce domaine est utilisé par {{apps}} application(s) et {{bcs}} capacité(s) métier et ne peut pas être supprimé"
  },
  "snackbar": {
    "created": "Domaine créé avec succès",
    "updated": "Domaine mis à jour avec succès",
    "deleted": "Domaine supprimé avec succès"
  }
}
```

> Ces clés doivent être ajoutées dans `src/i18n/locales/fr.json` **en même temps** que l'implémentation des composants — jamais après coup (convention F-02 RM-03).

---

## 7. Tests ⚠️

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable |
|---|---|---|---|
| Unit services | Jest | `src/domains/domains.service.spec.ts` | ✅ OpenCode |
| Contrat API | Supertest | `test/domains.e2e-spec.ts` | ✅ OpenCode |
| Sécurité / RBAC | Supertest | `test/domains.e2e-spec.ts` | ❌ **Manuel** |
| E2E browser | Cypress | `cypress/e2e/domains.cy.ts` | ✅ OpenCode (nominaux + droits UI) |

### Tests Jest — Unit

- [ ] `[Jest]` `DomainsService.create()` retourne le domaine créé
- [ ] `[Jest]` `DomainsService.create()` lève `ConflictException` sur erreur Prisma `P2002`
- [ ] `[Jest]` `DomainsService.remove()` lève `ConflictException` si des applications sont liées
- [ ] `[Jest]` `DomainsService.remove()` lève `ConflictException` si des business capabilities sont liées
- [ ] `[Jest]` `DomainsService.remove()` lève `ConflictException` si applications ET business capabilities sont liées
- [ ] `[Jest]` `DomainsService.findOne()` lève `NotFoundException` si UUID inexistant
- [ ] `[Jest]` `DomainsService.remove()` appelle `prisma.domain.delete()` si aucune entité liée

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `GET /domains` authentifié → `200` avec tableau
- [ ] `[Supertest]` `GET /domains` liste vide → `200` avec `[]`
- [ ] `[Supertest]` `GET /domains` 15 domaines → `200` avec tableau de 15 éléments (pas de pagination)
- [ ] `[Supertest]` `POST /domains` nom valide → `201` avec domaine créé
- [ ] `[Supertest]` `POST /domains` nom dupliqué → `409`
- [ ] `[Supertest]` `POST /domains` sans `name` → `400`
- [ ] `[Supertest]` `GET /domains/{id}` existant → `200`
- [ ] `[Supertest]` `GET /domains/{id}` UUID inexistant → `404`
- [ ] `[Supertest]` `PATCH /domains/{id}` description valide → `200`
- [ ] `[Supertest]` `PATCH /domains/{id}` nom dupliqué → `409`
- [ ] `[Supertest]` `DELETE /domains/{id}` sans entités liées → `204`
- [ ] `[Supertest]` `DELETE /domains/{id}` avec applications liées → `409` + message avec compteurs
- [ ] `[Supertest]` `DELETE /domains/{id}` avec business capabilities liées → `409` + message avec compteurs
- [ ] `[Supertest]` `DELETE /domains/{id}` avec applications ET business capabilities liées → `409` + message avec les deux compteurs

### Tests Sécurité / RBAC — Manuel ❌

- [ ] `[Manuel]` `GET /domains` sans token → `401`
- [ ] `[Manuel]` `POST /domains` avec rôle sans `domains:write` → `403`
- [ ] `[Manuel]` `DELETE /domains/{id}` avec rôle sans `domains:write` → `403`
- [ ] `[Manuel]` `PATCH /domains/{id}` avec rôle sans `domains:write` → `403`

### Tests Cypress — E2E Browser

**Parcours nominaux :**
- [ ] `[Cypress]` `DomainsListPage` affiche la liste après login
- [ ] `[Cypress]` `DomainsListPage` affiche l'empty state si aucun domaine
- [ ] `[Cypress]` `DomainsListPage` affiche 15 domaines sans contrôle de pagination
- [ ] `[Cypress]` Clic sur une ligne → redirect vers `/domains/:id`
- [ ] `[Cypress]` `DomainDetailPage` affiche nom, description et date de création
- [ ] `[Cypress]` Créer un domaine → redirect vers `/domains/<new-id>`, nom affiché sur la page
- [ ] `[Cypress]` Créer un domaine sans description → redirect vers `/domains/<new-id>`, aucune description affichée
- [ ] `[Cypress]` Cancel sur `DomainNewPage` → redirect vers `/domains`
- [ ] `[Cypress]` Modifier un domaine → reste sur `/domains/:id`, description mise à jour visible
- [ ] `[Cypress]` Cancel sur `DomainEditPage` → redirect vers `/domains/:id`, domaine inchangé
- [ ] `[Cypress]` Supprimer un domaine sans entités liées → disparaît de la liste
- [ ] `[Cypress]` Cancel suppression → dialog fermé, domaine toujours dans la liste

**Parcours d'erreur :**
- [ ] `[Cypress]` Créer un domaine avec nom dupliqué → erreur inline `"This domain name is already in use"`
- [ ] `[Cypress]` Créer un domaine sans nom → erreur inline `"Name is required"`
- [ ] `[Cypress]` Modifier un domaine avec nom dupliqué → erreur inline `"This domain name is already in use"`
- [ ] `[Cypress]` Supprimer un domaine lié à 3 apps, 0 BC → message `"...3 application(s) and no business capability(ies)..."`
- [ ] `[Cypress]` Supprimer un domaine lié à 0 apps, 4 BC → message `"...no application(s) and 4 business capability(ies)..."`
- [ ] `[Cypress]` Supprimer un domaine lié à 2 apps, 4 BC → message `"...2 application(s) and 4 business capability(ies)..."`
- [ ] `[Cypress]` `DomainEditPage` UUID inexistant → redirect vers `/domains`
- [ ] `[Cypress]` `DomainDetailPage` UUID inexistant → redirect vers `/domains`

**Droits UI :**
- [ ] `[Cypress]` Utilisateur sans `domains:write` sur `DomainsListPage` → bouton "Add Domain" absent du DOM
- [ ] `[Cypress]` Utilisateur sans `domains:write` sur `DomainsListPage` → icônes edit et delete absentes du DOM
- [ ] `[Cypress]` Utilisateur sans `domains:write` sur `DomainDetailPage` → bouton "Edit" absent du DOM
- [ ] `[Cypress]` Utilisateur sans `domains:write` naviguant vers `/domains/new` → redirigé vers `/403`
- [ ] `[Cypress]` Utilisateur sans `domains:write` naviguant vers `/domains/:id/edit` → redirigé vers `/403`

---

## 8. Contraintes Techniques

- **Ce module est le patron de référence :** Structure, nommage, gestion d'erreurs, tests, câblage `App.tsx`, convention i18n — tout doit être exemplaire.
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
- **i18n :** Toutes les strings visibles passent par `t('key')` — jamais de string en dur dans les composants. Clés `domains.*` à ajouter dans `src/i18n/locales/fr.json` en même temps que les composants (F-02 RM-03).
- **`format409Message(t, appCount, bcCount)` :** Signature mise à jour — accepte `TFunction` comme premier paramètre. Placé dans `src/utils/domain.utils.ts`. Ne pas dupliquer inline dans les composants.
- **`hasPermission()` :** Import depuis `@/store/auth` (FS-01) — ne pas recréer la logique localement.
- **Cypress helpers :**
  - `cy.login()` depuis `commands.ts` en `beforeEach` pour les parcours authentifiés
  - `cy.loginAsReadOnly()` depuis `commands.ts` pour les parcours droits UI — helper dédié, distinct de `cy.login()`
- **Câblage `App.tsx` :** Routes `/domains/new` et `/domains/:id/edit` sous `PrivateRoute permission="domains:write"`, routes `/domains` et `/domains/:id` sous `PrivateRoute` simple — **manuel, patron de référence pour tous les modules suivants**.

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
- hasPermission() importé depuis @/store/auth — conditionne l'affichage des boutons d'écriture (RM-06)
- format409Message(t, appCount, bcCount) dans src/utils/domain.utils.ts — accepte TFunction en premier param (RM-07)
- Le câblage App.tsx (PrivateRoute) est réalisé manuellement — ne pas le générer
- Post-save : création → navigate('/domains/' + id) ; édition → rester sur '/domains/:id'
- Cancel : New → navigate('/domains') ; Edit → navigate('/domains/:id')

i18n (F-02) :
- react-i18next installé, langue unique FR
- Fichier source : src/i18n/locales/fr.json
- Convention obligatoire : toutes les strings visibles passent par t('key') — jamais de string en dur
- Clés du module : domaine 'domains.*' — voir §6 pour la liste complète à injecter dans fr.json
- Ajouter les clés dans fr.json EN MÊME TEMPS que les composants
- Interpolation : t('domains.delete.blockedMessage', { apps, bcs }) avec {{apps}} et {{bcs}} dans fr.json
- Pas de composant <Trans> en P1

Stack de test :
  * Unit : Jest — src/domains/domains.service.spec.ts
  * API : Supertest — test/domains.e2e-spec.ts
  * E2E browser : Cypress — cypress/e2e/domains.cy.ts
  * cy.login() pour les parcours authentifiés, cy.loginAsReadOnly() pour les parcours read-only
  * Tests marqués [Manuel] : NE PAS générer
  * Assertions Cypress sur les textes : utiliser les valeurs FR de fr.json (ex: "Domaine créé avec succès")
- Scénarios utilisateurs : FS-02-domains-scenarios.md v0.3 — nommer les describe/it avec les labels exacts

Implémente la feature "Domains" (FS-02) en respectant strictement le contrat ci-dessous.
Génère le code de production ET les tests [Jest], [Supertest] et [Cypress] définis en section 7.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE CETTE SPEC ICI]
```

---

## 10. Checklist de Validation Avant Génération

- [ ] FS-01 au statut `done` — `JwtAuthGuard` global, `@RequirePermission()` disponible, `hasPermission()` exporté depuis `@/store/auth`
- [ ] **F-02 au statut `done`** — `react-i18next` installé, `fr.json` existant, convention `t()` active
- [ ] **Clés `domains.*` ajoutées dans `src/i18n/locales/fr.json`** — section complète de §6 présente
- [ ] **Jest + Supertest opérationnels (G-12 de F-00)**
- [ ] **Cypress opérationnel, `cy.login()` disponible (G-13 de F-00)**
- [ ] **`cy.loginAsReadOnly()` créé dans `cypress/support/commands.ts`**
- [ ] `schema.prisma` contient le modèle `Domain` avec ses relations inverses
- [ ] Migration Prisma appliquée — table `domains` présente en base
- [ ] Seed contient les permissions `domains:read` et `domains:write`
- [ ] **Câblage `App.tsx` réalisé manuellement** — 4 routes déclarées avec les bons `PrivateRoute`
- [ ] **`format409Message(t, appCount, bcCount)` implémenté dans `src/utils/domain.utils.ts`**
- [ ] Spec relue — aucune règle implicite non documentée

---

_Feature Spec FS-02 v0.7 — Projet ARK — Module de référence — Document de travail_

> **Probabilité que cette spec couvre l'intégralité des besoins Domains P1 sans ajustement majeur : ~94%.** Points d'incertitude résiduels : (1) parsing du message 409 backend pour extraire les compteurs — envisager d'enrichir la ConflictException avec un champ `details` structuré si le parsing s'avère fragile ; (2) l'interface exacte de `@RequirePermission()` dépend de FS-01 — vérifier avant de lancer OpenCode.