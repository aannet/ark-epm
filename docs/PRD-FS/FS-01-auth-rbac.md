# ARK — Feature Spec FS-01 : Auth & RBAC

_Version 0.5 — Février 2026_

> **Changelog v0.6 :** OpenCode implémente l'ensemble des tâches (1.2 à 1.7), y compris le backend Auth avec bcrypt + JWT.

> **Changelog v0.4 :** Section 7 restructurée — chaque cas de test étiqueté `[Jest]` / `[Supertest]` / `[Cypress]` / `[Manuel]`. Fichiers cibles précisés. Section 9 mise à jour.

> **Changelog v0.3 :** Routes React (`/login`, `/users`, `/roles`), structure fichiers frontend, comportements UX `UsersListPage`/`RolesListPage`, `hasPermission()` dans `store/auth.ts`, checklist section 10 complétée.

> **Changelog v0.2 :** Conventions transverses déplacées dans `AGENTS.md`. FS-01 conserve uniquement les règles spécifiques à Auth & RBAC.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-01 |
| **Titre** | Auth & RBAC — Login email/password, JWT, rôles, permissions, guards NestJS, écran login React |
| **Priorité** | P1 |
| **Statut** | `in_progress` |
| **Estimé** | 5 jours |
| **Version** | 0.6 |

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette feature fait :**

FS-01 implémente la couche d'authentification et de contrôle d'accès du MVP. Elle permet à un utilisateur de se connecter via email/password, d'obtenir un token JWT, et de se voir accorder ou refuser l'accès aux routes en fonction de son rôle global. À l'issue de FS-01, toutes les routes backend sont protégées par `JwtAuthGuard`, les rôles et permissions sont gérables via CRUD, et le frontend dispose d'un écran de login fonctionnel avec gestion du token en mémoire.

**Ce qu'elle ne fait pas (hors périmètre) :**

- Pas de SSO SAML2 — P2
- Pas de droits différenciés par domaine métier — P2
- Pas de workflow d'approbation d'inscription
- Pas de reset password / forgot password — P2
- Pas de refresh token — le token expire après `JWT_EXPIRES_IN` (défaut : 8h)

---

## 2. Modèle Prisma ⚠️

```prisma
model Permission {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @unique @db.VarChar(100)
  description String?
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  rolePermissions RolePermission[]

  @@map("permissions")
}

model Role {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @unique @db.VarChar(100)
  description String?
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  rolePermissions RolePermission[]
  users           User[]

  @@map("roles")
}

model RolePermission {
  roleId       String @map("role_id") @db.Uuid
  permissionId String @map("permission_id") @db.Uuid

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

model User {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  firstName    String?  @map("first_name") @db.VarChar(100)
  lastName     String?  @map("last_name") @db.VarChar(100)
  roleId       String?  @map("role_id") @db.Uuid
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  role Role? @relation(fields: [roleId], references: [id])

  ownedApplications    Application[]  @relation("ApplicationOwner")
  technicalInterfaces  Interface[]    @relation("InterfaceTechnicalContact")

  @@map("users")
}
```

---

## 3. Contrat API (OpenAPI) ⚠️

