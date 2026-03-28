# Backend & Data — Guide Op\u00e9rationnel

> Guide sp\u00e9cialis\u00e9 pour les Agents `back` et `data` sur ARK-EPM.  
> Ce fichier compl\u00e8te le `AGENTS.md` racine \u2014 charger les deux avant toute intervention.

---

## 1. Architecture NestJS

### Structure d'un module CRUD

Chaque entit\u00e9 EA suit la m\u00eame organisation :

```
backend/src/<entity>/
\u251c\u2500\u2500 <entity>.controller.ts   # Routes REST
\u251c\u2500\u2500 <entity>.service.ts      # Logique m\u00e9tier + Prisma queries
\u251c\u2500\u2500 <entity>.module.ts       # D\u00e9claration NestJS
\u251c\u2500\u2500 index.ts                 # Barrel export
\u2514\u2500\u2500 dto/
    \u251c\u2500\u2500 create-<entity>.dto.ts
    \u251c\u2500\u2500 update-<entity>.dto.ts
    \u2514\u2500\u2500 query-<entity>.dto.ts
```

### Pattern Controller

```typescript
@Controller('api/v1/<entity-kebab>')
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Get()
  findAll(@Query() query: QueryEntityDto) { ... }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { ... }

  @Post()
  create(@Body() dto: CreateEntityDto, @Req() req) { ... }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEntityDto) { ... }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) { ... }
}
```

### Pattern Service

```typescript
@Injectable()
export class EntityService {
  private readonly logger = new Logger(EntityService.name);

  constructor(private prisma: PrismaService) {}

  private async setCurrentUser(userId: string): Promise<void> {
    await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;
  }

  async create(dto: CreateEntityDto, userId: string) {
    await this.setCurrentUser(userId);
    return this.prisma.entity.create({ data: { ...dto } });
  }

  async findAll(query: QueryEntityDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder } = query;
    const [data, total] = await Promise.all([
      this.prisma.entity.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined,
      }),
      this.prisma.entity.count({ where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
```

### Import Order

```typescript
// 1. External libraries
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { Logger } from '@nestjs/common';

// 2. Internal modules
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// 3. Relative imports
import { CreateEntityDto } from './dto/create-entity.dto';
import { EntityService } from './entity.service';
```

### Error Handling

Utiliser le `HttpExceptionFilter` global \u2014 ne jamais cr\u00e9er de format custom :

```typescript
throw new NotFoundException({
  code: 'DOMAIN_NOT_FOUND',
  message: 'Le domaine n\'existe pas',
});
throw new ConflictException({
  code: 'APPLICATION_NAME_EXISTS',
  message: 'Une application avec ce nom existe d\u00e9j\u00e0',
});
```

### Auth & RBAC

```typescript
// JwtAuthGuard est global \u2014 toutes les routes sont prot\u00e9g\u00e9es par d\u00e9faut
// Utiliser @Public() pour exempter une route :
@Public()
@Post('login')
login() { ... }

// Permissions : format <resource>:<action>
// V\u00e9rifi\u00e9es par PermissionsGuard + d\u00e9corateur @RequirePermissions()
@RequirePermissions('applications:write')
@Post()
create(@Body() dto: CreateApplicationDto) { ... }
```

### Logging

```typescript
private readonly logger = new Logger(MyService.name);

// Format structur\u00e9
this.logger.log({ method: 'createApplication', userId, result: application.id });
this.logger.warn({ method: 'findOne', message: 'Entity not found', id });
this.logger.error({ method: 'create', error: error.message, stack: error.stack });
```

---

## 2. Prisma & Database (Agent `data`)

### Conventions Schema

Checklist obligatoire pour chaque mod\u00e8le :

- [ ] `@@map("table_name")` en snake_case
- [ ] `@map("column_name")` pour chaque champ camelCase \u2192 snake_case
- [ ] `@default(dbgenerated("gen_random_uuid()"))` pour tous les IDs
- [ ] `@db.Uuid` pour tous les champs UUID
- [ ] `@db.Timestamptz(6)` pour les champs DateTime
- [ ] Index sur les foreign keys utilis\u00e9es en WHERE/JOIN

Exemple de mod\u00e8le conforme :

```prisma
model Application {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String    @unique @db.VarChar(255)
  description     String?   @db.Text
  domainId        String?   @map("domain_id") @db.Uuid
  createdAt       DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime? @default(now()) @map("updated_at") @db.Timestamptz(6)

  domain          Domain?   @relation(fields: [domainId], references: [id], onDelete: NoAction)

  @@index([domainId], map: "idx_applications_domain")
  @@map("applications")
}
```

### Audit Context (CRITICAL)

