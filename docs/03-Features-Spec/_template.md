# ARK — Template Feature-Spec

_Version 0.3 — Mars 2026_

> **Changelog v0.3 :** Ajout section §11 — Revue de dette technique (gate de fin de sprint obligatoire). Intègre les 6 gates TD + tableau de résultat de revue. Template bumped v0.2 → v0.3.

> **Changelog v0.2 :** Intégration de la stratégie de test dans le sprint — section 7 restructurée avec outillage explicite (Jest/Supertest vs Cypress), section 8 enrichie des conventions de fichiers de test, section 9 mise à jour pour inclure la génération des tests dans la session OpenCode, section 10 complétée avec checklist tests.

> **Usage :** Ce template est le format standard de toute Feature-Spec ARK. Chaque spec est un document autonome, versionné, directement injectable dans Claude Code sans reformatage. Une spec = une feature end-to-end (backend + frontend + tests). **Ne pas coder sans spec stabilisée.**

---

## Comment utiliser ce template

1. Dupliquer ce fichier dans `docs/specs/`
2. Nommer le fichier : `FS-<numéro>-<slug>.md` (ex: `FS-01-auth-rbac.md`)
3. Remplir toutes les sections — les sections marquées ⚠️ sont bloquantes pour la génération
4. Faire valider la spec avant de lancer Claude Code
5. Injecter la spec complète en début de session Claude Code avec la commande de la section 9

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-XX |
| **Titre** | Nom court de la feature |
| **Priorité** | P1 / P2 / P3 |
| **Statut** | `draft` / `review` / `stable` / `done` |
| **Dépend de** | IDs des specs dont celle-ci dépend (ex: FS-01) |
| **Estimé** | Nb de jours développeur (inclut génération + validation des tests) |
| **Version** | 0.1 |

---

## 1. Objectif & Périmètre ⚠️

> Décrire en 3-5 phrases ce que cette feature accomplit, pourquoi elle existe, et ce qu'elle ne fait **pas** (hors périmètre explicite).

**Ce que cette feature fait :**


**Ce qu'elle ne fait pas (hors périmètre) :**

---

## 2. Modèle Prisma ⚠️

> Coller le bloc Prisma exact correspondant à cette feature. Claude Code utilise ce bloc comme source de vérité pour générer les types TypeScript et les requêtes.

```prisma
// Coller ici le modèle Prisma concerné
// Inclure les relations pertinentes
```

---

## 3. Contrat API (OpenAPI) ⚠️

> Définir chaque endpoint de la feature. Format YAML OpenAPI 3.0. Claude Code génère les controllers NestJS à partir de ce contrat — il doit être exhaustif.

```yaml
# Coller ici les routes OpenAPI de la feature
# Inclure : path, method, requestBody, responses, security
```

---

## 4. Règles Métier Critiques ⚠️

> Lister toutes les règles qui ne sont pas déductibles du schéma ou du contrat API. C'est la section la plus importante — ce que Claude Code ne peut pas deviner.

- **RM-01 :** 
- **RM-02 :** 
- **RM-03 :** 

---

## 5. Comportement attendu par cas d'usage

> Décrire les scénarios nominaux et les cas d'erreur. Format : "Quand X, alors Y."

**Nominal :**
- Quand ...
- Quand ...

**Erreurs :**
- Quand ...  → HTTP 4XX + message `"..."`
- Quand ...  → HTTP 4XX + message `"..."`

---

## 6. Composants Frontend

> Décrire les écrans ou composants React concernés. Inclure la structure des props si connue.

**Écrans :**
- 

**Props du composant principal :**
```typescript
// Interface TypeScript des props attendues
```

---

## 7. Tests ⚠️

> Stratégie de test à deux niveaux — à remplir exhaustivement car OpenCode génère les tests à partir de cette section.

### Outil par niveau

| Niveau | Outil | Fichier cible | Délégable à OpenCode |
|---|---|---|---|
| Unit (services NestJS) | **Jest** | `src/<domaine>/<domaine>.service.spec.ts` | ✅ Oui |
| API / contrat HTTP | **Jest + Supertest** | `test/<domaine>.e2e-spec.ts` | ✅ Oui |
| Sécurité / RBAC | **Jest + Supertest** | `test/<domaine>.e2e-spec.ts` | ❌ **Manuel** |
| E2E browser (UI) | **Cypress** | `cypress/e2e/<domaine>.cy.ts` | ✅ Oui (scénarios nominaux) |

> **Règle absolue :** Les tests de sécurité (guards, vérification que des champs sensibles ne fuient pas, comportements RBAC) ne sont **jamais** délégués à OpenCode. Cf. Plan Sprint §"Ce qu'il ne faut jamais déléguer".

### Tests Jest — Unit

> Un test = une méthode de service, un cas précis.

- [ ] `[Jest]` 
- [ ] `[Jest]` 

### Tests Jest + Supertest — Contrat API

> Un test = un endpoint, un cas (nominal ou erreur).

- [ ] `[Supertest]` `VERB /route` → code HTTP attendu
- [ ] `[Supertest]` 

### Tests Sécurité / RBAC — Manuel ❌

> À écrire et valider à la main. Ne pas déléguer.

