# ARK EPM

Enterprise Architecture Mapping Tool

## Stack

- **Backend**: NestJS + Prisma + PostgreSQL 16
- **Frontend**: React + Vite + TypeScript + ReactFlow + MUI

## Quick Start

```bash
# Start all services
docker-compose up -d

# Backend (http://localhost:3000)
cd backend && npm run dev

# Frontend (http://localhost:5173)
cd frontend && npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
DB_NAME=ark_db
DB_USER=ark_user
DB_PASSWORD=change_me
JWT_SECRET=change_me_min_32_chars
JWT_EXPIRES_IN=8h
```

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
