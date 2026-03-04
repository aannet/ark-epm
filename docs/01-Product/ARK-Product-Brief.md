

_Version 0.5 — Février 2026_

> **Changelog v0.5 :** Business Capabilities — contrainte de 5 niveaux levée (hiérarchie récursive illimitée en base, sans contrainte `level`). Indicateurs de performance des Interfaces (latence, taux d'erreur) déplacés en P2. Mise en cohérence avec schema.sql v0.4.

---

## 1. Contexte & Problématique

Les architectes d'entreprise des PME et ETI gèrent aujourd'hui leur inventaire applicatif et leurs cartographies dans des fichiers Excel et des présentations PowerPoint non partagés. Cette approche génère deux douleurs majeures :

|Pain|Description|
|---|---|
|**Inventaire fragmenté**|L'inventaire des applications est maintenu manuellement sur Excel par chaque architecte. Il n'existe pas de source de vérité unique accessible à toutes les équipes (IT, métier, direction).|
|**Dépendances inconnues**|Avant le lancement d'un projet, les équipes ne savent pas quelles applications sont liées entre elles, ce qui génère des surprises en cours de projet et des risques d'impact non anticipés.|

L'outil EPM vise à éliminer ces deux douleurs en proposant une plateforme centralisée, collaborative et visuelle pour gérer le patrimoine applicatif et les dépendances.

**Référence de conception :** les outils du marché étudiés (LeanIX, Ardoq, etc.) montrent que la clarté, la simplicité d'usage et l'ergonomie sont les facteurs clés d'adoption. Ces principes doivent guider toutes les décisions UX/UI du projet.

**Intégrations explicitement hors périmètre :** Azure Application Insights n'est pas prévu. Le SSO sera intégré en P2 via un protocole standard **SAML2** (approche générique, non couplée à un fournisseur spécifique).

---

## 2. Objectifs du Projet

|Objectif|Description|Remarques|
|---|---|---|
|**O1 — Source de vérité unique**|Centraliser l'inventaire applicatif, les capacités métier, les objets de données et les composants IT dans une base unique accessible à tous.|P1|
|**O2 — Visualisation des dépendances**|Permettre de cartographier et consulter les interfaces/flux entre applications pour anticiper les impacts avant tout projet.|P1|
|**O3 — Gouvernance et rôles**|Gestion des droits en mode CRUD par rôle par objet (Read/Write/Delete) en P1. En P2, un utilisateur pourra avoir des droits différenciés par domaine métier.|P1 (CRUD global) / **P2 (droits par domaine)**|
|**O4 — Collaboration**|Historique des changements intégré au modèle de données dès P1. L'UI de consultation de cet historique est différée en P2. Pas de système de notifications prévu à ce stade.|Modèle P1 / UI P2|
|**O5 — API-first**|Le backend expose une API REST complète dès le MVP. Toute interaction avec les données passe par cette API (le frontend en est le premier consommateur). Cela garantit l'ouverture à des intégrations futures sans refactoring.|P1|

---

## 3. Périmètre Fonctionnel

### 3.1 Priorité 1 — MVP (< 3 mois)

Les objets métier à gérer en P1 :

|Objet|Description|Attributs clés|
|---|---|---|
|**Applications**|Inventaire du patrimoine applicatif|Nom, propriétaire, criticité, cycle de vie, domaine, tags|
|**Business Capabilities**|Carte des capacités métier — structure hiérarchique récursive parent/enfant, **illimitée en profondeur**. Modélisée via une auto-référence SQL (`parent_id → id`) sur la même table.|Nom, domaine, parent_id, applications supportées, tags|
|**Data Objects**|Bases de données et jeux de données|Nom, type, source de vérité, applications consommatrices (liaison n:n via `app_data_object_map`), tags|
|**Interfaces / Flows**|Flux et interfaces entre applications — **relation unidirectionnelle (Source → Cible)**. Une interface bidirectionnelle se modélise par deux enregistrements distincts.|Source, cible, type (API/batch/message), criticité, responsable technique, tags|
|**IT Components**|Infrastructure et composants techniques|Nom, type, technologie, applications hébergées (liaison n:n via `app_it_component_map`), tags|
|**Providers**|Contrats et éditeurs applicatifs|Nom, type de contrat, date d'expiration, applications liées, tags|

> **Note modélisation Business Capabilities :** la contrainte de 5 niveaux maximum initialement envisagée a été levée. La hiérarchie est récursive et illimitée en base. Une règle métier de profondeur recommandée pourra être ajoutée dans l'UI à titre indicatif, sans enforcement en base.

**Système de tags :** chaque entité dispose d'un système de tags multiples libres. Ce mécanisme assure la flexibilité et la personnalisation sans nécessiter de méta-modèle en MVP.

Fonctionnalités transverses P1 :

- **Authentification :** gestion locale email/password, hash Bcrypt stocké en PostgreSQL, sessions via JWT — sans dépendance externe.
- **Gestion des utilisateurs :** groupes, rôles et droits CRUD par objet — sans workflow d'approbation en P1.
- **Entité Domaine :** créée dès P1 au niveau du modèle de données pour structurer le patrimoine. La gestion des droits différenciés par domaine est différée en P2.
- **Historique des changements :** audit trail modélisé en base de données dès P1 via triggers PostgreSQL autonomes, interface utilisateur différée en P2.
- **Import de données :** via une interface d'upload Excel dans le frontend React — aucune intégration externe requise en MVP.

### 3.2 Priorité 2 — Post-MVP

- UI de consultation de l'historique des changements
- SSO via SAML2
- **Droits d'accès différenciés par domaine métier** (un utilisateur peut avoir des rôles distincts selon le domaine)
- **Indicateurs de performance des Interfaces** : latence (ms), taux d'erreur (%) — remontée et affichage différés en P2
- Objectifs / OKR : stratégie et alignement métier
- Processus : cartographies de processus et workflows
- Projets : initiatives en cours et impact sur le portefeuille

### 3.3 Priorité 3 — Horizon long terme

- Méta-modèle extensible (si les tags s'avèrent insuffisants)
- Data lineage (étude à mener ultérieurement)

---

## 4. Utilisateurs Cibles & Rôles

|Rôle|Responsabilités principales|
|---|---|
|**Architecte Entreprise**|Administrateur de la cartographie, définit les standards, pilote les revues d'architecture. Accès complet en lecture/écriture.|
|**Owner Applicatif (IT)**|Maintient à jour les fiches de ses applications, les dépendances, les composants techniques. Accès en écriture sur son périmètre.|
|**Business Owner (Métier)**|Consulte les capacités métier, les processus et les applications de son domaine. Propose des mises à jour. Accès principalement en lecture.|
|**Administrateur**|Gère les utilisateurs, les groupes, les droits d'accès et la configuration de la plateforme.|

**Scalabilité utilisateurs :**

- MVP : 5 utilisateurs maximum
- Cible : moins de 100 utilisateurs

_Note : une étude approfondie des personas et cas d'usage par rôle sera menée ultérieurement._

---

## 5. Contraintes & Décisions Techniques

|Paramètre|Valeur / Décision|
|---|---|
|**Mode de déploiement**|On-premise / Self-hosted via image Docker — déploiement simplifié en `docker run` ou `docker-compose`|
|**Tenant**|Single-tenant : une instance = une organisation|
|**Stack frontend**|React + TypeScript + React Flow (visualisation des graphes de dépendances)|
|**Stack backend**|Node.js / NestJS / TypeScript|
|**API**|API REST complète exposée dès le MVP — couvre l'ensemble des objets P1 en CRUD. L'API est la seule interface d'accès aux données (le frontend React en est le premier consommateur). Documentation OpenAPI/Swagger incluse.|
|**Base de données**|PostgreSQL 16 — base graphe non retenue à ce stade|
|**Modélisation hiérarchique**|Business Capabilities : auto-référence SQL (`parent_id` nullable, FK vers la même table). **Hiérarchie illimitée en base** — contrainte de 5 niveaux levée.|
|**Modélisation des interfaces**|Relation unidirectionnelle Source → Cible. Une interface bidirectionnelle = deux enregistrements. Pas de contrainte UNIQUE globale entre source/cible — plusieurs interfaces distinctes peuvent coexister entre deux applications.|
|**Authentification P1**|Gestion locale email/password — hash Bcrypt stocké en PostgreSQL, sessions via JWT|
|**Authentification P2**|SSO via SAML2 (protocole standard, non couplé à un fournisseur)|
|**Domaines / Workspaces**|Entité _Domaine_ créée dès P1 au niveau du modèle de données. La gestion des droits différenciés par domaine est différée en P2.|
|**Import de données**|Import Excel via interface d'upload dans le frontend React — aucune intégration externe requise en MVP|
|**Audit trail**|Triggers PostgreSQL autonomes — le backend positionne `SET LOCAL app.current_user_id` à chaque requête.|
|**Indicateurs de performance des Interfaces**|Colonnes `latency_ms` et `error_rate` présentes en base dès P1 (nullable). Alimentation et affichage différés en P2.|
|**Intégrations hors périmètre**|Azure Application Insights (explicitement exclu)|

---

## 6. Architecture Domaine — Grands Thèmes

L'application est structurée autour de 6 domaines métier cohérents avec la taxonomie standard d'architecture d'entreprise :

|Domaine|Objets couverts|Priorité|
|---|---|---|
|**1. Métier (Business)**|Capacités (hiérarchie récursive illimitée), processus, services, organisations, objectifs|P1 (capacités) / P2 (processus, OKR)|
|**2. Applicatif**|Applications, modules, interfaces/flux (unidirectionnel), projets|P1|
|**3. Données**|Entités de données, jeux de données _(data lineage : étude ultérieure)_|P1 (objets) / P3 (lineage)|
|**4. Technologique**|Plateformes, composants infra, standards|P1|
|**5. Gouvernance**|Règles, décisions (ADR), métriques, roadmaps|P2|
|**6. Collaboration & Rôles**|Domaines/workspaces, rôles, groupes, historique des changements|P1 (modèle + domaines) / P2 (UI historique + droits par domaine)|

**Extensibilité MVP :** pas de méta-modèle en P1. Le système de tags multiples par entité assure la souplesse de personnalisation nécessaire.

---

## 7. Hors Périmètre (Explicitement Exclus du MVP)

- Azure Application Insights
- Intégration CMDB (ServiceNow, iTop) — P2 ou P3
- Intégration outils de ticketing (JIRA, Azure DevOps)
- Module de reporting avancé / BI
- Support multi-tenant
- Gestion des OKR et de la stratégie d'entreprise
- Data lineage
- Méta-modèle extensible
- Système de notifications
- Alimentation et affichage des indicateurs de performance des Interfaces (latence, taux d'erreur) — P2

---

## 8. Risques & Points de Vigilance

|Risque|Mitigation|
|---|---|
|**Modèle de données central trop rigide**|Système de tags multiples par entité dès le MVP pour assurer la flexibilité sans méta-modèle.|
|**Adoption utilisateurs métier**|S'inspirer des points forts des outils étudiés : clarté, simplicité, ergonomie. Limiter la friction pour la saisie et la mise à jour.|
|**Qualité des données d'import**|Import Excel via interface d'upload frontend. Prévoir une validation des données côté backend avant insertion.|
|**Délai MVP < 3 mois — développeur solo**|Scope P1 strict limité aux écrans CRUD (inventaire + fiche applicative). Graphe de dépendances en P1 si le temps le permet. S'appuyer sur OpenCode pour accélérer les développements.|
|**Visualisation des graphes**|Réaliser des POC avec React Flow sur données réelles. Des filtres de vue seront nécessaires pour gérer la complexité visuelle — **détail à définir lors d'un atelier dédié** (voir §9). Ne pas exclure le recours à plusieurs librairies selon les modes d'affichage (React Flow, vis.js, d3).|
|**Profondeur des Business Capabilities**|Contrainte de 5 niveaux levée. L'UI pourra afficher un avertissement au-delà d'une profondeur recommandée, sans blocage.|
|**Historique des changements**|Audit trail géré par triggers PostgreSQL autonomes dès P1 — indépendant du backend.|

---

## 9. Prochaines Étapes

|Étape|Action|Priorité|
|---|---|---|
|**Choix de stack validé**|React + React Flow / NestJS / PostgreSQL / Docker — ✅ décidé|—|
|**Modèle de données**|✅ schema.sql v0.4 — 6 objets P1, liaisons n:n Data Objects & IT Components, audit trail par triggers|P1|
|**Spécification API**|Définir le contrat OpenAPI (routes, payloads, codes de retour) pour les 6 objets P1 avant de coder — API-first oblige|P1|
|**Wireframes MVP**|Maquetter les 2 écrans CRUD prioritaires : inventaire applicatif et fiche application|P1|
|**POC graphe**|Tester React Flow sur un jeu de données réel pour valider l'approche de visualisation des dépendances|P1|
|**Atelier filtres de vue**|Définir les filtres nécessaires pour gérer la complexité du graphe de dépendances (par domaine, par criticité, par type d'interface, etc.)|P1|
|**Import Excel**|Spécifier le format d'import et la logique de validation côté backend|P1|
|**Découpage sprint**|Découper les user stories P1 et planifier les sprints (contrainte : 1 développeur + OpenCode)|P1|
|**Étude personas**|Définir les personas et cas d'usage détaillés par rôle|P2|
|**Spécification SSO**|Cadrer l'intégration SAML2|P2|
|**Spécification droits par domaine**|Définir le modèle de droits différenciés par domaine pour la P2|P2|
|**Spécification indicateurs de performance**|Définir la source de données et les modalités d'affichage de latency_ms et error_rate|P2|

---

## 10. Contexte Équipe & Outillage

|Paramètre|Valeur|
|---|---|
|**Équipe MVP**|1 développeur solo|
|**Accélérateur de développement**|OpenCode (génération de code assistée par IA)|
|**Implication**|Le recours à OpenCode impose une architecture claire, des interfaces bien définies et un découpage en modules cohérents pour maximiser la qualité du code généré. L'approche API-first (contrat OpenAPI défini en amont) s'y prête particulièrement bien.|

---

_Document de travail v0.5 — À valider en atelier de cadrage_