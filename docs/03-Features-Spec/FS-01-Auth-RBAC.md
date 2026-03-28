# ARK — Feature Spec FS-01 : Auth & RBAC

_Version 0.5 — Février 2026_

> **Changelog v0.7 :** Ajout du système de refresh tokens avec rotation (httpOnly cookie) et endpoint `/auth/refresh`. Token access: 15min, refresh: 7jours. Limite 1 session/utilisateur.

> **Changelog v0.6 :** OpenCode implémente l'ensemble des tâches (1.2 à 1.7), y compris le backend Auth avec bcrypt + JWT.

> **Changelog v0.4 :** Section 7 restructurée — chaque cas de test étiqueté `[Jest]` / `[Supertest]` / `[Cypress]` / `[Manuel]`. Fichiers cibles précisés. Section 9 mise à jour.

> **Changelog v0.3 :** Routes React (`/login`, `/users`, `/roles`), structure fichiers frontend, comportements UX `UsersListPage`/`RolesListPage`, `hasPermission()` dans `store/auth.ts`, checklist section 10 complétée.

> **Changelog v0.2 :** Conventions transverses déplacées dans `AGENTS.md`. FS-01 conserve uniquement les règles spécifiques à Auth & RBAC.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-01 |
| **Titre** | Auth & RBAC — Login email/password, JWT (15min TTL + refresh token), rôles, permissions, guards NestJS, écran login React |
| **Priorité** | P1 |
| **Statut** | ✅ `done` |
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
- ~~Pas de refresh token~~ ✅ **Implémenté v0.7** : access token 15min + refresh token 7jours (httpOnly cookie, rotation, limite 1 session/utilisateur)

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
          headers:
            Set-Cookie:
              description: Cookie httpOnly contenant le refresh token (7j)
              schema:
                type: string
                example: "refresh_token=xxx; HttpOnly; Path=/auth; Max-Age=604800"
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

  /auth/refresh:
    post:
      summary: Rafraîchir le token d'accès
      description: Génère un nouveau access token et rotate le refresh token (cookie httpOnly requis)
      tags: [Auth]
      security: []
      parameters:
        - name: Cookie
          in: header
          required: true
          description: Cookie httpOnly contenant refresh_token
          schema:
            type: string
      responses:
        '200':
          description: Nouveau access token et refresh token générés
          headers:
            Set-Cookie:
              description: Nouveau cookie httpOnly avec refresh token rotaté (7j)
              schema:
                type: string
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
          description: Refresh token manquant, invalide ou expiré

  /auth/logout:
    post:
      summary: Déconnexion (révoque le refresh token)
      description: Supprime le refresh token de la base et efface le cookie httpOnly
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
- **RM-03 — Logout révoque le refresh token :** `POST /auth/logout` supprime le refresh token de la base + efface le cookie httpOnly. Le client purge aussi le access token en mémoire.
- **RM-04 — Suppression d'utilisateur = soft delete :** `isActive = false`. Un utilisateur désactivé ne peut plus se connecter (`401` + `"Account disabled"`).
- **RM-05 — Suppression de rôle bloquée si assigné :** `409 Conflict` si au moins un utilisateur possède ce rôle.
- **RM-06 — Modification des permissions = remplacement complet :** `PUT /roles/{id}/permissions` = delete-and-insert en transaction.
- **RM-07 — Admin uniquement pour CRUD users/roles/permissions :** Permission `users:write`, `roles:write`, `permissions:write`.
- **RM-08 — Nomenclature permissions :** Format `<ressource>:<action>`. Vérification sur le nom.
- **RM-09 — Seed obligatoire :** Rôle `Admin` + toutes permissions P1 + `admin@ark.io`.
- **RM-10 — Refresh Token (v0.7) :**
  - Access token JWT : 15 minutes (header Authorization)
  - Refresh token opaque : 7 jours (cookie httpOnly, path=/auth)
  - Rotation : nouveau refresh token généré à chaque usage de `/auth/refresh`
  - Limite : 1 refresh token actif par utilisateur (nouveau login = invalide l'ancien)
  - Stockage : hash bcrypt du token en base (pas le token en clair)

---

## 5. Comportement Attendu par Cas d'Usage

**Nominal :**
- `POST /auth/login` credentials valides + `isActive = true` → `200` avec `{ accessToken, user }` + cookie `refresh_token` httpOnly
- `GET /auth/me` token valide → `200` profil utilisateur
- `POST /auth/refresh` avec cookie valide → `200` nouveau `{ accessToken, user }` + nouveau cookie rotaté
- Admin `POST /users` → `201` mot de passe hashé en base
- Admin `PUT /roles/{id}/permissions` → `200` nouvelles permissions (anciennes supprimées)
- Intercepteur 401 → appel automatique `/auth/refresh` → retry requête originale avec nouveau token

**Erreurs :**
- `POST /auth/login` email inconnu → `401` + `"Invalid credentials"` (ne pas distinguer email/password)
- `POST /auth/login` `isActive = false` → `401` + `"Account disabled"`
- Route protégée sans token → `401`
- Route protégée token expiré → Intercepteur tente refresh automatique
- `POST /auth/refresh` refresh token invalide/expiré → `401` + redirect `/login?reason=session_expired`
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

**Intercepteur Axios 401/403 (avec Refresh Token) :**

```typescript
// frontend/src/api/client.ts — compléter le fichier existant
// L'intercepteur gère maintenant automatiquement le refresh des tokens

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ne pas intercepter les erreurs de login/refresh
    if (error.config?.url === '/auth/login' || error.config?.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    // 401 → tentative de refresh automatique
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Attendre que le refresh en cours termine
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResult = await refreshToken(); // POST /auth/refresh
        
        if (refreshResult.success) {
          setAuth(refreshResult.data.accessToken, refreshResult.data.user);
          // Notifier tous les subscribers
          refreshSubscribers.forEach(cb => cb(refreshResult.data.accessToken));
          refreshSubscribers = [];
          
          originalRequest.headers.Authorization = `Bearer ${refreshResult.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh échoué → déconnexion
        clearAuth();
        window.location.href = '/login?reason=session_expired';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/401';
    }
    if (error.response?.status === 403) {
      window.location.href = '/403';
    }
    return Promise.reject(error);
  }
);
```

**Configuration Axios (withCredentials) :**
```typescript
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true,  // ← Important pour envoyer/recevoir cookies httpOnly
});
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

