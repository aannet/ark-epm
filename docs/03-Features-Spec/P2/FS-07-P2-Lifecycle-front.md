# ARK — Feature Spec FS-07-P2-FRONT : Business Capabilities — Onglet Lifecycle

_Version 1.0 — Avril 2026_

> **Spec T-017.** Onglet "Lifecycle" sur la page détail et la page édition d'une Business Capability.
> Visualisation de la trajectoire de modernisation sous forme de stepper chevron.
> Référence visuelle : rendu identique au stepper Applications (cf. screenshot fourni — 5 phases ordonnées, état actif mis en évidence).

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-07-P2-FRONT |
| **Titre** | Business Capabilities — Onglet Lifecycle (P2) |
| **Priorité** | P2 |
| **Statut** | `stable` |
| **Dépend de** | **FS-07-BACK amendment T-052** (gate bloquante — `lifecycleStatus` sur BC), FS-07-FRONT v1.0 done, FS-01, F-02 |
| **Tâche spec** | T-017 |
| **Estimé** | 0.5 jour |
| **Version** | 1.0 |

> ⚠️ Cette spec reste à `draft` tant que **T-052** (amendment FS-07-BACK : ajout `lifecycleStatus` sur `business_capabilities`) n'est pas au statut `done`.

---

## 1. Objectif & Périmètre

**Ce que cette spec fait :**

Ajouter un onglet "Lifecycle" sur `BusinessCapabilityDetailPage` et `BusinessCapabilityEditPage` affichant la trajectoire de modernisation de la capacité sous forme de **stepper chevron** interactif.

Le stepper visualise les 5 phases ordonnées du cycle de vie — identiques à celles utilisées pour les Applications — et met en évidence l'état actuel de la BC.

**Ce que cette spec fait côté frontend :**
- Nouveau composant `LifecycleStepper` (partagé — `components/shared/LifecycleStepper.tsx`)
- Nouvel onglet "Lifecycle" dans `BusinessCapabilityDetailPage` (lecture seule)
- Nouvel onglet "Lifecycle" dans `BusinessCapabilityEditPage` (sélection de la phase courante)
- Clés i18n `businessCapabilities.lifecycle.*`

**Hors périmètre :**
- Amendment backend (ajout colonne `lifecycle_status` sur `business_capabilities`) — couvert par **T-052** (agent `data`)
- Exposition API (`lifecycleStatus` dans les DTOs BC) — couvert par **T-052** (agent `back`)
- Historique des transitions — P3

---

## 2. Modèle de données

### Champ source

Le champ `lifecycleStatus` sera ajouté sur `BusinessCapability` par T-052 (amendment backend).
Type : `string | null` — mêmes valeurs que `Application.lifecycleStatus`.

### Phases ordonnées

```typescript
export const BC_LIFECYCLE_PHASES = [
  'draft',
  'in_progress',
  'production',
  'deprecated',
  'retired',
] as const;

export type BcLifecyclePhase = typeof BC_LIFECYCLE_PHASES[number];
```

| Valeur | Label FR | Couleur stepper |
|---|---|---|
| `draft` | Brouillon | `grey` (neutre) |
| `in_progress` | En développement | `info` (bleu) |
| `production` | En production | `success` (vert) |
| `deprecated` | Dépréciée | `warning` (orange) |
| `retired` | Retirée | `default` (gris foncé) |

### Logique d'état des étapes

Soit `currentPhase` la valeur de `bc.lifecycleStatus` :

```typescript
function getStepState(
  phase: BcLifecyclePhase,
  currentPhase: BcLifecyclePhase | null
): 'completed' | 'active' | 'upcoming' {
  if (!currentPhase) return 'upcoming';
  const currentIndex = BC_LIFECYCLE_PHASES.indexOf(currentPhase);
  const phaseIndex = BC_LIFECYCLE_PHASES.indexOf(phase);
  if (phaseIndex < currentIndex) return 'completed';
  if (phaseIndex === currentIndex) return 'active';
  return 'upcoming';
}
```

| État | Style chevron |
|---|---|
| `completed` | Fond vert (`success.main`), icône `CheckIcon` blanc, texte blanc |
| `active` | Fond navy (`primary.dark` / `#1A237E`), texte blanc gras |
| `upcoming` | Fond `grey.200`, texte `text.secondary` |

---

## 3. Composant `LifecycleStepper`

### Localisation

```
frontend/src/components/shared/LifecycleStepper.tsx
```

### Interface

```typescript
interface LifecycleStepperProps {
  /** Phase courante de l'entité (null = non défini) */
  currentPhase: string | null;
  /** Mode édition : clic sur une phase appelle onPhaseChange */
  editable?: boolean;
  /** Callback appelé lors d'un clic en mode édition */
  onPhaseChange?: (phase: BcLifecyclePhase) => void;
}
```

