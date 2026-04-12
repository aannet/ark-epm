# SESSION HANDOFF — front — T-056 Revert lifecycle BC — 2026-04-12

Agent : `front` | Session : `c3f8b1` | Tâche : T-056 → **done**

---

## Ce qui a été fait

### Revert complet lifecycle Business Capabilities (9 fichiers)

| Fichier | Modification |
|---|---|
| `frontend/src/pages/business-capabilities/BusinessCapabilityDetailPage.tsx` | Suppression onglets Tabs/Tab, retour à `<Paper>` direct, imports Tabs/Tab/Alert/LifecycleStepper retirés |
| `frontend/src/pages/business-capabilities/BusinessCapabilityEditPage.tsx` | Onglet Lifecycle (index 2) supprimé, Audit redescendu à index 2, states selectedPhase/lifecycleAlert + handler handleLifecycleSave retirés, imports Button/ArkAlert/LifecycleStepper/BcLifecyclePhase retirés |
| `frontend/src/i18n/locales/fr.json` | Bloc `businessCapabilities.lifecycle.*` (7 clés) + `businessCapabilities.snackbar.lifecycleUpdated` supprimés |
| `frontend/src/types/businessCapability.ts` | `lifecycleStatus: string \| null` supprimé de `BusinessCapability` + `lifecycleStatus?: string \| null` supprimé de `BusinessCapabilityFormValues` |
| `backend/src/business-capabilities/dto/create-business-capability.dto.ts` | Champ `lifecycleStatus` retiré |
| `backend/src/business-capabilities/dto/update-business-capability.dto.ts` | Champ `lifecycleStatus` retiré |
| `backend/src/business-capabilities/business-capabilities.service.ts` | `lifecycleStatus` retiré du type `BusinessCapabilityTreeNode`, du select `findTree()`, de `create()` data, de `update()` data |
| `backend/prisma/schema.prisma` | Champ `lifecycleStatus String? @map("lifecycle_status") @db.VarChar(50)` supprimé sur `BusinessCapability` |
| `docs/05-Project/tasks.yaml` | T-056 → done |

### Base de données

- `prisma db push --accept-data-loss` exécuté dans le container `ark-epm-backend-1`
- Colonne `lifecycle_status` supprimée de la table `business_capabilities`
- Prisma Client régénéré

### Validation

- `make validate-backend` ✅ (build TypeScript propre)
- `make test-api-backend` : **103/107** passent — score inchangé, aucune régression

---

## Ce qui est conservé (intentionnellement)

- `frontend/src/components/shared/LifecycleStepper.tsx` — **conservé** pour T-055 (Applications)
- `frontend/src/i18n/locales/fr.json` bloc `applications.lifecycle.*` (5 clés phases) — **conservé**
- `frontend/src/types/application.ts` — `lifecycleStatus: string | null` sur Application, ApplicationFormValues, ApplicationListItem — **intact**

---

## Gates pour les tâches suivantes

### T-054 — Backend audit Applications lifecycleStatus (assigned_agent: back)

Fichiers à inspecter :
- `backend/src/applications/dto/update-application.dto.ts` (ligne ~65) — vérifier `lifecycleStatus` présent et nullable
- `backend/src/applications/applications.service.ts` (lignes ~300, ~408, ~608) — vérifier `findOne()` select + `update()` data
- `backend/src/applications/applications.controller.ts` — vérifier que `GET /:id` et `PATCH /:id` sont bien mappés

Tests à valider manuellement ou via `make test-api-backend` :
1. `GET /api/v1/applications/:id` → champ `lifecycleStatus` présent dans la réponse JSON
2. `PATCH /api/v1/applications/:id { "lifecycleStatus": null }` → retourne 200 avec `lifecycleStatus: null`

Aucune modification attendue si tout est déjà en place (audit rapide prévu par le handoff T-053).

### T-055 — Frontend LifecycleStepper Applications (assigned_agent: front)

Gate : T-054 done.

Clés i18n à ajouter dans `fr.json` sous `applications.lifecycle` :
```json
"tabLabel": "Lifecycle",
"sectionTitle": "Trajectoire de modernisation",
"editDescription": "Sélectionnez la phase actuelle de cette application dans sa trajectoire de modernisation.",
"notDefined": "Aucune phase de lifecycle définie pour cette application.",
"clearButton": "Réinitialiser"
```
Et sous `applications.snackbar` :
```json
"lifecycleUpdated": "Phase de lifecycle mise à jour"
```

`ApplicationDetailPage.tsx` :
- Actuellement : `lifecycleStatus` affiché via `<StatusChip type="lifecycle" />` dans le corps (ligne ~120)
- Cible : onglet "Lifecycle" (lecture seule) avec `<LifecycleStepper currentPhase={application.lifecycleStatus} />`

`ApplicationEditPage.tsx` :
- Actuellement : `<Select>` avec `LIFECYCLE_STATUSES` constantes (ligne ~169)
- Cible : onglet "Lifecycle" éditable avec `<LifecycleStepper editable onPhaseChange={...} />`

Pattern exact à reproduire : voir `BusinessCapabilityEditPage.tsx` dans git history (commit T-053 `238f4f9`) pour référence du pattern implémenté puis revert.

---

## Score tests au moment de la clôture

| Suite | Passants | Échecs | Note |
|---|---|---|---|
| global | 103/107 | 4 | 3 échecs T-050 préexistants + 1 skipped |
