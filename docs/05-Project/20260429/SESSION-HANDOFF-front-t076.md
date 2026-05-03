# SESSION-HANDOFF — Agent front — T-076
> Archive 2026-04-29. Préparé par T-075 (front). Pattern de référence établi.

---

## Contexte

T-075 a modernisé les pages NEW/EDIT `Application` avec le pattern MUI v9 post-T-064.
T-076 doit appliquer ce même pattern aux 5 autres entités.

---

## Décisions actées (grill me T-076)

1. **maxWidth = `"xl"` partout** — même pour les formulaires courts.
2. **Paper wrapping formulaire** — même pour les formulaires sans tabs.
3. **Composants Form internes inchangés** — seuls les wrappers page (New/Edit) sont modifiés.
4. **BusinessCapabilityEditPage** — Avatar+h2 au-dessus, Paper wrapping les 3 tabs (comme ApplicationDetailPage).

---

## Pattern de référence T-075

```tsx
<PageContainer maxWidth="xl">
  <AppBreadcrumbs items={[...]} />

  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
    <Avatar sx={{ bgcolor: 'primary.dark', width: 48, height: 48, fontSize: '1.25rem' }}>
      {title.charAt(0).toUpperCase()}
    </Avatar>
    <Box sx={{ flex: 1 }}>
      <Typography variant="h2" component="h1">
        {t('entity.form.createTitle')}  {/* ou editTitle */}
      </Typography>
      {/* EditPage uniquement : */}
      <Typography variant="body2" color="text.secondary">
        {entity.name}
      </Typography>
    </Box>
  </Box>

  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 4 }}>
    {/* ArkAlert error submitError — si présent */}
    <ArkAlert ... />
    <EntityForm ... />
  </Paper>
</PageContainer>
```

### Détails du pattern

| Élément | Implémentation |
|---------|---------------|
| `maxWidth` | `"xl"` sur **toutes** les pages NEW/EDIT |
| `Avatar` | `sx={{ bgcolor, width: 48, height: 48, fontSize: '1.25rem' }}`. Initiale du titre (New) ou nom entité (Edit) |
| `Typography h2` | `variant="h2" component="h1"` — titre de la page |
| Sous-titre Edit | `variant="body2" color="text.secondary"` — nom de l'entité |
| `Paper` | `elevation={0}` + `border: '1px solid'` + `borderColor: 'divider'` + `p: 4` |
| `ArkAlert` | À l'intérieur du Paper (pas au-dessus des breadcrumbs) |

---

## Cas particulier : BusinessCapabilityEditPage

Cette page a 3 tabs (General / Relations / Audit). Le Paper doit wrapper les Tabs + contenu.

```tsx
<PageContainer maxWidth="xl">
  <AppBreadcrumbs items={[...]} />

  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
    <Avatar ...>{capability.name.charAt(0).toUpperCase()}</Avatar>
    <Box sx={{ flex: 1 }}>
      <Typography variant="h2" component="h1">{t('businessCapabilities.form.editTitle')}</Typography>
      <Typography variant="body2" color="text.secondary">{capability.name}</Typography>
    </Box>
  </Box>

  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
    {/* Pas de p=4 sur Paper — les panels gèrent leur padding */}
    <Tabs sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }} ... />
    <TabPanel value={0}>
      <Box sx={{ p: 4 }}><BusinessCapabilityForm ... /></Box>
    </TabPanel>
    <TabPanel value={1}>
      <Box sx={{ p: 4 }}>...</Box>
    </TabPanel>
    <TabPanel value={2}>
      <Box sx={{ p: 4 }}><EmptyState ... /></Box>
    </TabPanel>
  </Paper>
</PageContainer>
```

> **Note** : Pas de `p: 4` sur le Paper parent — le padding est sur chaque TabPanel. Cohérence avec `ApplicationDetailPage`.

---

## Couleurs Avatar par entité