---

## Annexe : User Scenarios (Gherkin)

> Cette section contient les scénarios utilisateur détaillés pour la génération des tests Cypress.

### Feature: Authentication

```gherkin
Feature: Authentication
  As a user of the ARK platform
  I want to log in with my email and password
  So that I can access the application securely

  Background:
    Given the user "admin@ark.io" exists with role "Admin" and is active

  #
  # ── NOMINAL PATHS ────────────────────────────────────────────────────────────
  #

  Scenario: Successful login redirects to home
    Given I am on the "/login" page
    When I fill in the email field with "admin@ark.io"
    And I fill in the password field with a valid password
    And I click "Sign in"
    Then I am redirected to "/"
    And the JWT token is stored in memory
    And no token is stored in localStorage or sessionStorage

  Scenario: Login page is accessible without authentication
    Given I am not logged in
    When I navigate to "/login"
    Then I see the login form
    And I am not redirected to "/401"

  Scenario: Authenticated user is redirected away from login page
    Given I am logged in
    When I navigate to "/login"
    Then I am redirected to "/"

  Scenario: Auth/me returns the current user profile
    Given I am logged in as "admin@ark.io"
    When the application calls "GET /auth/me"
    Then the response contains the user's email, firstName, lastName, role, and isActive
    And the response does not contain "passwordHash"

  Scenario: Logout clears the session
    Given I am logged in
    When I click the logout button in the Sidebar
    Then "POST /auth/logout" is called
    And the JWT token is purged from memory
    And I am redirected to "/login"

  Scenario: Navigating to a protected route after logout redirects to /login
    Given I have just logged out
    When I navigate to "/"
    Then I am redirected to "/login"
    And the JWT token is not present in memory

  Scenario: Expired JWT token redirects to /login with session_expired reason
    Given I am logged in with a token that has expired
    When the application makes an authenticated API call
    Then the interceptor purges the token from memory
    And I am redirected to "/login?reason=session_expired"
    And the token is no longer present in memory

  Scenario: /login page displays session expired message when reason=session_expired
    Given I navigate to "/login?reason=session_expired"
    Then I see the login form
    And I see a warning message "Votre session a expiré. Veuillez vous reconnecter."

  #
  # ── ERROR PATHS ──────────────────────────────────────────────────────────────
  #

  Scenario: Login with an unknown email shows an inline error
    Given I am on the "/login" page
    When I fill in the email field with "unknown@ark.io"
    And I fill in the password field with "anyPassword"
    And I click "Sign in"
    Then I see an inline error "Invalid email or password"
    And I remain on the "/login" page
    And I am not redirected to "/401"

  Scenario: Login with a wrong password shows an inline error
    Given I am on the "/login" page
    When I fill in the email field with "admin@ark.io"
    And I fill in the password field with "wrongPassword"
    And I click "Sign in"
    Then I see an inline error "Invalid email or password"
    And I remain on the "/login" page
    And I am not redirected to "/401"

  Scenario: Login with a disabled account shows an inline error
    Given the user "disabled@ark.io" exists with isActive set to false
    When I fill in the email field with "disabled@ark.io"
    And I fill in the password field with a valid password
    And I click "Sign in"
    Then I see an inline error "Account disabled"
    And I remain on the "/login" page

  Scenario: Login with an empty email shows a validation error
    Given I am on the "/login" page
    When I leave the email field empty
    And I fill in the password field with "anyPassword"
    And I click "Sign in"
    Then I see a validation error "Email is required" below the email field
    And the form is not submitted

  Scenario: Login with an empty password shows a validation error
    Given I am on the "/login" page
    When I fill in the email field with "admin@ark.io"
    And I leave the password field empty
    And I click "Sign in"
    Then I see a validation error "Password is required" below the password field
    And the form is not submitted
```

