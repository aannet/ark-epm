# ARK — Design System (DESIGN.md)

_Version 1.0 — Mars 2026_

> **Migration v1.0 :** Conversion du format Google Stitch standard. Contenu provient de `docs/02-Design/00-UI-Kit.md` (v0.5). Ce fichier est la **source de vérité** pour le design system — lecture automatique par les agents IA (Claude Code, Cursor, etc.). Pour les patterns de navigation et les flows utilisateur, voir `docs/02-Design/02-Navigation-Patterns.md`.

> **Changelog précédent (v0.5 du UI-Kit) :**
> - §5.2 Tableaux : ajout pattern **badge compteur (N:N)** — Chip quantitatif
> - §4 Saisie de Données : ajout **DatePicker MUI** avec locale FR
> - §5 Tableaux : ajout pattern **badge conditionnel**
> - §10 Composants Métier : ajout ExpiryDateBadge, ProviderRoleBadge, AppBreadcrumbs
> - §6 Cartes : clarification elevation et bordure
> - §7 Feedback & États : ajout ArkAlert, ConfirmDialog, règles déclenchement
> - Terminologie harmonisée : "snackbar" → "Alert"

---

## 1. Visual Theme & Atmosphere

ARK est une plateforme d'**Enterprise Architecture Mapping** destinée aux architectes d'entreprise et urbanistes SI. L'esthétique doit incarner la **rigueur technique, la clarté analytique et la confiance**.

### Caractéristiques visuelles

- **Aesthetic :** Minimal, plan technique, orienté données — jamais décoratif
- **Contraste :** Deux zones distinctes (Sidebar navigation vs Zone de travail) pour séparer le contexte de la tâche
- **Densité :** Compact mais spacieux — pas de surcharge, pas de vide
- **Typographie technique :** Monospace (JetBrains Mono) pour les IDs techniques (ex: APP-204)
- **Tone :** Professionnel, précis, sans fioriture — orienté utilisateur enterprise

### Mood Adjectives

Sophisticated, trustworthy, minimal, structured, technical, data-focused, enterprise-grade.

---

## 2. Color Palette & Roles

Tous les tokens de couleur MUI, avec noms descriptifs et rôles fonctionnels.

### Colors — Brand & Action

| Nom Descriptif | Token MUI | Hex Code | Rôle Fonctionnel |
|---|---|---|---|
| **Indigo Blueprint** | `primary.main` | `#1A237E` | Brand couleur, Sidebar (navigation), en-têtes, branding |
| **Azure Action** | `secondary.main` | `#007FFF` | Boutons, liens, focus states, icônes actives |
| **Slate Gray** | `text.primary` | `#1E293B` | Texte principal, contenu |
| **Slate Gray Soft** | `text.secondary` | `#64748B` | Labels, textes secondaires, aides contextuelles |
| **Sky Neutral** | `background.default` | `#F8FAFC` | Fond de page, backgrounds |
| **White Surface** | `paper` | `#FFFFFF` | Cartes, formulaires, tableaux, conteneurs |
| **Divider Gray** | `divider` | `#E2E8F0` | Lignes de séparation, bordures fines |
| **Neutral Header** | N/A | `#F1F5F9` | En-têtes de tableaux (fond gris neutre) |

### Colors — Semantic (Badges & Feedback)

| Nom | Hex Code | Usage |
|---|---|---|
| **Success Green** | `#10B981` | États réussis, validation, states "actif", badges success |
| **Warning Orange** | `#F59E0B` | Alertes modérées, warning, états d'attention |
| **Error Red** | `#EF4444` | Erreurs, suppressions, états dangéreux, criticalité haute |
| **Info Cyan** | `#06B6D4` | Informations, badges informatifs, compteurs N:N |
| **Default Gray** | `#D1D5DB` | États neutres, disabled, custom non sémantique |

### Colors — Semantic Detail

