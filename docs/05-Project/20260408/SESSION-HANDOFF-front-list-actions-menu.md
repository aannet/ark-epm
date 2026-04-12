# Handoff — Actions menus des listes frontend

## Ce qui a été fait

- Mise en place d'un composant partagé `RowActionsMenu` (`frontend/src/components/shared/RowActionsMenu.tsx`) avec menu à 3 points (`MoreVertIcon`) et trois actions :
  - `Voir les détails`
  - `Modifier`
  - `Supprimer`
- Export du composant depuis `frontend/src/components/shared/index.ts`.
- Ajout de la traduction `common.actions.view` dans `frontend/src/i18n/locales/fr.json`.
- Refactor des 6 vues de liste pour utiliser le composant partagé :
  - `ApplicationsListPage.tsx`
  - `BusinessCapabilitiesPage.tsx`
  - `ITComponentListPage.tsx`
  - `ProvidersListPage.tsx`
  - `DomainsListPage.tsx`
  - `DataObjectListPage.tsx`

## Points d'attention pour la suite

- Vérifier la cohérence visuelle de l'espacement/largeur de colonne après passage aux menus.
- Contrôler la lisibilité du libellé `Voir les détails` sur les écrans contraints.
- Valider la sélection clavier/accessibilité si un focus management est requis (pas encore vérifié).

## Gates validées / restantes

- ✅ Build frontend exécuté et valide (`npm run build` dans `frontend`).
- ✅ Commit créé : `2b0571b`.
- ⏳ Aucun test visuel/UX dédié n'a été ajouté pour ce refactor UI.
