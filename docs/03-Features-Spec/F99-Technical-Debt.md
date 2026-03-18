# ARK — Feature Spec F-999 : Technical Debt & Conventions Transverses

_Version 0.5 — Mars 2026_

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
| **Priorité** | P1 (items 1–5, 8, 10) / P2 (items 6–7, 9, 11) |
| **Statut** | `done` (items 1, 2, 3, 4, 9, 10) / `pending` (items 5, 8) / `P2` (items 6, 7, 11) |
| **Estimé** | 1 jour (items P1) — Items 1,2,3,4,9,10 implémentés |
| **Version** | 0.3 |

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

### Item 12 — APIs Providers et Users mockées *(P1 — Sprint 3)*

| | |
|---|---|
| **Statut** | 🔴 En cours — FS-06-FRONT livré avec mocks |
| **Priorité** | Haute — blocage UX sur formulaire Application |

**Contexte :**
FS-06-FRONT implémente les sélecteurs de Provider et Owner dans le formulaire Application (`ApplicationForm.tsx`), mais les APIs `/providers` (liste) et `/users` (liste filtrée des utilisateurs actifs) ne sont pas encore disponibles. Les composants utilisent des données mockées (arrays vides).

**Décision :**
- Livraison FS-06-FRONT avec mocks vides — formulaire fonctionnel mais sélecteurs vides
- **Déblocage :** 
  - FS-03-BACK (Providers CRUD + endpoint liste)
  - FS-09-BACK (Users endpoint liste `GET /users?isActive=true&role=member`)
- **Migration :** Remplacer `MOCK_PROVIDERS` et `MOCK_USERS` par les appels `useProviders()` et `useUsers()` quand disponibles

**Fichiers concernés :**
- `frontend/src/pages/applications/ApplicationNewPage.tsx`
- `frontend/src/pages/applications/ApplicationEditPage.tsx`
- `frontend/src/components/applications/ApplicationForm.tsx`

**Gate de validation :** Formulaire Application affiche les sélecteurs peuplés avec données réelles — test avec création d'une app liée à un provider existant

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
- [ ] **Item 12** — APIs Providers et Users remplacent les mocks dans ApplicationForm
- [ ] **Item 13** — Dimensions dynamiques via `/tag-dimensions` (remplacent hardcode)
- [ ] **Item 14** — Endpoint `PUT /tags/entity/:type/:id/batch` implémenté et testé
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

---

## 6. Historique des revues de sprint

> Une ligne par sprint clôturé. Alimenté à partir du tableau §11 de chaque Feature-Spec (`Résultat de la revue`). C'est la mémoire longitudinale de la dette — le complément opérationnel des gates TD dans les specs.

| Sprint | Date | Feature(s) | Items F-999 fermés | Items F-999 ouverts | Nouveaux items | NFR mis à jour | TODOs résiduels tracés |
|---|---|---|---|---|---|---|---|
| *(Sprint 1)* | *(2026-03-03)* | F-00, F-01, FS-01, F-999 | Items 1,2,3,4,9,10 | Item 5 (pending), Item 8 (pending) | — | NFR-SEC-001 à 004 → covered | — |

> **Convention :** compléter cette table à chaque fin de sprint, en consolidant les tableaux §11 des specs du sprint. Si plusieurs specs dans le même sprint, fusionner les lignes en une seule entrée par sprint.

---

_Feature Spec F-999 v0.4 — Projet ARK — Document de travail_