### Feature: Session Expiry & Access Control Pages

```gherkin
Feature: Session Expiry & Access Control Pages
  As a user of the ARK platform
  I want to be clearly informed when my session has expired or when I lack access
  So that I can take the appropriate action without confusion

  #
  # ── UNAUTHORIZED PAGE (401) ──────────────────────────────────────────────────
  #

  Scenario: Unauthenticated user accessing a protected route is redirected to /401
    Given I am not logged in
    When I navigate to "/domains"
    Then I am redirected to "/401"
    And the page title reads "Session expirée"
    And a "Se connecter" button is visible

  Scenario: UnauthorizedPage redirects to login
    Given I am on the "/401" page
    When I click "Se connecter"
    Then I am redirected to "/login"

  Scenario: Expired token triggers redirect to /401
    Given I am logged in with a token that has expired
    When the application makes an authenticated API call
    Then the interceptor purges the token from memory
    And I am redirected to "/401"
    And the token is no longer present in memory

  Scenario: /401 page is accessible without authentication
    Given I am not logged in
    When I navigate to "/401"
    Then I see the UnauthorizedPage
    And I am not redirected further

  #
  # ── FORBIDDEN PAGE (403) ─────────────────────────────────────────────────────
  #

  Scenario: Authenticated user without permission is redirected to /403
    Given I am logged in as a user without "domains:write" permission
    When I navigate directly to "/domains/new"
    Then I am redirected to "/403"
    And the page title reads "Accès refusé"
    And a "Retour à l'accueil" button is visible

  Scenario: ForbiddenPage redirects to home
    Given I am on the "/403" page
    When I click "Retour à l'accueil"
    Then I am redirected to "/"

  Scenario: API 403 response triggers redirect to /403
    Given I am logged in as a user without "users:write" permission
    When the application receives a 403 response from the API
    Then I am redirected to "/403"

  Scenario: /403 page is accessible without authentication
    Given I am not logged in
    When I navigate to "/403"
    Then I see the ForbiddenPage
    And I am not redirected to "/401"
```

### Feature: User Management

