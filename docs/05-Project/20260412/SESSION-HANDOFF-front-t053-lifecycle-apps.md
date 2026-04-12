# SESSION HANDOFF — front — T-053 LifecycleStepper (correction cible : Applications) — 2026-04-12

Agent : `front` | Session : `f3a9c1` | Tâche : T-053 → **done** (avec correction requise)

---

## Ce qui a été fait

### Composant partagé créé

`frontend/src/components/shared/LifecycleStepper.tsx` — **à conserver**

- 5 chevrons (draft → in_progress → production → deprecated → retired)
- Props : `currentPhase: string | null`, `editable?: boolean`, `onPhaseChange?: (phase) => void`
- États visuels : `completed` (vert + CheckIcon), `active` (#1A237E navy), `upcoming` (grey.200)
- Shape chevron via `clip-path: polygon(...)` dans `sx`
- Responsive : `flexWrap` sur mobile (< md), forme rectangulaire sans clip-path
- Export : `LifecycleStepper` (default) + `BC_LIFECYCLE_PHASES` + `BcLifecyclePhase`

### Fichiers modifiés (à reverter partiellement par T-056)

| Fichier | Modification | Action T-056 |
|---|---|---|
| `frontend/src/types/businessCapability.ts` | `lifecycleStatus: string \| null` sur `BusinessCapability` + `BusinessCapabilityFormValues` | Supprimer |
| `frontend/src/i18n/locales/fr.json` | Bloc `businessCapabilities.lifecycle.*` + `snackbar.lifecycleUpdated` | Supprimer |
| `frontend/src/pages/business-capabilities/BusinessCapabilityDetailPage.tsx` | Tabs Général + Lifecycle, onglet Lifecycle lecture seule | Retirer onglet + imports |
| `frontend/src/pages/business-capabilities/BusinessCapabilityEditPage.tsx` | Onglet Lifecycle éditable (index 2), Audit décalé à index 3 | Retirer onglet + imports |

### Types frontend Application (déjà présents — rien à faire)

`frontend/src/types/application.ts` :
- `Application.lifecycleStatus: string | null` ✅
- `ApplicationFormValues.lifecycleStatus: string | null` ✅
- `ApplicationListItem.lifecycleStatus: string | null` ✅

### Backend Applications (déjà complet — T-054 sera rapide)

- `GET /api/v1/applications/:id` → `lifecycleStatus` dans la réponse ✅ (à confirmer par T-054)
- `PATCH /api/v1/applications/:id` → accepte `lifecycleStatus` ✅ (service ligne ~408)
- Filtrage sur `lifecycleStatus` dans `GET /applications` ✅

---

## Erreur détectée en session

T-053 a été exécuté sur la **mauvaise entité** (Business Capabilities au lieu d'Applications).
La spec `FS-07-P2-Lifecycle-front.md` était la référence chargée au rituel d'ouverture — elle ciblait BC.
L'utilisateur a corrigé la direction en cours de session.

---

## Gates pour les tâches suivantes

### T-056 — Retrait complet lifecycle BC

**Couche FRONT :**
- `BusinessCapabilityDetailPage.tsx` : supprimer onglets → revenir à une page sans `<Tabs>` (structure `<Paper>` directe)
  - Retirer imports : `Tabs`, `Tab`, `Alert`, `LifecycleStepper`
  - Retirer state `activeTab`
  - Retirer `TabPanel` local
- `BusinessCapabilityEditPage.tsx` : supprimer onglet Lifecycle (index 2), redescendre Audit à index 2
  - Retirer imports : `Button` (si inutilisé ailleurs), `ArkAlert`, `LifecycleStepper`, `BcLifecyclePhase`
  - Retirer states : `selectedPhase`, `lifecycleAlert`
  - Retirer handler `handleLifecycleSave`
- `fr.json` : supprimer bloc `businessCapabilities.lifecycle` + `businessCapabilities.snackbar.lifecycleUpdated`
- `types/businessCapability.ts` : supprimer `lifecycleStatus` sur `BusinessCapability` et `BusinessCapabilityFormValues`

**Couche BACK :**
- `backend/src/business-capabilities/dto/create-business-capability.dto.ts` : retirer `lifecycleStatus`
- `backend/src/business-capabilities/dto/update-business-capability.dto.ts` : retirer `lifecycleStatus`
- `backend/src/business-capabilities/business-capabilities.service.ts` : retirer `lifecycleStatus` de `findTree()` select, `create()` data, `update()` data

**Couche DATA :**
- `backend/prisma/schema.prisma` : supprimer `lifecycleStatus String? @map("lifecycle_status") @db.VarChar(50)` sur `BusinessCapability`
- Migration (dans le container) :
  ```bash
  docker exec ark-epm-backend-1 npx prisma migrate dev --name remove_lifecycle_status_from_bc
  ```
  ⚠️ Vérifier que le container est bien `ark-epm-backend-1` (ou `ark-epm_backend_1` selon la version docker-compose).

### T-054 — Audit Applications backend

Vérifier dans Postman ou `make test-api-backend` :
1. `GET /api/v1/applications/:id` → champ `lifecycleStatus` présent dans la réponse JSON
2. `PATCH /api/v1/applications/:id { "lifecycleStatus": null }` → retourne 200 avec `lifecycleStatus: null`

Fichiers backend à inspecter si doute :
- `backend/src/applications/dto/update-application.dto.ts` (ligne ~65)
- `backend/src/applications/applications.service.ts` (lignes ~300, ~408, ~608)

### T-055 — Frontend Applications

Clés i18n à ajouter dans `fr.json` sous `applications.lifecycle` (les labels de phases existent déjà) :
```json
{
  "applications": {
    "lifecycle": {
      "draft": "Brouillon",       ← EXISTE DÉJÀ
      "in_progress": "...",       ← EXISTE DÉJÀ
      "production": "...",        ← EXISTE DÉJÀ
      "deprecated": "...",        ← EXISTE DÉJÀ
      "retired": "...",           ← EXISTE DÉJÀ
      "tabLabel": "Lifecycle",                ← À AJOUTER
      "sectionTitle": "Trajectoire de modernisation",  ← À AJOUTER
      "editDescription": "Sélectionnez la phase actuelle...", ← À AJOUTER
      "notDefined": "Aucune phase de lifecycle définie.", ← À AJOUTER
      "clearButton": "Réinitialiser"          ← À AJOUTER
    },
    "snackbar": {
      "lifecycleUpdated": "Phase de lifecycle mise à jour"  ← À AJOUTER
    }
  }
}
```

`ApplicationDetailPage.tsx` :
- Actuellement : `lifecycleStatus` affiché via `<StatusChip type="lifecycle" />` dans le corps de la page (ligne ~120)
- Cible : onglet "Lifecycle" (lecture seule) avec `<LifecycleStepper currentPhase={application.lifecycleStatus} />`
- Conserver le StatusChip dans l'onglet Général ou le supprimer (décision à prendre)

`ApplicationEditPage.tsx` :
- Actuellement : `<Select>` avec `LIFECYCLE_STATUSES` constantes (ligne ~169)
- Cible : onglet "Lifecycle" éditable avec `<LifecycleStepper editable onPhaseChange={...} />`
- Pattern identique à ce qui a été implémenté pour BC dans cette session

---

## Commit de référence

```
feat(front/session): T-053 — LifecycleStepper + onglets Lifecycle BC (cible corrigée T-056)
SHA : voir git log (branche develop, 2026-04-12)
```