- **Success** (`#10B981`) : Confirmation de création/modification, lifecycles actifs, badges d'urgence OK
- **Warning** (`#F59E0B`) : Alertes d'expiration 90j, flags d'attention, états intermédiaires
- **Error** (`#EF4444`) : Erreurs 5xx, suppressions critiques, expiration URGENT <30j, criticality "critique"
- **Info** (`#06B6D4`) : Compteurs N:N (neutre bleu), statuts informatifs, états draft
- **Default** (`#D1D5DB`) : Cas par défaut, rôles custom sans sémantique colorée

### Typography

- **Font Family (Primary)** : `Inter, system-ui, sans-serif` — corps de texte, UI labels
- **Font Family (Mono)** : `JetBrains Mono` — IDs techniques, codes, données structurées
- **Poids :** Regular (400), Medium (500), Bold (700)

### Spacing & Layout

- **Base Grid :** 8px
- **Standard Radius :** `4px` (aspect "plan technique", angles droits)
- **Action Radius :** `6px` (boutons, inputs, légèrement arrondi)
- **Sidebar Width :** 240px (fixe desktop), 56px (collapsed tablette)
- **Container Padding :** 24px (spacing 3)
- **Responsive Breakpoints :**
  - Desktop ≥ 1024px : expérience complète
  - Tablette 768–1023px : lecture seule, sidebar réduite
  - Mobile < 768px : hors scope (ne pas implémenter P1)

---

## 3. Typography Rules

### Type Scale & Hierarchy

| Level | Font Weight | Size (MUI variant) | Line Height | Usage |
|-------|-------------|---|---|---|
| **H1 — Page Title** | Bold (700) | `variant="h1"` | 1.2 | Titres de page (Application List, Detail) |
| **H2 — Section Header** | Bold (700) | `variant="h2"` | 1.3 | En-têtes de sections, onglets |
| **H3 — Subsection** | Medium (500) | `variant="h3"` | 1.4 | Sous-titres, groupes de champs |
| **Body Large** | Regular (400) | `variant="body1"` | 1.5 | Corps de texte principal, descriptions |
| **Body Small** | Regular (400) | `variant="body2"` | 1.5 | Texte secondaire, labels, aides |
| **Caption** | Regular (400) | `variant="caption"` | 1.4 | Très petit : timestamps, metadata |
| **Label / Button** | Medium (500) | `variant="button"` | 1.5 | Boutons, labels de champs, badges |
| **Monospace (IDs)** | Regular (400) | JetBrains Mono, 12–13px | 1.5 | IDs techniques (APP-204), codes |

### Typography Rules

