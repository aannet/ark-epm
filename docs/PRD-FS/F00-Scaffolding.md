# ARK — Feature Spec F-00 : Scaffolding Projet

_Version 0.1 — Février 2026_

> **Usage :** Ce document est la spec de fondation du projet ARK. Il est réalisé **entièrement manuellement** — aucune génération OpenCode. C'est le socle sur lequel toutes les Feature-Specs suivantes s'appuient. Une erreur ici se propage dans tout le MVP.

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | F-00 |
| **Titre** | Scaffolding Projet — NestJS + Prisma + Docker + JWT + middleware `ark.current_user_id` |
| **Priorité** | P1 |
| **Statut** | `draft` |
| **Dépend de** | — *(spec racine, aucune dépendance)* |
| **Estimé** | 2 jours |
| **Version** | 0.1 |
| **Mode** | 🟡 Manuel — **ne pas déléguer à OpenCode** |

---

## 1. Objectif & Périmètre ⚠️

**Ce que cette feature fait :**

F-00 établit le squelette technique complet du projet ARK. À l'issue de cette phase, un `docker-compose up -d` doit démarrer les 3 services (PostgreSQL, NestJS backend, React frontend), Prisma doit se connecter à la base, les guards JWT doivent être fonctionnels, et le middleware d'audit `ark.current_user_id` doit être en place. C'est la condition de départ de toutes les Feature-Specs suivantes.

Analogie : F-00, c'est couler les fondations et monter la charpente avant de poser les murs. On ne code pas une seule route métier ici — on installe les rails sur lesquels tout le reste va rouler.

**Ce qu'elle ne fait pas (hors périmètre) :**

- Aucune route métier (auth, CRUD) — c'est FS-01 et suivantes
- Pas de schéma Prisma complet — uniquement le `PrismaService` partagé et l'initialisation
- Pas de composants React — uniquement le scaffolding Vite + structure dossiers
- Pas de SSO, pas de droits différenciés par domaine (P2)
- Pas de données de seed (optionnel, voir section 8)

---

## 2. Structure du Projet ⚠️

Arborescence cible à l'issue de F-00 :

```
ark-epm/
├── backend/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts       ← Module Prisma partagé (global)
│   │   │   └── prisma.service.ts      ← PrismaService + middleware $executeRaw
│   │   ├── common/
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts  ← Guard JWT réutilisable par tous les modules
│   │   │   └── middleware/
│   │   │       └── audit-context.middleware.ts ← SET LOCAL ark.current_user_id
│   │   ├── applications/              ← dossier vide, prêt pour FS-06
│   │   ├── business-capabilities/    ← dossier vide, prêt pour FS-07
│   │   ├── data-objects/             ← dossier vide, prêt pour FS-05
│   │   ├── interfaces/               ← dossier vide, prêt pour FS-08
│   │   ├── it-components/            ← dossier vide, prêt pour FS-04
│   │   ├── providers/                ← dossier vide, prêt pour FS-03
│   │   ├── domains/                  ← dossier vide, prêt pour FS-02
│   │   ├── users/                    ← dossier vide, prêt pour FS-01
│   │   └── audit/                    ← dossier vide (triggers PostgreSQL autonomes)
│   ├── prisma/
│   │   ├── schema.prisma             ← Source de vérité TypeScript (P1 complet)
│   │   └── migrations/               ← Généré par `prisma migrate dev`
│   ├── Dockerfile
│   ├── .env                          ← Jamais commité — copie de .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── api/
│   │       └── client.ts             ← Instance Axios configurée (baseURL + token JWT)
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── schema.sql                    ← v0.4 — référence SQL + triggers d'audit
│   └── openapi.yaml                  ← Contrat API (enrichi sprint par sprint)
├── docker-compose.yml
├── docker-compose.dev.yml            ← Optionnel : pgAdmin en dev uniquement
├── .env.example
└── README.md
```

---

## 3. Contrat de Configuration ⚠️

### 3.1 Variables d'environnement — `.env.example`

