
## Synthèse des décisions FS-09

| # | Décision | Valeur retenue |
|---|---|---|
| D1 | Modèle de visualisation | Option B : multi-couche avec toggle + Interfaces comme arêtes |
| D2 | Point d'entrée primaire | Depuis une entité connue (bouton "Voir dans le graphe") |
| D3 | Entrée menu autonome | Canvas vide + Autocomplete focal |
| D4 | Nœud focal | Tout type d'entité ARK |
| D5 | Périmètre BC focal | Expansion récursive (enfants L2/L3 inclus) |
| D6 | Périmètre App focal | Profondeur configurable slider 1/2/3, défaut 1 |
| D7 | Endpoint backend | `GET /graph?focalType=&focalId=&depth=&layers=` |
| D8 | Format nœud | Minimal (id, type, isFocal, label, meta) |
| D9 | Drawer au clic nœud | PNS-02 identique, second appel API à la volée |
| D10 | Layout algorithm | Dagre par défaut (P1) — switch ELK / Force-directed P2 |
| D11 | Rendu nœuds | Forme + couleur par type, focal bordure épaisse |
| D12 | Domain | GroupNode conteneur → **P2** |
| D13 | Couches par défaut | Apps + Interfaces ON, reste OFF |
| D14 | Toolbar | Focal selector, toggle couches, filtre criticité, filtre domaine, depth slider, zoom, fit |
| D15 | Export Mermaid | **P2** |
| D16 | Graphe vide | Nœud focal seul + Alert discret |
| D17 | Graphe dense | Warning > 150 nœuds (client-side), pas de cap dur |
| D18 | Navigation focale | Historique ← → (useState) → **P2** |
| D19 | Deep linking complet | Query params encodent focal + couches + filtres + depth → **P2 (basique P1)** |

---

## User Stories P1 — Implémentation T-003

---

### US-01 — Ouverture contextuelle depuis une entité

En tant qu'Architecte Entreprise,
Je veux cliquer sur "Voir dans le graphe" depuis la fiche d'une entité ARK (Application, Business Capability, Domain, Provider, IT Component, Data Object),
Afin d'ouvrir immédiatement le graphe centré sur cette entité sans perdre mon contexte de navigation.

**Critères d'acceptation :**
- Bouton "Voir dans le graphe" présent sur les pages détail (scope : tâche future — hors T-003)
- Le graphe s'ouvre avec `focalType` et `focalId` correspondants pré-remplis (via URL params)
- Les couches par défaut sont actives selon D13
- La profondeur par défaut est 1
- L'URL reflète le focal + couches + depth
- Permission requise : `applications:read`

---

### US-02 — Ouverture depuis le menu (canvas vide)

En tant qu'Architecte Entreprise,
Je veux accéder au graphe de dépendances depuis le menu de navigation principal,
Afin d'explorer librement le SI en choisissant mon point de départ.

**Critères d'acceptation :**
- Entrée "Graphe" dans la sidebar de navigation
- À l'ouverture sans paramètres : canvas vide + Autocomplete MUI local centré ("Rechercher une application, un domaine, une capacité...")
- L'Autocomplete propose des options pré-chargées (pas d'appel FS-11 omnisearch)
- Sélection d'une entité → charge le graphe (même comportement que US-01)
- URL mise à jour avec les query params au chargement

---

### US-03 — Visualisation du graphe centré sur une Application

En tant qu'Architecte Entreprise,
Je veux visualiser les dépendances d'une application sous forme de graphe interactif,
Afin de comprendre d'un coup d'œil ses connexions avec le reste du SI.

**Critères d'acceptation :**
- Nœud focal affiché avec bordure épaisse `primary.main`, centré dans le canvas
- Couches actives par défaut : Applications voisines (reliées par Interface) + Interfaces comme arêtes orientées
- Arête Interface affiche : nom, type (`REST`, `BATCH_FILE`...), criticité (couleur)
- Nœuds Applications voisins à profondeur 1 affichés (selon slider)
- Layout Dagre appliqué automatiquement
- `Alert` discret si aucune relation visible : "Aucune relation visible avec les couches actives."

---

### US-04 — Visualisation du graphe centré sur une Business Capability

En tant qu'Architecte Entreprise,
Je veux visualiser toutes les applications qui supportent une capacité métier et sa sous-arborescence,
Afin d'évaluer la couverture applicative d'un domaine fonctionnel.

**Critères d'acceptation :**
- Nœud focal = la BC sélectionnée
- Expansion récursive : BC enfants L2/L3 affichés comme nœuds satellites — **gate T-086 (WITH RECURSIVE)**
- Applications liées à chaque BC de la sous-arborescence affichées
- Interfaces entre ces Applications affichées comme arêtes (couche Interfaces ON par défaut)
- Couche BC ON par défaut quand focal = BC
- Nœuds BC enfants visuellement distincts du focal (couleur `secondary.light` vs `secondary.main`)

---

### US-05 — Toggle des couches

En tant qu'Architecte Entreprise,
Je veux activer ou désactiver les couches du graphe (Applications, Interfaces, Business Capabilities, Providers, IT Components, Data Objects),
Afin d'adapter la densité visuelle à ma question du moment.

**Critères d'acceptation :**
- Toolbar contient un groupe de boutons toggle par couche
- État par défaut selon D13 (Apps + Interfaces ON, reste OFF)
- Désactiver une couche retire immédiatement les nœuds et arêtes correspondants du canvas
- Activer une couche déclenche un appel `/graph` avec les nouveaux paramètres `layers`
- Les couches actives sont reflétées dans l'URL (sync basique)
- La couche du nœud focal ne peut pas être désactivée (bouton disabled)

