# ARK — Feature Spec FS-02 : Domains

_Version 0.9 — Mars 2026_

> **Changelog v0.10 :**
> - RM-08 : ajout tri des colonnes côté client sur DomainsListPage (name, description, createdAt)
> - Gherkin : ajout scénarios de test pour le tri des colonnes


> - NFR-MAINT-001 : responses 409 enrichies avec champ `code` explicite (`CONFLICT` pour nom dupliqué, `DEPENDENCY_CONFLICT` pour suppression bloquée)
> - NFR-PERF-002 : clarification trade-off pagination — délibérément exclue de FS-02 pour valider le patron de référence rapidement
> - RM-02 : ajout test case whitespace-only name (espaces uniquement)
> - DTOs : ajout `maxLength(2000)` sur description

> **Changelog v0.8 :**
> - Ajout §11 — Revue de dette technique (gate de fin de sprint obligatoire)
> - 6 gates TD adaptées au contexte FS-02 (patron de référence, Item 5 F-999, permissions `domains:*`)
> - Note spécifique : tolérance zéro sur TD-1 à TD-4 car FS-02 propage ses patterns vers FS-03 → FS-11

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
| **Statut** | `in-progress` |
| **Dépend de** | FS-01, F-02 |
| **Estimé** | 2 jours |
| **Version** | 0.10 |

---

## 1. Objectif & Périmètre

**Ce que cette feature fait :**

FS-02 implémente la gestion complète des Domaines métier : création, lecture, modification et suppression via l'API REST, avec les pages React correspondantes. C'est intentionnellement la feature la plus simple du MVP : pas de relation n:n, pas de récursion, pas de règle métier complexe. Elle sert de module de référence pour tous les suivants — la qualité du code et des tests ici se propage dans tout le MVP.

**Ce qu'elle ne fait pas (hors périmètre) :**

- Pas de droits différenciés par domaine (P2)
- Pas de suppression en cascade — bloquée si entités liées (RM-03)
- Pas de pagination côté serveur en P1 — **délibéré** : FS-02 est le module de référence simple. NFR-PERF-002 sera implémenté dans un module ultérieur (FS-03+). Ce choix simplify FS-02 pour valider le patron de référence plus rapidement.
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
                  statusCode:
                    type: integer
                    example: 409
                  code:
                    type: string
                    example: "CONFLICT"
                  message:
                    type: string
                  timestamp:
                    type: string
                    format: date-time
                  path:
                    type: string

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
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                    example: 409
                  code:
                    type: string
                    example: "CONFLICT"
                  message:
                    type: string
                  timestamp:
                    type: string
                    format: date-time
                  path:
                    type: string

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
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                    example: 409
                  code:
                    type: string
                    example: "DEPENDENCY_CONFLICT"
                  message:
                    type: string
                  timestamp:
                    type: string
                    format: date-time
                  path:
                    type: string

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

## 4. Règles Métier Critiques ⚠️

- **RM-01 — Nom unique :** Deux domaines ne peuvent pas avoir le même nom. `409 Conflict` + code `"CONFLICT"` + message `"Domain name already in use"`. Intercepter l'erreur Prisma `P2002`. Réponse conforme à NFR-MAINT-001.

- **RM-02 — Nom non vide :** `name` obligatoire, non vide, non uniquement espaces. `@IsNotEmpty()` + trim avant validation. Les espaces uniquement sont rejectés comme vide.

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
    throw new ConflictException({
      code: 'DEPENDENCY_CONFLICT',
      message: `Domain is used by ${domain._count.applications} application(s) ` +
        `and ${domain._count.businessCapabilities} business capability(ies)`
    });
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

