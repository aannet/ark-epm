# ARK — UI Kit & Charte Design

_Version 0.4 — Mars 2026_

> **Changelog v0.4 :**
> - §3 Actions & Boutons : clarification variantes actions de ligne (icônes séparées vs menu dropdown)
> - §4 Saisie de Données : ajout **DatePicker MUI** (`@mui/x-date-pickers`, format DD/MM/yyyy, locale FR)
> - §5 Tableaux : ajout pattern **badge conditionnel** (Chip dynamique colorée)
> - §10 Composants Métier : ajout **ExpiryDateBadge** (FS-03), **ProviderRoleBadge** (FS-03 v1.1), **AppBreadcrumbs** (PNS-11 recommandé)
> - §6 Cartes : clarification elevation et bordure (consistent avec MUI defaults)

> **Changelog v0.3 :**
> - §10 Ajout : Composants Métier — référence vers F-03 pour DimensionTagInput

> **Changelog v0.2 :**
> - §7 Feedback & États enrichi : ajout du pattern `ArkAlert` (MUI Snackbar + Alert), règles de déclenchement, positionnement, cycle de vie et différenciation inline vs Alert
> - §7 Feedback & États : ajout du comportement du `ConfirmDialog` en cas de 409 DEPENDENCY_CONFLICT (bouton Confirmer désactivé)
> - Terminologie harmonisée : "snackbar" remplacé par "Alert" (`ArkAlert`) dans tout le document

---

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

## 2. Layout

L'application utilise une structure à deux zones de contraste pour séparer la navigation de la zone de travail.

