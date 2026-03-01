# ARK — Charte Design Express

_Version 0.1 — Février 2026_

**Style :** Modern Enterprise Blueprint

**Concept :** Hybride (Sidebar Dark / Content Light)

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
* **Mono :** `JetBrains Mono` (pour les IDs techniques)

### Formes (Shape)

* **Radius Standard :** `4px` (Angles droits pour l'aspect "Plan technique")
* **Action Radius :** `6px` (Boutons et Inputs)

---

## 2. Guide d'implémentation (Composants)

### Navigation (Sidebar) — *The Dark Side*

* **Fond :** `brand.primary` (#1A237E)
* **Texte :** `#FFFFFF` (85% opacité pour les items inactifs, 100% pour l'actif)
* **Iconographie :** `Secondary` (#007FFF) pour l'item actif.

### Contenu (Workspace) — *The Light Side*

* **DataGrid :** Pas de bordures externes. Bordures horizontales `divider`. Header en gris très léger (`#F1F5F9`).
* **Cards :** `elevation: 0` avec une bordure fine de `1px solid #E2E8F0`. On évite les ombres portées pour rester "flat".
* **Inputs :** Style `outlined` par défaut.

### Graphiques (React Flow)

* **Canvas :** Fond blanc avec une grille de points (`Dots`) gris clair.
* **Nodes :** Fond blanc, bordure indigo 1px, titres en gras.

---

### Prochaine étape

Cette charte est maintenant notre "loi" visuelle.