```gherkin
Feature: User Management
  As an Administrator
  I want to manage users of the ARK platform
  So that I can control who has access and with which role

  Background:
    Given I am logged in as an Administrator with "users:write" permission
    And I am on the "/users" page

  #
  # ── NOMINAL PATHS ────────────────────────────────────────────────────────────
  #

  Scenario: View the users list
    Then I see a table listing all existing users
    And each row displays the user's email, first name, last name, role, and active status
    And an "Add User" button is visible in the page header

  Scenario: View an empty users list
    Given no user other than myself has been created
    Then I see the users list with only my own account

  Scenario: Create a new user
    When I click "Add User"
    Then I am redirected to "/users/new"
    When I fill in the email field with "newuser@ark.io"
    And I fill in the password field with "SecurePass1!"
    And I fill in the first name with "Alice"
    And I fill in the last name with "Martin"
    And I select the role "Architect"
    And I click "Save"
    Then I see a success snackbar "User created successfully"
    And I am redirected to "/users"
    And "newuser@ark.io" appears in the users list

  Scenario: Create a user without optional fields
    When I click "Add User"
    And I fill in the email field with "minimal@ark.io"
    And I fill in the password field with "SecurePass1!"
    And I click "Save"
    Then I see a success snackbar "User created successfully"
    And "minimal@ark.io" appears in the users list

  Scenario: Edit an existing user
    Given the user "alice@ark.io" exists
    When I click the edit icon on the "alice@ark.io" row
    Then I am redirected to "/users/<id>/edit"
    And the email field is pre-filled with "alice@ark.io"
    When I update the first name to "Alicia"
    And I click "Save"
    Then I see a success snackbar "User updated successfully"
    And I am redirected to "/users"
    And the first name "Alicia" is displayed in the users list

  Scenario: Deactivate a user
    Given the user "alice@ark.io" is active
    When I click the deactivate icon on the "alice@ark.io" row
    Then a confirmation dialog appears with the message "Are you sure you want to deactivate 'alice@ark.io'?"
    When I click "Deactivate" in the dialog
    Then I see a success snackbar "User deactivated successfully"
    And the status badge for "alice@ark.io" displays "Inactive"
    And the row is visually dimmed

  Scenario: Reactivate a user
    Given the user "alice@ark.io" is inactive
    When I click the activate icon on the "alice@ark.io" row
    Then I see a success snackbar "User activated successfully"
    And the status badge for "alice@ark.io" displays "Active"

  Scenario: Assign a role to a user
    Given the user "bob@ark.io" has no role assigned
    When I click the edit icon on the "bob@ark.io" row
    And I select the role "Business Owner"
    And I click "Save"
    Then I see a success snackbar "User updated successfully"
    And "Business Owner" is displayed in the role column for "bob@ark.io"

  #
  # ── ERROR PATHS ──────────────────────────────────────────────────────────────
  #

  Scenario: Attempt to create a user with a duplicate email
    Given the user "alice@ark.io" already exists
    When I click "Add User"
    And I fill in the email field with "alice@ark.io"
    And I fill in the password field with "SecurePass1!"
    And I click "Save"
    Then I see an inline error "This email is already in use"
    And I remain on the "/users/new" page
    And no duplicate user is created

  Scenario: Attempt to create a user with an invalid email format
    When I click "Add User"
    And I fill in the email field with "not-an-email"
    And I fill in the password field with "SecurePass1!"
    And I click "Save"
    Then I see a validation error "Invalid email format" below the email field
    And the form is not submitted

  Scenario: Attempt to create a user with a password shorter than 8 characters
    When I click "Add User"
    And I fill in the email field with "short@ark.io"
    And I fill in the password field with "short"
    And I click "Save"
    Then I see a validation error "Password must be at least 8 characters" below the password field
    And the form is not submitted

  Scenario: Access the edit page for a non-existent user
    When I navigate directly to "/users/non-existent-uuid/edit"
    Then I am redirected to "/users"

  #
  # ── ACCESS CONTROL PATHS ─────────────────────────────────────────────────────
  #

  Scenario: Non-admin user cannot access the users list
    Given I am logged in as a user without "users:write" permission
    When I navigate directly to "/users"
    Then I am redirected to "/403"

  Scenario: Non-admin user cannot access the user creation page
    Given I am logged in as a user without "users:write" permission
    When I navigate directly to "/users/new"
    Then I am redirected to "/403"
```

### Feature: Role & Permission Management

