# ARK — Template Feature-Spec (Index)

_Version 0.4 — Mars 2026_

> **Changelog v0.4 :**
> - Refonte complète — ce fichier devient une **page d'index** suite à la décision de split back/front (Sprint FS-02)
> - Le format unifié (une spec = back + front) est **déprécié** à partir de Sprint 2
> - Deux templates distincts créés : `_template-back.md` et `_template-front.md`
> - Correction du chemin de dépôt : `docs/specs/` → `docs/03-Features-Spec/`
> - Convention de nommage mise à jour : `FS-XX-<slug>-back.md` / `FS-XX-<slug>-front.md`

> **Changelog v0.3 :** Ajout section §11 — Revue de dette technique (gate de fin de sprint obligatoire).

> **Changelog v0.2 :** Intégration de la stratégie de test dans le sprint — section 7 restructurée avec outillage explicite (Jest/Supertest vs Cypress).

---

## Décision architecturale — Split back / front

À partir de **Sprint 2 (FS-02)**, chaque Feature-Spec est découpée en deux documents distincts :

| Document | Périmètre | Template |
|---|---|---|
| `FS-XX-<slug>-back.md` | NestJS + Prisma + tests Jest/Supertest | `_template-back.md` |
| `FS-XX-<slug>-front.md` | React + MUI + i18n + Cypress | `_template-front.md` |

**Pourquoi :** Le contexte d'une spec unifiée est trop dense et hétérogène pour OpenCode. Le signal/bruit est meilleur dans deux sessions spécialisées. La spec back est la gate bloquante avant toute session frontend.

**Règle de séquencement :**
```
FS-XX-BACK : draft → stable → [session OpenCode] → done
                                                        ↓ gate débloquée
FS-XX-FRONT : draft ————————————————————————————→ stable → [session OpenCode] → done
```

---

## Quel template utiliser ?

### Pour une Feature-Spec standard (Sprint 2+)

→ Dupliquer **`_template-back.md`** → nommer `FS-XX-<slug>-back.md`
→ Dupliquer **`_template-front.md`** → nommer `FS-XX-<slug>-front.md`
→ Déposer dans `docs/03-Features-Spec/`

### Pour une spec de Fondation (F-XX — manuel, pas de génération OpenCode)

→ Utiliser le format libre — pas de template imposé.
→ Exemples existants : `F-00-Scaffolding.md`, `F-01-Design-System.md`, `F-02-i18n.md`, `F-999-Technical-Debt.md`

### Pour FS-01 (Auth & RBAC — déjà done, format unifié)

→ Conserver le format unifié existant — pas de migration rétroactive.

---

## Conventions de nommage et de dépôt

| Type | Nom de fichier | Dossier |
|---|---|---|
| Spec backend | `FS-XX-<slug>-back.md` | `docs/03-Features-Spec/` |
| Spec frontend | `FS-XX-<slug>-front.md` | `docs/03-Features-Spec/` |
| Fondation | `F-XX-<slug>.md` | `docs/03-Features-Spec/` |
| Scénarios Gherkin | `FS-XX-<slug>-scenarios.md` | `docs/03-Features-Spec/` |

---

## Règles de statut (inchangées)

| Statut | Signification |
|---|---|
| `draft` | Spec en cours de rédaction |
| `review` | Spec complète, en attente de validation |
| `stable` | Spec validée — prête pour OpenCode |
| `in-progress` | Implémentation en cours |
| `done` | Implémentée, testée, mergée |

> ⚠️ La spec front ne peut jamais passer à `stable` tant que la spec back correspondante n'est pas `done`.

---

## Checklist de création d'une paire de specs

### Étape 1 — Rédaction back (peut commencer dès que les prérequis back sont réunis)
- [ ] Dupliquer `_template-back.md` → `FS-XX-<slug>-back.md`
- [ ] Remplir toutes les sections ⚠️
- [ ] Valider le contrat OpenAPI §3 contre `schema.prisma`
- [ ] Passer au statut `stable`
- [ ] Lancer la session OpenCode backend
- [ ] Valider les gates G-01 à G-08
- [ ] Passer au statut `done`

### Étape 2 — Rédaction front (commence après que la spec back est `done`)
- [ ] Dupliquer `_template-front.md` → `FS-XX-<slug>-front.md`
- [ ] Remplir §2 (référence contrat API — pointer vers back §3, ne pas redéfinir)
- [ ] Remplir §3 Layout Contract — **un bloc YAML par page, obligatoire**
- [ ] Remplir toutes les autres sections ⚠️
- [ ] Ajouter les clés i18n dans `fr.json` (§5)
- [ ] Réaliser le câblage `App.tsx` manuellement (§7)
- [ ] Passer au statut `stable`
- [ ] Lancer la session OpenCode frontend
- [ ] Valider la checklist §11
- [ ] Passer au statut `done`

---

## Références croisées

| Document | Rôle | Lien avec les templates |
|---|---|---|
| `AGENTS.md` | Conventions AI agents (transverse) | À injecter dans chaque session OpenCode en complément de la spec |
| `F-999-Technical-Debt.md` | Registre dette technique | Gates TD-1 à TD-6 présentes dans §11 de chaque template |
| `ARK-NFR.md` | Exigences non fonctionnelles | Gate TD-5 : NFR à mettre à jour après chaque sprint |
| `F-01-Design-System.md` | Composants partagés F-01 | Liste injectée dans la commande OpenCode du template front §10 |
| `F-02-i18n.md` | Convention i18n | Prérequis gate front §8 — doit être `done` avant session frontend |

---

## Format déprécié

> Le format unifié (une seule spec back + front) était le standard jusqu'à `_template.md` v0.3.
> Il reste valide pour **FS-01** (déjà implémenté) mais ne doit plus être utilisé pour les nouvelles specs.
> Le fichier `_template.md` v0.3 est archivé dans `docs/03-Features-Spec/_archive/` si besoin de référence.

---

_Template Index v0.4 — Projet ARK_