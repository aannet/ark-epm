# ARK — Navigation Patterns

_Version 0.3 — Mars 2026_

> **Changelog v0.3 :**
> - **PNS-03** corrigé : après une création réussie, navigation vers la **fiche détail du nouvel objet** (+ `ArkAlert success`) — abandonne le pattern "retour liste + highlight"
> - **PNS-02** : "snackbar d'erreur" remplacé par `ArkAlert` (terminologie harmonisée avec `00-UI-Kit.md §7`)
> - **Flow A, B, C** mis à jour : feedback `ArkAlert` ajouté sur chaque action CUD réussie
> - **PNS-10** ajouté : règle transverse de feedback utilisateur (synthèse des règles `ArkAlert` pour injection OpenCode)

> Ce document combine :
> - `ARK-Navigation-Principes-Communs.md` (règles transverses)
> - `ARK-Navigation-Objet-par-Objet.md` (spécificités par objet)

---

## 1. Principes de Navigation Standard ARK (PNS)

### PNS-01 — Vue par défaut et vue avancée

Chaque objet métier est accessible via un item de la Sidebar. Cet item atterrit toujours sur la **vue liste** (défaut). Une **vue avancée** (graphique ou arborescente) est disponible pour certains objets via un toggle dans l'en-tête de la page — même URL de base, paramètre `?view=` distinct.

Les filtres actifs en vue liste se propagent à la vue avancée.

| Objet | Vue par défaut | Vue avancée |
|---|---|---|
| Applications | Table avec filtres | — (P1) |
| Interfaces | Table avec filtres | Graphe React Flow (FS-09) |
| Business Capabilities | Table arborescente | Arbre hiérarchique (FS-07) |
| Data Objects | Table avec filtres | — |
| IT Components | Table avec filtres | — |
| Providers | Table avec filtres | — |
| Domains | Table avec filtres | — |

---

### PNS-02 — Pattern de consultation et d'édition rapide (Side Drawer)

Cliquer sur une ligne d'une liste ouvre un **Side Drawer** à droite. **Tout objet possède un drawer**, a minima avec son nom et ses champs simples, et un lien "Voir la fiche complète" vers la Full Page.

**Règle fonctionnelle critique :** pour qu'une sauvegarde depuis le drawer soit valide, aucun champ obligatoire ne doit manquer dans le drawer. Les champs structurels (relations n:n, hiérarchie) ne sont jamais modifiables depuis le drawer — ils passent par la Full Page.

> **Exception PNS-02-APP :** Le drawer **Applications** (FS-06) est en **lecture seule uniquement**. Toute modification passe par la Full Page via le bouton "Modifier". Les champs sont affichés en mode consultation sans édition inline.

**Contenu standard du drawer :**
- Avatar + nom de l'Owner (si applicable) — affiché en lecture seule en haut du drawer
- Champs simples de l'objet (modifiables inline)
- Description Markdown (rendu lecture + édition inline — voir PNS-09)
- Lien **"Voir la fiche complète"** → ouvre `/<objet>/:id/edit`

**Comportement sur erreur :**
- Validation échouée → message d'erreur inline sous le champ, drawer reste ouvert
- Erreur réseau ou 5xx → `ArkAlert severity="error"` dans le drawer, drawer reste ouvert (voir PNS-10)

---

### PNS-03 — Pattern de création (Full Page dédiée)

La création ouvre toujours une **page dédiée full-width** — jamais une modale. Point d'entrée : bouton **"+ Créer"** dans le `PageHeader` de la liste.

**La création n'est accessible que depuis les vues liste.** Pas depuis le graphe, pas depuis le drawer.

**Après une création réussie :** navigation vers la **fiche détail du nouvel objet** (`/<objet>/:id`) avec `ArkAlert severity="success"` transmise en navigation state (voir PNS-10).

> Ce pattern vaut pour tous les objets P1 sans exception. Il permet à l'utilisateur de vérifier immédiatement l'objet créé et d'accéder à ses relations depuis la fiche détail.

**Erreur sur création :**
- 400 / 409 CONFLICT → erreur inline sur le champ concerné, page reste affichée
- 5xx → `ArkAlert severity="error"` au-dessus du formulaire, page reste affichée

---

### PNS-04 — Pattern d'édition structurelle (Full Page — Fact Sheet)

La Full Page (`/<objet>/:id/edit`) est organisée en **3 onglets** :

