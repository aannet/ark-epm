
_Version 0.4 — Février 2026 — Basé sur Brief v0.5_

> **Changelog v0.4 :** Remplacement de TypeORM par **Prisma** comme ORM principal — meilleure DX et typage TypeScript pour OpenCode. Convention de middleware `$executeRaw` documentée pour l'injection de session `ark.current_user_id`. Structure projet mise à jour (`prisma/` à la racine du backend).

---

## Principes directeurs

Ce setup applique trois règles tirées du brief : **pas d'intégration externe en MVP**, **stack homogène TypeScript**, **déploiement le plus simple possible**. Chaque outil ajouté doit justifier sa présence au regard du scope P1.

---

## 1. Poste de travail

Installer uniquement :

- **Docker Desktop** + Docker Compose — orchestration des 3 services MVP
- **Node.js 20 LTS** — runtime commun frontend et backend (stack TypeScript unifiée)
- **VS Code** avec les extensions : ESLint, Prettier, Docker, REST Client (pour tester l'API directement dans VS Code sans Postman)
- **Git**

> ❌ Retiré du setup original : extension **Azure Tools** — aucune intégration Azure prévue, Azure Application Insights est explicitement hors périmètre (Brief §7).

---

## 2. Structure du projet

```
ark-epm/
├── backend/
│   ├── src/
│   ├── prisma/
│   │   ├── schema.prisma       ← modèle Prisma (source de vérité TypeScript)
│   │   └── migrations/         ← migrations versionnées générées par Prisma
│   ├── Dockerfile              ← colocalisé avec le service
│   └── package.json
├── frontend/
│   ├── src/
│   ├── Dockerfile              ← colocalisé avec le service
│   └── package.json
├── scripts/
│   └── import-excel/           ← scripts utilitaires de migration
├── docs/
│   ├── openapi.yaml            ← contrat API défini en amont (approche API-first)
│   └── 04-Tech/schema.sql              ← schéma PostgreSQL versionné (v0.4) — référence SQL des triggers
├── docker-compose.yml          ← à la racine
└── .env.example
```

> ❌ Retiré du setup original : dossier `docker/` séparé. Les Dockerfiles sont colocalisés avec leur service pour éviter les problèmes de contexte de build Docker (chemins relatifs cassés).

> 💡 `docs/04-Tech/schema.sql` reste la référence pour les triggers PostgreSQL (audit trail), qui sont hors périmètre de Prisma. Lors du premier déploiement, les triggers sont appliqués manuellement ou via un script d'init séparé.

---

## 3. Backend — NestJS

Initialiser avec la CLI NestJS en TypeScript :

```bash
npx @nestjs/cli new backend --strict
```

Organiser les modules par domaine métier (cohérent avec le Brief §6) :

```
src/
├── applications/
├── business-capabilities/  ← récursion parent/enfant illimitée
├── data-objects/
├── interfaces/             ← relations unidirectionnelles Source → Cible
├── it-components/
├── providers/
├── domains/                ← entité Domaine créée dès P1, droits par domaine en P2
├── users/
└── audit/                  ← audit trail géré par triggers PostgreSQL (base autonome)
```

Dépendances P1 :

```bash
# ORM — Prisma (remplace TypeORM)
npm install prisma @prisma/client
npx prisma init          # génère backend/prisma/schema.prisma + .env

# Documentation API
npm install @nestjs/swagger swagger-ui-express

# Configuration
npm install @nestjs/config

# Authentification (Bcrypt + JWT — Brief §3.1 & §5)
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install bcrypt
npm install -D @types/bcrypt @types/passport-jwt @types/passport-local

# Logging structuré
npm install nest-winston winston
```

Logging : **Winston** via `nest-winston`, logs structurés JSON. Simple, self-hostable, sans dépendance externe.

> ❌ Retiré : **Azure Application Insights** — explicitement hors périmètre (Brief §5 et §7). Un logger JSON local est suffisant pour 5 utilisateurs.

### Points de modélisation critiques

**Business Capabilities — récursion SQL illimitée**

La hiérarchie parent/enfant est **illimitée en profondeur** — la contrainte de 5 niveaux initialement envisagée a été levée. La modélisation reste par auto-référence sur la même table :

```sql
CREATE TABLE business_capabilities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  parent_id   UUID REFERENCES business_capabilities(id) ON DELETE SET NULL,
  domain_id   UUID REFERENCES domains(id),
  -- ...autres attributs
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

> L'UI pourra afficher un avertissement au-delà d'une profondeur recommandée (ex. 5 niveaux), sans blocage en base.

**Interfaces — relation unidirectionnelle, pas de contrainte UNIQUE globale**

Une Interface est toujours Source → Cible. Une relation bidirectionnelle = deux enregistrements distincts. Pas de contrainte UNIQUE globale sur (source, cible, type) — plusieurs interfaces distinctes peuvent coexister entre deux mêmes applications (ex : deux contrats API avec SLA différents).

```sql
CREATE TABLE interfaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_app_id   UUID NOT NULL REFERENCES applications(id),
  target_app_id   UUID NOT NULL REFERENCES applications(id),
  type            VARCHAR(50) NOT NULL CHECK (type IN ('api', 'batch', 'message')),
  latency_ms      INTEGER,         -- présent en base, alimenté en P2
  error_rate      DECIMAL(5,2),    -- présent en base, alimenté en P2
  -- ...autres attributs
);
```

**Audit trail — délégation aux triggers PostgreSQL**

L'audit trail est entièrement géré par des triggers PostgreSQL (fonction `fn_audit_trigger`). Prisma ne connaît pas ces triggers — le backend NestJS positionne la variable de session via `$executeRaw` dans un middleware global, avant chaque opération :

```typescript
// Dans un PrismaMiddleware NestJS global :
await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;
// puis l'opération Prisma normale
await prisma.application.create({ data: { ... } });
```

> ⚠️ Convention critique : toute opération d'écriture doit passer par ce middleware. Sans lui, `changed_by` sera NULL dans `audit_trail`. À documenter dans le README du projet et à vérifier en code review.

**Relations n:n — Data Objects & IT Components**

Les liaisons application ↔ data object et application ↔ IT component sont portées par des tables de jonction dédiées avec une colonne de rôle :

```sql
-- app_data_object_map.role : 'consumer' | 'producer' | 'owner'
-- app_it_component_map : simple liaison sans attribut de rôle
```

---

## 4. Frontend — React + TypeScript

Initialiser avec Vite :

```bash
npm create vite@latest frontend -- --template react-ts
```

Dépendances P1 :

```bash
# Visualisation graphe de dépendances
npm install reactflow

