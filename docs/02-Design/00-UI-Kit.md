# ARK — UI Kit & Charte Design

_Version 0.2 — Mars 2026_

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
| **Table** | `IconButton` | Actions de ligne (Edit/Delete) dans les tableaux |
| **Désactivé** | `Button disabled` | Bouton Confirmer dans `ConfirmDialog` quand la suppression est bloquée (409 DEPENDENCY_CONFLICT) |

---

## 4. Saisie de Données (Forms)

* **Style :** `TextField variant="outlined"`
* **Densité :** `size="small"` pour les formulaires complexes (Applications/Interfaces)
* **Radius :** `6px` (Action Radius)
* **Validation :** Les erreurs s'affichent en rouge (`error.main`) avec un message d'aide descriptif sous le champ

---

## 5. Tableaux de Données

Le cœur de l'analyse ARK.

* **Header :** Fond gris neutre (`#F1F5F9`), texte en majuscules, gras, taille réduite (`0.75rem`)
* **Lignes :** Bordure inférieure simple `1px solid #E2E8F0`. Pas de rayures (zebra-striping) pour garder un aspect épuré
* **Typographie technique :** Les IDs (ex: `APP-204`) utilisent `JetBrains Mono`

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

**Positionnement :** `anchorOrigin: { vertical: 'top', horizontal: 'center' }` — systématique sur toutes les pages.

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

_Document de travail v0.2 — Projet ARK_