### Rendu

```yaml
layout:
  component: Box (display flex, flexWrap wrap, gap 0)
  
  pour chaque phase dans BC_LIFECYCLE_PHASES:
    component: Box (position relative, display flex, alignItems center)
    
    inner:
      component: Box
      shape: chevron (pseudo-element ::after pour la flèche droite)
      sx:
        minWidth: 160px
        height: 40px
        display: flex
        alignItems: center
        justifyContent: center
        gap: 1
        paddingLeft: 3 (sauf première phase)
        paddingRight: 2
        cursor: editable ? 'pointer' : 'default'
        backgroundColor: selon état (completed=success.main, active=primary.dark, upcoming=grey.200)
        color: selon état (completed/active=white, upcoming=text.secondary)
        fontWeight: active ? 700 : 400
        fontSize: '0.75rem'
        letterSpacing: '0.05em'
        transition: 'background-color 0.2s'
        '&:hover' (si editable et non active): backgroundColor légèrement assombri

    content:
      - si completed: <CheckIcon sx={{ fontSize: 14 }} />
      - label: t(`businessCapabilities.lifecycle.${phase}`)
```

> **Note implémentation** : les chevrons peuvent être réalisés avec `clip-path: polygon(...)` ou via `::before`/`::after` CSS dans `sx`. Pas de librairie externe. Le composant est responsive : `flexWrap: 'wrap'` → passage à la ligne sur petit écran.

### Comportement responsive

- Desktop (≥ md) : toutes les phases sur une ligne
- Mobile (< md) : passage à la ligne, chaque phase occupe 100% de largeur, forme rectangulaire (sans chevron)

---

## 4. Layout Contract

### 4.1 Onglet Lifecycle — `BusinessCapabilityDetailPage` (lecture seule)

```yaml
page: BusinessCapabilityDetailPage
route: /business-capabilities/:id
tab_id: lifecycle
tab_label: t('businessCapabilities.lifecycle.tabLabel')

on_load:
  data_source: bc.lifecycleStatus (déjà chargé par le GET /:id principal)

zones:
  header:
    component: Typography variant="h6"
    content: t('businessCapabilities.lifecycle.sectionTitle')
    sx: { mb: 3 }

  stepper:
    component: LifecycleStepper
    props:
      currentPhase: bc.lifecycleStatus
      editable: false

  empty_state:
    condition: bc.lifecycleStatus === null
    component: ArkAlert
    props:
      severity: info
      message: t('businessCapabilities.lifecycle.notDefined')
```

### 4.2 Onglet Lifecycle — `BusinessCapabilityEditPage` (édition)

```yaml
page: BusinessCapabilityEditPage
route: /business-capabilities/:id/edit
tab_id: lifecycle
tab_label: t('businessCapabilities.lifecycle.tabLabel')

on_load:
  data_source: bc.lifecycleStatus (déjà chargé)
  local_state: selectedPhase = bc.lifecycleStatus

zones:
  description:
    component: Typography variant="body2" color="text.secondary"
    content: t('businessCapabilities.lifecycle.editDescription')
    sx: { mb: 3 }

  stepper:
    component: LifecycleStepper
    props:
      currentPhase: selectedPhase
      editable: true
      onPhaseChange: (phase) => setSelectedPhase(phase)

  clear_action:
    condition: selectedPhase !== null
    component: Button
    props:
      variant: outlined
      size: small
      color: inherit
      label: t('businessCapabilities.lifecycle.clearButton')
      onClick: setSelectedPhase(null)
    sx: { mt: 2 }

  save_section:
    component: Box
    sx: { mt: 4, display: 'flex', gap: 2 }
    actions:
      - component: Button
        props:
          variant: contained
          disabled: selectedPhase === bc.lifecycleStatus
          label: t('common.actions.save')
          onClick: |
            PATCH /api/v1/business-capabilities/:id { lifecycleStatus: selectedPhase }
            on_success:
              - invalidateQueries(['businessCapability', id])
              - snackbar: t('businessCapabilities.snackbar.lifecycleUpdated') severity=success
      - component: Button
        props:
          variant: outlined
          label: t('common.actions.cancel')
          onClick: setSelectedPhase(bc.lifecycleStatus)  # reset local state
```

### 4.3 Intégration dans les onglets existants

**`BusinessCapabilityDetailPage`** — ajouter l'onglet après les champs existants :

```typescript
// Ajout dans le tableau des onglets (si structure MUI Tabs)
{ id: 'lifecycle', label: t('businessCapabilities.lifecycle.tabLabel') }
```