```bash
# Base de données
DB_NAME=ark_db
DB_USER=ark_user
DB_PASSWORD=change_me_in_production

# Backend
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
JWT_SECRET=change_me_in_production_min_32_chars
JWT_EXPIRES_IN=8h
NODE_ENV=development

# Frontend (optionnel — Vite expose via import.meta.env)
VITE_API_BASE_URL=http://localhost:3000/api
```

> ⚠️ `.env` ne doit **jamais** être commité. Ajouter au `.gitignore` dès F-00.

### 3.2 `docker-compose.yml`

```yaml
version: '3.9'

services:

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docs/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      NODE_ENV: ${NODE_ENV}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 4. Règles de Mise en Œuvre Critiques ⚠️

### RM-01 : `PrismaService` est un module global partagé

Le `PrismaModule` doit être déclaré `@Global()`. Tous les autres modules l'importent sans re-déclarer la connexion. Il n'y a qu'un seul `PrismaClient` instancié dans tout le backend.

```typescript
// prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### RM-02 : Le middleware `ark.current_user_id` est global et précoce

Le middleware qui positionne `SET LOCAL ark.current_user_id` doit être appliqué **à toutes les routes** dès F-00. Sans lui, la colonne `changed_by` de `audit_trail` sera NULL sur toutes les écritures. Il doit extraire l'UUID depuis le token JWT décodé.

```typescript
// common/middleware/audit-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = this.jwt.verify<{ sub: string }>(token);
        // SET LOCAL est scoped à la transaction courante
        await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${payload.sub}`;
      } catch {
        // Token invalide ou absent — l'audit_trail.changed_by sera NULL
        // L'authentification est gérée par JwtAuthGuard, pas ici
      }
    }
    next();
  }
}
```

> ⚠️ Convention critique documentée dans le README : **toute opération d'écriture doit être précédée de ce middleware**. À vérifier en code review systématiquement.

### RM-03 : `JwtAuthGuard` est le guard par défaut sur toutes les routes protégées

Déclarer le guard globalement dans `AppModule` avec `APP_GUARD`. Les routes publiques (ex: `POST /auth/login`) sont exemptées via un décorateur `@Public()`.

```typescript
// app.module.ts — guard global
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

```typescript
// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```typescript
// jwt-auth.guard.ts — lecture du décorateur @Public()
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### RM-04 : `schema.prisma` P1 complet dès F-00

Le `schema.prisma` doit refléter **l'intégralité** du schéma P1 défini dans `docs/schema.sql` v0.4. Ne pas le fragmenter feature par feature — Prisma est la source de vérité TypeScript unique. Les migrations sont générées par `prisma migrate dev`.

> ⚠️ Les triggers d'audit définis dans `schema.sql` sont **hors périmètre Prisma**. Ils sont appliqués via le volume Docker `./docs/schema.sql:/docker-entrypoint-initdb.d/schema.sql` au premier démarrage de PostgreSQL.

### RM-05 : Jamais de `prisma migrate dev` sans relire la migration générée

Avant d'appliquer toute migration Prisma, lire le fichier SQL généré dans `prisma/migrations/`. Une migration destructive (DROP TABLE, DROP COLUMN) ne se rattrape pas en production.

---

## 5. Comportement Attendu — Gate de Sortie F-00

La phase F-00 est terminée quand **tous** ces points sont verts :

