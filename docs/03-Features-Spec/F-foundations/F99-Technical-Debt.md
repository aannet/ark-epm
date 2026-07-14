# ARK — Feature Spec F-999 : Technical Debt & Conventions Transverses

_Version 0.9 — Avril 2026_

> **Changelog v0.9 :** Ajout Item 25 — Escalade de privilèges : endpoints write Tags sans décorateur `@RequirePermissions`. Identifié par revue de sécurité automatisée (2026-04-29). Vulnérabilité confirmée, priorité haute.

> **Changelog v0.8 :** Ajout Item 24 — Contrôle dépendances Interfaces avant suppression d'Application. Amendment FS-06-BACK requis après FS-08-BACK `done` : `ApplicationsService.remove()` doit vérifier `_count.sourceInterfaces + _count.targetInterfaces` et lever `DEPENDENCY_CONFLICT` si > 0. Identifié lors de la rédaction FS-08-BACK (Sprint 4).
>
> **Changelog v0.7 :** Ajout Items 17-21 — Breadcrumbs systématisés (PNS-11, docs/02-Design/02-Navigation-Patterns.md v0.4) + dette technique Sprint 3 : filtres Providers, breadcrumbs Applications/Domains/Providers harmonisés, composant AppBreadcrumbs recommandé. Guidelines design mises à jour : DatePicker MUI, badge conditionnel, ExpiryDateBadge, ProviderRoleBadge, AppBreadcrumbs documentés.
>
> **Changelog v0.5 :** Ajout Item 11 — Description Markdown pour Applications (différé P2). Drawer Applications confirmé read-only (exception PNS-02).
>
> **Changelog v0.4 :** Ajout §6 — Historique des revues de sprint. Mémoire longitudinale de la dette technique, alimentée à partir des gates TD §11 de chaque Feature-Spec. Pré-rempli avec Sprint 1 (F-00, F-01, FS-01, F-999).
> - Item 1 : HttpExceptionFilter créé dans src/common/filters/
> - Item 2 : JWT TTL 15min, redirect /login?reason=session_expired, page login avec message
> - Item 3 : ThrottlerModule configuré (100 req/min global, 10 req/min auth)
> - Item 4 : PaginationQueryDto créé dans src/common/dto/
> - Item 9 : API prefix /api/v1 configuré dans main.ts
> - Item 10 : RequestIdMiddleware créé, header X-Request-ID sur toutes les réponses
> AGENTS.md mis à jour avec les nouvelles conventions.

_Version 0.1 — Mars 2026_