# Requêtes API
npm install axios

# Composants UI
npm install @mui/material @emotion/react @emotion/styled

# Upload et parsing Excel (import des inventaires existants — Brief §3.1)
npm install xlsx
```

> ⚠️ Brief §8 : réaliser un POC React Flow sur données réelles avant de valider définitivement. Des **filtres de vue** seront nécessaires pour gérer la complexité du graphe — détail à définir lors d'un atelier dédié (voir §7). Les librairies vis.js ou d3 restent des alternatives selon les écrans.

---

## 5. Base de données — PostgreSQL standard

Utiliser **PostgreSQL 16** sans extension graphe.

```bash
# Dans docker-compose.yml — service postgres standard
image: postgres:16-alpine
```

Le schéma relationnel couvre 100% des besoins P1 : applications, interfaces (unidirectionnel), Business Capabilities (auto-référence récursive illimitée), entité Domaine, liaisons n:n Data Objects et IT Components, audit trail par triggers. Aucune extension graphe nécessaire à ce stade.

> ❌ Retiré : **Apache AGE** (extension graphe PostgreSQL). Le Brief §5 indique explicitement "base graphe non retenue à ce stade". À réévaluer en P3 si le data lineage devient un sujet.

---

## 6. Docker Compose — 3 services, pas un de plus

```yaml
# docker-compose.yml
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
      - ./docs/04-Tech/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Démarrage en une commande :

```bash
docker-compose up -d
```

> ❌ Retirés du setup original : **n8n** (notifications hors périmètre — Brief §7) et **pgAdmin** (outil dev uniquement).

> 💡 pgAdmin peut être ajouté en dev via `docker-compose.dev.yml` sans polluer l'image de production.

---

## 7. Ordre de démarrage recommandé

En travaillant à rebours depuis l'objectif (livrer un MVP en < 3 mois avec 1 développeur + OpenCode) :

|Étape|Action|Pourquoi en premier|
|---|---|---|
|**1**|✅ Définir `docs/04-Tech/schema.sql` — 6 objets P1 + auto-référence Business Capabilities + tables de liaison n:n + entité Domaine + audit trail par triggers|Fait. schema.sql v0.4 stable.|
|**2**|Définir `docs/04-Tech/openapi.yaml` — contrat API complet avant de coder|API-first. OpenCode génère un meilleur code NestJS à partir d'un contrat OpenAPI explicite.|
|**3**|POC React Flow sur données réelles|Valider la visualisation avant d'investir dans le frontend.|
|**4**|Atelier filtres de vue du graphe|Définir les dimensions de filtrage (domaine, criticité, type d'interface…) avant de coder le composant — évite un refactoring coûteux.|
|**5**|Scaffolding NestJS par domaine|Générer les modules CRUD avec OpenCode à partir du contrat OpenAPI. Initialiser le PrismaService partagé. Ajouter le middleware `$executeRaw ark.current_user_id` dès le départ.|
|**6**|Scaffolding React (écrans CRUD)|Inventaire applicatif + fiche application en priorité.|
|**7**|Spécifier le format d'import Excel|Définir le mapping colonnes Excel → modèle de données, et la logique de validation côté backend.|

---

_Document de travail v0.4 — À valider en atelier de cadrage_