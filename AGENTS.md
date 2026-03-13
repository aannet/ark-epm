# AGENTS.md - ARK-EPM Development Guide

AI agent guidance for ARK-EPM codebase (Enterprise Architecture Mapping tool).

> **Quick Checklist — Avant chaque session :**
> - [ ] Ambiguïté sur spec ? → 1 question max, puis exécuter
> - [ ] Modification UI prévue ? → Prévoir hard refresh navigateur
> - [ ] Bug malgré code correct ? → Vérifier cache TS/Navigateur 1er
> - [ ] Pas d'explication préalable → Code d'abord, résumer après

## Project Stack

- **Backend**: NestJS + Prisma ORM + PostgreSQL
- **Frontend**: React + Vite + TypeScript + ReactFlow + MUI
- **Database**: PostgreSQL 16 with audit trail triggers

---

## Commands

### Backend
```bash
cd backend
npm run start:dev     # hot reload (port 3000)
npm run build
npm start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

### Frontend
```bash
cd frontend
npm run dev           # hot reload (port 5173)
npm run build
npm run preview
```

### After UI Changes (Cache Issues)
```bash
# Hard refresh browser (systematic after CSS/React changes)
Ctrl + F5                    # Windows/Linux
Cmd + Shift + R              # Mac

# Restart VSCode TS Server (if unexplained import errors)
Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Docker
```bash
docker-compose up -d
docker-compose up -d --build
docker-compose down
```

> **⚠️ WARNING**: Never run `docker-compose down -v` — destroys the database. Re-seed: `docker exec ark-epm_backend_1 npx ts-node prisma/seed.ts`

---

## Code Style

### Import Order
1. External libraries (`@nestjs/common`, `prisma`)
2. Internal modules
3. Relative imports (grouped by depth)

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Files | PascalCase | `ApplicationService.ts` |
| Variables/Functions | camelCase | `getApplications()` |
| Classes | PascalCase | `ApplicationController` |
| Database tables | snake_case | `business_capabilities` |
| API endpoints | kebab-case | `/business-capabilities` |
| Constants | UPPER_SNAKE_CASE | `MAX_DEPTH = 5` |
| DTOs | CreateXxxDto, UpdateXxxDto | `CreateApplicationDto` |

### TypeScript
- Prefer `interface` for objects, `type` for unions
- Always use explicit return types
- Use strict null checks: `function findById(id: string): App | null`

### Error Handling
Use the global `HttpExceptionFilter` — never create custom error formats:
```typescript
throw new NotFoundException({ code: 'DOMAIN_NOT_FOUND', message: 'Le domaine n existe pas' });
```

### Prisma - CRITICAL
Always set user session before write operations:
```typescript
async setCurrentUser(userId: string): Promise<void> {
  await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;
}
await this.setCurrentUser(currentUserId);
await this.prisma.application.create({ data: { ... } });
```

### React/Frontend
- Functional components with explicit prop types
- Hooks first, then handlers, then render
- Use React Query/SWR for data fetching
- Use MUI components exclusively (no Tailwind)

### Logging
```typescript
private readonly logger = new Logger(MyService.name);
this.logger.log({ method: 'createApp', userId, result: id });
```

---

## Key Conventions

1. **Never commit secrets** - Use `.env`, add to `.gitignore`
2. **Always use UUIDs** - `gen_random_uuid()` for primary keys
3. **Audit trail** - Handled by PostgreSQL triggers, not app code
4. **Prisma schema** - Source of truth for TypeScript types
5. **Never hard-delete users** - Always soft delete via `isActive = false`
6. **API versioning** - All routes under `/api/v1/` prefix
7. **Pagination** - List endpoints use `PaginationQueryDto` with `{ data, meta }` response format

---

## Auth & Security

### Route Protection
`JwtAuthGuard` is global. Use `@Public()` decorator for public routes:
```typescript
@Public()
@Post('login')
login() { ... }
```

### Logout
`POST /auth/logout` → `204`, client deletes token. Frontend:
1. Call logout endpoint (ignore errors)
2. Clear token + user from state
3. Hard redirect to `/login`

### Permissions
Format: `<resource>:<action>` (e.g., `applications:read`, `domains:write`)

---

## Frontend Reference

### Design System
See `docs/03-Features-Spec/F01-Design-System.md`

Key points:
- MUI v5 only (no Tailwind)
- Theme: `src/theme/index.ts` — source of truth for colors/tokens
- Components: `@/components/layout`, `@/components/shared`, `@/components/error`
- Page pattern: `/<entity>s`, `/<entity>s/new`, `/<entity>s/:id`, `/<entity>s/:id/edit`

### i18n
See `docs/03-Features-Spec/F02-i18n.md`

Key points:
- File: `src/i18n/locales/fr.json`
- All visible strings via `t('key')` — never hardcoded
- Key format: `domain.page.element` (e.g., `common.actions.save`)

---

## File Structure
```
backend/src/
├── auth/                  # Login, JWT, logout
├── applications/          # CRUD
├── business-capabilities/ # recursive hierarchy
├── data-objects/
├── interfaces/            # unidirectional (source → target)
├── it-components/
├── providers/
├── users/
├── domains/
├── audit/
└── main.ts
```

---

## Communication Patterns

### Code First, Explain Later
- **Ne pas expliquer** avant de faire — modifier le code directement
- Résumer brièvement **après** l'action (1-2 phrases max)
- ❌ Éviter : "Je vais maintenant...", "Permettez-moi de...", "Je vais créer..."

### Spécifications UI
- Vérifier l'état visuel actuel avant toute modification CSS
- **Toujours mentionner** après changement styling : "Vérifiez dans le navigateur (Ctrl+F5 pour hard refresh)"
- Anticiper les problèmes de cache VSCode : "Si erreur import → Restart TS Server"

### Debugging
- Code semble correct mais comportement étrange ? → **Suggérer cache 1er**
  - VSCode : `Ctrl + Shift + P` → "TypeScript: Restart TS Server"
  - Navigateur : `Ctrl + F5` (hard refresh)
- Valider que le code source est correct avant d'approfondir sur les explications

### Ambiguïtés
- Clarifier immédiatement :
  - "Drawer readonly ou éditable ?"
  - "Quelles zones du tableau ouvrent le drawer ?"
  - "Style exact du lien (souligné ? couleur ?)"
- 1 question max, puis exécuter

### Concision
- Actions simples : 1 phrase ou juste le code
- Explications détaillées : uniquement pour décisions architecturales

---

## Anti-Patterns Learned

### UI Components
1. **Drawer PNS-02** : Toujours clarifier "readonly avec lien détail" vs "éditable inline"
2. **Zones de clic tableau** : Spécifier explicitement :
   - Nom = navigation directe (lien)
   - Corps = drawer
   - Actions = navigation édition/suppression
3. **Styling MUI** : Toujours vérifier `backgroundColor`, `color`, `z-index` après création composant

### Cache Issues
- VSCode TS Server : erreurs d'import fantômes après création fichiers
- Navigateur : comportements UI étranges malgré code correct
- **Solution** : Mentionner systématiquement hard refresh / restart TS Server