- **RM-08 — Tri des colonnes côté client :** ⚠️ *Nouveau v0.10*

  Les colonnes du tableau DomainsListPage sont triables côté client. Par défaut, le tri est effectué par `name` en ordre ascendant. Click sur un en-tête de colonne inverse le sens du tri si la même colonne est sélectionnée, sinon trie par la nouvelle colonne en ordre ascendant.

  ```typescript
  type SortField = 'name' | 'description' | 'createdAt';
  type SortOrder = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // MUI TableSortLabel
  <TableSortLabel
    active={sortField === 'name'}
    direction={sortField === 'name' ? sortOrder : 'asc'}
    onClick={() => handleSort('name')}
  >
    {t('domains.list.columns.name')}
  </TableSortLabel>
  ```

  Le tri est implémenté via `useMemo` côté client sur le tableau des domaines reçus depuis l'API.

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
- `POST /domains` name avec uniquement des espaces → `400` + erreur inline `t('domains.form.nameRequired')`
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
- `DomainsListPage` : tri des colonnes (name, description, createdAt) via MUI TableSortLabel, tri client (RM-08)
- `DomainsListPage` : tri par défaut sur `name` en ordre ascendant
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
- [ ] `[Supertest]` `POST /domains` name avec uniquement des espaces → `400`
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
- [ ] `[Cypress]` Tri par défaut sur `name` ascendant — domaines affichés dans l'ordre alphabétique
- [ ] `[Cypress]` Clic sur en-tête `Name` inverse le tri (desc) — domaines affichés dans l'ordre alphabétique inverse
- [ ] `[Cypress]` Clic sur en-tête `Created` trie par date croissante
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
- [ ] `[Cypress]` Créer un domaine avec nom uniquement espaces → erreur inline `"Name is required"`
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
- **Validation DTO :** `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@MaxLength(255)` pour name, `@MaxLength(2000)` pour description.
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

## 11. Revue de dette technique *(gate de fin de sprint — obligatoire)* ⚠️

> À remplir **après** implémentation, avant de clore le sprint. Bloquant : FS-02 n'est `done` que si cette section est complétée et consignée dans F-999 §6.

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré de ce sprint | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts' '*.tsx'` |
| TD-2 | Items F-999 activés par FS-02 mis à jour — en particulier **Item 5** (politique de suppression, `409 DEPENDENCY_CONFLICT`) | F-999 §2 Item 5 |
| TD-3 | Checklist F-999 §4 cochée : Item 4 (`PaginationQueryDto` — FS-02 sert de référence), Item 5 (`remove()` avec `_count`) | F-999 §4 |
| TD-4 | AGENTS.md : pattern `_count` avant suppression documenté comme patron de référence | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés mis à jour — notamment `NFR-SEC-004` (RBAC, nouvelles permissions `domains:*`) | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses émergées pendant l'implémentation → Item F-999 créé si applicable | Jugement |

> **Note FS-02 spécifique :** ce sprint valide le patron de référence pour tous les modules suivants. Une anomalie non corrigée ici se propage à FS-03 → FS-11. Tolérance zéro sur TD-1 à TD-4.

### Résultat de la revue

| Champ | Valeur |
|---|---|
| **Sprint** | *(ex : Sprint 2)* |
| **Date de revue** | *(date)* |
| **Items F-999 fermés** | *(ex : Item 4 — FS-02 implémente le contrat de référence pagination ; Item 5 — `_count` + 409 validés)* |
| **Items F-999 ouverts** | *(ex : Item 8 — reste pending)* |
| **Nouveaux items F-999 créés** | *(ex : aucun)* |
| **NFR mis à jour** | *(ex : NFR-SEC-004 → covered ; NFR-PERF-001 → partial)* |
| **TODOs résiduels tracés** | *(ex : aucun)* |
| **Statut gates TD** | ✅ TD-1 / ✅ TD-2 / ✅ TD-3 / ✅ TD-4 / ✅ TD-5 / ✅ TD-6 |

---

---

## Annexe : User Scenarios (Gherkin)

> Cette section contient les scénarios utilisateur détaillés pour la génération des tests Cypress.
> Les textes UI sont en anglais pour lisibilité ; voir fr.json pour les valeurs FR exactes.

### Feature: Business Domain Management