| Onglet | Contenu |
|---|---|
| **Général** | Champs simples + Description Markdown |
| **Relations** | Liaisons n:n, hiérarchie (`parent_id`), FK structurelles |
| **Audit** | Historique des modifications — *(UI différée en P2, onglet visible mais vide en P1)* |

**Après une modification réussie :** navigation vers la **fiche détail** (`/<objet>/:id`) avec `ArkAlert severity="success"` en navigation state (voir PNS-10).

---

### PNS-05 — Gestion des droits RBAC dans la navigation

| Élément UI | Comportement selon le rôle |
|---|---|
| Bouton **"+ Créer"** | Actif pour les rôles `write`. **Masqué** pour les rôles lecture seule. |
| Pages `/new` | Inaccessibles pour les rôles lecture seule — redirection `403` si accès direct par URL |
| Pages `/:id/edit` | Accessibles pour les rôles lecture seule en **mode read-only** : champs grisés, bouton "Enregistrer" absent |
| Side Drawer | Affiché pour tous les rôles. Champs grisés pour les rôles lecture seule, bouton "Enregistrer" absent |

---

### PNS-06 — Filtres

Chaque vue liste expose des filtres sur les attributs de l'objet. Les filtres actifs persistent lors du passage en vue avancée. Quand le filtre domaine global (PNS-08) est actif, il s'applique en amont de tous les filtres locaux.

La liste exhaustive des filtres par objet est définie dans chaque Feature-Spec.

---

### PNS-07 — Recherche globale (Omnibar)

Une barre de recherche **Omnibar** est accessible depuis la TopBar sur toutes les pages. Elle porte sur l'ensemble des objets P1 : Applications, Interfaces, Business Capabilities, Data Objects, IT Components, Providers, Domains.

**Comportement :**
- Accessible au clic ou via raccourci clavier (`/` ou `Cmd+K` / `Ctrl+K`)
- Résultats groupés par type d'objet, affichés en dropdown
- Sélection d'un résultat → ouvre le Side Drawer de l'objet dans sa liste contextuelle
- Recherche sur : nom, tags, description

**Scope MVP :** recherche textuelle simple (ILIKE PostgreSQL). Recherche full-text avancée différée en P2.

---

### PNS-08 — Filtre Domaine Global

Un **sélecteur de domaine** (`DomainSelector`) en Sidebar ou TopBar filtre l'ensemble des listes. Quand un domaine est sélectionné, toutes les vues n'affichent que les objets de ce domaine. Un bouton "Tous les domaines" réinitialise.

**Comportement :**
- Persistant dans la session
- Visible en permanence (badge actif dans la Sidebar ou TopBar)
- Se combine avec les filtres locaux de chaque liste (PNS-06)
- Point d'entrée de la page d'accueil `/` : l'utilisateur sélectionne son domaine et entre dans son univers

---

### PNS-09 — Description Markdown

