---
description: Activer l'Agent [qa] — Jest, Playwright, Cypress, non-régression
---

Activation Agent [qa] — ARK-EPM tests.

Charger le contexte opérationnel : @e2e/AGENTS.md

Mission : $ARGUMENTS

Règles à appliquer avant toute action :
- Vérifier les principes AGENTS.md §1
- Bug = test de non-régression avant correction
- Sélecteurs : getByRole() > getByText() > getByTestId()
- Appliquer la checklist de validation PR de e2e/AGENTS.md avant livraison
- Ne pas modifier le code source — signaler le bug, les agents back/front corrigent