---

### US-06 — Contrôle de la profondeur de voisinage

En tant qu'Architecte Entreprise,
Je veux ajuster la profondeur d'exploration des connexions entre applications (1, 2 ou 3 niveaux),
Afin de zoomer sur le voisinage immédiat ou d'explorer des chaînes de dépendances plus longues.

**Critères d'acceptation :**
- Slider "Profondeur" dans la toolbar avec valeurs 1 / 2 / 3, défaut 1
- Changement de profondeur → nouvel appel `/graph` avec `depth` mis à jour
- Profondeur 2 : affiche les voisins des voisins via Interfaces
- Profondeur 3 : affiche jusqu'à 3 niveaux de connexions
- `Alert` warning si > 150 nœuds : "Ce graphe contient X nœuds — essayez de désactiver des couches ou de réduire la profondeur." (client-side : compter `nodes.length`)
- Profondeur reflétée dans l'URL

---

### US-07 — Consultation rapide d'un nœud (drawer PNS-02)

En tant qu'Architecte Entreprise,
Je veux cliquer sur un nœud du graphe pour consulter le détail de l'entité correspondante,
Afin d'accéder aux informations clés sans quitter le graphe.

**Critères d'acceptation :**
- Clic sur un nœud → ouverture du drawer PNS-02 identique aux vues liste (composant existant)
- Le drawer déclenche `GET /api/v1/[type]/:id` à la volée pour charger le payload complet
- Footer drawer : bouton "Modifier" (disabled si pas de permission write) + "Voir la fiche complète"
- Escape ou clic extérieur → ferme le drawer, graphe préservé (position, zoom, filtres)
- Le nœud cliqué est mis en surbrillance pendant que le drawer est ouvert

---

### US-10 — Filtres criticité et domaine

En tant qu'Architecte Entreprise,
Je veux filtrer les nœuds du graphe par criticité et par domaine,
Afin de focaliser mon analyse sur les périmètres à risque ou les frontières organisationnelles.

**Critères d'acceptation :**
- Filtre "Criticité" : multiselect `LOW / MEDIUM / HIGH / CRITICAL / ALL` (défaut ALL)
- Filtre "Domaine" : multiselect liste des domaines existants + ALL (défaut ALL)
- Les filtres masquent les nœuds non correspondants (et leurs arêtes orphelines) — côté client uniquement
- Le nœud focal n'est jamais masqué par les filtres
- Les arêtes dont les deux extrémités sont visibles restent affichées
- Les filtres sont reflétés dans l'URL

---

## User Stories P2 — Tâches futures (hors T-003)

---

### US-08 — Navigation entre focaux (historique ← →)

En tant qu'Architecte Entreprise,
Je veux naviguer entre les entités focales successives que j'ai explorées,
Afin de retracer mon parcours d'exploration sans recommencer depuis le menu.

**Critères d'acceptation :**
- Boutons ← → dans la toolbar (désactivés si pas d'historique dans la direction)
- Chaque changement de focal (via drawer ou sélecteur) s'empile dans un historique local (useState)
- ← charge le focal précédent avec ses couches et filtres au moment de la navigation
- → disponible après un retour en arrière
- L'historique est limité à 10 entrées (FIFO)
- L'historique ne persiste pas entre sessions (pas de localStorage)

---

### US-09 — Changement d'algorithme de layout

En tant qu'Architecte Entreprise,
Je veux choisir l'algorithme de positionnement des nœuds (Dagre / ELK / Force-directed),
Afin d'adapter la représentation visuelle à la structure de mon graphe.

**Critères d'acceptation :**
- Bouton switch algo dans la toolbar : `Dagre` | `ELK` | `Force`
- Dagre actif par défaut (seul disponible en P1)
- Changement d'algo → recalcul immédiat des positions sans rechargement des données
- Force-directed : les nœuds sont déplaçables manuellement (drag) pendant la simulation
- ELK : layout recalculé côté client (pas de serveur)
- Le choix d'algo n'est pas persisté ni encodé dans l'URL (préférence de session)

---

### US-11 — Export Mermaid

En tant qu'Architecte Entreprise,
Je veux exporter le graphe affiché au format Mermaid,
Afin de l'intégrer dans ma documentation Confluence, Notion ou GitHub.

**Critères d'acceptation :**
- Bouton "Export Mermaid" dans la toolbar
- L'export génère uniquement les nœuds et arêtes **actuellement visibles** (couches actives + filtres appliqués)
- Format généré : `graph LR` avec nœuds labelisés par nom + type
- Les arêtes Interface incluent le label du type (`REST`, `BATCH_FILE`...)
- Le fichier téléchargé est nommé `ark-graph-[focalType]-[focalLabel]-[date].md`
- L'export fonctionne sans appel réseau supplémentaire (depuis le state ReactFlow)

---

### US-12 — Deep linking complet et partage

En tant qu'Architecte Entreprise,
Je veux copier l'URL du graphe dans son état actuel et la partager à un collègue,
Afin qu'il accède exactement à la même vue sans avoir à reconfigurer les filtres.

**Critères d'acceptation :**
- L'URL encode : `focalType`, `focalId`, `layers`, `depth`, `criticalityFilter`, `domainFilter`
- Accès direct à une URL avec query params → charge le graphe dans l'état correspondant
- Si `focalId` invalide ou entité supprimée → message d'erreur "Entité introuvable" + redirection canvas vide
- Si paramètre `layers` invalide → fallback sur les couches par défaut (D13)
- Pas d'encodage du choix d'algo (préférence session, non partageable)