- [ ] `[Manuel]` Vérifier que le rôle `X` reçoit `403` sur la route `Y`
- [ ] `[Manuel]` Vérifier qu'aucun champ sensible n'apparaît dans les réponses

### Tests Cypress — E2E Browser

> Un test = un scénario utilisateur complet dans l'UI.

- [ ] `[Cypress]` 
- [ ] `[Cypress]` 

---

## 8. Contraintes techniques

> Tout ce qui contraint l'implémentation : patterns imposés, conventions du projet, points d'attention spécifiques.

- **Pattern NestJS :** Suivre le module `[référence]` comme exemple
- **Prisma :** Toute écriture passe par le middleware `$executeRaw ark.current_user_id`
- **Auth :** Toutes les routes sont protégées par `JwtAuthGuard` sauf mention contraire
- **Conventions de fichiers de test :**
  - Unit : `src/<domaine>/<domaine>.service.spec.ts`
  - E2E API : `test/<domaine>.e2e-spec.ts` (dossier `test/` à la racine de `backend/`)
  - Cypress : `cypress/e2e/<domaine>.cy.ts` (dossier `cypress/` à la racine de `frontend/`)
- **Setup Supertest :** Utiliser `@nestjs/testing` + `supertest`. Le module de test NestJS doit mocker `PrismaService` avec `jest.mock()`.
- **Setup Cypress :** `cy.request()` pour les appels API directs, `cy.visit()` pour les flows UI. Token JWT stocké via `cy.window().then(win => win.__ark_setToken(token))` — convention à définir dans `cypress/support/commands.ts`.
- *(ajouter ici les contraintes spécifiques à la feature)*

---

## 9. Commande Claude Code

> Bloc prêt à l'emploi — copier-coller en début de session Claude Code. Les tests sont générés dans la **même session** que le code de production.

```
Contexte projet ARK :
- Stack : NestJS + Prisma + PostgreSQL 16 + React + TypeScript strict
- Toute écriture en base passe par : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- Structure modules : src/<domaine>/<domaine>.module.ts / .service.ts / .controller.ts
- Pattern de référence : [indiquer le module à suivre]
- Stack de test :
  * Unit + API : Jest + Supertest (@nestjs/testing)
  * E2E browser : Cypress
  * Tests de sécurité/RBAC : écrits manuellement — NE PAS générer

Implémente la feature "[TITRE]" (FS-XX) en respectant strictement le contrat ci-dessous.
Génère le code de production ET les tests (Jest unit, Supertest API, Cypress E2E) définis en section 7.
Ne génère PAS les tests marqués [Manuel] — ils seront écrits à la main.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE LA SPEC ICI]
```

---

## 10. Checklist de validation avant génération

- [ ] Modèle Prisma testé en base (`prisma migrate dev`)
- [ ] Contrat OpenAPI relu et cohérent avec le modèle
- [ ] Règles métier exhaustives (aucune règle implicite)
- [ ] Section 7 complète — chaque cas de test étiqueté `[Jest]` / `[Supertest]` / `[Cypress]` / `[Manuel]`
- [ ] Tests sécurité/RBAC identifiés et marqués `[Manuel]`
- [ ] Dépendances (autres FS) marquées `done`
- [ ] Module de référence NestJS identifié (section 8)
- [ ] Stack de test configurée (Jest + Supertest opérationnels, Cypress installé)
- [ ] Spec relue par une seconde personne ou par Claude en mode Review

---

## 11. Revue de dette technique *(gate de fin de sprint — obligatoire)* ⚠️

> À remplir **après** implémentation, avant de clore le sprint. Bloquant : un sprint n'est `done` que si cette section est complétée.

### Gates TD

| # | Vérification | Commande / Action |
|---|---|---|
| TD-1 | Aucun `TODO / FIXME / HACK` non tracé dans le code livré de ce sprint | `git grep -n "TODO\|FIXME\|HACK" -- '*.ts' '*.tsx'` |
| TD-2 | Items F-999 activés par cette feature : statut mis à jour (`pending` → `done` si applicable) | Relire F-999 §2 |
| TD-3 | Checklist F-999 §4 : cases cochées pour les items de ce sprint | F-999 §4 |
| TD-4 | AGENTS.md : aucun pattern nouveau non documenté introduit par ce sprint | Relire AGENTS.md |
| TD-5 | ARK-NFR.md : NFR impactés par cette feature mis à jour (`missing` → `covered` / `partial`) | ARK-NFR.md |
| TD-6 | Nouvelles décisions transverses → nouvel Item F-999 créé si applicable | Jugement |

### Résultat de la revue

| Champ | Valeur |
|---|---|
| **Sprint** | *(ex : Sprint 2)* |
| **Date de revue** | *(date)* |
| **Items F-999 fermés** | *(ex : Item 5)* |
| **Items F-999 ouverts** | *(ex : Item 8 — reste pending)* |
| **Nouveaux items F-999 créés** | *(ex : Item 11 — voir §2)* |
| **NFR mis à jour** | *(ex : NFR-SEC-005 → covered)* |
| **TODOs résiduels tracés** | *(ex : 2 TODOs → issues GitHub #12, #13)* |
| **Statut gates TD** | ✅ TD-1 / ✅ TD-2 / ❌ TD-3 / … |

---

_Template v0.3 — Projet ARK_