# SESSION-HANDOFF — front — T-065 (2026-04-21)

## Tâche
T-065 — Retravailler design de la vue détail d'une Application

## Ce qui a été fait

### Code
- **`ApplicationDetailPage.tsx`** : refonte complète
  - Layout 2 colonnes (main `md=8` + sidebar `md=4`), `maxWidth="xl"`
  - Header enrichi : Avatar (initiale), nom h2, domaine en sous-titre, chips criticité/lifecycle inline, bouton Modifier
  - 3 tabs : Informations générales / Interfaces (placeholder) / Assessment (LifecycleStepper)
  - Owner déplacé dans section "Informations générales"
  - Commentaire + tags + métadonnées → sidebar droite
  - Providers : cards grille 2 cols avec rôle (RelationCard cliquable, chevron `>`)
  - IT Components : cards grille 2 cols (RelationCard cliquable, chevron `>`)
  - Business Capabilities : chips cliquables
  - Domaine : ClickableRow avec chevron
  - Composants internes au fichier : `DetailRow`, `ClickableRow`, `RelationCard`

### i18n
- `fr.json` : +4 clés (`detail.tabs.general`, `detail.tabs.interfaces`, `detail.tabs.assessment`, `detail.phaseActuelle`)

### Specs
- `FS-06-Applications-front.md` §4.2 : Layout Contract réécrit (v1.3)
- `FS-06-Applications-US.md` : section DETAIL étendue (3 onglets, layout 2 colonnes)

### Validation
- `tsc --noEmit` : 0 erreur
- `npm run build` : succès
- Commit : `feat(front): T-065 — Redesign ApplicationDetailPage`

## Points d'attention

1. **Tabs placeholders** — Interfaces et Assessment sont des placeholders. Le tab Assessment contient le LifecycleStepper (déplacé depuis l'ancien tab 0). Le tab Interfaces affiche `common.comingSoon` en attendant FS-08.

2. **Pas d'identifiant** — Décision : pas de champ IDENTIFIANT dans la sidebar (exclu du mockup).

3. **Provider roles i18n** — Les rôles providers utilisent `t('applications.roles.${role}')` avec fallback sur la valeur brute si la clé n'existe pas. Les clés existantes dans `fr.json` : editor, integrator, support, vendor, custom.

4. **Pas de box amber** — Commentaire interne en style standard (label + valeur), pas de mise en évidence colorée.

5. **Drawer non modifié** — `ApplicationDrawer.tsx` n'a pas été touché. Il reste conforme au pattern PNS-02 read-only. Les 2 composants partagent les mêmes clés i18n `applications.detail.*`.

## Gates validées
- FS-06-BACK done
- FS-06-FRONT done (spec stable, implémentation livrée)
- Build + tsc OK

## Gates restantes
- Validation visuelle sur navigateur (Ctrl+F5 après déploiement)
- Vérifier responsive mobile (colonnes empilées en `xs=12`)