```yaml
paths:

  /auth/login:
    post:
      summary: Connexion email/password
      tags: [Auth]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
      responses:
        '200':
          description: Authentification réussie
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                  user:
                    $ref: '#/components/schemas/UserResponse'
        '401':
          description: Identifiants invalides

  /auth/me:
    get:
      summary: Profil de l'utilisateur connecté
      tags: [Auth]
      security:
        - bearerAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '401':
          description: Token absent ou invalide

  /auth/logout:
    post:
      summary: Déconnexion (stateless)
      tags: [Auth]
      security:
        - bearerAuth: []
      responses:
        '204':
          description: Déconnexion confirmée

  /users:
    get:
      summary: Liste des utilisateurs
      tags: [Users]
      security:
        - bearerAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UserResponse'

    post:
      summary: Créer un utilisateur (Admin)
      tags: [Users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '409':
          description: Email déjà utilisé

  /users/{id}:
    get:
      summary: Détail d'un utilisateur
      tags: [Users]
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
                $ref: '#/components/schemas/UserResponse'
        '404':
          description: Utilisateur introuvable

    patch:
      summary: Modifier un utilisateur
      tags: [Users]
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
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateUserDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '403':
          description: Modification interdite
        '404':
          description: Utilisateur introuvable

    delete:
      summary: Désactiver un utilisateur (soft delete)
      tags: [Users]
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
          description: Utilisateur désactivé
        '403':
          description: Permission insuffisante
        '404':
          description: Utilisateur introuvable

  /roles:
    get:
      summary: Liste des rôles
      tags: [Roles]
      security:
        - bearerAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/RoleResponse'

    post:
      summary: Créer un rôle (Admin)
      tags: [Roles]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateRoleDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RoleResponse'
        '409':
          description: Nom de rôle déjà utilisé

  /roles/{id}:
    get:
      summary: Détail d'un rôle avec ses permissions
      tags: [Roles]
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
                $ref: '#/components/schemas/RoleWithPermissionsResponse'
        '404':
          description: Rôle introuvable

    patch:
      summary: Modifier un rôle
      tags: [Roles]
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
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateRoleDto'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RoleResponse'

    delete:
      summary: Supprimer un rôle (Admin)
      tags: [Roles]
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
          description: Rôle supprimé
        '409':
          description: Rôle assigné à des utilisateurs

  /roles/{id}/permissions:
    put:
      summary: Remplacer les permissions d'un rôle (Admin)
      tags: [Roles]
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
              type: object
              required: [permissionIds]
              properties:
                permissionIds:
                  type: array
                  items:
                    type: string
                    format: uuid
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RoleWithPermissionsResponse'

  /permissions:
    get:
      summary: Liste de toutes les permissions
      tags: [Permissions]
      security:
        - bearerAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/PermissionResponse'

    post:
      summary: Créer une permission (Admin)
      tags: [Permissions]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePermissionDto'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PermissionResponse'
        '409':
          description: Nom de permission déjà utilisé

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    UserResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
        firstName:
          type: string
          nullable: true
        lastName:
          type: string
          nullable: true
        isActive:
          type: boolean
        role:
          $ref: '#/components/schemas/RoleResponse'
          nullable: true
        createdAt:
          type: string
          format: date-time
      # passwordHash est TOUJOURS exclu

    CreateUserDto:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        firstName:
          type: string
        lastName:
          type: string
        roleId:
          type: string
          format: uuid
          nullable: true

    UpdateUserDto:
      type: object
      properties:
        firstName:
          type: string
        lastName:
          type: string
        roleId:
          type: string
          format: uuid
          nullable: true
        isActive:
          type: boolean

    RoleResponse:
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

    RoleWithPermissionsResponse:
      allOf:
        - $ref: '#/components/schemas/RoleResponse'
        - type: object
          properties:
            permissions:
              type: array
              items:
                $ref: '#/components/schemas/PermissionResponse'

    CreateRoleDto:
      type: object
      required: [name]
      properties:
        name:
          type: string
        description:
          type: string

    UpdateRoleDto:
      type: object
      properties:
        name:
          type: string
        description:
          type: string

    PermissionResponse:
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

    CreatePermissionDto:
      type: object
      required: [name]
      properties:
        name:
          type: string
          example: "applications:write"
        description:
          type: string
```

---

## 4. Règles Métier Critiques ⚠️