**Toujours** ex\u00e9cuter avant une op\u00e9ration d'\u00e9criture Prisma :

```typescript
await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;
await this.prisma.application.create({ data: { ... } });
```

Le trigger `fn_audit_trigger()` utilise cette variable de session pour peupler `audit_trail.changed_by`.

### Migration Workflow

```bash
# 1. Modifier schema.prisma
# 2. G\u00e9n\u00e9rer la migration (dev uniquement)
cd backend && npx prisma migrate dev --name descriptive_name

# 3. G\u00e9n\u00e9rer le client
npx prisma generate

# 4. V\u00e9rifier la migration g\u00e9n\u00e9r\u00e9e dans prisma/migrations/
# 5. Tester manuellement (seed + CRUD)
```

### Seeds

Convention : un fichier par entit\u00e9, orchestr\u00e9 par `seed.ts` :

```
prisma/
\u251c\u2500\u2500 seed.ts               # Orchestrateur principal
\u251c\u2500\u2500 seed-applications.ts  # Donn\u00e9es de d\u00e9mo Applications
\u251c\u2500\u2500 seed-domains.ts       # Donn\u00e9es de d\u00e9mo Domains
\u251c\u2500\u2500 seed-providers.ts     # Donn\u00e9es de d\u00e9mo Providers
\u2514\u2500\u2500 seed-tags.ts          # Dimensions + valeurs de tags
```

### Entit\u00e9s EA actuelles

| Mod\u00e8le Prisma | Table PostgreSQL | Statut | Relations cl\u00e9s |
|---|---|---|---|
| `Application` | `applications` | Impl\u00e9ment\u00e9 | Domain, Provider (N:N), ITComponent (N:N), Interface (source/target) |
| `Domain` | `domains` | Impl\u00e9ment\u00e9 | Applications, BusinessCapabilities |
| `Provider` | `providers` | Impl\u00e9ment\u00e9 | Applications (N:N via `app_provider_map`) |
| `ItComponent` | `it_components` | Impl\u00e9ment\u00e9 | Applications (N:N via `app_it_component_map`) |
| `BusinessCapability` | `business_capabilities` | Schema only | Domain, Applications (N:N), Hierarchy (parent/children) |
| `DataObject` | `data_objects` | Schema only | Applications (N:N via `app_data_object_map`) |
| `Interface` | `interfaces` | Schema only | Source App, Target App, Technical Contact |
| `TagDimension` | `tag_dimensions` | Impl\u00e9ment\u00e9 | TagValues |
| `TagValue` | `tag_values` | Impl\u00e9ment\u00e9 | EntityTags, Hierarchy (parent/children) |
| `EntityTag` | `entity_tags` | Impl\u00e9ment\u00e9 | TagValue (polymorphique via entityType/entityId) |

### Tables de mapping (N:N)

| Table | Entit\u00e9s reli\u00e9es | Champs suppl\u00e9mentaires |
|---|---|---|
| `app_provider_map` | Application \u2194 Provider | `provider_role` |
| `app_capability_map` | Application \u2194 BusinessCapability | \u2014 |
| `app_data_object_map` | Application \u2194 DataObject | `role` (consumer/producer) |
| `app_it_component_map` | Application \u2194 ItComponent | \u2014 |

---

## 3. Ajout d'une Nouvelle Entit\u00e9 EA \u2014 Checklist

### Phase 1 \u2014 Data (Agent `data`)
- [ ] Ajouter le mod\u00e8le dans `schema.prisma` (conventions ci-dessus)
- [ ] Cr\u00e9er la migration : `npx prisma migrate dev --name add_<entity>`
- [ ] V\u00e9rifier que `audit_trail.id` a son DEFAULT `gen_random_uuid()`
- [ ] Cr\u00e9er le seed file : `prisma/seed-<entity>.ts`
- [ ] Int\u00e9grer dans `prisma/seed.ts`

### Phase 2 \u2014 Backend (Agent `back`)
- [ ] Cr\u00e9er le module NestJS : `backend/src/<entity>/`
- [ ] Controller avec 5 routes CRUD
- [ ] Service avec `setCurrentUser()` + pagination
- [ ] DTOs : Create, Update, Query
- [ ] Enregistrer le module dans `app.module.ts`
- [ ] Ajouter les permissions : `<entity>:read`, `<entity>:write`
- [ ] Seeder les permissions dans `prisma/seed.ts`
- [ ] Tests e2e : `backend/test/<entity>.e2e-spec.ts`

### Phase 3 \u2014 Validation
- [ ] `npm run build` passe
- [ ] Tests unitaires passent
- [ ] Tests e2e passent
- [ ] Curl CRUD complet fonctionnel

