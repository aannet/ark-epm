# SESSION HANDOFF — spec — T-017 FS-07 Lifecycle (2026-04-12)

Agent : `spec` | Session : `b3d7a1` | Tâche : T-017 → **done**

---

## Ce qui a été fait

### Spec produite

**`docs/03-Features-Spec/P2/FS-07-P2-Lifecycle-front.md`** — statut `stable`

Onglet "Lifecycle" sur les pages Detail et Edit d'une Business Capability.

### Décisions clés

| Décision | Valeur retenue |
|---|---|
| Modèle lifecycle BC | Réutilise les 5 phases existantes des Applications (`draft → in_progress → production → deprecated → retired`) |
| Champ backend | `lifecycleStatus String?` — même type que `Application.lifecycleStatus` (VarChar 50, nullable) |
| Composant UI | Nouveau `LifecycleStepper` dans `components/shared/` — chevrons MUI sx-only |
| Placement onglet | Entre "Relations" et "Audit" sur EditPage ; onglet supplémentaire sur DetailPage |
| Édition | Clic sur une phase pour la sélectionner + bouton Enregistrer (PATCH /:id) |

### Tâche dérivée créée

**T-052** (`open`, agent `data`) — Amendment Prisma + DTOs backend :
- Ajouter `lifecycleStatus String? @map("lifecycle_status") @db.VarChar(50)` sur `BusinessCapability`
- Migration : `npx prisma migrate dev --name add_lifecycle_status_to_business_capabilities`
- Exposer dans DTOs : Response, ListItem, TreeNode, UpdateDto

---

## Points d'attention pour T-052

### Agent `data`

```prisma
// schema.prisma — modèle BusinessCapability, après technicalFit :
lifecycleStatus  TechnicalFitLevel?  @map("technical_fit")
// ↓ ajouter :
lifecycleStatus  String?             @map("lifecycle_status") @db.VarChar(50)
```

Pas d'enum — type `String?` libre pour conserver la flexibilité (pattern identique à `Application.lifecycleStatus`).

### Agent `back`

DTOs à mettre à jour dans `backend/src/business-capabilities/dto/` :

| DTO | Champ à ajouter |
|---|---|
| `BusinessCapabilityResponseDto` | `lifecycleStatus?: string \| null` |
| `BusinessCapabilityListItemDto` | `lifecycleStatus?: string \| null` |
| `BusinessCapabilityTreeNodeDto` | `lifecycleStatus?: string \| null` |
| `UpdateBusinessCapabilityDto` | `@IsOptional() @IsString() lifecycleStatus?: string \| null` |

Le `CreateBusinessCapabilityDto` peut également recevoir `lifecycleStatus` en optionnel.

---

## Gate pour l'agent `front` (FS-07-P2-FRONT)

- [ ] T-052 done — `lifecycleStatus` disponible dans `GET /api/v1/business-capabilities/:id`
- [ ] Clés i18n `businessCapabilities.lifecycle.*` ajoutées dans `fr.json` (voir spec §5)
- [ ] `FS-07-P2-Lifecycle-front.md` passe à `stable` → déjà fait (spec validée)

Commande OpenCode front disponible en **§8 de la spec**.

---

## Fichiers modifiés cette session

| Fichier | Action |
|---|---|
| `docs/03-Features-Spec/P2/FS-07-P2-Lifecycle-front.md` | Créé — spec stable |
| `docs/05-Project/tasks.yaml` | T-017 → done ; T-052 créé |