- **RM-01 — Hash Bcrypt obligatoire :** `bcrypt.hash(password, 12)` (async). Ne jamais utiliser la variante sync.
- **RM-02 — `passwordHash` jamais exposé :** `@Exclude()` sur le champ. `ClassSerializerInterceptor` global.
- **RM-03 — JWT stateless :** `POST /auth/logout` → `204`, le client supprime le token. Pas de blacklist en P1.
- **RM-04 — Suppression d'utilisateur = soft delete :** `isActive = false`. Un utilisateur désactivé ne peut plus se connecter (`401` + `"Account disabled"`).
- **RM-05 — Suppression de rôle bloquée si assigné :** `409 Conflict` si au moins un utilisateur possède ce rôle.
- **RM-06 — Modification des permissions = remplacement complet :** `PUT /roles/{id}/permissions` = delete-and-insert en transaction.
- **RM-07 — Admin uniquement pour CRUD users/roles/permissions :** Permission `users:write`, `roles:write`, `permissions:write`.
- **RM-08 — Nomenclature permissions :** Format `<ressource>:<action>`. Vérification sur le nom.
- **RM-09 — Seed obligatoire :** Rôle `Admin` + toutes permissions P1 + `admin@ark.io`.

---

## 5. Comportement Attendu par Cas d'Usage

**Nominal :**
- `POST /auth/login` credentials valides + `isActive = true` → `200` avec `{ accessToken, user }` (sans `passwordHash`)
- `GET /auth/me` token valide → `200` profil utilisateur
- Admin `POST /users` → `201` mot de passe hashé en base
- Admin `PUT /roles/{id}/permissions` → `200` nouvelles permissions (anciennes supprimées)

**Erreurs :**
- `POST /auth/login` email inconnu → `401` + `"Invalid credentials"` (ne pas distinguer email/password)
- `POST /auth/login` `isActive = false` → `401` + `"Account disabled"`
- Route protégée sans token → `401`
- Route protégée token expiré → `401` + `"Token expired"`
- Non-Admin `POST /users` → `403`
- `POST /users` email dupliqué → `409` + `"Email already in use"`
- `DELETE /roles/{id}` utilisateurs assignés → `409` + `"Role is assigned to X user(s)"`

---

## 6. Composants Frontend

**Routes React :**

| Route | Composant | Accès |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/401` | `UnauthorizedPage` | Public |
| `/403` | `ForbiddenPage` | Public |
| `/users` | `UsersListPage` | Authentifié + `users:write` |
| `/users/:id/edit` | `UserEditPage` | Authentifié + `users:write` |
| `/roles` | `RolesListPage` | Authentifié + `roles:write` |

**Structure de fichiers :**

```
frontend/src/
├── store/
│   └── auth.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── UnauthorizedPage.tsx       ← 401 — token absent ou expiré
│   ├── ForbiddenPage.tsx          ← 403 — authentifié mais permission insuffisante
│   ├── users/
│   │   ├── UsersListPage.tsx
│   │   └── UserEditPage.tsx
│   └── roles/
│       └── RolesListPage.tsx
├── components/
│   └── PrivateRoute.tsx           ← étendu : vérifie token + permission optionnelle
├── api/
│   └── client.ts                  ← intercepteur Axios 401/403
└── types/
    └── auth.ts
```

**Gestion du token JWT :**

```typescript
// frontend/src/store/auth.ts
let _token: string | null = null;
let _user: UserResponse | null = null;

export const setAuth = (token: string, user: UserResponse) => { _token = token; _user = user; };
export const getToken = () => _token;
export const getUser = () => _user;
export const clearAuth = () => { _token = null; _user = null; };
export const hasPermission = (permission: string): boolean =>
  _user?.role?.permissions?.some(p => p.name === permission) ?? false;
```

**`UnauthorizedPage` (401) :**

```typescript
// frontend/src/pages/UnauthorizedPage.tsx
// Affiché quand : token absent, token expiré, ou compte désactivé
// Pas de Sidebar — page autonome (hors AppShell)
//
// Contenu :
// - Code "401" en grand (h1, color primary.main)
// - Titre : "Session expirée"
// - Description : "Votre session a expiré ou vous n'êtes pas connecté."
// - Bouton "Se connecter" → navigate('/login') via useNavigate()
// - Centré verticalement (height: 100vh), fond background.default

