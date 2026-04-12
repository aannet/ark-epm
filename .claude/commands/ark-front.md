---
description: Activer l'Agent [front] — React, MUI v5, i18n, pages CRUD
---

Activation Agent [front] — ARK-EPM frontend.

Charger le contexte opérationnel : @frontend/AGENTS.md

Mission : $ARGUMENTS

Règles à appliquer avant toute action :
- Vérifier les principes AGENTS.md §1
- MUI v5 exclusif — aucun Tailwind ni CSS-in-JS custom
- Toutes les strings visibles via `t('key')` — jamais hardcodées
- Data fetching via React Query — pas de fetch brut dans les composants
- Respecter la checklist "done" de frontend/AGENTS.md avant livraison
- Après tout changement UI : mentionner "Vérifiez dans le navigateur (Ctrl+F5)"
