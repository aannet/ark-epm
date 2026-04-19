# SESSION-HANDOFF — T-059 FS-11 Omnisearch Spec

> Agent `spec` — Session OC c3a7f1 — 2026-04-19

---

## Résumé de la session

**Tâche** : T-059 — Rédaction specs FS-11 Omnisearch back et front  
**Statut** : ✅ DONE  
**Livrables** :
- `docs/03-Features-Spec/FS-11-omnisearch-back.md` (stable)
- `docs/03-Features-Spec/FS-11-omnisearch-front.md` (draft)
- `docs/03-Features-Spec/FS-11-omnisearch-userstories.md` (stable) ← complété post-session avec 11 US détaillées

---

## Décisions clés

### Entités searchables
7 entités EA incluses (demande utilisateur : oui aux interfaces malgré FS-08-FRONT en draft) :
1. `application`
2. `domain`
3. `businessCapability`
4. `provider`
5. `itComponent`
6. `dataObject`
7. `interface` ← inclus même si page détail non implémentée

### Format réponse backend
Liste **plate** de max 20 résultats, triée par score décroissant (score 10 = match exact, 1 = description contient). Pas de groupage côté backend — le frontend groupe pour l'affichage.

### UX frontend
- Trigger : `Ctrl+K` / `Cmd+K` + icône dans TopBar
- Debounce : 300ms
- Min chars : 2
- Navigation clavier : ↑↓ Enter Escape
- Groupage par type côté client (pas de "Voir plus" par groupe pour MVP)

### Permission
Pas de permission spécifique `search:read` — tout user authentifié peut chercher.

---

## Gates levées / Nouvelles gates

| Tâche | Ancien statut | Nouveau statut | Déblocage |
|-------|---------------|----------------|-----------|
| T-059 | `open` | `done` | — |
| T-060 | `blocked` | `ready` | FS-11-BACK spec stable ✅ |
| T-061 | `blocked` | `blocked` | Attend T-060 done + FS-11-FRONT stable |

---

## Files créés/modifiés

```
docs/05-Project/tasks.yaml                          # T-059 → done, sessions[] mis à jour
docs/03-Features-Spec/FS-11-omnisearch-back.md        # NEW — stable
docs/03-Features-Spec/FS-11-omnisearch-front.md       # NEW — draft (gate FS-11-BACK)
docs/03-Features-Spec/FS-11-omnisearch-userstories.md # NEW — stable (11 US complètes)
```

---

## Prochaines étapes

1. **Agent `back`** — T-060 : Implémenter `GET /api/v1/search` (SearchModule NestJS)
2. **Agent `spec`** (après T-060 done) — Passer FS-11-FRONT de `draft` à `stable`
3. **Agent `front`** — T-061 : Implémenter composant Omnisearch.tsx dans TopBar

---

## Contexte technique utile

### Tables Prisma à interroger
```
applications, domains, business_capabilities, providers, it_components, data_objects, interfaces
```

### Champs searchables (tous identiques)
- `name` (priorité haute)
- `description` (priorité basse)

### Pattern backend recommandé
```typescript
// Requêtes parallèles Promise.all, puis merge + sort
const [apps, domains, ...] = await Promise.all([
  prisma.applications.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, take: limit*2 }),
  prisma.domains.findMany({ ... }),
  // ... 7 tables
]);
```

---

*Session clôturée — Contexte archivé pour référence T-060 / T-061.*
