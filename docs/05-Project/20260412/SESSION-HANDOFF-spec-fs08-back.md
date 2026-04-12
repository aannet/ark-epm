# SESSION HANDOFF — Agent spec — FS-08-BACK Interfaces

**Date :** 2026-04-12  
**Agent :** spec  
**Session ID :** fs08sp  
**Tâches :** T-040 (impl FS-08-BACK), T-039 (amendment FS-06-BACK)

---

## Ce qui a été fait

### Spec rédigée : `docs/03-Features-Spec/FS-08-Interfaces-back.md` v1.1

Spec backend complète pour le module Interfaces (Sprint 4). Statut actuel : `draft` — prête pour review/stable avant session OpenCode.

**Décisions clés :**

| Décision | Choix retenu | Raison |
|---|---|---|
| `latency_ms` | Supprimé (P2) | Hors périmètre MVP |
| `technical_contact` | Texte libre `VARCHAR(255)` | Contact peut être externe à ARK (pas de FK users) |
| `criticality` | Enum `CriticalityLevel` réutilisé (FS-07) | Cohérence — LOW/MEDIUM/HIGH/CRITICAL |
| `type` | Nouvel enum `InterfaceType` | REST/SOAP/FTP/SFTP/DATABASE/MESSAGE_QUEUE/BATCH_FILE/EVENT_STREAM/GRAPHQL/GRPC/OTHER |
| `frequency` | Nouvel enum `InterfaceFrequency` | REALTIME/NEAR_REALTIME/HOURLY/DAILY/WEEKLY/MONTHLY/ON_DEMAND |
| Unicité (source, target, type) | Pas de contrainte | Plusieurs interfaces du même type entre deux apps = valide |
| Suppression | Libre (pas de DEPENDENCY_CONFLICT) | Aucune FK entrante vers `interfaces` |
| Tags | F-03 polymorphe via `entity_tags` | Pattern standard |

**Migrations requises sur le modèle existant :**
- Fix `@default(uuid())` → `gen_random_uuid()`
- Ajout `description TEXT` + `comment TEXT` (NFR-GOV-005)
- `tags TEXT[]` supprimé
- `updatedAt` corrigé `@updatedAt`
- `technical_contact_id UUID FK` → `technical_contact VARCHAR(255)` (texte libre)
- `latency_ms` supprimé
- `type`/`frequency`/`criticality` migrés de VARCHAR vers enums

### F-999 Item 24 ajouté

Tracé la dette : `ApplicationsService.remove()` ne vérifie pas `_count.sourceInterfaces + _count.targetInterfaces`. La FK bloque en DB mais aucun `DEPENDENCY_CONFLICT` propre n'est renvoyé. → T-039.

---

## Points d'attention pour la session d'implémentation (T-040)

1. **Spec à passer `stable` avant OpenCode** — relire §9 Gates et confirmer statut.

2. **T-006 sera débloqué** après T-040 done — 4 tests Playwright applications-dependencies.

3. **T-039 (amendment FS-06-BACK) doit suivre T-040** — ne pas le faire dans la même session pour éviter les conflits de migration.

4. **Prisma schema** : les relations `sourceInterfaces` et `targetInterfaces` doivent apparaître côté `Application` après la migration pour que T-039 puisse utiliser `_count.sourceInterfaces`.

5. **Seed** : s'assurer que les apps seedées (FS-06) existent avant le seed Interfaces — ordre dans `seed.ts`.

---

## Gates restantes avant OpenCode (T-040)

- [ ] Spec FS-08-BACK passée au statut `stable` (review humaine)
- [ ] Migration Prisma générée et appliquée en local
- [ ] `interfaces:read` et `interfaces:write` ajoutés au seed permissions

---

## Fichiers modifiés cette session

| Fichier | Action |
|---|---|
| `docs/03-Features-Spec/FS-08-Interfaces-back.md` | Créé (v1.1) |
| `docs/03-Features-Spec/F99-Technical-Debt.md` | Item 24 ajouté (v0.8) |
| `docs/05-Project/tasks.yaml` | T-039 + T-040 créés |

**Commit :** `docs(spec): FS-08-BACK v1.1 — Interfaces backend + F-999 Item 24 + T-039/T-040`