**`BusinessCapabilityEditPage`** — onglet supplémentaire après "Relations" et avant "Audit" :

```yaml
tabs_order:
  - general   # §4.7 FS-07-FRONT
  - relations # §4.7 FS-07-FRONT
  - lifecycle # NOUVEAU — T-017
  - audit     # §4.7 FS-07-FRONT
```

---

## 5. Clés i18n à ajouter dans `fr.json`

```json
{
  "businessCapabilities": {
    "lifecycle": {
      "tabLabel": "Lifecycle",
      "sectionTitle": "Trajectoire de modernisation",
      "editDescription": "Sélectionnez la phase actuelle de cette capacité métier dans sa trajectoire de modernisation.",
      "notDefined": "Aucune phase de lifecycle définie pour cette capacité.",
      "clearButton": "Réinitialiser",
      "draft": "Brouillon",
      "in_progress": "En développement",
      "production": "En production",
      "deprecated": "Dépréciée",
      "retired": "Retirée"
    },
    "snackbar": {
      "lifecycleUpdated": "Phase de lifecycle mise à jour"
    }
  }
}
```

---

## 6. Gates — Conditions pour passer à `stable`

- [ ] **T-052 done** — `lifecycleStatus` exposé dans `GET /api/v1/business-capabilities/:id` (agent `data` + `back`)
- [ ] **API testée** — `PATCH /:id { lifecycleStatus: "production" }` retourne 200 avec le champ mis à jour
- [ ] **FS-07-FRONT v1.0 done** (T-018) — pages Detail et Edit existantes avec structure d'onglets
- [ ] **F-02 done** — `useTranslation()` disponible
- [ ] **Clés i18n `businessCapabilities.lifecycle.*` ajoutées dans `fr.json`** (§5)
- [ ] **Composant `LifecycleStepper` créé** dans `components/shared/`

---

## 7. Tâches dérivées à créer

| ID | Agent | Description |
|---|---|---|
| T-052 | `data` + `back` | Amendment FS-07-BACK — Ajouter `lifecycleStatus String?` sur `BusinessCapability` : migration Prisma + exposition dans DTOs + endpoint PATCH |

---

## 8. Commande OpenCode — Frontend

```
Contexte projet ARK — Session Frontend FS-07-P2-FRONT (T-017) :

Stack : React 18 + Vite + TypeScript strict + MUI v9 + react-i18next
Règles MUI obligatoires :
- MUI v9 UNIQUEMENT — pas de Tailwind, pas de styled-components
- Styling : sx prop uniquement — jamais de styled()
- Inputs : variant="outlined" systématiquement

Tâche : Implémenter l'onglet "Lifecycle" sur BusinessCapabilityDetailPage et BusinessCapabilityEditPage.

Prérequis vérifiés :
- bc.lifecycleStatus: string | null disponible depuis GET /api/v1/business-capabilities/:id
- Pages Detail et Edit existantes avec onglets MUI Tabs
- Composants shared : AppBreadcrumbs, ArkAlert, StatusChip disponibles

À créer :
1. frontend/src/components/shared/LifecycleStepper.tsx
   - Props : currentPhase: string | null, editable?: boolean, onPhaseChange?: (phase: string) => void
   - Rendu : 5 chevrons horizontaux (draft → in_progress → production → deprecated → retired)
   - États visuels :
     * completed (phases avant currentPhase) : fond vert success.main, icône CheckIcon, texte blanc
     * active (currentPhase) : fond #1A237E (primary.dark), texte blanc gras
     * upcoming (phases après currentPhase) : fond grey.200, texte text.secondary
   - Chevron shape : via clip-path ou border-trick CSS dans sx
   - editable=true : clic sur une phase appelle onPhaseChange(phase)
   - Responsive : flexWrap sur mobile

2. Ajouter onglet "Lifecycle" dans BusinessCapabilityDetailPage
   - Lecture seule : <LifecycleStepper currentPhase={bc.lifecycleStatus} />
   - Si null : ArkAlert severity="info" message={t('businessCapabilities.lifecycle.notDefined')}

3. Ajouter onglet "Lifecycle" dans BusinessCapabilityEditPage (entre "Relations" et "Audit")
   - État local : const [selectedPhase, setSelectedPhase] = useState(bc.lifecycleStatus)
   - <LifecycleStepper editable onPhaseChange={setSelectedPhase} currentPhase={selectedPhase} />
   - Bouton "Réinitialiser" si selectedPhase !== null
   - Bouton "Enregistrer" : PATCH /:id { lifecycleStatus: selectedPhase }
     disabled si selectedPhase === bc.lifecycleStatus
     on_success : invalidateQueries + snackbar

Clés i18n businessCapabilities.lifecycle.* déjà ajoutées dans fr.json.
```
