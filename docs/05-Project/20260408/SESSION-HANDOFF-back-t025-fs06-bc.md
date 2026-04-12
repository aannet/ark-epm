# SESSION-HANDOFF — back — T-025 — FS-06 Amendment Business Capabilities

Date : 2026-04-08 | Agent : back | Commit : b4ca760

## Ce qui a été fait

### Backend (T-025 — done)
- `capabilityIds?: string[]` ajouté dans `CreateApplicationDto` + `UpdateApplicationDto`
  (`@IsOptional`, `@IsArray`, `@ArrayMinSize(0)`, `@IsUUID('4', { each: true })`)
- `validateForeignKeys()` vérifie les Business Capabilities et lève `404` `BUSINESS_CAPABILITY_NOT_FOUND`
- `create()` synchronise `app_capability_map` via `createMany` quand `capabilityIds` est fourni
- `update()` fait `deleteMany` puis `createMany` quand `capabilityIds !== undefined`
- `findAll()` + `findOne()` incluent `capabilities.capability { id, name }`
- `mapApplicationResponse()` expose `businessCapabilities: [{ id, name }]`

### Tests validés
- Supertest `backend/test/FS-06-applications.e2e-spec.ts` : 21/21 PASS
- Playwright API étendu :
  - `e2e/tests/applications/applications-crud.api.spec.ts`
  - `e2e/tests/applications/applications-validation.api.spec.ts`
- Fixture cleanup mise à jour : `e2e/fixtures/test-data.fixture.ts`
  - detach `capabilityIds: []` avant DELETE application

### Contrat API et docs
- `docs/04-Tech/openapi.yaml` mis à jour en `1.4.0`
  - `CreateApplicationDto`/`UpdateApplicationDto` : `capabilityIds: string[]`
  - `ApplicationResponse`/`ApplicationListItem` : `businessCapabilities: [{ id, name }]`
- `docs/03-Features-Spec/FS-06-Applications-back.md` passé en v1.4
  - changelog BC, RM-10, checklist tests enrichie

## Points d'attention pour la suite (T-026 front)

### Gate
- T-025 est done : T-026 est débloquée.

### À implémenter côté front
1. `types/application.ts`
   - ajouter `businessCapabilities` dans `Application`
   - ajouter `capabilityIds: string[]` dans `ApplicationFormValues`
2. `ApplicationForm.tsx`
   - Autocomplete multi-sélection BC (pattern `itComponents`, sans rôle)
3. `ApplicationNewPage` + `ApplicationEditPage`
   - charger `useBusinessCapabilities()`
   - mapper/passer `capabilityIds`
4. `ApplicationDetailPage`
   - afficher la section Relations > Business Capabilities
5. `fr.json`
   - ajouter `applications.relations.businessCapabilities.*`
   - ajouter `applications.form.businessCapabilitiesLabel`
6. `BusinessCapabilityEditPage.tsx:296`
   - remplacer la string hardcodée par une clé i18n

### Notes pratiques
- Le hook `useBusinessCapabilities()` existe déjà via FS-07-FRONT.
- Aucun endpoint backend additionnel n'est requis pour T-026.
