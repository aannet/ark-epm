# ARK — Template Feature-Spec

_Version 0.1 — Février 2026_

> **Usage :** Ce template est le format standard de toute Feature-Spec ARK. Chaque spec est un document autonome, versionné, directement injectable dans Claude Code sans reformatage. Une spec = une feature end-to-end (backend + frontend + tests). **Ne pas coder sans spec stabilisée.**

---

## Comment utiliser ce template

1. Dupliquer ce fichier dans `docs/specs/`
2. Nommer le fichier : `FS-<numéro>-<slug>.md` (ex: `FS-01-auth-rbac.md`)
3. Remplir toutes les sections — les sections marquées ⚠️ sont bloquantes pour la génération
4. Faire valider la spec avant de lancer Claude Code
5. Injecter la spec complète en début de session Claude Code avec la commande : `"Implémente la feature suivante en respectant strictement ce contrat. Ne fais aucune hypothèse non documentée ici."`

---

## En-tête

| Champ | Valeur |
|---|---|
| **ID** | FS-XX |
| **Titre** | Nom court de la feature |
| **Priorité** | P1 / P2 / P3 |
| **Statut** | `draft` / `review` / `stable` / `done` |
| **Dépend de** | IDs des specs dont celle-ci dépend (ex: FS-01) |
| **Estimé** | Nb de jours développeur |
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

## 7. Tests attendus

> Lister les cas de test à implémenter. Claude Code génère les tests à partir de cette liste.

**Unit :**
- [ ] 
- [ ] 

**E2E :**
- [ ] 
- [ ] 

**Sécurité / RBAC :**
- [ ] Vérifier que le rôle `X` ne peut pas accéder à la route `Y`
- [ ] 

---

## 8. Contraintes techniques

> Tout ce qui contraint l'implémentation : patterns imposés, conventions du projet, points d'attention spécifiques.

- **Pattern NestJS :** Suivre le module `[référence]` comme exemple
- **Prisma :** Toute écriture passe par le middleware `$executeRaw ark.current_user_id`
- **Auth :** Toutes les routes sont protégées par `JwtAuthGuard` sauf mention contraire
- *(ajouter ici les contraintes spécifiques à la feature)*

---

## 9. Commande Claude Code

> Bloc prêt à l'emploi — copier-coller en début de session Claude Code.

```
Contexte projet ARK :
- Stack : NestJS + Prisma + PostgreSQL 16 + React + TypeScript strict
- Toute écriture en base passe par : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- Structure modules : src/<domaine>/<domaine>.module.ts / .service.ts / .controller.ts
- Pattern de référence : [indiquer le module à suivre]

Implémente la feature "[TITRE]" (FS-XX) en respectant strictement le contrat ci-dessous.
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE LA SPEC ICI]
```

---

## 10. Checklist de validation avant génération

- [ ] Modèle Prisma testé en base (`prisma migrate dev`)
- [ ] Contrat OpenAPI relu et cohérent avec le modèle
- [ ] Règles métier exhaustives (aucune règle implicite)
- [ ] Dépendances (autres FS) marquées `done`
- [ ] Module de référence NestJS identifié (section 8)
- [ ] Spec relue par une seconde personne ou par Claude en mode Review

---

_Template v0.1 — Projet ARK_