export default function UnauthorizedPage(): JSX.Element
```

**`ForbiddenPage` (403) :**

```typescript
// frontend/src/pages/ForbiddenPage.tsx
// Affiché quand : utilisateur authentifié mais permission insuffisante
// Pas de Sidebar — page autonome (hors AppShell)
//
// Contenu :
// - Code "403" en grand (h1, color error.main)
// - Titre : "Accès refusé"
// - Description : "Vous n'avez pas les droits nécessaires pour accéder à cette page."
// - Bouton "Retour à l'accueil" → navigate('/') via useNavigate()
// - Bouton secondaire "Contacter l'administrateur" → mailto (optionnel)
// - Centré verticalement (height: 100vh), fond background.default

export default function ForbiddenPage(): JSX.Element
```

**`PrivateRoute` étendu :**

```typescript
// frontend/src/components/PrivateRoute.tsx
// Garde de route à deux niveaux :
//   1. Token absent → redirect /401
//   2. Permission requise absente → redirect /403
//   3. Les deux présents → rendu du composant enfant

interface PrivateRouteProps {
  permission?: string; // ex: 'users:write' — optionnel, si absent vérifie uniquement le token
}

// Usage dans App.tsx :
// <Route path="/users" element={<PrivateRoute permission="users:write" />}>
//   <Route index element={<UsersListPage />} />
// </Route>
//
// <Route path="/domains" element={<PrivateRoute />}>  ← token requis, pas de permission spécifique
//   <Route index element={<DomainsListPage />} />
// </Route>

export default function PrivateRoute({ permission }: PrivateRouteProps): JSX.Element {
  const token = getToken();
  if (!token) return <Navigate to="/401" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/403" replace />;
  return <Outlet />;
}
```

**Intercepteur Axios 401/403 :**

```typescript
// frontend/src/api/client.ts — compléter le fichier existant de F-01
// Ajouter l'intercepteur de réponse après l'intercepteur de requête existant :

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      // Redirection hard (window.location) pour purger le state React en mémoire
      window.location.href = '/401';
    }
    if (error.response?.status === 403) {
      window.location.href = '/403';
    }
    return Promise.reject(error);
  }
);