Le champ `description` des objets qui le supportent est rendu en **Markdown** :
- **Mode lecture :** rendu Markdown (titres, listes, liens, gras/italique)
- **Mode édition :** éditeur simplifié (barre d'outils : gras, italique, liste, lien)

Objets concernés en P1 : Applications, Business Capabilities. Extensible aux autres objets en P2.

---

### PNS-10 — Feedback utilisateur (ArkAlert) *(nouveau)*

Toute action CUD réussie ou échouée donne un feedback visuel via le composant `ArkAlert` (voir `00-UI-Kit.md §7`). Ce principe est transverse à tous les objets P1.

**Règle de déclenchement par action :**

| Action | Résultat | Feedback | Page d'affichage |
|--------|----------|----------|-----------------|
| Création | 201 | `ArkAlert success` via navigation state | Fiche détail du nouvel objet |
| Modification | 200 | `ArkAlert success` via navigation state | Fiche détail de l'objet |
| Suppression | 204 | `ArkAlert success` via navigation state | Vue liste de l'objet |
| Toute action | 5xx | `ArkAlert error` via `useState` local | Page courante (formulaire ou drawer) |
| Suppression bloquée | 409 DEPENDENCY_CONFLICT | Message dans `ConfirmDialog` | Dans le dialog (pas d'`ArkAlert`) |
| Validation / doublon | 400 / 409 CONFLICT | Erreur inline sous le champ | Formulaire (pas d'`ArkAlert`) |

**Règle de transport :**
- Alertes **success** → `react-router-dom` navigation state. La page réceptrice lit `location.state?.alert` puis efface le state avec `window.history.replaceState({}, '')`.
- Alertes **error** → `useState` local dans la page ou le drawer. Pas d'auto-dismiss. Restent jusqu'à navigation.
- Auto-dismiss : **5 000 ms** pour les alertes success. Aucun pour les alertes error.

> **Règle d'implémentation :** Ne jamais créer de `Snackbar` ou d'`Alert` MUI directement dans une page. Toujours passer par le composant `ArkAlert` depuis `@/components/shared`.

---

## 2. Sitemap global

```
ARK
├── / (Home — Domain Landing Page)
│   ├── Sélecteur de domaine → active PNS-08 (filtre global persistant)
│   ├── Compteurs par domaine : X apps · Y interfaces · Z capabilities
│   └── Omnibar (PNS-07) — point d'entrée recherche rapide
│
├── /applications
├── /interfaces               ← toggle → ?view=graph
├── /business-capabilities    ← toggle → ?view=tree
├── /data-objects
├── /it-components
├── /providers
├── /domains
│
├── /admin/users
├── /admin/roles
└── /admin/import
│
├── /login    (hors AppShell — public)
├── /401      (hors AppShell)
├── /403      (hors AppShell)
└── *  → 404  (hors AppShell)
```

---

## 3. User Flows transverses

### Flow A — Consultation et correction rapide (Side Drawer)

```
[Vue Liste]
      │  clic sur une ligne
      ▼
[Side Drawer]
  ├── Owner : avatar + nom (lecture seule)
  ├── Champs simples (édition inline)
  ├── Description Markdown (lecture + édition inline)
  ├── "Enregistrer" → PATCH /api/<objet>/:id
  │       ├── Succès → ArkAlert success dans le drawer + liste rafraîchie
  │       ├── Erreur validation → erreur inline sous le champ, drawer reste ouvert
  │       └── Erreur 5xx → ArkAlert error dans le drawer, drawer reste ouvert
  └── "Voir la fiche complète" → Flow C
```

### Flow B — Création (Full Page)

```
[Vue Liste]
      │  clic sur "+ Créer"
      ▼
[/<objet>/new]
  ├── Champs du formulaire
  ├── "Enregistrer" → POST /api/<objet>
  │       ├── Succès (201) → navigate('/<objet>/:newId', { state: { alert: success } })
  │       │       └── ArkAlert success affiché sur la fiche détail
  │       ├── Erreur 400 / 409 CONFLICT → erreur inline sous le champ concerné
  │       └── Erreur 5xx → ArkAlert error au-dessus du formulaire, page reste affichée
  └── "Annuler" → retour liste (sans feedback)
```

### Flow C — Édition structurelle (Full Page — Fact Sheet)

```
[Side Drawer ou Fiche Détail]
      │  clic sur "Voir la fiche complète" ou "Modifier"
      ▼
[/<objet>/:id/edit]
  ├── Onglet Général : champs simples + Description Markdown
  ├── Onglet Relations : n:n, parent_id, FK structurelles
  ├── Onglet Audit : placeholder P2 (visible, vide en P1)
  ├── "Enregistrer" → PATCH /api/<objet>/:id
  │       ├── Succès (200) → navigate('/<objet>/:id', { state: { alert: success } })
  │       │       └── ArkAlert success affiché sur la fiche détail
  │       ├── Erreur 400 / 409 CONFLICT → erreur inline sous le champ concerné
  │       └── Erreur 5xx → ArkAlert error au-dessus du formulaire, page reste affichée
  └── "Annuler" → retour fiche détail (sans feedback)
```

### Flow D — Suppression (depuis la liste)

```
[Vue Liste]
      │  clic sur IconButton Delete sur une ligne
      ▼
[ConfirmDialog]
  ├── Message : "Êtes-vous sûr de vouloir supprimer X ?"
  ├── "Confirmer" → DELETE /api/<objet>/:id
  │       ├── Succès (204) → navigate('/<objet>', { state: { alert: success } })
  │       │       └── ArkAlert success affiché sur la liste, objet absent
  │       └── 409 DEPENDENCY_CONFLICT → message remplacé par format409Message()
  │               └── Bouton Confirmer désactivé — dialog reste ouvert
  └── "Annuler" → dialog fermé, aucun changement
```

### Flow E — Import Excel

```
[/admin/import]
      │  upload fichier Excel (format standard ARK)
      ▼
[Validation backend]
  ├── Vérification format + données
  ├── Rapport : lignes OK / lignes en erreur (détail par ligne + numéro Excel)
  ├── Si OK → "Importer" → POST /api/import
  │       └── Rapport : nb créés par entité / nb ignorés
  └── Si erreurs → liste des erreurs → l'utilisateur corrige et recommence
```

---

## 4. Spécificités par objet

### 4.1 Applications

| Élément | Détail |
|---|---|
| Routes | `/applications`, `/applications/new`, `/applications/:id`, `/applications/:id/edit` |
| Filtres | Criticité, Lifecycle Status, Domaine, Owner, Fraîcheur |
| Colonnes liste | Nom, Criticité, Lifecycle, Owner, Domaine, Fraîcheur, Actions |
| Side Drawer | Owner, Nom, Criticité, Lifecycle, Tags, Description |
| Full Page | 3 onglets (Général, Relations, Audit) |
| Règles | Pas d'unicité sur nom • Suppression bloquée si interfaces liées • FreshnessIndicator |

### 4.2 Interfaces

| Élément | Détail |
|---|---|
| Routes | `/interfaces`, `/interfaces?view=graph`, `/interfaces/new`, `/interfaces/:id`, `/interfaces/:id/edit` |
| Filtres | Type, Criticité, Source, Cible, Domaine |
| Colonnes liste | Nom, Source → Cible, Type, Criticité, Contact, Actions |
| Side Drawer | Nom, Type, Fréquence, Tags, Description (Source/Cible non modifiables) |
| Full Page | 3 onglets (Général, Relations, Audit) |
| Règles | Source/Cible obligatoires et non modifiables depuis drawer • Unidirectionnelle |

### 4.3 Business Capabilities

| Élément | Détail |
|---|---|
| Routes | `/business-capabilities`, `/business-capabilities?view=tree`, `/business-capabilities/new`, `/business-capabilities/:id`, `/business-capabilities/:id/edit` |
| Filtres | Domaine, Niveau de profondeur, Tags |
| Colonnes liste | Nom indenté, Domaine, Nb applications, Actions |
| Side Drawer | Nom, Description, Tags, Breadcrumb hiérarchique |
| Full Page | 3 onglets (Général, Relations, Audit) |
| Règles | Hiérarchie récursive illimitée • Breadcrumb cliquable • Suppression avec cascade ou remontée enfants |

### 4.4 Data Objects

| Élément | Détail |
|---|---|
| Routes | `/data-objects`, `/data-objects/new`, `/data-objects/:id`, `/data-objects/:id/edit` |
| Filtres | Type, Source de vérité, Tags |
| Colonnes liste | Nom, Type, Source de vérité, Nb applications, Actions |
| Side Drawer | Nom, Type, Source de vérité, Tags |
| Full Page | 3 onglets (Général, Relations, Audit) |

### 4.5 IT Components

| Élément | Détail |
|---|---|
| Routes | `/it-components`, `/it-components/new`, `/it-components/:id`, `/it-components/:id/edit` |
| Filtres | Type, Technologie, Tags |
| Colonnes liste | Nom, Technologie, Type, Nb applications, Actions |
| Side Drawer | Nom, Type, Technologie, Tags |
| Full Page | 3 onglets (Général, Relations, Audit) |

### 4.6 Providers

| Élément | Détail |
|---|---|
| Routes | `/providers`, `/providers/new`, `/providers/:id`, `/providers/:id/edit` |
| Filtres | Type de contrat, Expiration, Tags |
| Colonnes liste | Nom, Type de contrat, Expiration, Nb applications, Actions |
| Side Drawer | Nom, Type de contrat, Date expiration, Tags |
| Full Page | 3 onglets (Général, Relations, Audit) |

### 4.7 Domains

| Élément | Détail |
|---|---|
| Routes | `/domains`, `/domains/new`, `/domains/:id`, `/domains/:id/edit` |
| Filtres | Aucun en P1 |
| Colonnes liste | Nom, Description, Nb objets liés, Actions |
| Side Drawer | Nom, Description |
| Full Page | 3 onglets (Général, Relations, Audit) |
| Règles | Nom unique • Suppression bloquée si référencé |

---

## 5. Administration

### 5.1 Utilisateurs (`/admin/users`)
- Routes : liste, création, édition
- Accès : Admin uniquement
- Colonnes : Avatar + Nom, E-mail, Rôle, Statut, Créé le

### 5.2 Rôles (`/admin/roles`)
- Routes : liste, création, édition
- Accès : Admin uniquement
- Colonnes : Nom, Description, Nb permissions, Actions

### 5.3 Import Excel (`/admin/import`)
- Accès : Admin et Architecte Entreprise
- Flow : Download template → Upload → Validation → Import → Rapport (Flow E)

---

_Document de travail v0.3 — Projet ARK_