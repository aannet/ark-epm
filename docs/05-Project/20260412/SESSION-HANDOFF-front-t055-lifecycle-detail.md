# SESSION HANDOFF — front — T-055 LifecycleStepper ApplicationDetailPage — 2026-04-12

Agent : `front` | Session : `f1a2b3` | Tâches : T-054 → done, T-055 → done, T-057 → open

---

## Ce qui a été fait

### T-054 — Audit backend (RAS)

Audit confirmé sans modification. Les 3 points sont déjà corrects dans le backend :
1. `GET /api/v1/applications/:id` → `mapApplicationResponse()` inclut `lifecycleStatus` (service.ts:608)
2. `PATCH /api/v1/applications/:id { lifecycleStatus: null }` → géré ligne 408, `@IsOptional()` OK
3. `UpdateApplicationDto` : `@IsString() @IsOptional() lifecycleStatus?: string` (dto:65)

### T-055 — Frontend LifecycleStepper ApplicationDetailPage

| Fichier | Modification |
|---|---|
| `frontend/src/components/shared/LifecycleStepper.tsx` | Fix bug i18n : `businessCapabilities.lifecycle.${phase}` → `applications.lifecycle.${phase}` (les clés BC avaient été supprimées par T-056, le composant était silencieusement cassé) |
| `frontend/src/i18n/locales/fr.json` | Ajout `common.comingSoon: "À venir"` + `applications.lifecycle.tabLabel: "Assessment"`, `sectionTitle`, `notDefined` |
| `frontend/src/pages/applications/ApplicationDetailPage.tsx` | Tabs MUI (2 onglets) : "Informations générales" + "Assessment" |

#### Structure ApplicationDetailPage

- **Tab 0 "Informations générales"** (défaut) :
  - Champs nom, criticality, description, comment
  - Section `LifecycleStepper read-only` inline sous les champs (remplace le StatusChip lifecycle supprimé)
  - Section Relations (domain, providers, IT components, BCs, owner)
  - Section Tags
  - Section Métadonnées (createdAt, updatedAt)
- **Tab 1 "Assessment"** :
  - Contenu : `t('common.comingSoon')` = "À venir"
  - Réservé pour contenu futur (non spécifié)

---

## Ce qui reste à faire — T-057

**`ApplicationEditPage` / `ApplicationForm.tsx`** — LifecycleStepper éditable.

### Contexte

- `ApplicationForm.tsx` lignes 626–645 : `<FormControl>` avec `<Select>` lifecycle à remplacer
- `ApplicationEditPage.tsx` ligne 169 : `lifecycleStatuses: LIFECYCLE_STATUSES` passé en prop (à retirer)
- `ApplicationEditPage.tsx` ligne 21 : `const LIFECYCLE_STATUSES = [...]` (à supprimer)

### À implémenter

1. **i18n** — ajouter dans `fr.json` sous `applications.lifecycle` :
   ```json
   "editDescription": "Sélectionnez la phase actuelle de cette application dans sa trajectoire de modernisation.",
   "clearButton": "Réinitialiser"
   ```
   Et créer `applications.snackbar` :
   ```json
   "lifecycleUpdated": "Phase de lifecycle mise à jour"
   ```

2. **`ApplicationForm.tsx`** — remplacer les lignes 626–645 :
   ```tsx
   // AVANT
   <FormControl fullWidth disabled={isLoading}>
     <InputLabel id="lifecycle-status-label">...</InputLabel>
     <Select ...>{LIFECYCLE_STATUSES.map(...)}</Select>
   </FormControl>

   // APRÈS
   <Box>
     <Typography variant="subtitle2" sx={{ mb: 1 }}>
       {t('applications.form.lifecycleStatusLabel')}
     </Typography>
     <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
       {t('applications.lifecycle.editDescription')}
     </Typography>
     <LifecycleStepper
       currentPhase={values.lifecycleStatus}
       editable
       onPhaseChange={(phase) => handleChange('lifecycleStatus', phase)}
     />
     {values.lifecycleStatus && (
       <Button
         size="small"
         variant="text"
         color="inherit"
         sx={{ mt: 1 }}
         onClick={() => handleChange('lifecycleStatus', null)}
         disabled={isLoading}
       >
         {t('applications.lifecycle.clearButton')}
       </Button>
     )}
   </Box>
   ```

3. **`ApplicationForm.tsx`** — retirer `lifecycleStatuses` de l'interface `availableOptions` et du destructuring (non nécessaire avec LifecycleStepper).

4. **`ApplicationEditPage.tsx`** — supprimer `LIFECYCLE_STATUSES` constante (ligne 21) et `lifecycleStatuses: LIFECYCLE_STATUSES` dans `availableOptions` (ligne 169).

5. **`ApplicationNewPage.tsx`** — même nettoyage que EditPage si `LIFECYCLE_STATUSES` y est aussi.

### Notes

- Le `lifecycleStatus` continue d'être sauvegardé via le submit du formulaire (PATCH /:id avec tous les champs).
- Le snackbar `lifecycleUpdated` peut être déclenché en remplacement du snackbar `updated` générique, ou ignoré pour cette session.
- `LifecycleStepper` est dans `components/shared/LifecycleStepper.tsx` — import : `import { LifecycleStepper } from '@/components/shared/LifecycleStepper'`

---

## Score tests au moment de la clôture

| Suite | Passants | Échecs | Note |
|---|---|---|---|
| global | 103/107 | 4 | 3 échecs T-050 préexistants + 1 skipped — inchangé |