| # | Validation | Commande / Action |
|---|---|---|
| G-01 | `docker-compose up -d` démarre sans erreur | `docker-compose up -d && docker-compose ps` |
| G-02 | PostgreSQL accepte les connexions | `docker exec ark-postgres pg_isready -U ark_user` |
| G-03 | `schema.sql` v0.4 appliqué — tables et triggers présents | `\dt` dans psql + vérifier `audit_trail` |
| G-04 | Prisma se connecte à PostgreSQL | `npx prisma db pull` sans erreur depuis `backend/` |
| G-05 | `schema.prisma` P1 complet — première migration générée | `npx prisma migrate dev --name init` |
| G-06 | `npm run start:dev` démarre le backend NestJS sur port 3000 | `curl http://localhost:3000/api/health` → `200 OK` |
| G-07 | Middleware `ark.current_user_id` actif — log de debug visible | Requête avec token JWT → vérifier `SET LOCAL` dans les logs |
| G-08 | `JwtAuthGuard` bloque les routes sans token | `curl http://localhost:3000/api/domains` → `401 Unauthorized` |
| G-09 | Frontend Vite démarre sur port 80 | `curl http://localhost` → page React |
| G-10 | POC React Flow concluant sur données fictives hardcodées | Valider visuellement — go/no-go avant FS-09 |
| G-11 | Requête `WITH RECURSIVE` validée en SQL pur sur PostgreSQL | Exécuter le script de test (voir section 8) |

---

## 6. Composants Frontend — Scaffolding Minimal

Pas de composants métier à ce stade. Uniquement :

**Client Axios centralisé :**