* **Sidebar (Navigation) :**
  * **Couleur :** `Primary.main` (#1A237E)
  * **Comportement :** Navigation verticale fixe
  * **Style des items :** Texte blanc (80% opacité). Icône `Secondary.main` (#007FFF) uniquement pour l'item **actif**

* **Main Content (Zone de travail) :**
  * **Couleur :** `Background.default` (#F8FAFC)
  * **Structure :** Utilisation de `Container` MUI avec un padding standard de `24px` (spacing 3)

---

## 3. Actions & Boutons

Nous limitons les styles pour garantir une hiérarchie visuelle claire.

| Type | Composant MUI | Usage |
| --- | --- | --- |
| **Primaire** | `Button variant="contained"` | Action principale de la page (ex: "Ajouter un Domaine") |
| **Secondaire** | `Button variant="outlined"` | Actions secondaires ou annulations |
| **Danger** | `Button color="error"` | Suppressions (toujours avec confirmation via `ConfirmDialog`) |
| **Table — Actions séparées** | `IconButton` (Edit) + `IconButton` (Delete) | Actions de ligne — variante avec icônes séparées (Providers, Applications) |
| **Table — Dropdown** | `IconButton` (MoreVertIcon) → Menu MUI | Actions de ligne — variante avec menu dropdown (économise l'espace colonne) |
| **Désactivé** | `Button disabled` | Bouton Confirmer dans `ConfirmDialog` quand la suppression est bloquée (409 DEPENDENCY_CONFLICT) |

> **Note :** Les deux variantes (icônes séparées vs menu dropdown) coexistent dans ARK. Choisir selon le contexte (taille de l'écran, nombre d'actions, espace disponible) et documenter dans la spec correspondante.

---

## 4. Saisie de Données (Forms)

* **Style :** `TextField variant="outlined"`
* **Densité :** `size="small"` pour les formulaires complexes (Applications/Interfaces)
* **Radius :** `6px` (Action Radius)
* **Validation :** Les erreurs s'affichent en rouge (`error.main`) avec un message d'aide descriptif sous le champ

### 4.1 DatePicker

* **Composant :** `@mui/x-date-pickers` avec `AdapterDateFns`
* **Locale :** Français (format : `DD/MM/yyyy`)
* **Style :** `variant="outlined"`, `size="small"` (cohérent avec les TextField)
* **Usage :** Saisie de dates dans les formulaires (ex: `expiryDate` Providers, dates de début/fin Interfaces)
* **Validation :** Support des props MUI standard (`error`, `helperText`, `disabled`, `required`, etc.)

Exemple d'intégration :
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

---

## 5. Tableaux de Données

Le cœur de l'analyse ARK.

* **Header :** Fond gris neutre (`#F1F5F9`), texte en majuscules, gras, taille réduite (`0.75rem`)
* **Lignes :** Bordure inférieure simple `1px solid #E2E8F0`. Pas de rayures (zebra-striping) pour garder un aspect épuré
* **Typographie technique :** Les IDs (ex: `APP-204`) utilisent `JetBrains Mono`

### 5.1 Badge conditionnel

Pattern pour afficher des valeurs dynamiques colorées (ex: rôle, statut, urgence) :

```typescript
<Chip
  size="small"
  label={t(`applications.roles.${role}`)}
  color={roleColorMap[role]}  // 'primary' | 'secondary' | 'info' | 'warning' | 'default'
  variant="outlined"  // ou "filled"
/>
```

Exemples d'utilisation :
- **Provider Roles** (FS-03 v1.1) : editor=primary (bleu), integrator=secondary (orange), support=info (cyan), vendor=warning (jaune), custom=default (gris)
- **Expiry Badges** (FS-03) : URGENT <30j=error (rouge), ALERTE <90j=warning (orange)
- **Lifecycle Status** : draft=info, active=success, deprecated=error
- **Criticality** : critical=error, high=warning, medium=info, low=success

---

## 6. Cartes & Conteneurs (Surface)

* **Style :** `elevation={0}`, bordure `1px solid #E2E8F0`
* **Radius :** `4px` (Standard Radius)
* **Usage :** Pour regrouper les informations logiques (ex: champs d'une fiche détail)

---

## 7. Feedback & États

### 7.1 Chargement

* **Skeleton :** Toujours privilégier `LoadingSkeleton` lors du chargement des listes et des fiches — jamais un spinner central (`CircularProgress`)

### 7.2 État vide

* **Empty State :** Composant `EmptyState` — message centré avec icône grise et bouton d'action conditionnel selon les droits RBAC. Ne jamais afficher un tableau vide sans `EmptyState`

### 7.3 Feedback actions CUD — `ArkAlert`

Le composant `ArkAlert` (`src/components/shared/ArkAlert.tsx`) est le **seul** mécanisme de feedback pour les actions de création, modification et suppression. Il encapsule `MUI Snackbar + Alert`.

> Référence MUI : https://mui.com/material-ui/react-alert/

**Implémentation :**

```typescript
// MUI Snackbar + Alert — wrapper ArkAlert
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

**Positionnement :** `anchorOrigin: { vertical: 'top', horizontal: 'center' }` — ou sous `PageHeader` pour les pages liste (ex: FS-06 Applications). Systématique sur toutes les pages.

**Règles de déclenchement :**

| Événement | Severity | Canal | Auto-dismiss |
|-----------|----------|-------|--------------|
| Création réussie | `success` | Navigation state → page réceptrice | 5 000 ms |
| Modification réussie | `success` | Navigation state → page réceptrice | 5 000 ms |
| Suppression réussie | `success` | Navigation state → `DomainsListPage` | 5 000 ms |
| Erreur serveur 5xx | `error` | `useState` local dans la page | Aucun |
| Erreur réseau (drawer) | `error` | `useState` local dans le drawer | Aucun |

**Règle de différenciation — Alert vs Inline :**

| Type d'erreur | Rendu | Composant |
|---------------|-------|-----------|
| Validation (400) | Sous le champ concerné | `helperText` + `error` prop du `TextField` |
| Conflit de nom (409 CONFLICT) | Sous le champ name | `helperText` + `error` prop du `TextField` |
| Suppression bloquée (409 DEPENDENCY_CONFLICT) | Dans le `ConfirmDialog` | Message du dialog remplacé par `format409Message()` |
| Erreur serveur (5xx) | Au-dessus du formulaire | `ArkAlert severity="error"` |
| Erreur réseau (drawer) | Dans le drawer | `ArkAlert severity="error"` |

> **Règle absolue :** Ne jamais créer de `Snackbar` ou d'`Alert` inline dans une page. Toujours passer par le composant `ArkAlert`. Ce composant est le patron réutilisable pour tous les modules FS-02 à FS-11.

**Transport des alertes succès entre pages :**

Les alertes succès sont transmises via `react-router-dom` navigation state pour éviter tout re-fetch et maintenir le contexte de navigation :

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

### 7.4 `ConfirmDialog` — Suppression bloquée

Quand un `DELETE` retourne `409 DEPENDENCY_CONFLICT` :
- Le message du dialog est **remplacé** par le message formaté (`format409Message()`)
- Le bouton Confirmer est **désactivé** (`disabled`)
- Le dialog **reste ouvert** — l'utilisateur doit fermer explicitement
- Aucune `ArkAlert` n'est déclenchée dans ce cas

```typescript
// Comportement ConfirmDialog sur 409 DEPENDENCY_CONFLICT
{
  message: format409Message(t, appCount, bcCount),  // remplace le message initial
  confirmButton: <Button disabled color="error">Supprimer</Button>,
  cancelButton: visible et actif
}
```

---

## 8. Graphiques (React Flow)

* **Canvas :** Fond blanc avec une grille de points (`Dots`) gris clair
* **Nodes :** Fond blanc, bordure indigo 1px, titres en gras

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

## 10. Composants Métier

Certains composants réutilisables mais spécifiques à un domaine métier sont documentés dans leur Feature Spec respective :

| Composant | Feature Spec | Usage |
|---|---|---|
| `DimensionTagInput` | F-03 §6 | Saisie de tags hiérarchiques par dimension (Geography, Brand, etc.) |
| `ConfirmDialog` | F-01 §7 | Confirmation de suppression avec gestion 409 DEPENDENCY_CONFLICT |
| `ExpiryDateBadge` | FS-03 §4.4 | Badge conditionnel sur date d'expiration : URGENT <30j (rouge), ALERTE <90j (orange), normal >90j |
| `ProviderRoleBadge` | FS-03 v1.1 §4.4 | Badge coloré par rôle de fournisseur (N:N) : editor (bleu), integrator (orange), support (cyan), vendor (jaune), custom (gris) |
| `AppBreadcrumbs` | PNS-11 (Recommended) | Breadcrumb systématique 3 niveaux (Accueil > Liste > Courant). À implémenter comme composant partagé dans F-01 Design System ou FS-11 Navigation Transverse |

> **Note :** Ces composants suivent les mêmes règles de design (tokens, sx prop, i18n) que les composants génériques.

---

_Document de travail v0.4 — Projet ARK_