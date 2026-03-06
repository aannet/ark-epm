# ARK EPM

Enterprise Architecture Mapping Tool

## Stack

- **Backend**: NestJS + Prisma + PostgreSQL 16
- **Frontend**: React + Vite + TypeScript + ReactFlow + MUI

## Quick Start

### With Docker (recommended)

```bash
# Start all services
docker-compose up -d

# Services
# - Backend: http://localhost:3000
# - Frontend: http://localhost:5173
# - Database: localhost:5432
```

> **⚠️ WARNING**: Never run `docker-compose down -v` in development — this destroys 
> the database volume and all data. If you accidentally do this, you must re-run 
> the seed to recreate the admin user:
> ```bash
> docker exec ark-epm_backend_1 npx ts-node prisma/seed.ts
> ```

### Local Development

```bash
# Stop Docker frontend first to avoid port conflict on 5173
docker stop ark-epm_frontend_1

# Backend
cd backend && npm install && npm run start:dev

# Frontend (in another terminal)
cd frontend && npm install
cp .env.example .env
npm run dev   # runs on http://localhost:5173
```

> **Tip**: If port 5173 is still in use, Vite will automatically use 5174.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_NAME=arkepm
DB_USER=arkepm
DB_PASSWORD=arkepm

# Backend
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
JWT_SECRET=change_me_min_32_chars
JWT_EXPIRES_IN=8h
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Frontend (required for local dev; docker-compose sets this automatically)
VITE_API_BASE_URL=http://localhost:3000
```

> **Note**: The frontend has a fallback to `http://localhost:3000` for convenience, but for proper local development, create a `.env` file with `VITE_API_BASE_URL` configured.

## Convention: Audit Context

**Critical**: Every write operation must set the audit context:

```typescript
await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;
await this.prisma.application.create({ data: { ... } });
```

This ensures `audit_trail.changed_by` is populated correctly.

## Project Structure

```
backend/src/
├── prisma/           # PrismaService (global)
├── common/
│   ├── guards/       # JwtAuthGuard
│   ├── middleware/   # AuditContextMiddleware
│   └── decorators/   # @Public()
├── applications/     # FS-06
├── business-capabilities/  # FS-07
├── data-objects/     # FS-05
├── interfaces/       # FS-08
├── it-components/    # FS-04
├── providers/        # FS-03
├── domains/          # FS-02
├── users/            # FS-01
└── audit/           # PostgreSQL triggers
```
