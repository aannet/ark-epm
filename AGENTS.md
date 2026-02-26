# AGENTS.md - ARK-EPM Development Guide

AI agent guidance for ARK-EPM codebase (Enterprise Architecture Mapping tool).

## Project Stack

- **Backend**: NestJS + Prisma ORM + PostgreSQL
- **Frontend**: React + Vite + TypeScript + ReactFlow + MUI
- **Database**: PostgreSQL 16 with audit trail triggers

---

## Commands

### Backend
```bash
cd backend
npm run dev           # hot reload (port 3000)
npm run build         # TypeScript build
npm start             # production
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # GUI for database
```

### Frontend
```bash
cd frontend
npm run dev           # hot reload (port 5173)
npm run build         # production build
npm run preview       # preview production build
```

### Single Test
> No test framework installed. Install first:
> - Backend: `npm install --save-dev jest @types/jest ts-jest`, then `npx jest --testPathPattern=<pattern>`
> - Frontend: `npm install --save-dev vitest`, then `npx vitest run --testNamePattern=<pattern>`

### Docker
```bash
docker-compose up -d          # start all services
docker-compose up -d --build  # rebuild
docker-compose down           # stop
```

---

## Code Style

### Import Order
1. External libraries (`@nestjs/common`, `prisma`)
2. Internal modules
3. Relative imports (grouped by depth)

### Naming
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

### Error Handling (NestJS)
```typescript
throw new NotFoundException(`Application ${id} not found`);
throw new BadRequestException('Invalid input');
throw new InternalServerErrorException(`Failed: ${error.message}`);
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
- Use MUI components for consistency

### File Structure
```
backend/src/
├── applications/           # CRUD
├── business-capabilities/ # recursive hierarchy
├── data-objects/
├── interfaces/            # unidirectional (source → target)
├── it-components/
├── providers/
├── users/
├── domains/
├── audit/
├── prisma/
└── main.ts
```

### Linting (not configured)
Recommended: ESLint + Prettier with rules:
- `no-unused-vars`: error
- `prefer-const`: error
- `no-console`: warn (use logger)

### Logging
Use Winston with structured JSON:
```typescript
private readonly logger = new Logger(MyService.name);
this.logger.log({ method: 'createApp', userId, result: id });
```

---

## Key Conventions

1. **Never commit secrets** - Use `.env`, add to `.gitignore`
2. **Always use UUIDs** - `gen_random_uuid()` for primary keys
3. **Audit trail** - Handled by PostgreSQL triggers, not app code
4. **API contracts** - Define in `docs/openapi.yaml` before coding
5. **Prisma schema** - Source of truth for TypeScript types
6. **No external integrations** in MVP (keep dependencies minimal)

---

## Environment

```bash
# Backend (.env)
DATABASE_URL=postgresql://arkepm:arkepm@localhost:5432/arkepm
JWT_SECRET=<secret>
NODE_ENV=development

# Frontend (.env)
VITE_API_URL=http://localhost:3000
```
