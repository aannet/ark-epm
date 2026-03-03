# ARK — Feature Spec F-999 : Technical Debt & Conventions Transverses

_Version 0.1 — Mars 2026_

> **Usage :** Ce document est la référence vivante des décisions techniques transverses qui ne sont pas portées par une feature métier. Il est distinct de AGENTS.md (qui décrit les conventions de code et les patterns d'implémentation) : F-999 docte les **décisions d'architecture** et les **contrats techniques globaux** — le "pourquoi" et le "quoi", pas le "comment coder".
>
> **Mode :** Chaque item doit être implémenté manuellement et validé par une gate dédiée avant d'être marqué `done`.
>
> **Lecture recommandée :** avant de rédiger toute nouvelle Feature-Spec (FS-XX). Les conventions de ce document s'imposent à toutes les features.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | F-999 |
| **Titre** | Technical Debt & Conventions Transverses |
| **Priorité** | P1 (items 1–5) / P2 (items 6–7) |
| **Statut** | `draft` |
| **Dépend de** | F-00 |
| **Estimé** | 1 jour (items P1) |
| **Version** | 0.1 |

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
| **Statut** | 🔴 À implémenter — P1 |
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
    const status = exception.getExceptionResponse();

    response.status(exception.getStatus()).json({
      statusCode: exception.getStatus(),
      code: /* extraire du payload ou defaulter */ 'INTERNAL_ERROR',
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

> ⚠️ **À injecter dans le bloc contexte OpenCode de chaque session :** "Toutes les erreurs retournent le format `{ statusCode, code, message, timestamp, path }` via le `HttpExceptionFilter` global. Ne pas créer de format d'erreur personnalisé."

---

### Item 2 — Durée et stratégie JWT

| | |
|---|---|
| **Statut** | 🔴 À documenter/valider — P1 |
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
| **Statut** | 🔴 À implémenter — P1 |
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
| **Statut** | 🔴 À documenter — P1 |
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
| `data_objects` | ❌ **Blocage** si des applications sont mappées | |
| `it_components` | ❌ **Blocage** si des applications sont mappées | |
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
Exposer `GET /api/health` (non authentifié) retournant :
```json
{ "status": "ok", "db": "ok", "timestamp": "..." }
```
Utiliser `@nestjs/terminus`. À implémenter au démarrage de P2 avec le déploiement production.

---

### Item 7 — CORS *(P2)*

| | |
|---|---|
| **Statut** | 🟡 Documenté — à vérifier avant déploiement production |
| **Priorité** | Faible — on-premise avec frontend et backend co-localisés |

**Décision :**
En développement local, CORS permissif (`*`). En production on-premise, restreindre à l'origin du frontend déployé via variable d'environnement `CORS_ORIGIN`. À configurer dans `main.ts` avant la mise en production P1.

---

## 3. Bloc contexte OpenCode — à injecter (complément F-00)

> Ce bloc s'ajoute au bloc contexte standard de F-00. Il doit être injecté dans **chaque session OpenCode Sprint 2+** pour que les conventions ci-dessus soient respectées automatiquement.

```
Conventions transverses ARK (F-999) :

Erreurs API :
- Format obligatoire : { statusCode, code, message, timestamp, path }
- Codes : VALIDATION_ERROR (422), NOT_FOUND (404), CONFLICT (409), DEPENDENCY_CONFLICT (409), FORBIDDEN (403)
- Filtre global : HttpExceptionFilter dans src/common/filters/ — ne pas créer de format custom

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
```

---

## 4. Checklist d'implémentation P1

- [ ] **Item 1** — `HttpExceptionFilter` créé et enregistré dans `main.ts`
- [ ] **Item 1** — Format d'erreur vérifié sur toutes les routes FS-01 existantes
- [ ] **Item 2** — TTL JWT configuré à 15 min dans `JwtModule`
- [ ] **Item 2** — Intercepteur Axios 401 → redirect `/login?reason=session_expired`
- [ ] **Item 3** — `@nestjs/throttler` installé et `ThrottlerModule` configuré dans `AppModule`
- [ ] **Item 3** — `POST /api/auth/login` limité à 10 req/min — testé manuellement
- [ ] **Item 4** — `PaginationQueryDto` créé dans `src/common/dto/`
- [ ] **Item 4** — FS-02 (Domains) implémente le contrat — sert de référence pour les suivantes
- [ ] **Item 5** — Vérification de dépendances implémentée dans chaque service `remove()`
- [ ] **Item 5** — Suppression d'un Domain référencé → 409 validé en test manuel

---

## 5. Journal des décisions

> Tracer ici toute modification de ce document avec date et justification.

| Date | Item | Modification | Auteur |
|---|---|---|---|
| 2026-03-03 | Tous | Création initiale — items 1-7 | Alec |

---

_Feature Spec F-999 v0.1 — Projet ARK — Document de travail_