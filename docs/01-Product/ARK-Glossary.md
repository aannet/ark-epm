# ARK — Glossary

_Version 0.2 — Mars 2026_

> Ce document définit les termes clés utilisés dans le projet ARK.

---

## Termes Métier

| Terme | Définition |
|-------|------------|
| **Application** | Logiciel ou système informatique utilisé dans l'entreprise |
| **Business Capability** | Capacité organisationnelle permettant de mener à bien une activité métier |
| **Interface** | Connexion entre deux applications (flux de données) |
| **Data Object** | Donnée ou ensemble de données identifié comme pertinent pour l'entreprise |
| **IT Component** | Composant technique hébergeant des applications |
| **Provider** | Fournisseur de services ou de composants IT. Relation N:N avec les Applications — chaque provider peut avoir un rôle spécifique : editor, integrator, support, vendor, ou custom (voir section "Rôles des Providers" ci-dessous et FS-03-FRONT v1.1). |
| **Domain** | Domaine métier regroupant des applications et des capabilities |

### Rôles des Providers

| Rôle | Description |
|------|-------------|
| **editor** | Éditeur/propriétaire principal du logiciel |
| **integrator** | Intégrateur responsable de l'implémentation et l'intégration |
| **support** | Support technique et maintenance |
| **vendor** | Fournisseur de composants ou d'infrastructure |
| **custom** | Rôle personnalisé (défini au cas par cas) |

> Voir **FS-03-FRONT v1.1** pour l'affichage des rôles dans l'interface frontend.

---

## Termes Techniques

| Terme | Définition |
|-------|------------|
| **Prisma** | ORM TypeScript pour PostgreSQL |
| **React Flow** | Librairie de graphes pour React |
| **RBAC** | Role-Based Access Control — Contrôle d'accès basé sur les rôles |
| **JWT** | JSON Web Token — Token d'authentification |

---

_Document de travail v0.1 — Projet ARK_