```gherkin
Feature: Role & Permission Management
  As an Administrator
  I want to manage roles and their associated permissions
  So that I can control what each type of user can do in ARK

  Background:
    Given I am logged in as an Administrator with "roles:write" permission
    And I am on the "/roles" page

  #
  # ── NOMINAL PATHS ────────────────────────────────────────────────────────────
  #

  Scenario: View the roles list
    Then I see a table listing all existing roles
    And each row displays the role name, description, and the number of associated permissions
    And an "Add Role" button is visible in the page header

  Scenario: View an empty roles list
    Given no custom role has been created
    Then I see the seeded roles ("Admin", "Architect", etc.) in the list

  Scenario: Create a new role
    When I click "Add Role"
    And I fill in the name field with "Read Only"
    And I fill in the description field with "Can only view data"
    And I click "Save"
    Then I see a success snackbar "Role created successfully"
    And "Read Only" appears in the roles list

  Scenario: Edit a role's permissions
    Given the role "Architect" exists
    When I click the edit icon on the "Architect" row
    Then I am redirected to "/roles/<id>/edit"
    And the current permissions for "Architect" are pre-selected
    When I add the permission "providers:write"
    And I click "Save"
    Then I see a success snackbar "Role updated successfully"
    And "providers:write" is included in "Architect"'s permissions

  Scenario: Remove a permission from a role
    Given the role "Architect" has the permission "providers:write"
    When I click the edit icon on the "Architect" row
    And I deselect the permission "providers:write"
    And I click "Save"
    Then I see a success snackbar "Role updated successfully"
    And "providers:write" is no longer listed for "Architect"

  Scenario: Delete a role with no assigned users
    Given the role "Obsolete Role" exists and has no users assigned
    When I click the delete icon on the "Obsolete Role" row
    Then a confirmation dialog appears with the message "Are you sure you want to delete the role 'Obsolete Role'?"
    When I click "Delete" in the dialog
    Then I see a success snackbar "Role deleted successfully"
    And "Obsolete Role" no longer appears in the list

  Scenario: Cancel a role deletion
    Given the role "Architect" exists
    When I click the delete icon on the "Architect" row
    And a confirmation dialog appears
    When I click "Cancel" in the dialog
    Then the dialog closes
    And "Architect" remains in the roles list

  #
  # ── ERROR PATHS ──────────────────────────────────────────────────────────────
  #

  Scenario: Attempt to create a role with a duplicate name
    Given the role "Admin" already exists
    When I click "Add Role"
    And I fill in the name field with "Admin"
    And I click "Save"
    Then I see an inline error "This role name is already in use"
    And I remain on the "/roles/new" page
    And no duplicate role is created

  Scenario: Attempt to create a role with an empty name
    When I click "Add Role"
    And I leave the name field empty
    And I click "Save"
    Then I see a validation error "Name is required" below the name field
    And the form is not submitted

  Scenario: Attempt to delete a role assigned to users
    Given the role "Architect" is assigned to 2 users
    When I click the delete icon on the "Architect" row
    And I confirm the deletion in the dialog
    Then I see an error message "This role is assigned to 2 user(s) and cannot be deleted"
    And the role "Architect" remains in the list

  #
  # ── ACCESS CONTROL PATHS ─────────────────────────────────────────────────────
  #

  Scenario: Non-admin user cannot access the roles list
    Given I am logged in as a user without "roles:write" permission
    When I navigate directly to "/roles"
    Then I am redirected to "/403"
```

### Feature: PrivateRoute Guard

```gherkin
Feature: PrivateRoute Guard
  As the ARK frontend application
  I want to protect routes based on authentication and permissions
  So that unauthenticated or unauthorized users cannot access restricted pages

  Scenario: Unauthenticated user is redirected to /401
    Given the user has no JWT token in memory
    When the user navigates to any protected route (e.g. "/domains")
    Then they are redirected to "/401"
    And the protected page content is never rendered

  Scenario: Authenticated user without required permission is redirected to /403
    Given the user has a valid JWT token in memory
    And the user does not have the "users:write" permission
    When the user navigates to "/users"
    Then they are redirected to "/403"
    And the users list is never rendered

  Scenario: Authenticated user with required permission can access the route
    Given the user has a valid JWT token in memory
    And the user has the "users:write" permission
    When the user navigates to "/users"
    Then the users list page is rendered

  Scenario: Route with no permission requirement only checks authentication
    Given the user has a valid JWT token in memory
    When the user navigates to "/domains"
    Then the domains list page is rendered regardless of specific permissions
```

---

_Document de travail — Projet ARK_