> **Usage :** Ce document est la référence vivante des décisions techniques transverses qui ne sont pas portées par une feature métier. Il est distinct de AGENTS.md (qui décrit les conventions de code et les patterns d'implémentation) : F-999 docte les **décisions d'architecture** et les **contrats techniques globaux** — le "pourquoi" et le "quoi", pas le "comment coder".
>
> **Mode :**  Chaque item doit être implémenté manuellement et validé par une gate dédiée avant d'être marqué `done`.
>
> **Lecture recommandée :** avant de rédiger toute nouvelle Feature-Spec (FS-XX). Les conventions de ce document s'imposent à toutes les features.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | F-999 |
| **Titre** | Technical Debt & Conventions Transverses |
| **Priorité** | P1 (items 1–5, 8, 10, 12, 13, 14, 15, 23, 24) / P2 (items 6–7, 9, 11, 16, 17–22) |
| **Statut** | `done` (items 1, 2, 3, 4, 9, 10, 12, 12b, 15) / `in-progress` (items 13, 14) / `pending` (items 5, 8, 23, **24**) / `documented` (items 17–22, FS-11) |
| **Estimé** | 1 jour (items P1 core) + 3 jours (items 12-14 debt) + 2 jours (items 17-22 Sprint 3) + 0.5j (item 23 sécurité) + 0.5j (item 24 amendment FS-06) |
| **Version** | 0.8 |

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette feature fait :**

F-999 établit les conventions techniques transverses qui s'appliquent à l'ensemble du projet ARK, indépendamment de toute feature métier. Elle documente les décisions qui — si elles ne sont pas prises explicitement avant Sprint 2 — seront réinventées différemment par OpenCode à chaque nouvelle feature, créant une dette impossible à résorber sans refactoring global. Analogie : c'est le règlement de copropriété de l'immeuble — chaque locataire (feature) doit le respecter, mais personne ne le réécrit à chaque emménagement.

**Ce qu'elle ne fait pas (hors périmètre) :**

- Pas de code métier — aucune route, aucun composant UI, aucun modèle Prisma
- Ne remplace pas AGENTS.md pour les conventions de code (patterns NestJS, structure fichiers, etc.)
- Ne couvre pas la configuration de l'environnement (voir F-00)
- Items P2 (6–7) : documentés ici pour traçabilité, implémentation différée

---

## 2. Registre des décisions

> Chaque item = une décision transverse. Format : **contexte → décision → conséquences → statut**.
> Ajouter de nouveaux items en bas de cette section au fil du projet.

---

### Item 1 — Format d'erreur API normalisé

| | |
|---|---|
| **Statut** | ✅ Implémenté — P1 |
| **Priorité** | Critique — bloque la cohérence frontend |
| **Gate de validation** | Toutes les routes existantes (FS-01, FS-02) retournent ce format |

**Contexte :**
Sans format d'erreur unifié, chaque module NestJS génère ses propres structures (`{ message }`, `{ error }`, `{ detail }`...). Le frontend doit alors gérer N cas particuliers, et OpenCode reproduit l'incohérence à chaque nouvelle feature.

**Décision :**
Toutes les erreurs API ARK respectent le contrat suivant, sans exception :

```json
{
  "statusCode": 404,
  "code": "DOMAIN_NOT_FOUND",
  "message": "Le domaine demandé n'existe pas.",
  "timestamp": "2026-03-03T10:00:00Z",
  "path": "/api/domains/uuid-inexistant"
}
```

| Champ | Obligatoire | Description |
|---|---|---|
| `statusCode` | ✅ | Code HTTP (400, 401, 403, 404, 409, 422, 500) |
| `code` | ✅ | Code sémantique en SCREAMING_SNAKE_CASE — identifie l'erreur précisément |
| `message` | ✅ | Message lisible par un humain, en français |
| `timestamp` | ✅ | ISO 8601 UTC |
| `path` | ✅ | Route appelée |

**Codes d'erreur standards ARK :**

| Code | HTTP | Situation |
|---|---|---|
| `VALIDATION_ERROR` | 422 | DTO invalide (class-validator) |
| `UNAUTHORIZED` | 401 | Token absent ou expiré |
| `FORBIDDEN` | 403 | Permission insuffisante |
| `NOT_FOUND` | 404 | Ressource introuvable — suffixer par le nom de l'entité : `DOMAIN_NOT_FOUND`, `APPLICATION_NOT_FOUND`, etc. |
| `CONFLICT` | 409 | Contrainte d'unicité violée — ex: nom dupliqué |
| `DEPENDENCY_CONFLICT` | 409 | Suppression impossible car référencé par d'autres entités |
| `INTERNAL_ERROR` | 500 | Erreur non anticipée |

**Implémentation :**
Créer un `HttpExceptionFilter` global dans `backend/src/common/filters/http-exception.filter.ts` et l'enregistrer dans `main.ts` via `app.useGlobalFilters()`. Ce filtre intercepte toutes les exceptions NestJS et les transforme au format ci-dessus.

```typescript
// backend/src/common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const responseBody = typeof exceptionResponse === 'object' ? exceptionResponse : {};
    const code = (responseBody as Record<string, unknown>)['code'] as string || this.getDefaultCode(status);

    response.status(status).json({
      statusCode: status,
      code,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getDefaultCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      500: 'INTERNAL_ERROR',
    };
    return codes[status] || 'INTERNAL_ERROR';
  }
}
```

> ⚠️ **À injecter dans le bloc contexte OpenCode de chaque session :** "Toutes les erreurs retournent le format `{ statusCode, code, message, timestamp, path }` via le `HttpExceptionFilter` global. Ne pas créer de format d'erreur personnalisé."

---

### Item 2 — Durée et stratégie JWT

| | |
|---|---|
| **Statut** | ✅ Implémenté — P1 |
| **Priorité** | Critique — décision UX/sécurité non documentée |
| **Gate de validation** | Comportement de déconnexion automatique testé manuellement |

**Contexte :**
La décision de stocker les JWT en mémoire (protection XSS) est prise dans FS-01, mais la durée d'expiration et la stratégie de refresh ne sont pas formalisées. Sans refresh token, les utilisateurs sont déconnectés silencieusement à l'expiration.

**Décision :**

| Paramètre | Valeur | Justification |
|---|---|---|
| Access token TTL | **15 minutes** | Compromis sécurité/UX pour usage interne PME |
| Refresh token | **Absent en P1** | Complexité non justifiée pour 5 utilisateurs |
| Comportement à expiration | Redirection vers `/login` avec message i18n `auth.session.expired` | UX explicite plutôt que 401 silencieux |
| Stockage refresh (P2) | httpOnly cookie (si implémenté) | Cohérent avec la stratégie anti-XSS |

**Conséquence assumée :** un utilisateur qui laisse l'app inactive 15 minutes doit se reconnecter. Ce trade-off est documenté et acceptable pour le MVP on-premise.

> **À revoir en P2** si le retour terrain montre que la durée est trop courte — envisager 60 minutes ou implémenter un refresh token silencieux.

**Implémentation frontend :**
Intercepteur Axios dans `frontend/src/api/client.ts` — sur réception d'un 401, vider le token mémoire et rediriger vers `/login?reason=session_expired`.

---

### Item 3 — Rate limiting

| | |
|---|---|
| **Statut** | ✅ Implémenté — P1 |
| **Priorité** | Haute — route d'upload et routes auth exposées |
| **Gate de validation** | `POST /api/auth/login` limité à 10 req/min par IP |

**Contexte :**
Sans rate limiting, les routes d'authentification et d'upload (FS-10) sont vulnérables au brute-force et aux abus. `@nestjs/throttler` est une dépendance légère, impossible à ajouter proprement après coup sans risque de régression sur les tests existants.

**Décision :**
Installer `@nestjs/throttler` et configurer des limites globales avec surcharge par route sensible.

```bash
npm install @nestjs/throttler
```

**Configuration :**

```typescript
// backend/src/app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000,   // fenêtre de 60 secondes
  limit: 100,   // 100 requêtes/min par défaut (usage normal)
}])
```

**Surcharges par route :**

| Route | Limite | Justification |
|---|---|---|
| `POST /api/auth/login` | 10 req/min/IP | Anti brute-force |
| `POST /api/auth/register` | 5 req/min/IP | Anti spam |
| `POST /api/import/excel` | 3 req/min/user | Upload lourd |
| Toutes les autres | 100 req/min (défaut) | Usage normal |

> ⚠️ Décorer les routes à limiter avec `@Throttle({ default: { limit: 10, ttl: 60000 } })`.

---

### Item 4 — Convention de pagination et tri des listes

| | |
|---|---|
| **Statut** | ✅ Implémenté — P1 |
| **Priorité** | Haute — s'applique à toutes les routes de liste (FS-02 à FS-11) |
| **Gate de validation** | FS-02 (Domains) implémente ce contrat — sert de référence |

**Contexte :**
Si la pagination n'est pas standardisée avant Sprint 2, OpenCode génère des patterns différents (certains avec `page/limit`, d'autres avec `offset/take`, d'autres sans pagination du tout). Le frontend doit alors maintenir N logiques de liste.

**Décision :**
Toutes les routes de liste ARK utilisent le contrat suivant :

**Query params standard :**

| Param | Type | Défaut | Description |
|---|---|---|---|
| `page` | integer | 1 | Numéro de page (base 1) |
| `limit` | integer | 20 | Taille de page (max 100) |
| `sortBy` | string | `createdAt` | Champ de tri |
| `sortOrder` | `asc` \| `desc` | `desc` | Direction |
| `search` | string | — | Recherche textuelle libre (optionnel par entité) |

**Format de réponse standard :**

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

**Implémentation :**
Créer un DTO générique `PaginationQueryDto` dans `backend/src/common/dto/pagination-query.dto.ts` avec `class-validator`. Chaque service de liste étend ce DTO.

```typescript
// backend/src/common/dto/pagination-query.dto.ts
export class PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 20;

  @IsOptional() @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional() @IsString()
  search?: string;
}
```

> ⚠️ **À injecter dans le bloc contexte OpenCode :** "Toutes les routes de liste utilisent `PaginationQueryDto` (`src/common/dto/pagination-query.dto.ts`) et retournent `{ data: [...], meta: { page, limit, total, totalPages } }`."

---

### Item 5 — Politique de suppression (soft delete vs hard delete)

| | |
|---|---|
| **Statut** | 🔴 À décider et implémenter — P1 |
| **Priorité** | Haute — FK orphelines possibles dès Sprint 2 |
| **Gate de validation** | Suppression d'un Domain référencé par une Application retourne `409 DEPENDENCY_CONFLICT` |

**Contexte :**
Le schéma SQL actuel ne comporte pas de colonne `deleted_at`. Supprimer une Application référencée par 20 interfaces crée des FK orphelines ou des erreurs de contrainte non gérées. La politique doit être décidée entité par entité, pas globalement.

**Décision par entité :**

| Entité | Politique | Justification |
|---|---|---|
| `domains` | ❌ **Blocage** si des applications y sont rattachées | Un domaine vide peut être supprimé |
| `providers` | ❌ **Blocage** si des applications y font référence | Intégrité contrat fournisseur |
| `applications` | ❌ **Blocage** si des interfaces source/cible existent | Cœur du patrimoine — jamais silencieux |
| `business_capabilities` | ❌ **Blocage** si des enfants ou applications mappées existent | Hiérarchie récursive — risque élevé |
| `interfaces` | ✅ **Hard delete** autorisé | Relation simple, pas de dépendances en aval |
| `data_objects` | ❌ **Blocage** si des applications sont mappées | Traçabilité des flux de données — rupture de lineage |
| `it_components` | ❌ **Blocage** si des applications sont mappées | Impact sur la cartographie d'infrastructure |
| `users` | 🟡 **Soft delete** (`is_active = false`) | Préserver l'audit trail — `changed_by` doit rester résolvable |

> **Pas de soft delete généralisé en P1** : la colonne `deleted_at` n'est pas ajoutée au schéma global. Les suppressions bloquées retournent `409 DEPENDENCY_CONFLICT` avec un message explicite indiquant le nombre de dépendances. Le soft delete est réservé à `users` via le champ `is_active` existant.

**Pattern de vérification avant suppression (service NestJS) :**

```typescript
// Exemple pour domains
async remove(id: string): Promise<void> {
  const count = await this.prisma.application.count({ where: { domainId: id } });
  if (count > 0) {
    throw new ConflictException({
      code: 'DEPENDENCY_CONFLICT',
      message: `Ce domaine est référencé par ${count} application(s) et ne peut pas être supprimé.`,
    });
  }
  await this.prisma.domain.delete({ where: { id } });
}
```

> ⚠️ **À injecter dans le bloc contexte OpenCode :** "Avant toute suppression, vérifier les dépendances et lever `ConflictException` avec `code: 'DEPENDENCY_CONFLICT'` si des entités référencent la ressource. Voir la politique complète dans F-999 §Item 5."

---

### Item 6 — Healthcheck endpoint *(P2)*

| | |
|---|---|
| **Statut** | 🟡 Documenté — implémentation P2 |
| **Priorité** | Faible — utile pour les équipes IT on-premise |

**Décision :**
Exposer `GET /api/v1/health` (non authentifié) retournant :
```json
{ "status": "ok", "db": "ok", "timestamp": "..." }
```
Utiliser `@nestjs/terminus`. À implémenter au démarrage de P2 avec le déploiement production.

---

### Item 8 — Sécurité des requêtes raw Prisma

| | |
|---|---|
| **Statut** | 🔴 À documenter — P1 |
| **Priorité** | Haute — concerne FS-07 (WITH RECURSIVE) et le middleware audit |
| **Gate de validation** | Revue manuelle de toutes les occurrences `$queryRaw` / `$executeRaw` avant merge |

**Contexte :**
Prisma paramétrise automatiquement toutes les requêtes générées (`.findMany()`, `.create()`, etc.) — pas de risque d'injection SQL sur les CRUD standards. En revanche, `$queryRaw` et `$executeRaw` contournent cette protection si un paramètre utilisateur est interpolé par concaténation de string plutôt que via le tagged template `Prisma.sql`.

ARK utilise ces deux méthodes dans deux endroits critiques :
- Le middleware d'audit (`SET LOCAL ark.current_user_id = ${userId}`)
- La requête `WITH RECURSIVE` de FS-07 (Business Capabilities)

**Décision :**
Règle absolue — **toute variable interpolée dans un `$queryRaw` ou `$executeRaw` passe par le tagged template Prisma**, jamais par concaténation.

```typescript
// ✅ Correct — Prisma paramétrise automatiquement userId
await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;

// ✅ Correct — paramètres isolés
const results = await prisma.$queryRaw`
  SELECT * FROM applications WHERE domain_id = ${domainId}
`;

// ❌ Interdit — injection SQL possible
const results = await prisma.$queryRaw(
  Prisma.raw(`SELECT * FROM applications WHERE domain_id = '${domainId}'`)
);

// ❌ Interdit — concaténation de string
await prisma.$executeRaw(Prisma.raw(`SET LOCAL ark.current_user_id = '${userId}'`));
```

**Scope des occurrences à surveiller :**

| Fichier | Usage | Risque |
|---|---|---|
| `common/middleware/audit-context.middleware.ts` | `$executeRaw SET LOCAL` | ✅ Déjà sécurisé si tagged template |
| `business-capabilities/business-capabilities.service.ts` | `$queryRaw WITH RECURSIVE` | ⚠️ À vérifier lors de l'implémentation FS-07 |
| Tout futur `$queryRaw` / `$executeRaw` | — | ⚠️ Revue obligatoire |

> ⚠️ **Règle de code review :** toute PR contenant `$queryRaw` ou `$executeRaw` doit être relue manuellement ligne par ligne — OpenCode ne garantit pas l'usage correct du tagged template. Classé dans "Ce qu'il ne faut jamais déléguer" du Plan Sprint.

> **Note :** `dangerouslySetInnerHTML` est également interdit dans tous les composants React ARK — aucune raison métier ne justifie son usage, et React échappe nativement tout ce qui passe par JSX `{value}`.

---

### Item 9 — API Versioning *(P1)*

| | |
|---|---|
| **Statut** | ✅ Implémenté — P1 |
| **Priorité** | Faible — utile si le projet évolue au-delà du MVP |

**Contexte :**
Si l'API publique évolue (changement de structure de réponse, dépréciation de champs), sans versionnement, les clients existants cassent. Pour un MVP on-premise à 5 utilisateurs, c'est prématuré — mais la règle doit être posée.

**Décision :**

| Stratégie | Mise en œuvre |
|---|---|
| Version dans l'URL | `GET /api/v1/domains` |
| Version par défaut | v1 — aucune route sans version dans le chemin |
| Dépréciation | Ajouter header `Deprecation: true` + `Sunset: <date>` lors du passage à v2 |

**Implémentation future :**
- Prefix global dans `main.ts` : `app.setGlobalPrefix('api/v1')`
- Documentation OpenAPI générée avec version dans le titre

---

### Item 10 — Request ID / Correlation ID

| | |
|---|---|
| **Statut** | ✅ Implémenté — P1 |
| **Priorité** | Haute — debugging production indispensable |
| **Gate de validation** | Logs et responses contiennent un `requestId` cohérent |

**Contexte :**
En production, corréler les logs backend avec les erreurs rapportées par le frontend est impossible sans identifiant commun. Le pattern standard est un `X-Request-ID` généré par le premier service (frontend ou gateway) et propagé tout au long de la chaîne.

**Décision :**

| Action | Implémentation |
|---|---|
| Génération | Si absent, générer un UUID v4 au niveau du middleware NestJS |
| Propagation | Logger et response header `X-Request-ID` |
| Frontend | Ajouter `X-Request-ID` à chaque requête Axios |

**Implémentation :**

```typescript
// backend/src/common/middleware/request-id.middleware.ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  }
}
```

> ⚠️ **À injecter dans le bloc contexte OpenCode :** "Tout endpoint ARK retourne le header `X-Request-ID`. Logger ce même ID pour chaque requête."

---

### Item 7 — CORS *(P2)*

| | |
|---|---|
| **Statut** | 🟡 Documenté — à vérifier avant déploiement production |
| **Priorité** | Faible — on-premise avec frontend et backend co-localisés |

**Décision :**
En développement local, CORS permissif (`*`). En production on-premise, restreindre à l'origin du frontend déployé via variable d'environnement `CORS_ORIGIN`. À configurer dans `main.ts` avant la mise en production P1.

---

### Item 11 — Description Markdown pour Applications *(P2)*

| | |
|---|---|
| **Statut** | 🟡 Documenté — implémentation différée P2 |
| **Priorité** | Moyenne — amélioration UX, pas bloquant P1 |

**Contexte :**
La spec PNS-09 définit que le champ `description` doit être rendu en Markdown avec éditeur simplifié. FS-06 (Applications) implémente actuellement le champ `description` en texte simple (v1.1), sans support Markdown. Cette feature doit être ajoutée en P2 pour uniformiser l'expérience avec Business Capabilities.

**Décision :**
- **P1 (FS-06 v1.1)** : Champ `description` en texte simple, textarea standard
- **P2** : Remplacer par éditeur Markdown simplifié (barre d'outils : gras, italique, liste, lien)
  - Rendu Markdown en mode lecture (fiche détail et drawer)
  - Éditeur avec preview side-by-side ou toggle édition/prévisualisation
  - Migration transparente : texte existant reste valide (Markdown interprète le texte simple comme du paragraphe)

**Références :**
- PNS-09 : Description Markdown
- FS-06-FRONT §4.3, §4.4 : Formulaire Applications (champ description actuellement texte simple)

**Implémentation P2 suggérée :**
```typescript
// frontend/src/components/shared/MarkdownEditor.tsx
// Basé sur react-markdown + react-textarea-autosize
// Props : value, onChange, preview?: boolean
```

---

### Item 12 — APIs Providers et Users mockées *(P1 — DONE)*

| | |
|---|---|
| **Statut** | ✅ Done — Providers ✅ + Users ✅ |
| **Priorité** | Haute — blocage UX sur formulaire Application |

**Contexte :**
FS-06-FRONT implémente les sélecteurs de Provider et Owner dans le formulaire Application (`ApplicationForm.tsx`). Les APIs `/providers` et `/users` (filtré `isActive=true`) sont désormais disponibles et le formulaire utilise des données réelles.

**Décision :**
- ✅ **Providers — RÉSOLU (2026-03-29)** 
  - FS-03-BACK fournit `GET /api/v1/providers` (endpoint liste pageiné, search, sort)
  - ApplicationNewPage et ApplicationEditPage maintenant appellent `useProviders({ limit: 200 })`
  - Sélecteur providers popuplé avec données réelles depuis la base
  - Commit: `2313983`
  
- ✅ **Users — RÉSOLU**
  - `MOCK_USERS = []` supprimé de `ApplicationNewPage.tsx` et `ApplicationEditPage.tsx`
  - Sélecteur owner alimenté via `useUsers()` + `GET /api/v1/users?isActive=true`
  - Fallback: owner actif/inactif conservé en mode édition pour préserver la valeur actuelle
  - Item 12b clos (voir section dédiée)

**Fichiers concernés :**
- `frontend/src/pages/applications/ApplicationNewPage.tsx`
- `frontend/src/pages/applications/ApplicationEditPage.tsx`
- `frontend/src/api/users.ts`
- `frontend/src/components/applications/ApplicationForm.tsx` (utilise les options passées en props)

**Gate de validation :**
- ✅ Providers : Formulaire Application affiche les sélecteurs providers peuplés avec données réelles — test avec création d'une app liée à un provider existant
- ✅ Users : Owner dropdown n'est plus vide (édition protège le propriétaire courant si inactif)

---

### Item 12b — API Users mockée *(P1 — Sprint 3)* — NOUVEAU

| | |
|---|---|
| **Statut** | ✅ Done — FS-06-FRONT livré |
| **Priorité** | Moyenne — sélecteur owner vide dans formulaire Application |

**Contexte :**
`MOCK_USERS = []` restait en dur dans `ApplicationNewPage.tsx` et `ApplicationEditPage.tsx` après la résolution partielle du Item 12, laissant le sélecteur owner vide côté UX.

**Décision :**
**Décision :**
- API utilisable : `GET /api/v1/users?isActive=true` (retour : `{ id, firstName, lastName, ... }`)
- Hook front `useUsers()` créé dans `frontend/src/api/users.ts` (pattern `useProviders`)
- Intégration dans `ApplicationNewPage.tsx` et `ApplicationEditPage.tsx`
- `MOCK_USERS` supprimé, options owner injectées depuis l'API
- En édition : le propriétaire courant est conservé même si inactif

**Fichiers modifiés :**
- `frontend/src/pages/applications/ApplicationNewPage.tsx`
- `frontend/src/pages/applications/ApplicationEditPage.tsx`
- `frontend/src/api/users.ts`

**Gate de validation :** Formulaire Application affiche le sélecteur owner peuplé avec les utilisateurs actifs et préserve le propriétaire courant — test avec assignation d'une app à un responsable existant.

**Liée à :** Item 12 (Providers — partial fix)

---

### Item 13 — Dimensions de tags hardcodées *(P1 — Sprint 3)*

| | |
|---|---|
| **Statut** | 🔴 En cours — attente API F-03 |
| **Priorité** | Haute — impact maintenance si dimensions modifiées |

**Contexte :**
Le composant `DimensionTagInput` est disponible (F-03), mais l'API qui liste les dimensions (`GET /tag-dimensions`) n'est pas encore exposée côté backend. Les dimensions Geography, Brand, LegalEntity sont hardcodées en dur dans le frontend FS-06.

**Décision :**
- Hardcoder les 3 dimensions de seed avec leurs IDs et couleurs :
  - `geography-dim` (#2196F3) — Geography
  - `brand-dim` (#9C27B0) — Brand  
  - `legal-dim` (#FF9800) — LegalEntity
- **Déblocage :** F-03-BACK (endpoint `/tag-dimensions`) + FS-03-FRONT (hook `useDimensions`)
- **Refactoring :** Centraliser dans un hook `useDimensions()` quand API disponible

**Fichiers concernés :**
```
frontend/src/pages/applications/ApplicationsListPage.tsx   (ApplicationFilters)
frontend/src/pages/applications/ApplicationNewPage.tsx      (ApplicationForm)
frontend/src/pages/applications/ApplicationEditPage.tsx       (ApplicationForm)
```

**Risque :** Si les IDs de dimensions changent en base, les composants front casseront silencieusement (autocomplete vide).

---

### Item 14 — Endpoint batch pour tags d'entité *(P1 — Sprint 3)*

| | |
|---|---|
| **Statut** | 🔴 À implémenter — FS-06-FRONT en attente |
| **Priorité** | Haute — blocage sauvegarde tags Application |

**Contexte :**
Le service `tagsApi.setEntityTags()` (frontend) appelle un endpoint backend `PUT /tags/entity/:type/:id/batch` qui n'existe pas encore. L'API actuelle (`putEntityTags`) nécessite un `dimensionId` par appel, mais le frontend n'a pas cette information lors de la sauvegarde du formulaire.

**Décision :**
- Créer endpoint backend : `PUT /api/v1/tags/entity/:entityType/:entityId/batch`
- Body : `{ tagValueIds: string[] }` — remplace tous les tags de l'entité par ceux fournis
- Atomicité : transaction SQL — rollback si erreur sur un tag
- **Impact :** Sans cet endpoint, la sauvegarde des tags en création/édition d'Application échouera

**Implémentation backend suggérée :**
```typescript
// tags.controller.ts
@Put('entity/:entityType/:entityId/batch')
async setEntityTagsBatch(
  @Param('entityType') entityType: string,
  @Param('entityId') entityId: string,
  @Body() dto: { tagValueIds: string[] },
) {
  return this.tagsService.setEntityTagsBatch(entityType, entityId, dto.tagValueIds);
}
```

**Référence frontend :** `frontend/src/api/tags.ts` ligne 85-88 (commentaire TODO)

---

### Item 15 — Routes Providers commentées dans App.tsx *(P1 — Sprint 2)*

| | |
|---|---|
| **Statut** | ✅ **DONE** — FS-03-FRONT implémentée le 2026-03-29 |
| **Priorité** | Moyenne — bloque navigation vers module Providers |
| **Gate de validation** | ✅ Routes `/providers` fonctionnelles avec navigation sidebar, CRUD complet |

**Contexte :**
Lors de l'implémentation de FS-04-IT-Components-front, les routes Providers dans `App.tsx` importaient des composants (`ProvidersListPage`, `ProviderNewPage`, `ProviderDetailPage`, `ProviderEditPage`) qui n'existaient pas encore dans le repository. Pour permettre la compilation TypeScript sans erreur, les routes ont été temporairement commentées.

**Décision :**
- Les routes Providers **étaient** commentées dans `App.tsx` (lignes 71-77)
- Les imports des composants Providers **étaient** commentés (lignes 20-23)
- **Déblocage :** FS-03-FRONT (Providers frontend) a implémenté les 4 composants manquants
- **Migration :** Routes sont maintenant **décommentées** dans App.tsx

**Fichier impacté :**
```
frontend/src/App.tsx (lines 19-23, 71-77)
```

**Implémentation complétée :**
- ✅ `frontend/src/pages/providers/ProvidersListPage.tsx` (327 LOC)
- ✅ `frontend/src/pages/providers/ProviderNewPage.tsx` (107 LOC)
- ✅ `frontend/src/pages/providers/ProviderDetailPage.tsx` (283 LOC)
- ✅ `frontend/src/pages/providers/ProviderEditPage.tsx` (136 LOC)
- ✅ Composants support (Drawer, Form, RoleBadge, ExpiryDateBadge)

**Gate de validation :** ✅ Routes `/providers` fonctionnelles — navigation sidebar, liste (pagination + search), création, édition, suppression avec 409 DEPENDENCY_CONFLICT handling

---

### Item 17 — Filtres dropdowns dans ProvidersListPage *(P2 — Sprint 3)*

| | |
|---|---|
| **Statut** | 🟡 En attente — Backend query param support requis |
| **Priorité** | Basse — Spec demande 3 filtres (search + contractType + expiryDate), search seul implémenté |

**Contexte :**
La spec FS-03-Providers-front.md (§3.2 Layout Contract, §4 Checklist) demande une barre de filtres avec 3 contrôles sur ProvidersListPage :
1. `TextField` search (debounced) — ✅ **IMPLÉMENTÉ**
2. `FormControl` dropdown contractType — ❌ **NON IMPLÉMENTÉ**
3. `FormControl` dropdown expiryDate (options: 30/90/180 jours) — ❌ **NON IMPLÉMENTÉ**

Le backend `QueryProvidersDto` actuellement supporte **uniquement** `search`, `page`, `limit`, `sortBy`, `sortOrder`. Les query params `contractType` et `expiryDate` n'existent pas encore.

**Décision :**
- **v1.0 (actuel)** : Search seul implémenté. Spec gate partiellement déverrouillée (2/3 filtres)
- **v1.1 (Sprint 3)** : Ajouter les query params au backend QueryProvidersDto
  - Backend : Ajouter support `contractType?: string` et `expiryDate?: { min, max }` ou deux params séparés
  - Frontend : Implémenter les deux dropdowns dans ProvidersListPage avec filtrage côté API
  - Données dropdowns : Hardcodées ou générées dynamiquement à partir des entités existantes

**Impact :**
- Backend : Modification DTO + query WHERE clauses
- Frontend : Deux nouveaux FormControl + MUI Select composants
- UX : Amélioration expérience de filtrage (actuellement search seul)

**Fichiers à modifier :**
- `backend/src/providers/dto/query-providers.dto.ts` — ajouter fields
- `backend/src/providers/providers.service.ts` — ajouter WHERE clauses
- `frontend/src/pages/providers/ProvidersListPage.tsx` — ajouter dropdowns

**Timing :** Sprint 3 (après FS-03-FRONT completion et Sprint 2 closure)

---

### Item 18 — Breadcrumbs manquants : Applications (Detail, New, Edit) *(P2 — Sprint 3)*

| | |
|---|---|
| **Statut** | 🔴 À implémenter — Pattern PNS-11 non respecté |
| **Priorité** | Moyenne — UX/Navigation, pas bloquant P1 |

**Contexte :**
Les pages `ApplicationDetailPage`, `ApplicationNewPage`, et `ApplicationEditPage` n'affichent pas de breadcrumb. Le pattern PNS-11 (v0.4) standardise les breadcrumbs 3 niveaux (Accueil > Liste > Courant) sur toutes les pages de type Detail/New/Edit.

**Décision :**
- Ajouter breadcrumb sur les 3 pages Applications manquantes
- Pattern : 3 niveaux avec "Accueil" link
  - Detail : `Accueil > Applications > {app.name}`
  - New : `Accueil > Applications > Nouvelle application`
  - Edit : `Accueil > Applications > {app.name} > Modifier`

**Implémentation :**
Utiliser le composant partagé `AppBreadcrumbs` (recommandé par PNS-11) ou implémenter inline avec MUI `Breadcrumbs` en cohérence avec Providers et IT-Components. Ajouter les clés i18n `applications.detail.breadcrumb.*` et `applications.form.breadcrumb.*`.

**Fichiers à modifier :**
- `frontend/src/pages/applications/ApplicationDetailPage.tsx`
- `frontend/src/pages/applications/ApplicationNewPage.tsx`
- `frontend/src/pages/applications/ApplicationEditPage.tsx`
- `frontend/src/i18n/locales/fr.json` — ajouter clés breadcrumb

**Timing :** Sprint 3

---

### Item 19 — Breadcrumbs manquants : Domains (Detail, New, Edit) *(P2 — Sprint 3)*

| | |
|---|---|
| **Statut** | 🔴 À implémenter — Pattern PNS-11 non respecté |
| **Priorité** | Moyenne — UX/Navigation, pas bloquant P1 |

**Contexte :**
Les pages `DomainDetailPage`, `DomainNewPage`, et `DomainEditPage` n'affichent pas de breadcrumb. Le pattern PNS-11 standardise les breadcrumbs sur toutes les pages de type Detail/New/Edit.

**Décision :**
- Ajouter breadcrumb sur les 3 pages Domains manquantes
- Pattern : 3 niveaux avec "Accueil" link
  - Detail : `Accueil > Domaines > {domain.name}`
  - New : `Accueil > Domaines > Nouveau domaine`
  - Edit : `Accueil > Domaines > {domain.name} > Modifier`

**Implémentation :**
Utiliser le composant partagé `AppBreadcrumbs` ou implémenter inline cohérent avec PNS-11. Ajouter clés i18n `domains.detail.breadcrumb.*` et `domains.form.breadcrumb.*`.

**Fichiers à modifier :**
- `frontend/src/pages/domains/DomainDetailPage.tsx`
- `frontend/src/pages/domains/DomainNewPage.tsx`
- `frontend/src/pages/domains/DomainEditPage.tsx`
- `frontend/src/i18n/locales/fr.json` — ajouter clés breadcrumb

**Timing :** Sprint 3

---

### Item 20 — Harmoniser breadcrumbs Providers *(P2 — Sprint 3)*

| | |
|---|---|
| **Statut** | 🟡 Partiellement implémenté — 2 niveaux sans "Accueil", spacing inconsistant |
| **Priorité** | Basse — Fonctionnel mais incohérent avec PNS-11 |

**Contexte :**
Les breadcrumbs Providers (FS-03-FRONT) utilisent un pattern 2 niveaux sans "Accueil" link (différent de IT-Components qui a 3 niveaux avec Accueil). De plus, la namespace i18n pour Detail page réutilise `providers.form.breadcrumb.*` au lieu d'avoir son propre namespace `detail.breadcrumb.*`. Le spacing varie entre `mb: 2` et `mb: 3` selon les pages.

**Décision :**
- Ajouter le lien "Accueil" → 3 niveaux standardisés
  - Detail : `Accueil > Fournisseurs > {provider.name}` (actuellement : `Fournisseurs > {name}`)
  - New : `Accueil > Fournisseurs > Nouveau fournisseur` (actuellement : `Fournisseurs > Nouveau`)
  - Edit : `Accueil > Fournisseurs > {provider.name} > Modifier` (déjà 3 niveaux, ajuster Accueil link)
- Standardiser spacing : `mb: 2` sur toutes les pages
- Corriger i18n namespacing : créer `providers.detail.breadcrumb.{home,list}` distinct de `providers.form.breadcrumb.*`

**Implémentation :**
Refactor les breadcrumbs Providers existants pour cohérence avec PNS-11 et les autres entités (IT-Components).

**Fichiers à modifier :**
- `frontend/src/pages/providers/ProviderDetailPage.tsx` — ajouter Accueil link, fixer spacing, i18n
- `frontend/src/pages/providers/ProviderNewPage.tsx` — ajouter Accueil link, spacing
- `frontend/src/pages/providers/ProviderEditPage.tsx` — ajouter Accueil link, spacing
- `frontend/src/i18n/locales/fr.json` — refactor namespaces

**Timing :** Sprint 3

---

### Item 21 — Créer composant partagé AppBreadcrumbs *(Recommandé — F-01 ou FS-11)*

| | |
|---|---|
| **Statut** | 🟡 Documenté dans PNS-11 — implémentation recommandée mais non bloquante |
| **Priorité** | Basse — Éliminer duplication inline, améliorer maintenabilité |

**Contexte :**
Les breadcrumbs sont actuellement implémentés inline dans chaque page (ProviderDetailPage, ProviderNewPage, ProviderEditPage, ITComponentDetailPage, ITComponentFormPage — 11+ occurrences attendues après Sprint 3). Aucun composant partagé `AppBreadcrumbs` dans `frontend/src/components/shared/`.

**Décision :**
- Créer composant `AppBreadcrumbs.tsx` acceptant un tableau typé d'items
- Composant gère automatiquement le dernier item comme texte non cliquable
- Centralisé dans `@/components/shared/`
- À ajouter à l'index `components/shared/index.ts`

**Interface suggérée :**
```typescript
interface BreadcrumbItem {
  label: string;
  onClick?: () => void;  // omis pour le dernier élément (courant)
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
  sx?: SxProps;
}

export const AppBreadcrumbs: React.FC<AppBreadcrumbsProps> = ({ items, sx }) => {
  // Rendre MUI Breadcrumbs avec derniers item non cliquable
}
```

**Impact :**
- Réduit duplication code dans 11+ pages
- Garantit cohérence visuelle (styling, spacing, i18n key pattern)
- Facilite évolutions futures (theme breadcrumb, A11y)
- Non bloquant pour Sprint 2 — recommandé pour P2/Sprint 3

**Timing :** Sprint 3 ou Sprint 4 (après Items 18-20)

---

---

### Item 22 — Migration tests FS-05-FRONT : Cypress → Playwright *(P2 — Sprint 3)*

| | |
|---|---|
| **Statut** | ✅ Fait — Migration de Cypress vers Playwright réalisée |
| **Priorité** | Moyenne — Couverture tests E2E FS-05-FRONT en attente |

**Contexte:**
Lors de l'implémentation de FS-05-FRONT (Data Objects frontend), un fichier de tests Cypress a été généré (`frontend/cypress/e2e/data-objects.cy.ts`, 37 tests). L'exécution a échoué en raison de dépendances système manquantes (`libnspr4.so`, bibliothèques X11/NSPR) sur l'environnement de développement. Plutôt que d'investir dans la résolution de ces dépendances Cypress, la décision a été prise de migrer vers **Playwright** pour les tests E2E frontend.

**Décision:**
- **Abandonner Cypress** pour les tests E2E frontend — Playwright est devenu la référence
- **Le fichier `data-objects.cy.ts`** a servi de spécification de référence (37 tests documentés)
- **Les 37 tests ont été migrés** vers Playwright dans `e2e/tests/data-objects/`
- **Les dépendances Cypress ont été retirées** du projet après migration complète

**Tests migrés (37 tests — référence historique `frontend/cypress/e2e/data-objects.cy.ts`) :**

| Section | N° | Tests |
|---------|-----|-------|
| **ListPage** (6) | 1-6 | Affichage liste, colonnes, empty state, tri, recherche, bouton ajouter |
| **Drawer** (7) | 7-13 | Ouverture clic ligne, navigation nom, onglets Info/Apps, fermeture, navigation detail/edit, disabled read-only |
| **DetailPage** (4) | 14-17 | Champs affichés, onglet apps, bouton modifier, redirect UUID inexistant |
| **Création** (6) | 18-23 | Nom+description, sans description, annuler, dupliqué, nom vide, espaces |
| **Modification** (3) | 24-26 | Modifier ok, annuler, redirect UUID inexistant |
| **Suppression** (4) | 27-30 | Sans dépendances, annuler, avec dépendances (409), bouton disabled |
| **Filtres** (2) | 31-32 | Par type, par source officielle |
| **Droits UI** (6) | 33-37 | Bouton Add absent, colonne Actions absente, icônes absentes, Edit disabled, redirect /403 (×2) |

**Fichiers concernés :**
- ✅ Créé : `e2e/tests/data-objects/data-objects.spec.ts` (Playwright)
- ✅ Supprimé après migration : `frontend/cypress/e2e/data-objects.cy.ts`
- ✅ Supprimé après migration complète : `frontend/cypress/` (dossier entier)

**Implémentation Playwright (réalisée) :**
```typescript
// e2e/tests/data-objects/data-objects.spec.ts
import { test, expect } from '@playwright/test';
import { login, loginAsReadOnly } from '../fixtures/auth.fixture';

test.describe('Data Objects Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/data-objects');
  });

  test('affiche la liste des objets de données après login', async ({ page }) => {
    await expect(page.getByText('Objets de Données')).toBeVisible();
  });
  // ... 36 autres tests
});
```

**Gate de validation :**
- [x] Les 37 tests Playwright passent en headless
- [x] `make test-e2e` inclut les tests Data Objects
- [x] Fichier Cypress `data-objects.cy.ts` supprimé
- [x] Dépendances Cypress retirées de `package.json`

**Timing :** Sprint 3 (après FS-05-FRONT completion) — réalisé via T-009

---

### Item 27 — Exécution hybride des tests e2e (Jest + Playwright)

| | |
|---|---|
| **Statut** | 🟡 En attente — Normaliser le mode d'exécution Jest e2e backend |
| **Priorité** | Moyenne — Fiabilité des validations locales/CI |

**Contexte :**
Le Makefile montre une stratégie hybride déjà opérationnelle :
- **Backend e2e** via **Jest/Supertest** (`make test-backend-e2e`)
- **API + UI e2e** via **Playwright** (`make test-api-*`, `make test-e2e`)

Or, la commande `jest` peut être absente sur l'hôte si `backend/node_modules` n'y est pas installé, alors qu'elle est bien disponible dans le conteneur backend (`/app/node_modules/.bin/jest`). Cette divergence provoque des faux négatifs du type `jest: not found` lors des validations rapides.

**Décision :**
- Conserver la stratégie mixte (pas de retrait complet de Jest backend)
- Documenter explicitement l'usage recommandé : Jest pour backend e2e en container Docker, Playwright pour API/UI via `make test-api-*` et `make test-e2e`
- Ajouter une note de runbook dans ce registre de dette pour éviter la régression opérationnelle

**Runbook recommandé :**
- Backend e2e ciblé : `docker exec ark-epm-backend-1 sh -lc "cd /app && npm run test:e2e -- --runInBand test/users.e2e-spec.ts"`
- API e2e : `make test-api`
- UI e2e : `make test-e2e`

**Gate de validation :**
- ✅ Le document de dette contient l'état réel de la stratégie test (mixte) et le mode d'exécution non ambigu
- ✅ Plus aucun `jest: not found` non justifié en validation locale après adoption du runbook

---

### Item 23 — Supprimer le secret JWT hardcodé en fallback *(P1 — Sécurité)*

| | |
|---|---|
| **Statut** | 🔴 À corriger — Vulnérabilité de sécurité confirmée |
| **Priorité** | Haute — Compromission d'authentification possible |
| **Gate de validation** | Application refuse de démarrer si `JWT_SECRET` absent ; aucun fallback hardcodé dans le code |

**Contexte :**
Une revue de sécurité (2026-04-05) a identifié un secret JWT hardcodé utilisé comme valeur de repli dans `backend/src/auth/jwt.strategy.ts` :

```typescript
secretOrKey: configService.get('JWT_SECRET') || 'fallback-secret-do-not-use-in-prod',
```

Le `ConfigModule` ne valide pas la présence de `JWT_SECRET` au démarrage (pas de schéma Joi/Zod). Si la variable d'environnement n'est pas injectée (CI/CD mal configuré, environnement de dev sans `.env`, secret manquant en orchestration de conteneurs), l'application démarre silencieusement avec le secret visible dans le code source. Un attaquant ayant accès au source peut forger des JWT valides pour n'importe quel `userId`.

**Décision :**
- **Supprimer** le `|| 'fallback-secret-do-not-use-in-prod'` de `jwt.strategy.ts`
- **Ajouter** une validation de configuration au démarrage via `ConfigModule` (schéma Joi)
- **Utiliser** `configService.getOrThrow<string>('JWT_SECRET')` pour un fail-fast explicite

**Implémentation :**
```typescript
// backend/src/auth/jwt.strategy.ts
secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),

// backend/src/app.module.ts — ConfigModule.forRoot()
validationSchema: Joi.object({
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  // ...autres variables obligatoires
}),
```

**Fichiers concernés :**
- `backend/src/auth/jwt.strategy.ts` — supprimer le fallback
- `backend/src/app.module.ts` — ajouter validation schema Joi

**Gate de validation :**
- ✅ `npm run start:dev` sans `JWT_SECRET` lève une erreur explicite au démarrage
- ✅ Aucune chaîne `fallback` ou secret hardcodé dans le code source auth
- ✅ Tests e2e auth passent avec `JWT_SECRET` correctement injecté

**Timing :** À corriger avant toute mise en production (bloquant)

---

### Item 24 — Contrôle dépendances Interfaces avant suppression d'Application *(P1 — Amendment FS-06-BACK)*

| | |
|---|---|
| **Statut** | 🟠 Documenté — À implémenter via amendment FS-06-BACK |
| **Priorité** | P1 — Intégrité référentielle applicative |
| **Gate de validation** | `DELETE /api/v1/applications/{id}` avec interfaces liées → `409 DEPENDENCY_CONFLICT` |

**Contexte :**

La table `interfaces` référence `applications` via deux FK (`source_app_id`, `target_app_id`) avec `ON DELETE NO ACTION`. La suppression d'une Application liée à des interfaces est actuellement bloquée au niveau **base de données** (erreur FK Postgres), mais pas interceptée proprement côté applicatif — aucun `DEPENDENCY_CONFLICT` avec compteurs n'est renvoyé au client.

FS-06-BACK n'a pas encore été amendé pour inclure `_count.sourceInterfaces` et `_count.targetInterfaces` dans le guard de suppression de `ApplicationsService.remove()`. Ce manque a été identifié lors de la rédaction de FS-08-BACK (Sprint 4).

**Décision :**

Amender `FS-06-BACK` pour ajouter le contrôle suivant dans `ApplicationsService.remove()` :

```typescript
const app = await this.prisma.application.findUnique({
  where: { id },
  select: {
    _count: {
      select: {
        sourceInterfaces: true,   // FK source_app_id
        targetInterfaces: true,   // FK target_app_id
        // ... autres _count existants
      }
    }
  }
});

const interfaceCount = app._count.sourceInterfaces + app._count.targetInterfaces;
if (interfaceCount > 0) {
  throw new ConflictException({
    code: 'DEPENDENCY_CONFLICT',
    message: `Application is used by ${interfaceCount} interface(s)`
  });
}
```

**Fichiers concernés :**
- `backend/src/applications/applications.service.ts` — méthode `remove()`, select `_count`
- `backend/test/FS-06-applications.e2e-spec.ts` — ajouter test Supertest `DELETE` avec interface liée → `409 DEPENDENCY_CONFLICT`

**Prérequis :**
- FS-08-BACK `done` (migration table `interfaces` appliquée, relations Prisma à jour)

**Timing :** Sprint 4 — Amendment après FS-08-BACK `done`, avant recette FS-08-FRONT

---

### Item 25 — Escalade de privilèges : endpoints write Tags sans autorisation *(P1 — Sécurité)*

| | |
|---|---|
| **Statut** | 🔴 À corriger — Vulnérabilité de sécurité confirmée |
| **Priorité** | Haute — tout utilisateur authentifié peut modifier les tags de toutes les entités |
| **Gate de validation** | Appel `PUT /tags/entity/application/{uuid}` sans permission `tags:write` → `403 FORBIDDEN` |

**Contexte :**
Une revue de sécurité automatisée (2026-04-29) a identifié que trois endpoints write du module Tags ne portent aucun décorateur `@RequirePermissions`. Le `PermissionsGuard` global (enregistré dans `app.module.ts`) autorise sans condition toute requête pour laquelle le décorateur est absent :

```typescript
// permissions.guard.ts
if (!requiredPermissions || requiredPermissions.length === 0) {
  return true; // ← autorise sans vérification de permission
}
```

Un utilisateur authentifié avec un rôle lecture seule peut donc appeler :
- `POST /tags/resolve` — crée des valeurs de tag arbitraires dans la hiérarchie
- `PUT /tags/entity/:type/:id` — remplace les tags d'une entité pour une dimension
- `PUT /tags/entity/:type/:id/batch` — écrase **tous** les tags d'une entité

Seuls `createDimension` et `updateDimension` portent correctement `@RequirePermissions('tags:write')`.

**Décision :**
Ajouter `@RequirePermissions('tags:write')` sur les trois endpoints write, et `@RequirePermissions('tags:read')` sur les endpoints de lecture pour cohérence défensive :

```typescript
// backend/src/tags/tags.controller.ts

@Post('tags/resolve')
@RequirePermissions('tags:write')     // ← manquant
async resolveTag(...) { ... }

@Put('tags/entity/:entityType/:entityId')
@RequirePermissions('tags:write')     // ← manquant
async putEntityTags(...) { ... }

@Put('tags/entity/:entityType/:entityId/batch')
@RequirePermissions('tags:write')     // ← manquant
async batchEntityTags(...) { ... }

// Lecture — défense en profondeur
@Get('tags/autocomplete')
@RequirePermissions('tags:read')      // ← recommandé
async autocomplete(...) { ... }

@Get('tags/entity/:entityType/:entityId')
@RequirePermissions('tags:read')      // ← recommandé
async getEntityTags(...) { ... }
```

**Fichiers concernés :**
- `backend/src/tags/tags.controller.ts` — ajouter les décorateurs sur 5 méthodes (3 bloquants + 2 défensifs)

**Tâche associée :** T-079

**Gate de validation :**
- ✅ Utilisateur sans permission `tags:write` reçoit `403 FORBIDDEN` sur les 3 endpoints write
- ✅ Utilisateur sans permission `tags:read` reçoit `403 FORBIDDEN` sur les 2 endpoints de lecture
- ✅ Aucun autre endpoint write sans `@RequirePermissions` dans le codebase (audit exhaustif)

---

### Item 16 — Customisation des couleurs provider roles *(P2)*

| | |
|---|---|
| **Statut** | 🟡 Différé P2 — Documentation de dette |
| **Priorité** | Basse — UI/UX, pas bloquant |
| **Gate de validation** | Admin dashboard avec interface color picker pour rôles |

**Contexte :**
La spec FS-03-FRONT v1.1 implémente l'affichage des `provider_role` via badges MUI avec couleurs hardcodées dans le code TypeScript (`editor → primary`, `integrator → secondary`, etc.). Bien que cette solution soit fonctionnelle et UX correcte pour v1.0, elle ne permet pas aux administrateurs de personnaliser les couleurs sans modification du code et redéploiement.

**Décision :**
- **v1.1 (actuel)** : Couleurs hardcodées dans `roleColorMap` TypeScript (FS-03-FRONT ProvidersDrawer, ProviderDetailPage)
- **v2.0 (P2)** : Admin dashboard avec UI de customisation des couleurs par rôle
  - Endpointe API : `GET/PUT /api/v1/admin/settings/provider-role-colors` (ou similaire — à concevoir)
  - Persistance : Configurations stockées dans table `settings` ou nouvelle table `role_color_configs`
  - Frontend : Page admin `/admin/settings/provider-roles-colors` avec color picker MUI + preview en temps réel
  - Fallback : Si configuration absente en DB, utiliser les hardcodes v1.1 par défaut

**Impact :**
- Nécessite : concevoir endpoint API + table persistance + page admin
- N'impacte pas : logique métier providers/applications, audit trail, permissions
- Timing : Sprint 4+ (post-MVP)

**Fichiers affectés (future implémentation) :**
- `backend/src/settings/` — nouveau module
- `frontend/src/pages/admin/ProviderRoleColorsPage.tsx` — nouvelle page
- `frontend/src/utils/roleColors.ts` — refactor pour consommer API

---

## 3. Bloc contexte OpenCode — à injecter (complément F-00)

> Ce bloc s'ajoute au bloc contexte standard de F-00. Il doit être injecté dans **chaque session OpenCode Sprint 2+** pour que les conventions ci-dessus soient respectées automatiquement.

```
Conventions transverses ARK (F-999) :

Erreurs API :
- Format obligatoire : { statusCode, code, message, timestamp, path }
- Codes : VALIDATION_ERROR (422), NOT_FOUND (404), CONFLICT (409), DEPENDENCY_CONFLICT (409), FORBIDDEN (403)
- Filtre global : HttpExceptionFilter dans src/common/filters/ — ne pas créer de format custom

JWT :
- Access token TTL : 15 min (mémoire uniquement)
- Sur 401 : rediriger vers /login?reason=session_expired

Pagination :
- Toutes les routes de liste utilisent PaginationQueryDto (src/common/dto/pagination-query.dto.ts)
- Réponse : { data: [...], meta: { page, limit, total, totalPages } }
- Défauts : page=1, limit=20, sortBy=createdAt, sortOrder=desc

Suppressions :
- Vérifier les dépendances AVANT de supprimer
- Lever ConflictException({ code: 'DEPENDENCY_CONFLICT', message: '...' }) si dépendances existantes
- Jamais de hard delete silencieux sur les entités avec FK entrantes

Rate limiting :
- ThrottlerModule global : 100 req/min
- Routes auth : @Throttle limit=10/min
- Route import Excel : @Throttle limit=3/min

Requêtes raw Prisma :
- Toute variable dans $queryRaw / $executeRaw passe par le tagged template Prisma (backticks)
- Jamais de Prisma.raw() avec interpolation de string
- dangerouslySetInnerHTML interdit dans tous les composants React

Request ID :
- Chaque requête génère ou propage X-Request-ID
- Header présent dans la réponse et les logs

**Dette technique Sprint 3 (à résorber) :**
- Item 12 : Remplacer mocks Providers/Users par vraies APIs (FS-03, FS-09)
- Item 13 : Remplacer dimensions hardcodées par API `/tag-dimensions` (F-03)
- Item 14 : Implémenter endpoint `PUT /tags/entity/:type/:id/batch` pour sauvegarde tags
```

---

### Item 28 — Validation injection uniforme sur tous les DTOs *(P1 — Sécurité)*

| | |
|---|---|
| **Statut** | 🟡 En cours — T-101 assignée |
| **Priorité** | P1 (sécurité — cohérence DAST) |
| **Gate de validation** | T-101 done + tous les tests injection passent sur toutes entités |

**Contexte :**
Le scan OWASP ZAP (2026-05-04) a persisté des payloads de fuzzing dans `data_objects` (T-099). Fix appliqué sur `DataObjectDto` : ajout de `@Matches` pour rejeter les caractères injection, `@NotContains('://')` pour les URL, et `@Transform(trim)` sur champs libres.

Audit des DTOs restants (2026-05-04) révèle que le même gap existe sur toutes les entités :
- **Critique** : `InterfaceDto` (name, description, comment, technicalContact) — zéro garde
- **Critique** : `ApplicationDto` (description, comment, lifecycleStatus) — pas de trim ni MaxLength
- **High** : `ItComponentDto` (description, comment, technology, type) — pas de trim
- **Medium** : Tous les autres (name sans @Matches injection filter)

**Décision :**
Appliquer uniformément sur tous les DTOs create + update le pattern établi dans T-099 :

```typescript
// Name fields (ALL entities)
@Matches(/^[^;<>|`\\{}\[\]\x00-\x1F]*$/, {
  message: 'Name contains forbidden characters (injection attempt)',
})
@NotContains('://', {
  message: 'Name cannot contain URL schemes',
})

// Description/Comment/Text free-form fields
@Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
@MaxLength(2000)
```

**Conséquences :**
- Cohérence de la surface d'attaque : toute entité rejette les payloads ZAP
- Alignement OWASP A03:2021 Injection
- Impact tests : ajouter cas d'injection dans chaque `*.validation.api.spec.ts`

**Scope (6 entités × 2 DTOs = 12 fichiers) :**
- `applications` → CreateApplicationDto, UpdateApplicationDto (3 champs : description, comment, lifecycleStatus)
- `domains` → CreateDomainDto, UpdateDomainDto (name only : @Matches)
- `providers` → CreateProviderDto, UpdateProviderDto (name + contractType trim)
- `it_components` → CreateItComponentDto, UpdateItComponentDto (description, comment, technology, type)
- `business_capabilities` → CreateBusinessCapabilityDto, UpdateBusinessCapabilityDto (name only : @Matches)
- `interfaces` → CreateInterfaceDto, UpdateInterfaceDto (ALL fields : name, description, comment, technicalContact)
- `tags` → CreateTagDimensionDto, UpdateTagDimensionDto (name + description + color + icon)

**Tests requis :**
- Chaque `*.validation.api.spec.ts` : ajouter ≥1 test injection (POST + PATCH)
- Payloads : `ZAP;cat /etc/passwd;`, `ZAP|type`, `http://evil.com`, `]]>`, `Data`whoami``
- Réponse attendue : 400 Bad Request
- Sanity check : valid name avec espaces/tirets accepté → 201/200

**Gate de validation :**
- [ ] Tous les DTOs respects le pattern T-099 (imports `Matches`, `NotContains`)
- [ ] `npm run build` passe sans erreur
- [ ] Tests injection ajoutés pour chaque entité critique+high
- [ ] `make test-api` : 0 régression, injection tests 100% pass
- [ ] `make test-backend-e2e` : 0 régression

---

## 4. Checklist d'implémentation P1

- [x] **Item 1** — `HttpExceptionFilter` créé et enregistré dans `main.ts`
- [x] **Item 1** — Format d'erreur vérifié sur toutes les routes FS-01 existantes
- [x] **Item 2** — TTL JWT configuré à 15 min dans `.env`
- [x] **Item 2** — Intercepteur Axios 401 → redirect `/login?reason=session_expired`
- [x] **Item 2** — LoginPage affiche message session expirée
- [x] **Item 3** — `@nestjs/throttler` installé et `ThrottlerModule` configuré dans `AppModule`
- [ ] **Item 3** — `POST /api/auth/login` limité à 10 req/min — testé manuellement
- [x] **Item 4** — `PaginationQueryDto` créé dans `src/common/dto/`
- [ ] **Item 4** — FS-02 (Domains) implémente le contrat — sert de référence pour les suivantes
- [ ] **Item 5** — Vérification de dépendances implémentée dans chaque service `remove()`
- [ ] **Item 5** — Suppression d'un Domain référencé → 409 validé en test manuel
- [x] **Item 8** — Middleware audit vérifié : `$executeRaw` en tagged template
- [x] **Item 9** — API prefix `/api/v1` configuré dans `main.ts`
- [x] **Item 10** — RequestIdMiddleware créé et enregistré dans AppModule
- [x] **Item 10** — Header `X-Request-ID` présent sur toutes les réponses
- [x] **Item 12 (Providers)** — API Providers remplace le mock dans ApplicationForm ✅ 2026-03-29
- [x] **Item 12b (Users)** — API Users remplace le mock dans ApplicationForm ✅ 2026-05-03
- [ ] **Item 13** — Dimensions dynamiques via `/tag-dimensions` (remplacent hardcode)
- [ ] **Item 14** — Endpoint `PUT /tags/entity/:type/:id/batch` implémenté et testé
- [ ] **Item 15** — Routes Providers décommentées et fonctionnelles après FS-03-FRONT
- [ ] **Item 16** — Admin dashboard pour customisation couleurs provider roles (P2 — Sprint 4+)

## 4.1 Checklist P2 — Sprint 3 (Breadcrumbs & Design Guidelines)

- [ ] **Item 17** — Query params contractType + expiryDate implémentés dans backend QueryProvidersDto
- [ ] **Item 17** — Dropdowns contractType et expiryDate affichés dans ProvidersListPage
- [ ] **Item 18** — Breadcrumbs ajoutés aux 3 pages Applications (Detail, New, Edit) — pattern PNS-11
- [ ] **Item 18** — Clés i18n `applications.detail.breadcrumb.*` et `applications.form.breadcrumb.*` ajoutées
- [ ] **Item 19** — Breadcrumbs ajoutés aux 3 pages Domains (Detail, New, Edit) — pattern PNS-11
- [ ] **Item 19** — Clés i18n `domains.detail.breadcrumb.*` et `domains.form.breadcrumb.*` ajoutées
- [ ] **Item 20** — Breadcrumbs Providers harmonisés : 3 niveaux avec Accueil link + i18n refactor
- [ ] **Item 20** — Spacing breadcrumbs standardisé à `mb: 2` sur toutes les pages
- [ ] **Item 21** — Composant `AppBreadcrumbs` créé dans `@/components/shared/` (optional — recommandé P2/FS-11)
- [x] **Item 22** — Migrer 37 tests Cypress `data-objects.cy.ts` vers Playwright `e2e/tests/data-objects/data-objects.spec.ts`
- [x] **Item 22** — Supprimer `frontend/cypress/` après migration complète
- [x] **Item 22** — Retirer dépendances Cypress de `package.json`
- [ ] **Item 27** — Stabiliser le runbook e2e : Jest backend (container) + Playwright API/UI
- [ ] **Item 23** — Supprimer fallback JWT hardcodé dans `jwt.strategy.ts`
- [ ] **Item 23** — Ajouter validation schema Joi pour `JWT_SECRET` dans `ConfigModule`
- [ ] **Item 25** — Ajouter `@RequirePermissions('tags:write')` sur `resolveTag`, `putEntityTags`, `batchEntityTags`
- [ ] **Item 25** — Ajouter `@RequirePermissions('tags:read')` sur `autocomplete`, `getEntityTags` (défensif)
- [ ] **Item 25** — Valider `403 FORBIDDEN` pour utilisateur sans `tags:write` sur les 3 endpoints write
- [ ] **Item 28** — @Matches + @NotContains('://') sur `name` de : Application, Domain, Provider, ItComponent, BusinessCapability, Interface, TagDimension
- [ ] **Item 28** — @Transform trim + @MaxLength sur : Interface (4 champs), Application (description, comment, lifecycleStatus), ItComponent (4 champs), Provider (contractType), TagDimension (4 champs)
- [ ] **Item 28** — Tests injection dans `*.validation.api.spec.ts` pour chaque entité concernée (400 sur ZAP;*, |, http://, ]]>, backtick)
- [ ] **Item 28** — Validation : `make test-api` et `make test-backend-e2e` 100% pass

---

## 5. Journal des décisions

> Tracer ici toute modification de ce document avec date et justification.

| Date | Item | Modification | Auteur |
|---|---|---|---|
| 2026-03-03 | Tous | Création initiale — items 1-7 | Alec |
| 2026-03-03 | Item 8 | Ajout règle sécurité requêtes raw Prisma — injection SQL | Alec |
| 2026-03-03 | Item 9 | Ajout API Versioning — stratégie URL /api/v1/ | Alec |
| 2026-03-03 | Item 10 | Ajout Request ID / Correlation ID — X-Request-ID | Alec |
| 2026-03-03 | Items 1,2,3,4,9,10 | Implémentation complète — HttpExceptionFilter, JWT 15min, Throttler, PaginationDto, API v1, RequestId | Alec |
| 2026-03-04 | §6 | Ajout section Historique des Revues de Sprint — revue de dette obligatoire en fin de sprint | Alec |
| 2026-03-14 | Item 11 | Ajout Description Markdown pour Applications — différé P2 | Alec |
| 2026-03-15 | Items 12, 13, 14 | Dette technique FS-06-FRONT — mocks Providers/Users, dimensions hardcodées, endpoint batch tags manquant | Alec |
| 2026-03-21 | Item 15 | Routes Providers commentées — fichiers FS-03-FRONT manquants | OpenCode |
| 2026-03-21 | Item 16 | Customisation couleurs provider roles — couleurs hardcodées v1.1, admin dashboard P2 | OpenCode |
| 2026-03-29 | Items 17-21 | Ajout dette technique Design Guidelines : filtres Providers (P2), breadcrumbs Applications/Domains/Providers (Sprint 3), composant AppBreadcrumbs (FS-11) | OpenCode/Spec |

| 2026-04-05 | Item 22 | Migration tests FS-05-FRONT Cypress → Playwright — 37 tests à migrer | OpenCode/Front |
| 2026-04-05 | Item 23 | Secret JWT fallback hardcodé détecté (revue sécurité) — `getOrThrow` + validation Joi obligatoires | Spec/Sécurité |
| 2026-04-29 | Item 25 | Escalade de privilèges tags : 3 endpoints write sans `@RequirePermissions` — revue sécurité automatisée | Claude/Arch |
| 2026-05-03 | Item 12b | `MOCK_USERS` remplacés par `GET /api/v1/users?isActive=true` + `useUsers()` (FS-06 front + FS-01 back) | Alec |
| 2026-05-03 | Item 27 | Stratégie test hybride confirmée : backend Jest e2e (container) + Playwright API/UI, et runbook d'exécution documenté | Alec |
| 2026-05-04 | Item 28 | Audit DTOs post-ZAP T-099 : gap injection/trim sur 6 entités — T-101 créée pour harmoniser validation ALL DTOs | back |

---

## 6. Historique des revues de sprint

> Une ligne par sprint clôturé. Alimenté à partir du tableau §11 de chaque Feature-Spec (`Résultat de la revue`). C'est la mémoire longitudinale de la dette — le complément opérationnel des gates TD dans les specs.

| Sprint | Date | Feature(s) | Items F-999 fermés | Items F-999 ouverts | Nouveaux items | NFR mis à jour | TODOs résiduels tracés |
|---|---|---|---|---|---|---|---|
| *(Sprint 1)* | *(2026-03-03)* | F-00, F-01, FS-01, F-999 | Items 1,2,3,4,9,10 | Item 5 (pending), Item 8 (pending) | — | NFR-SEC-001 à 004 → covered | — |

> **Convention :** compléter cette table à chaque fin de sprint, en consolidant les tableaux §11 des specs du sprint. Si plusieurs specs dans le même sprint, fusionner les lignes en une seule entrée par sprint.

---

_Feature Spec F-999 v0.4 — Projet ARK — Document de travail_