- **Couleur par défaut :** `text.primary` (#1E293B) pour tous les niveaux sauf spécification contraire
- **Emphasis :** Bold (700) pour les noms d'entités, Medium (500) pour les labels structurels
- **Line Height :** Minimum 1.4 pour lisibilité, 1.5 pour le body text
- **Letter Spacing :** Standard, aucun ajustement sauf pour les MAJUSCULES (en-têtes de tableau : +0.5px tracking)

---

## 4. Component Stylings

Styles visuels et états pour les composants récurrents.

### 4.1 Buttons (Boutons)

| Type | Variant MUI | Usage | États |
|---|---|---|---|
| **Primary** | `Button variant="contained"` | Action principale de la page (ex: "+ Ajouter") | Normal, Hover, Active, Disabled |
| **Secondary** | `Button variant="outlined"` | Actions secondaires, annulations | Normal, Hover, Active, Disabled |
| **Danger** | `Button color="error" variant="..."`| Suppressions — **toujours avec confirmation ConfirmDialog** | Normal, Hover, Active, **Disabled (409 DEPENDENCY_CONFLICT)** |
| **Icon Button** | `IconButton` | Actions de ligne (Edit, Delete) — deux variantes possibles (§4.2) | Normal, Hover, Active, Disabled |

**Padding :** Buttons small pour les formulaires complexes.
**Radius :** 6px (Action Radius).
**Focus State :** Outline visible pour accessibilité.

### 4.2 Table Actions — Variantes

Deux variantes coexistent pour les actions de ligne :

#### Variante A : Icônes Séparées
```
| Row Data | ... | [Edit Icon] [Delete Icon] |
```
**Usage :** Listes avec peu d'actions (2 max), espace colonne générique.

#### Variante B : Menu Dropdown
```
| Row Data | ... | [⋮ MoreVertIcon] → Menu |
```
**Usage :** Listes avec 3+ actions, économie d'espace.

**Règle :** Choisir selon le contexte et **documenter explicitement dans la spec** de chaque entité.

### 4.3 Text Input & Validation

- **Style :** `TextField variant="outlined"`
- **Densité :** `size="small"` pour formulaires complexes
- **Radius :** 6px (Action Radius)
- **Erreur :** Affichage rouge (`error.main`), message `helperText` descriptif sous le champ
- **États :** Normal, Focused, Disabled, Error, Success

### 4.4 DatePicker

- **Composant :** `@mui/x-date-pickers` avec `AdapterDateFns`
- **Locale :** Français (format : `DD/MM/yyyy`)
- **Style :** `variant="outlined"`, `size="small"` (cohérent avec TextField)
- **Validation :** Support des props MUI (`error`, `helperText`, `disabled`, `required`)

```typescript
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fr } from 'date-fns/locale';

<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
  <DatePicker 
    label="Date d'expiration"
    format="dd/MM/yyyy"
    slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
  />
</LocalizationProvider>
```

### 4.5 Tables (Tableaux de Données)

- **Header :** Fond gris neutre (#F1F5F9), texte majuscules, gras (`font-weight: 700`), taille réduite (`0.75rem`)
- **Rows :** Bordure inférieure `1px solid #E2E8F0`, pas de zebra-striping (rayures) pour garder un aspect épuré
- **Typographie technique :** IDs en `JetBrains Mono`

#### 4.5.1 Badge Conditionnel

Pattern pour afficher des valeurs dynamiques colorées (rôle, statut, urgence) :

```typescript
<Chip
  size="small"
  label={t(`applications.roles.${role}`)}
  color={roleColorMap[role]}  // 'primary' | 'secondary' | 'info' | 'warning' | 'error' | 'default'
  variant="outlined"  // ou "filled"
/>
```

**Exemples d'utilisation :**
- **Provider Roles** : editor=primary (bleu), integrator=secondary (orange), support=info (cyan), vendor=warning (jaune), custom=default (gris)
- **Expiry Badges** : URGENT <30j=error (rouge), ALERTE <90j=warning (orange)
- **Lifecycle Status** : draft=info, active=success, deprecated=error
- **Criticality** : critical=error, high=warning, medium=info, low=success

#### 4.5.2 Badge Compteur (N:N)

Pattern pour afficher un compteur de relations N:N dans les colonnes de tableau :

```typescript
<Chip
  label={items.length}    // nombre entier
  size="small"
  variant="outlined"
  color="info"            // toujours info (bleu neutre)
/>
```

**Règles :**
- **Valeur > 0 :** affiche le `<Chip>` avec le nombre
- **Valeur = 0 :** affiche `'—'` (tiret), jamais un chip avec `0`
- **Couleur fixe :** `info` (bleu neutre) — le compteur n'a pas de sémantique conditionnelle
- **Variante :** `outlined` (cohérent avec les badges conditionnels)
- **Taille :** `small`
- **Non interactif :** le chip n'est pas cliquable, navigation via la ligne

**Exemples d'utilisation :**
- IT Components : colonne "Composants IT" dans liste Applications
- Applications : colonne "Applications" dans liste IT Components
- Pattern extensible : toute relation N:N en colonne de liste (Capacités, Data Objects, Interfaces)

### 4.6 Cards & Containers (Surface)

- **Style :** `elevation={0}`, bordure `1px solid #E2E8F0`
- **Radius :** 4px (Standard Radius)
- **Padding :** 16px (spacing 2) ou 24px (spacing 3) selon contexte
- **Usage :** Regrouper les informations logiques (fiche détail, sections)

### 4.7 Side Drawer

- **Width Desktop :** 400px, latéral à droite, overlay semi-transparent
- **Width Tablette :** Plein écran, lecture seule
- **Contenu standard :**
  - Avatar + nom Owner (lecture seule)
  - Champs simples de l'objet
  - Description Markdown (lecture + édition inline)
  - Lien "Voir la fiche complète" / "Modifier"

### 4.8 Full Page (Fact Sheet)

- **Layout :** 3 onglets (Général, Relations, Audit)
- **Formulaires :** Champs simples en colonne unique, dense
- **Pagination interne :** Tables avec ~20 lignes/page

### 4.9 React Flow (Graphiques)

- **Canvas :** Fond blanc, grille de points gris clair
- **Nodes :** Fond blanc, bordure indigo `1px`, titres gras
- **Edges :** Lignes fines gris neutre
- **Zoom/Pan :** Souris activée par défaut

---

## 5. Layout & Responsive

### Desktop Layout (≥ 1024px)

```
┌─────────────────────────────────────┐
│         TopBar (Admin, Auth)         │
├──────────┬──────────────────────────┤
│ Sidebar  │   Main Content (flexbox) │
│ 240px    │   Padding: 24px          │
│ Fixed    │                          │
│ Primary  │   [Page Header]          │
│ #1A237E  │   [Filters / Breadcrumb] │
│          │   [Content — Table/Form] │
└──────────┴──────────────────────────┘
```

**Sidebar :**
- Largeur : 240px
- Couleur : Indigo (#1A237E)
- Texte : Blanc 80% opacité
- Icônes : Azure (#007FFF) uniquement item actif
- Comportement : Navigation verticale fixe

**Main Content :**
- Couleur fond : Sky Neutral (#F8FAFC)
- Structure : `Container` MUI + padding 24px
- Espacement vertical : 24px entre sections

### Tablette Layout (768–1023px)

| Élément | Comportement |
|---|---|
| Sidebar | Collapsée à 56px, icônes uniquement |
| Side Drawer | Plein écran, **lecture seule** |
| Listes | Colonnes réduites : Nom + Criticité/Statut + Actions |
| React Flow | N'affiche pas (EmptyState à la place) |
| Full Page | Général uniquement, lecture seule |

### Mobile (< 768px)

**Hors scope P1** — ne pas implémenter.

---

## 6. Feedback & Business Components

### 6.1 Loading State

- **Skeleton :** Toujours `LoadingSkeleton` sur les listes et fiches — **jamais** `CircularProgress` central
- **Comportement :** Affiche des placeholders gris animés

### 6.2 Empty State

- **Composant :** `EmptyState` — message centré + icône grise + bouton conditionnel RBAC
- **Règle :** Ne jamais afficher un tableau vide sans `EmptyState`

### 6.3 ArkAlert — Feedback CUD (Create, Update, Delete)

Le composant `ArkAlert` est le **seul** mécanisme de feedback pour les actions CUD. Encapsule `MUI Snackbar + Alert`.

**Implémentation :**

```typescript
<Snackbar
  open={open}
  autoHideDuration={autoDismiss ?? null}
  onClose={onClose}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
>
  <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
    {message}
  </Alert>
</Snackbar>
```

**Positionnement :** `{ vertical: 'top', horizontal: 'center' }` — ou sous `PageHeader` pour les listes. Systématique sur toutes les pages.

**Règles de déclenchement :**

| Événement | Severity | Canal | Auto-dismiss |
|-----------|----------|-------|--------------|
| Création réussie | `success` | Navigation state → fiche détail | 5 000 ms |
| Modification réussie | `success` | Navigation state → fiche détail | 5 000 ms |
| Suppression réussie | `success` | Navigation state → liste | 5 000 ms |
| Erreur serveur 5xx | `error` | `useState` local dans la page | Aucun |
| Erreur réseau (drawer) | `error` | `useState` local dans le drawer | Aucun |

**Transport des alertes succès entre pages :**

```typescript
// Émetteur
navigate('/chemin/destination', {
  state: { alert: { severity: 'success', message: t('module.alert.created') } }
});

// Récepteur — toujours effacer le state après lecture
useEffect(() => {
  if (location.state?.alert) window.history.replaceState({}, '');
}, []);
```

**Différenciation Alert vs Inline :**

| Type d'erreur | Rendu | Composant |
|---------------|-------|-----------|
| Validation (400) | Sous le champ concerné | `helperText` + `error` prop du `TextField` |
| Conflit de nom (409 CONFLICT) | Sous le champ name | `helperText` + `error` prop du `TextField` |
| Suppression bloquée (409 DEPENDENCY_CONFLICT) | Dans le `ConfirmDialog` | Message remplacé par `format409Message()` |
| Erreur serveur (5xx) | Au-dessus du formulaire | `ArkAlert severity="error"` |
| Erreur réseau (drawer) | Dans le drawer | `ArkAlert severity="error"` |

**Règle absolue :** Ne jamais créer de `Snackbar` ou d'`Alert` inline dans une page. Toujours passer par `ArkAlert` depuis `@/components/shared`.

### 6.4 ConfirmDialog — Suppression & 409 Handling

Quand un `DELETE` retourne `409 DEPENDENCY_CONFLICT` :

- Le message du dialog est **remplacé** par le message formaté (`format409Message()`)
- Le bouton Confirmer est **désactivé** (`disabled`)
- Le dialog **reste ouvert** — l'utilisateur ferme explicitement
- **Aucune `ArkAlert`** ne s'affiche dans ce cas

```typescript
// Comportement ConfirmDialog sur 409 DEPENDENCY_CONFLICT
{
  message: format409Message(t, appCount, bcCount),
  confirmButton: <Button disabled color="error">Supprimer</Button>,
  cancelButton: visible et actif
}
```

### 6.5 Business-Specific Components

Certains composants sont métier-spécifiques mais réutilisables. Voir les Feature Specs pour les détails complets :

| Composant | Feature Spec | Usage |
|---|---|---|
| **DimensionTagInput** | F-03 §6 | Saisie de tags hiérarchiques par dimension (Geography, Brand, etc.) |
| **ConfirmDialog** | F-01 §7 | Confirmation suppression + gestion 409 |
| **ExpiryDateBadge** | FS-03 §4.4 | Badge conditionnel sur date expiration : <30j (rouge), <90j (orange), >90j normal |
| **ProviderRoleBadge** | FS-03 v1.1 §4.4 | Badge coloré par rôle fournisseur : editor (bleu), integrator (orange), support (cyan), vendor (jaune), custom (gris) |
| **AppBreadcrumbs** | PNS-11 | Breadcrumb 3 niveaux : Accueil > Liste > Courant. Composant partagé. |

**Note :** Ces composants suivent les mêmes règles de design (tokens, sx prop, i18n) que les composants génériques.

---

## Design System Notes (For AI Agents)

### Prompting Guidance

Quand vous générez ou modifiez un composant UI avec Claude Code, Cursor, ou autre agent IA :

**Language à utiliser :**
- "Indigo Blueprint" au lieu de "bleu"
- "Softly rounded corners" pour `border-radius: 6px`
- "Minimal, technical aesthetic — no decorative elements"

**Color References Exactes :**
```
Primary actions    → Azure Action (#007FFF)
Danger/Delete      → Error Red (#EF4444)
Success feedback   → Success Green (#10B981)
Warnings           → Warning Orange (#F59E0B)
Info/Counters      → Info Cyan (#06B6D4)
```

**Component Constraints :**
- Boutons : toujours `variant="contained"` ou `"outlined"`, jamais `"text"`
- Inputs : toujours `size="small"` dans formulaires
- Badges : Chip `size="small"` uniquement
- Tables : header gris neutre, pas de zebra-striping
- Drawers : 400px sur desktop, lecture seule par défaut

**Spacing :** Toujours multiples de 8px (8, 16, 24, 32, 40, 48px).

**What NOT to do :**
- ❌ Ne pas ajouter de shadows décoratives (elevation 0 sauf exception)
- ❌ Ne pas mélanger plus de deux familles de fontes
- ❌ Ne pas créer de Snackbar/Alert custom (toujours `ArkAlert`)
- ❌ Ne pas utiliser de gradients ou dégradés
- ❌ Ne pas ajouter d'animations fancy (transitions légères OK)

---

_Document normatif v1.0 — ARK-EPM — Projet Architecture Mapping_
_Source de vérité design system pour agents IA et développeurs_