| Entité | bgcolor | Source confirmée |
|--------|---------|-----------------|
| Application | `primary.dark` | ApplicationDetailPage.tsx |
| BusinessCapability | À vérifier | `BusinessCapabilityDetailPage.tsx` — copier la valeur |
| Interface | À vérifier | `InterfaceDetailPage.tsx` — copier la valeur |
| DataObject | À vérifier | `DataObjectDetailPage.tsx` — copier la valeur |
| ITComponent | À vérifier | `ITComponentDetailPage.tsx` — copier la valeur |
| Provider | `error.dark` | Confirmé ProviderDetailPage.tsx |

> **Règle** : la couleur Avatar doit matcher la DetailPage de l'entité. Ne pas inventer.

---

## Fichiers à modifier (8 wrappers page)

### Wrapper pages — modifications uniquement

| # | Fichier | Changements | Complexité |
|---|---------|-------------|------------|
| 1 | `pages/business-capabilities/BusinessCapabilityNewPage.tsx` | maxWidth xl, Avatar+h2, Paper p=4 | ⭐ |
| 2 | `pages/business-capabilities/BusinessCapabilityEditPage.tsx` | maxWidth xl, Avatar+h2+nom, Paper wrappant Tabs | ⭐⭐ |
| 3 | `pages/interfaces/InterfaceNewPage.tsx` | maxWidth xl, Avatar+h2, Paper p=4 | ⭐ |
| 4 | `pages/interfaces/InterfaceEditPage.tsx` | maxWidth xl, Avatar+h2+titre, Paper p=4 | ⭐ |
| 5 | `pages/data-objects/DataObjectFormPage.tsx` | maxWidth xl, Avatar+h2, Paper, ArkAlert dans Paper | ⭐ |
| 6 | `pages/it-components/ITComponentFormPage.tsx` | maxWidth xl, Avatar+h2, Paper, ArkAlert dans Paper | ⭐ |
| 7 | `pages/providers/ProviderNewPage.tsx` | maxWidth xl, Avatar+h2, Paper, fix ordre ArkAlert | ⭐ |
| 8 | `pages/providers/ProviderEditPage.tsx` | maxWidth xl, Avatar+h2+nom, Paper, fix ordre ArkAlert | ⭐ |

### Composants Form — inchangés

- `components/business-capabilities/BusinessCapabilityForm.tsx` — **NE PAS TOUCHER**
- `components/interfaces/InterfaceForm.tsx` — **NE PAS TOUCHER**
- `components/data-objects/DataObjectForm.tsx` — **NE PAS TOUCHER**
- `components/it-components/ITComponentForm.tsx` — **NE PAS TOUCHER**
- `components/providers/ProviderForm.tsx` — **NE PAS TOUCHER**

---

## Anti-pattern à corriger

### ProviderNewPage + ProviderEditPage — position ArkAlert

**Actuellement** (anti-pattern) :
```tsx
<PageContainer>
  <ArkAlert ... />           {/* ← AVANT breadcrumbs ! */}
  <AppBreadcrumbs ... />
```

**Corrigé** :
```tsx
<PageContainer maxWidth="xl">
  <AppBreadcrumbs ... />
  <Avatar+h2 Box />
  <Paper ...>
    <ArkAlert ... />           {/* ← DANS le Paper */}
```

> **Note** : DataObjectFormPage et ITComponentFormPage ont aussi ArkAlert avant breadcrumbs — même correction.

---

## Checklist de validation T-076

- [ ] 8 fichiers wrappers modifiés
- [ ] maxWidth="xl" partout
- [ ] Paper elevation=0 border divider partout
- [ ] Avatar+h2 sur toutes les pages
- [ ] Avatar+h2+nom sur toutes les EditPage
- [ ] Couleurs Avatar cohérentes avec DetailPages respectives
- [ ] ArkAlert repositionné dans le Paper (Provider/DataObject/ITComponent)
- [ ] BusinessCapabilityEditPage : Paper wrappant Tabs sans padding global
- [ ] `npm run build` passe (tsc + vite) — 0 erreur
- [ ] Aucun composant Form interne modifié

---

## Références

- Pattern établi : `frontend/src/pages/applications/ApplicationNewPage.tsx`
- Pattern établi : `frontend/src/pages/applications/ApplicationEditPage.tsx`
- Spec mère : `docs/03-Features-Spec/FS-06-Applications/FS-06-Applications-front.md` §4.3/4.4