```gherkin
Feature: Business Domain Management
  As an Enterprise Architect
  I want to manage business domains
  So that I can structure my organization's application portfolio

  Background:
    Given I am logged in as an Enterprise Architect
    And I am on the "/domains" page

  #
  # ── NOMINAL PATHS ────────────────────────────────────────────────────────────
  #

  Scenario: View the domains list
    Then I see a table listing all existing domains
    And each row displays the domain name, description, and creation date
    And an "Add Domain" button is visible in the page header

  Scenario: View an empty domains list
    Given no domain has been created yet
    Then I see an empty state with the message "No domain created yet"
    And a call-to-action button "Create your first domain" is visible

  Scenario: View domains list with no pagination
    Given 15 domains have been created
    When I navigate to "/domains"
    Then all 15 domains are displayed in the table
    And no pagination control is visible

  Scenario: Default sorting is by name ascending
    Given the domains "Zebra", "Apple", "Banana" exist
    When I navigate to "/domains"
    Then the domains are displayed in order "Apple", "Banana", "Zebra"

  Scenario: Sort domains by name descending
    Given the domains "Zebra", "Apple", "Banana" exist
    When I navigate to "/domains"
    And I click the "Name" column header
    And I click the "Name" column header again
    Then the domains are displayed in order "Zebra", "Banana", "Apple"

  Scenario: Sort domains by creation date
    Given the domains "First" (created yesterday) and "Second" (created today) exist
    When I navigate to "/domains"
    And I click the "Created" column header
    Then the domains are displayed in order "Second", "First"

  Scenario: Create a new domain
    When I click "Add Domain"
    Then I am redirected to "/domains/new"
    When I fill in the name field with "Finance"
    And I fill in the description field with "Financial and accounting domain"
    And I click "Save"
    Then I see a success snackbar "Domain created successfully"
    And I am redirected to "/domains/<new-id>"
    And the page displays the domain name "Finance"
    And the page displays the description "Financial and accounting domain"

  Scenario: Create a domain with name only (description optional)
    When I click "Add Domain"
    And I fill in the name field with "HR"
    And I leave the description field empty
    And I click "Save"
    Then I see a success snackbar "Domain created successfully"
    And I am redirected to "/domains/<new-id>"
    And the page displays the domain name "HR"
    And no description is displayed

  Scenario: Cancel creating a domain
    When I click "Add Domain"
    And I fill in the name field with "Draft"
    And I click "Cancel"
    Then I am redirected to "/domains"
    And no domain "Draft" appears in the list

  Scenario: View a domain detail page
    Given the domain "Finance" exists
    When I click on the "Finance" row in the list
    Then I am redirected to "/domains/<id>"
    And the page displays the domain name "Finance"
    And the page displays the creation date
    And an "Edit" button is visible

  Scenario: Edit an existing domain
    Given the domain "Finance" exists
    When I click the edit icon on the "Finance" row
    Then I am redirected to "/domains/<id>/edit"
    And the name field is pre-filled with "Finance"
    When I update the description to "Finance, HR and Legal domain"
    And I click "Save"
    Then I see a success snackbar "Domain updated successfully"
    And I remain on "/domains/<id>"
    And the page displays the updated description "Finance, HR and Legal domain"

  Scenario: Cancel editing a domain
    Given the domain "Finance" exists
    When I click the edit icon on the "Finance" row
    And I modify the name to "Finance Modified"
    And I click "Cancel"
    Then I am redirected to "/domains/<id>"
    And the page displays the domain name "Finance" unchanged

  Scenario: Delete a domain with no linked entities
    Given the domain "Sandbox" exists with no linked applications or business capabilities
    When I click the delete icon on the "Sandbox" row
    Then a confirmation dialog appears with the message "Are you sure you want to delete the domain 'Sandbox'?"
    When I click "Delete" in the dialog
    Then I see a success snackbar "Domain deleted successfully"
    And the domain "Sandbox" no longer appears in the list

  Scenario: Cancel a domain deletion
    Given the domain "Finance" exists
    When I click the delete icon on the "Finance" row
    And a confirmation dialog appears
    When I click "Cancel" in the dialog
    Then the dialog closes
    And the domain "Finance" remains in the list

  #
  # ── ERROR PATHS ──────────────────────────────────────────────────────────────
  #

  Scenario: Attempt to create a domain with a duplicate name
    Given the domain "Finance" already exists
    When I click "Add Domain"
    And I fill in the name field with "Finance"
    And I click "Save"
    Then I see an inline error "This domain name is already in use"
    And no duplicate domain is created
    And I remain on the "/domains/new" page

  Scenario: Attempt to create a domain with an empty name
    When I click "Add Domain"
    And I leave the name field empty
    And I click "Save"
    Then I see a validation error "Name is required" below the name field
    And the form is not submitted

  Scenario: Attempt to edit a domain with a duplicate name
    Given the domains "Finance" and "IT" exist
    When I click the edit icon on the "Finance" row
    And I change the name to "IT"
    And I click "Save"
    Then I see an inline error "This domain name is already in use"
    And I remain on the "/domains/<id>/edit" page
    And the domain "Finance" is unchanged

  Scenario: Attempt to delete a domain linked to applications only
    Given the domain "Finance" is linked to 3 applications and 0 business capabilities
    When I click the delete icon on the "Finance" row
    And I confirm the deletion in the dialog
    Then I see an error message "This domain is used by 3 application(s) and no business capability(ies) and cannot be deleted"
    And the domain "Finance" remains in the list

  Scenario: Attempt to delete a domain linked to business capabilities only
    Given the domain "Finance" is linked to 0 applications and 4 business capabilities
    When I click the delete icon on the "Finance" row
    And I confirm the deletion in the dialog
    Then I see an error message "This domain is used by no application(s) and 4 business capability(ies) and cannot be deleted"
    And the domain "Finance" remains in the list

  Scenario: Attempt to delete a domain linked to both applications and business capabilities
    Given the domain "Finance" is linked to 2 applications and 4 business capabilities
    When I click the delete icon on the "Finance" row
    And I confirm the deletion in the dialog
    Then I see an error message "This domain is used by 2 application(s) and 4 business capability(ies) and cannot be deleted"
    And the domain "Finance" remains in the list

  Scenario: Access the edit page for a non-existent domain
    When I navigate directly to "/domains/non-existent-uuid/edit"
    Then I am redirected to "/domains"

  Scenario: Access the detail page for a non-existent domain
    When I navigate directly to "/domains/non-existent-uuid"
    Then I am redirected to "/domains"

  #
  # ── ACCESS CONTROL PATHS ─────────────────────────────────────────────────────
  #

  Scenario: Access the domains list without being authenticated
    Given I am not logged in
    When I navigate to "/domains"
    Then I am redirected to "/401"

  Scenario: Read-only user sees no write actions on the domains list
    Given I am logged in as a read-only user via cy.loginAsReadOnly()
    When I navigate to "/domains"
    Then the "Add Domain" button is not visible
    And no edit icon is visible on any domain row
    And no delete icon is visible on any domain row

  Scenario: Read-only user sees no edit button on the domain detail page
    Given I am logged in as a read-only user via cy.loginAsReadOnly()
    And the domain "Finance" exists
    When I navigate to "/domains/<id>"
    Then the "Edit" button is not visible

  Scenario: Read-only user navigates directly to the new domain page
    Given I am logged in as a read-only user via cy.loginAsReadOnly()
    When I navigate directly to "/domains/new"
    Then I am redirected to "/403"

  Scenario: Read-only user navigates directly to the edit domain page
    Given I am logged in as a read-only user via cy.loginAsReadOnly()
    When I navigate directly to "/domains/<id>/edit"
    Then I am redirected to "/403"
```

---

_Feature Spec FS-02 v0.8 — Projet ARK — Module de référence — Document de travail_

> **Probabilité que cette spec couvre l'intégralité des besoins Domains P1 sans ajustement majeur : ~94%.** Points d'incertitude résiduels : (1) parsing du message 409 backend pour extraire les compteurs — envisager d'enrichir la ConflictException avec un champ `details` structuré si le parsing s'avère fragile ; (2) l'interface exacte de `@RequirePermission()` dépend de FS-01 — vérifier avant de lancer OpenCode.