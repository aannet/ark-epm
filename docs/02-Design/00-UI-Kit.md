# ARK — UI Kit & Charte Design

_Version 0.1 — Février 2026_

## 1. Design Tokens (MUI Baseline)

### Couleurs

| Catégorie | Token | Valeur | Usage |
| --- | --- | --- | --- |
| **Brand** | `primary` | `#1A237E` | Indigo (Sidebar, Header, Branding) |
| **Action** | `secondary` | `#007FFF` | Bleu Azure (Boutons, liens, focus) |
| **Background** | `default` | `#F8FAFC` | Gris neutre (Fond de page) |
| **Surface** | `paper` | `#FFFFFF` | Blanc (Cartes, Formulaires, Tableaux) |
| **Text** | `primary` | `#1E293B` | Ardoise (Texte principal) |
| **Text** | `secondary` | `#64748B` | Gris bleu (Labels, aides) |
| **Border** | `divider` | `#E2E8F0` | Lignes de séparation |

### Typographie

* **Font Family :** `Inter, system-ui, sans-serif`
* **Poids :** Regular (400), Medium (500), Bold (700)
* **Mono ::** `JetBrains Mono` (pour les IDs techniques)

### Formes (Shape)

* **Radius Standard :** `4px` (Angles droits pour l'aspect "Plan technique")
* **Action Radius :** `6px` (Boutons et Inputs)

---

## 2. Layout

L'application utilise une structure à deux zones de contraste pour séparer la navigation de la zone de travail.

* **Sidebar (Navigation) :**
* **Couleur :** `Primary.main` (#1A237E).
* **Comportement :** Navigation verticale fixe.
* **Style des items :** Texte blanc (80% opacité). Icône `Secondary.main` (#007FFF) uniquement pour l'item **actif**.


* **Main Content (Zone de travail) :**
* **Couleur :** `Background.default` (#F8FAFC).
* **Structure :** Utilisation de `Container` MUI avec un padding standard de `24px` (spacing 3).

---

## 3. Actions & Boutons

Nous limitons les styles pour garantir une hiérarchie visuelle claire.

| Type | Composant MUI | Usage |
| --- | --- | --- |
| **Primaire** | `Button variant="contained"` | Action principale de la page (ex: "Ajouter un Domaine"). |
| **Secondaire** | `Button variant="outlined"` | Actions secondaires ou annulations. |
| **Danger** | `Button color="error"` | Suppressions (toujours avec confirmation). |
| **Table** | `IconButton` | Actions de ligne (Edit/Delete) dans les tableaux. |

---

## 4. Saisie de Données (Forms)

* **Style :** `TextField variant="outlined"`.
* **Densité :** `size="small"` pour les formulaires complexes (Applications/Interfaces).
* **Radius :** `6px` (Action Radius).
* **Validation :** Les erreurs s'affichent en rouge (`error.main`) avec un message d'aide descriptif sous le champ.

---

## 5. Tableaux de Données (DataGrid)

Le cœur de l'analyse ARK.

* **Header :** Fond gris neutre (`#F1F5F9`), texte en majuscules, gras, taille réduite (`0.75rem`).
* **Lignes :** Bordure inférieure simple `1px solid #E2E8F0`. Pas de rayures (zebra-striping) pour garder un aspect épuré.
* **Typographie technique :** Les IDs (ex: `APP-204`) utilisent `JetBrains Mono`.

---

## 6. Cartes & Conteneurs (Surface)

* **Style :** `elevation={0}`, bordure `1px solid #E2E8F0`.
* **Radius :** `4px` (Standard Radius).
* **Usage :** Pour regrouper les informations logiques (ex: "Propriétaire du domaine" dans la fiche détail).

---

## 7. Feedback & États

* **Skeleton :** Toujours privilégier les `Skeleton` lors du chargement des listes plutôt qu'un spinner central.
* **Empty State :** Un message centré avec une icône grise et un bouton d'action pour "Commencer".

---

## 8. Graphiques (React Flow)

* **Canvas :** Fond blanc avec une grille de points (`Dots`) gris clair.
* **Nodes :** Fond blanc, bordure indigo 1px, titres en gras.

---

## 9. Responsive — Desktop First

> **Desktop First (≥ 1024px)** : expérience complète
> **Tablette (768px–1023px)** : lecture seule uniquement
> **Mobile (< 768px)** : hors scope — ne pas implémenter

### Comportement par composant

| Composant | Desktop (≥1024px) | Tablette (768-1023px) |
|---|---|---|
| Sidebar | Fixe, 240px | Collapsée, 56px, icônes uniquement |
| Side Drawer | Latéral, 400px | Plein écran, lecture seule |
| Listes | Toutes colonnes | Nom + Criticité/Statut + Actions |
| React Flow | Graphe complet | Non affiché (EmptyState) |
| Full Page | 3 onglets, édition | Général uniquement, lecture seule |

---

_Document de travail v0.1 — Projet ARK_