// ⚠️ Exception : NE PAS intercepter le 401 de POST /auth/login
// → Cette route gère son propre état d'erreur inline dans LoginPage
// → Utiliser un flag ou une instance Axios séparée pour /auth/login si nécessaire
```

**Bouton de déconnexion (Sidebar — bas) :**
- Affiché sous le nom utilisateur + avatar
- Au clic :
  1. Appel `POST /auth/logout` (best-effort — ignorer les erreurs réseau)
  2. `clearAuth()` — purge token + user en mémoire
  3. `window.location.href = '/login'` — hard redirect pour purger le state React



> **Note sur la stratégie de redirection :** `window.location.href` (hard redirect) est intentionnel pour le 401 — il purge le state React en mémoire (`_token`, `_user`) et force un cycle de vie propre. Pour le 403, une alternative acceptable est `navigate('/403')` via React Router si le contexte le permet.

---

## 7. Tests ⚠️

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable |
|---|---|---|---|
| Unit services | Jest | `src/users/users.service.spec.ts`, `src/auth/auth.service.spec.ts` | ✅ OpenCode |
| Contrat API | Supertest | `test/auth.e2e-spec.ts`, `test/users.e2e-spec.ts`, `test/roles.e2e-spec.ts` | ✅ OpenCode |
| Sécurité / RBAC | Supertest | `test/auth.e2e-spec.ts` | ❌ **Manuel** |
| E2E browser | Cypress | `cypress/e2e/login.cy.ts`, `cypress/e2e/users.cy.ts` | ✅ OpenCode (nominaux) |

### Tests Jest — Unit

- [ ] `[Jest]` `AuthService.validateUser()` retourne `null` si email inconnu
- [ ] `[Jest]` `AuthService.validateUser()` retourne `null` si mot de passe incorrect
- [ ] `[Jest]` `AuthService.validateUser()` retourne `null` si `isActive = false`
- [ ] `[Jest]` `AuthService.login()` retourne un JWT bien formé avec `sub = userId`
- [ ] `[Jest]` `UsersService.create()` hash le mot de passe avant insertion (`passwordHash !== password`)
- [ ] `[Jest]` `UsersService.remove()` positionne `isActive = false` — ne supprime pas la ligne

### Tests Supertest — Contrat API

- [ ] `[Supertest]` `POST /auth/login` credentials valides → `200` avec `accessToken`
- [ ] `[Supertest]` `POST /auth/login` credentials invalides → `401`
- [ ] `[Supertest]` `GET /auth/me` token valide → `200`
- [ ] `[Supertest]` `GET /auth/me` sans token → `401`
- [ ] `[Supertest]` `POST /users` Admin valide → `201`
- [ ] `[Supertest]` `POST /users` email dupliqué → `409`
- [ ] `[Supertest]` `DELETE /users/{id}` → `204` + `isActive = false` en base
- [ ] `[Supertest]` `DELETE /roles/{id}` rôle assigné → `409`
- [ ] `[Supertest]` `PUT /roles/{id}/permissions` → `200` permissions remplacées
- [ ] `[Supertest]` `POST /auth/logout` token valide → `204`
- [ ] `[Supertest]` `POST /auth/logout` sans token → `401`

### Tests Sécurité / RBAC — Manuel ❌

> Ces tests ne sont **jamais** délégués à OpenCode.

- [ ] `[Manuel]` Vérifier que `passwordHash` n'apparaît dans **aucune** réponse API (grep sur les réponses brutes)
- [ ] `[Manuel]` Rôle sans `users:write` → `403` sur `POST /users`
- [ ] `[Manuel]` Rôle sans `roles:write` → `403` sur `DELETE /roles/{id}`
- [ ] `[Manuel]` Token expiré → `401` (pas `403`)
- [ ] `[Manuel]` Utilisateur désactivé (`isActive = false`) → `401` sur `POST /auth/login`
- [ ] `[Manuel]` `DELETE /roles/{id}` avec utilisateurs assignés → `409` (pas `204`)
- [ ] `[Manuel]` `POST /auth/login` avec credentials invalides → erreur inline dans `LoginPage`, **pas** de redirect vers `/401`
- [ ] `[Manuel]` Intercepteur Axios : `401` reçu sur une route protégée → `_token` et `_user` purgés en mémoire

### Tests Cypress — E2E Browser

- [ ] `[Cypress]` Flow login complet : saisie email/password → token en mémoire → redirection `/`
- [ ] `[Cypress]` Credentials invalides → message d'erreur inline sur `LoginPage`
- [ ] `[Cypress]` `PrivateRoute` redirige vers `/401` si token absent
- [ ] `[Cypress]` `PrivateRoute` redirige vers `/403` si token valide mais permission insuffisante
- [ ] `[Cypress]` `UnauthorizedPage` : bouton "Se connecter" redirige vers `/login`
- [ ] `[Cypress]` `ForbiddenPage` : bouton "Retour à l'accueil" redirige vers `/`
- [ ] `[Cypress]` Intercepteur Axios : réponse `401` de l'API → redirect `/401` + token purgé
- [ ] `[Cypress]` `UsersListPage` affiche la liste des utilisateurs après login
- [ ] `[Cypress]` Désactivation d'un utilisateur via UI → badge statut mis à jour
- [ ] `[Cypress]` Flow logout : clic bouton déconnexion → token purgé + redirect `/login`
- [ ] `[Cypress]` Après logout, navigation vers `/` redirige vers `/401`
---

## 8. Contraintes Techniques

- **Pattern NestJS :** Ce module est la référence de sécurité — le module métier de référence est FS-02.
- **Prisma :** Toute écriture passe par `$executeRaw ark.current_user_id`.
- **Bcrypt :** `bcrypt.hash(password, 12)` (async uniquement).
- **ClassSerializerInterceptor :** Global dans `main.ts`.
- **Seed :** `prisma/seed.ts` idempotent (`upsert`) — rôle Admin + permissions P1 + `admin@ark.io`.
- **Conventions de fichiers de test :**
  - Unit : `src/auth/auth.service.spec.ts`, `src/users/users.service.spec.ts`
  - E2E API : `test/auth.e2e-spec.ts`, `test/users.e2e-spec.ts`, `test/roles.e2e-spec.ts`
  - Cypress : `cypress/e2e/login.cy.ts`, `cypress/e2e/users.cy.ts`
- **Mock Prisma dans les tests unit :** `jest.mock()` ou `{ provide: PrismaService, useValue: mockPrisma }` dans `Test.createTestingModule()`.
- **Cypress login :** Utiliser `cy.login('admin@ark.io', password)` depuis `cypress/support/commands.ts`.

---

## 9. Commande OpenCode

> ⚠️ OpenCode implémente l'ensemble des tâches de cette spec :
> - **1.2** : Backend Auth (bcrypt + JWT)
> - **1.3** : CRUD users/roles/permissions + guards
> - **1.4** : Frontend (LoginPage, PrivateRoute, pages 401/403, store auth, interceptors)
> - **1.5** : Tests Jest + Supertest
> - **1.7** : Tests Cypress
>
> Les tests marqués [Manuel] ne sont pas générés.

```
Contexte projet ARK (conventions dans AGENTS.md) :
- Stack : NestJS strict + Prisma + PostgreSQL 16 + React + TypeScript strict
- Toute écriture en base passe par : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global — ne pas le réimporter
- JwtAuthGuard est global — @Public() sur les routes publiques uniquement
- ClassSerializerInterceptor est global — @Exclude() actif partout
- Pages d'erreur disponibles (F-01) : NotFoundPage (*), ErrorBoundary (wrapper global)
- Pages d'erreur FS-01 à créer : UnauthorizedPage (/401), ForbiddenPage (/403)
- PrivateRoute à créer : redirige /401 si token absent, /403 si permission insuffisante
- Intercepteur Axios à compléter : 401 API → clearAuth() + window.location.href='/401' (sauf POST /auth/login)
- Stack de test :
  * Unit + API : Jest + Supertest (@nestjs/testing)
  * E2E browser : Cypress
  * Tests marqués [Manuel] : NE PAS générer