---

## 4. Troubleshooting

### P2011 Null constraint violation sur ID

**Sympt\u00f4me :** `Null constraint violation on the fields: (id)` malgr\u00e9 `@default(dbgenerated())`

**Checklist :**
1. V\u00e9rifier la table cible a son DEFAULT :
   ```bash
   docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "\d table_name"
   # Doit afficher: DEFAULT gen_random_uuid()
   ```

2. **V\u00e9rifier audit_trail.id (SI TRIGGER AUDIT ACTIF) :**
   ```bash
   docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "
     SELECT column_default
     FROM information_schema.columns
     WHERE table_name='audit_trail' AND column_name='id';
   "
   ```
   Si NULL ou vide :
   ```bash
   docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "
     ALTER TABLE audit_trail ALTER COLUMN id SET DEFAULT gen_random_uuid();
   "
   ```

**Root cause :** Le trigger `fn_audit_trigger()` tente d'ins\u00e9rer dans `audit_trail` sans ID. Si `audit_trail.id` n'a pas de DEFAULT, l'insertion \u00e9choue et l'op\u00e9ration originale rollback.

### Prisma Client Cache Issues

**Sympt\u00f4me :** Changements schema non pris en compte malgr\u00e9 `prisma generate`

```bash
# Force full regeneration
docker exec ark-epm_backend_1 sh -c "rm -rf node_modules/.prisma && npx prisma generate"

# Puis rebuild
docker exec ark-epm_backend_1 sh -c "rm -rf dist && npm run build"
docker restart ark-epm_backend_1
```

### Jest ES6 Import Errors

**Sympt\u00f4me :** `SyntaxError: Unexpected token 'export'` pour `uuid` ou packages ES6

**Solutions :**
1. **Pr\u00e9f\u00e9rer `crypto.randomUUID()`** (natif Node.js) \u2014 pas besoin d'import
2. Ou configurer Jest :
   ```json
   "jest": {
     "transformIgnorePatterns": [
       "node_modules/(?!(uuid|other-esm-package)/)"
     ]
   }
   ```

---

## 5. Validation Pipeline

```bash
# S\u00e9quence compl\u00e8te apr\u00e8s toute modification backend :
npm run build                    # Compilation TypeScript
npm test -- PATTERN              # Tests unitaires
npm run test:e2e                 # Tests e2e (optionnel)
docker restart ark-epm_backend_1 # Redeploy

# Quick API test
TOKEN=$(./scripts/get-token.sh)
curl http://localhost:3000/api/v1/<endpoint> -H "Authorization: Bearer $TOKEN" | jq
```

---

## 6. Database Verification

```bash
# V\u00e9rifier une table sp\u00e9cifique
docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "\d table_name"

# V\u00e9rifier colonnes avec defaults
docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "
  SELECT column_name, column_default, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'TABLE_NAME'
  ORDER BY ordinal_position;
"

# V\u00e9rifier les triggers
docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "
  SELECT trigger_name, event_manipulation, action_statement
  FROM information_schema.triggers
  WHERE event_object_table = 'table_name';
"
```

---

## 7. Docker Commands

```bash
# Rebuild full stack
docker-compose down && docker-compose up -d --build

# Backend only rebuild
docker exec ark-epm_backend_1 sh -c "rm -rf dist && npm run build"
docker restart ark-epm_backend_1

# Database shell
docker exec -it ark-epm_postgres_1 psql -U arkepm -d arkepm

# Logs
docker logs ark-epm_backend_1 -f
docker logs ark-epm_postgres_1 -f

# Prisma Studio
docker exec ark-epm_backend_1 npx prisma studio

# Re-seed (sans d\u00e9truire la base)
docker exec ark-epm_backend_1 npx ts-node prisma/seed.ts
```

> **Ne JAMAIS** ex\u00e9cuter `docker-compose down -v` \u2014 d\u00e9truit la base de donn\u00e9es.

---

## 8. Workflow Test Rapide

```bash
# 1. Get auth token
TOKEN=$(./scripts/get-token.sh)

# 2. Test POST
curl -X POST http://localhost:3000/api/v1/ENDPOINT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'

# 3. Test GET list
curl http://localhost:3000/api/v1/ENDPOINT \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

# 4. Test GET by ID
curl http://localhost:3000/api/v1/ENDPOINT/<uuid> \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Test PATCH
curl -X PATCH http://localhost:3000/api/v1/ENDPOINT/<uuid> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"updated"}'

# 6. Test DELETE
curl -X DELETE http://localhost:3000/api/v1/ENDPOINT/<uuid> \
  -H "Authorization: Bearer $TOKEN"
```
