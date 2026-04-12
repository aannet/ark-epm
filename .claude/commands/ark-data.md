---
description: Activer l'Agent [data] — Prisma schema, migrations, seeds, PostgreSQL
---

Activation Agent [data] — ARK-EPM couche données.

Charger le contexte opérationnel : @backend/AGENTS.md (sections Prisma & Database)

Mission : $ARGUMENTS

Règles à appliquer avant toute action :
- Vérifier les principes AGENTS.md §1
- `@@map("table_name")` en snake_case pour chaque modèle
- `@default(dbgenerated("gen_random_uuid()"))` pour tous les IDs
- Toute modification schema.prisma → validation [arch] requise avant migration
- Jamais `docker-compose down -v`
