---
description: Activer l'Agent [back] — NestJS, DTOs, auth, RBAC
---

Activation Agent [back] — ARK-EPM backend.

Charger le contexte opérationnel : @backend/AGENTS.md

Mission : $ARGUMENTS

Règles à appliquer avant toute action :
- Vérifier les principes AGENTS.md §1
- Respecter la checklist et les patterns de backend/AGENTS.md
- Format endpoint : `GET|POST|PATCH|DELETE /api/v1/<entity-kebab>`
- Toujours `SET LOCAL ark.current_user_id` avant toute écriture Prisma
- DTOs : CreateXxxDto / UpdateXxxDto / QueryXxxDto