Implémente la feature "Auth & RBAC" (FS-01) en respectant strictement le contrat ci-dessous.
Génère le code de production ET les tests [Jest], [Supertest] et [Cypress] définis en section 7.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE CETTE SPEC ICI]
```

---

## 10. Checklist de Validation Avant Génération

- [ ] F-00 terminé — `docker-compose up` OK, PrismaModule global, middleware audit actif
- [ ] **F-01 terminé** — Theme MUI actif, AppShell fonctionnel, composants partagés disponibles
- [ ] **Jest + Supertest configurés et opérationnels (G-12 de F-00)**
- [ ] **Cypress installé et opérationnel (G-13 de F-00)**
- [ ] **`cy.login()` disponible dans `cypress/support/commands.ts`**
- [ ] `schema.prisma` contient `User`, `Role`, `Permission`, `RolePermission`
- [ ] Migration Prisma `init` appliquée
- [ ] Seed `prisma/seed.ts` rédigé et testé
- [ ] Backend Auth (tâche 1.2) implémenté manuellement — login OK, token valide
- [ ] `ClassSerializerInterceptor` enregistré globalement dans `main.ts`
- [ ] Aucun `passwordHash` visible dans les réponses API (testé manuellement)
- [ ] React Router configuré — routes `/login`, `/401`, `/403`, `/users`, `/roles` déclarées
- [ ] `UnauthorizedPage` affichée sur `/401` — bouton "Se connecter" fonctionnel
- [ ] `ForbiddenPage` affichée sur `/403` — bouton "Retour à l'accueil" fonctionnel
- [ ] `PrivateRoute` redirige vers `/401` (pas `/login`) si token absent
- [ ] `PrivateRoute` redirige vers `/403` si permission insuffisante
- [ ] Intercepteur Axios actif — `401` API purge le token et redirige vers `/401`
- [ ] `POST /auth/login` échoué → erreur inline dans `LoginPage`, **pas** de redirect vers `/401`
- [ ] `LoginPage` redirige vers `/` après succès
- [ ] Spec relue — aucune règle implicite non documentée