```typescript
// frontend/src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
});

// Injection automatique du token JWT dans chaque requête
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('ark_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

> Note : `sessionStorage` est utilisé ici pour simplifier le scaffolding. FS-01 (Auth) définira la stratégie définitive de stockage du token (mémoire React state vs sessionStorage vs httpOnly cookie).

---

## 7. Tests Attendus

À ce stade, pas de tests unitaires ou e2e — ce sont des fondations. Les validations sont manuelles (Gate de sortie §5).

**Vérification manuelle du middleware audit :**
```sql
-- Après avoir fait une requête authentifiée qui écrit en base :
SELECT changed_by, action, entity_type, occurred_at
FROM audit_trail
ORDER BY occurred_at DESC
LIMIT 5;
-- changed_by doit être non NULL si le token JWT est valide
```

**Test `WITH RECURSIVE` à valider avant FS-07 :**
```sql
-- Insérer des données de test dans business_capabilities
WITH RECURSIVE capability_tree AS (
  -- Ancre : racines (pas de parent)
  SELECT id, name, parent_id, 1 AS depth
  FROM business_capabilities
  WHERE parent_id IS NULL

  UNION ALL

  -- Récursion : enfants
  SELECT bc.id, bc.name, bc.parent_id, ct.depth + 1
  FROM business_capabilities bc
  INNER JOIN capability_tree ct ON bc.parent_id = ct.id
)
SELECT * FROM capability_tree ORDER BY depth, name;
-- Doit retourner l'arbre complet sans boucle infinie
```

---

## 8. Contraintes Techniques

- **NestJS strict mode :** `npx @nestjs/cli new backend --strict` — TypeScript strict activé dès le départ
- **Prisma comme ORM unique :** pas de TypeORM, pas de requêtes SQL directes sauf `$executeRaw` / `$queryRaw` pour les cas spécifiques (audit context, WITH RECURSIVE)
- **`schema.prisma` = source de vérité TypeScript :** ne jamais modifier la base manuellement sans passer par une migration Prisma
- **Triggers PostgreSQL appliqués via Docker init :** `./docs/schema.sql` est monté dans `docker-entrypoint-initdb.d/` — exécuté automatiquement au premier démarrage du container PostgreSQL
- **3 services Docker, pas un de plus en production :** pgAdmin est optionnel via `docker-compose.dev.yml` uniquement
- **`.env` jamais commité :** à ajouter au `.gitignore` dès l'init du repo

---

## 9. Ordre d'Exécution Recommandé

| # | Action | Commande |
|---|---|---|
| 1 | Init repo Git + `.gitignore` | `git init && echo ".env\nnode_modules\ndist" >> .gitignore` |
| 2 | Créer la structure de dossiers racine | `mkdir -p backend frontend docs scripts/import-excel` |
| 3 | Copier `schema.sql` v0.4 dans `docs/` | — |
| 4 | Créer `.env.example` et `.env` | Voir section 3.1 |
| 5 | Créer `docker-compose.yml` | Voir section 3.2 |
| 6 | Scaffolding NestJS | `cd backend && npx @nestjs/cli new . --strict` |
| 7 | Installer les dépendances backend P1 | Voir section ci-dessous |
| 8 | `npx prisma init` dans `backend/` | Génère `prisma/schema.prisma` + `.env` backend |
| 9 | Rédiger `schema.prisma` P1 complet | Traduire `schema.sql` v0.4 en Prisma |
| 10 | Créer `PrismaModule` + `PrismaService` | Voir RM-01 |
| 11 | Créer `AuditContextMiddleware` | Voir RM-02 |
| 12 | Configurer `JwtAuthGuard` global + `@Public()` | Voir RM-03 |
| 13 | Créer les dossiers domaine vides (`applications/`, etc.) | — |
| 14 | Scaffolding React + Vite | `cd frontend && npm create vite@latest . -- --template react-ts` |
| 15 | Installer les dépendances frontend P1 | Voir section ci-dessous |
| 16 | Créer `api/client.ts` | Voir section 6 |
| 17 | `docker-compose up -d` | Valider tous les points du Gate §5 |

**Dépendances backend P1 à installer :**
```bash
npm install prisma @prisma/client
npm install @nestjs/swagger swagger-ui-express
npm install @nestjs/config
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install bcrypt
npm install nest-winston winston
npm install -D @types/bcrypt @types/passport-jwt @types/passport-local
npx prisma init
```

**Dépendances frontend P1 à installer :**
```bash
npm install reactflow axios @mui/material @emotion/react @emotion/styled xlsx
```

---

## 10. Checklist de Validation F-00

- [ ] Repo Git initialisé, `.env` absent du tracking, `.env.example` commité
- [ ] `docker-compose up -d` : 3 services healthy
- [ ] `schema.sql` v0.4 appliqué en base (tables + triggers vérifiés)
- [ ] `schema.prisma` P1 complet — migration `init` générée et appliquée
- [ ] `PrismaModule` global instancié, `PrismaService` injectable
- [ ] Middleware `AuditContextMiddleware` enregistré globalement dans `AppModule`
- [ ] `JwtAuthGuard` global — routes sans token retournent `401`
- [ ] Décorateur `@Public()` fonctionnel — route `/health` accessible sans token
- [ ] Client Axios frontend configuré avec intercepteur JWT
- [ ] **POC React Flow concluant** — go/no-go validé (gate pour FS-09)
- [ ] **Requête `WITH RECURSIVE` validée en SQL pur** (gate pour FS-07)
- [ ] README rédigé — convention `$executeRaw ark.current_user_id` documentée

---

## 11. Commande OpenCode

> F-00 est réalisé **manuellement**. Il n'y a pas de commande OpenCode pour cette phase. Les tâches sont trop sensibles (sécurité, conventions transverses, socle architectural) pour être déléguées.
>
> En revanche, une fois F-00 terminé, utiliser ce bloc en début de **chaque** session OpenCode pour les sprints suivants :

```
Contexte projet ARK :
- Stack : NestJS strict + Prisma + PostgreSQL 16 + React + TypeScript strict
- Toute écriture en base passe par : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- Structure modules : src/<domaine>/<domaine>.module.ts / .service.ts / .controller.ts
- PrismaModule est global — ne pas le réimporter dans chaque module
- JwtAuthGuard est global — décorer avec @Public() les routes publiques uniquement
- Pattern de référence : module Domains (FS-02) une fois disponible

Implémente la feature "[TITRE]" ([ID]) en respectant strictement le contrat ci-dessous.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.
```

---

_Feature Spec F-00 v0.1 — Projet ARK — Document de travail, à valider avant démarrage_

> **Probabilité que ce scaffolding couvre l'intégralité des besoins P1 sans ajustement : ~75%.** Les points d'incertitude résiduels sont le comportement de `SET LOCAL` sous Prisma en mode connection pool (à tester en G-07), et le rendu React Flow sur données denses (résolu par le POC G-10).