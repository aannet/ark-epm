ARK
/

les test réalisés par cypress doivent-ils être spécifié en gherkin d'abord ?
18:37

Réponse courte : non, ce n'est pas requis par les specs actuelles — mais c'est une décision valide à prendre consciemment.

Probabilité que cette analyse soit correcte : 92%

Ce que les specs disent aujourd'hui

Les specs (FS-01, FS-02) spécifient les cas Cypress directement sous forme de checklist d'assertions ([Cypress] DomainsListPage affiche la liste après login), sans Gherkin. La commande OpenCode demande à générer les fichiers .cy.ts directement depuis ces listes.

Les deux options

Option A — Cypress pur .cy.ts (chemin actuel)

C'est l'approche implicite des specs. Tu écris ou génères directement le code Cypress. Plus léger, moins de friction pour un développeur solo + OpenCode.

Convient si : le seul lecteur des tests, c'est toi.

Option B — Gherkin d'abord avec cypress-cucumber-preprocessor

Tu rédiges des fichiers .feature en Given/When/Then, puis tu lies chaque step à du code Cypress. Les .feature deviennent de la documentation vivante lisible par un non-développeur (ton futur client, un Business Owner, un auditeur).
gherkin

Feature: Gestion des domaines
  Scenario: Supprimer un domaine utilisé
    Given je suis connecté en tant qu'Admin
    And il existe un domaine "Finance" lié à 3 applications
    When je tente de supprimer le domaine "Finance"
    Then je vois un message d'erreur "Domain is used by 3 application(s)"

Convient si : tu veux aligner les tests sur le langage métier du brief, ou si des non-devs valident les specs.

Ma recommandation pour ARK

Étant donné que tu es développeur solo avec OpenCode et que tes specs sont déjà très précises, le Gherkin est un overhead sans bénéfice immédiat. Le vrai ROI de Gherkin arrive quand plusieurs profils (dev, PO, client) co-rédigent les scénarios.

En revanche, une astuce intermédiaire utile : nommer tes describe/it Cypress avec le vocabulaire métier du brief — ça donne la lisibilité sans la lourdeur du tooling Gherkin.

Probabilité que l'option A soit le bon choix pour ton contexte : 85%

les spécifications gherkin ont l'avantage de penser "parcours utilisateur".  Sans pour autant les faire tourner dans un moteur automatique, je propose de détailler un fichier complémentaire à celui des spécifications permettant de couvrir les usescases utilisateurs.
18:40

C'est une excellente décision — tu gardes le bénéfice cognitif du Gherkin (penser parcours utilisateur, langage métier) sans la complexité du tooling.

Probabilité que cette approche soit optimale pour ton contexte : 88%

Ce que ça change dans l'architecture documentaire

Tu introduis un nouveau type de fichier entre la spec technique et les tests Cypress :

FS-XX.md          → contrat technique (API, règles métier, DTOs)
FS-XX-scenarios.md → parcours utilisateurs en Gherkin (nouveau)
cypress/e2e/XX.cy.ts → implémentation des tests (généré par OpenCode)

Le fichier Gherkin devient le pont de traduction entre la spec et le test — OpenCode peut s'en servir comme source pour générer les describe/it Cypress avec le bon vocabulaire métier.

Ma proposition de structure pour FS-02-scenarios.md
gherkin

# ARK — Scénarios utilisateurs FS-02 : Domains
# Version 0.1 — Février 2026
# Usage : spécification des parcours utilisateurs.
# Non exécuté automatiquement — sert de source pour les tests Cypress.

Feature: Gestion des domaines métier
  En tant qu'Architecte Entreprise
  Je veux gérer les domaines métier
  Afin de structurer le patrimoine applicatif de mon organisation

  Background:
    Given je suis connecté en tant qu'Architecte Entreprise
    And je suis sur la page "/domains"

  # --- Parcours nominaux ---

  Scenario: Consulter la liste des domaines
    Then je vois un tableau listant tous les domaines existants
    And chaque ligne affiche le nom, la description et la date de création

  Scenario: Créer un nouveau domaine
    When je clique sur "Nouveau domaine"
    And je saisis le nom "Finance"
    And je saisis la description "Domaine financier et comptable"
    And je clique sur "Enregistrer"
    Then je vois une confirmation "Domaine créé avec succès"
    And le domaine "Finance" apparaît dans la liste

  Scenario: Modifier un domaine existant
    Given le domaine "Finance" existe
    When je clique sur l'icône d'édition de "Finance"
    And je modifie la description en "Domaine finance, RH et juridique"
    And je clique sur "Enregistrer"
    Then je vois une confirmation "Domaine mis à jour"
    And la nouvelle description est visible dans la liste

  Scenario: Supprimer un domaine sans applications liées
    Given le domaine "Test" existe sans applications ni capacités liées
    When je clique sur l'icône de suppression de "Test"
    And je confirme la suppression dans le dialog
    Then le domaine "Test" disparaît de la liste

  # --- Parcours d'erreur ---

  Scenario: Tenter de créer un domaine avec un nom déjà utilisé
    Given le domaine "Finance" existe déjà
    When je tente de créer un nouveau domaine nommé "Finance"
    Then je vois une erreur inline "Ce nom de domaine est déjà utilisé"
    And aucun domaine n'est créé en double

  Scenario: Tenter de supprimer un domaine utilisé par des applications
    Given le domaine "Finance" est lié à 3 applications
    When je clique sur l'icône de suppression de "Finance"
    And je confirme la suppression dans le dialog
    Then je vois un message d'erreur
      """
      Ce domaine est utilisé par 3 application(s) et ne peut pas être supprimé.
      """
    And le domaine "Finance" reste présent dans la liste

  Scenario: Accéder à la page d'édition d'un domaine inexistant
    When j'accède directement à l'URL "/domains/uuid-inexistant/edit"
    Then je suis redirigé vers la liste "/domains"
```

---

**Comment intégrer ça dans ton workflow OpenCode**

Tu ajoutes une ligne dans la commande OpenCode de chaque spec :
```
Génère les tests Cypress depuis les scénarios définis 
dans [FS-XX-scenarios.md]. Nomme les describe/it 
en reprenant le libellé exact des Scenario.

Ça garantit une traçabilité directe entre le scénario Gherkin et le test .cy.ts — sans moteur d'exécution Gherkin.

Ce que je te propose de faire maintenant

Veux-tu que je génère les fichiers FS-01-scenarios.md et FS-02-scenarios.md complets en cohérence avec les specs existantes ? Je peux aussi proposer un template de fichier scénarios à ajouter dans ta Roadmap comme convention projet.

Probabilité que ce format de fichier couvre 100% des besoins sans ajustement : 78% — il faudra probablement affiner la granularité des scénarios d'erreur après les premiers tests réels.

regénère ce fichier en anglais
18:47

Probabilité que ce fichier couvre les parcours utilisateurs de FS-02 sans ajustement : 82%
Consulté un fichier, fichier créé, lu un fichier
Terminé

Le fichier couvre 3 catégories de parcours :

Nominal paths — les 7 workflows heureux (list, empty state, create, create name-only, edit, cancel, delete).

Error paths — les 6 cas d'erreur métier (duplicate name, empty name, linked applications, linked applications + capabilities, unknown UUID).

Access control paths — les 3 cas de droits (unauthenticated, insufficient permission on create, hidden delete icon).

La section Mapping to Cypress Tests fait le lien explicite entre chaque scénario Gherkin et son it() Cypress, avec la distinction [Cypress] / [Manuel] alignée sur FS-02 §7 — OpenCode sait donc quoi générer et quoi ignorer.
Fs 02 scenarios
Document · MD 

le système de droits implémenté actuellement permet-il de vérouiller la création de domain ?
18:51

Bonne question d'architecture. Laisse-moi relire la spec FS-01 et FS-02 précisément avant de répondre.

Probabilité que mon analyse soit correcte : 90%

Ce que les specs définissent

FS-01 définit le système RBAC ainsi :

    Un User a un Role
    Un Role a des Permission[]
    Les permissions suivent le format <ressource>:<action> (ex: domains:write)
    Le guard @RequirePermission('domains:write') est appliqué sur POST/PATCH/DELETE

FS-02 définit :

    domains:read sur GET
    domains:write sur POST/PATCH/DELETE

Donc oui — la création de domaine est verrouillable, via l'absence de domains:write dans le rôle de l'utilisateur.

Mais il y a une ambiguïté dans les specs

Le scénario que j'ai écrit dans FS-02-scenarios.md dit :
gherkin

Scenario: Attempt to create a domain without the required permission
  Given I am logged in as a Business Owner (read-only role)
  When I navigate to "/domains/new"
  Then I am redirected to "/403"

Ce scénario suppose que PrivateRoute vérifie la permission avant le rendu de la page. Or dans FS-01, PrivateRoute est défini ainsi :
typescript

interface PrivateRouteProps {
  permission?: string; // optionnel
}
// → redirect /403 si permission absente

Ça fonctionne uniquement si la route /domains/new est déclarée dans App.tsx avec la permission explicite :
typescript

// Ce câblage doit être fait manuellement dans App.tsx
<Route path="/domains" element={<PrivateRoute permission="domains:write" />}>
  <Route path="new" element={<DomainNewPage />} />
  <Route path=":id/edit" element={<DomainEditPage />} />
</Route>

Ce câblage n'est pas documenté dans FS-02. C'est un trou dans la spec.

Ce qu'il faudrait ajouter à FS-02

Une section sur le câblage des routes dans App.tsx :
typescript

// Routes Domains — à ajouter dans App.tsx
<Route path="/domains" element={<PrivateRoute permission="domains:read" />}>
  <Route index element={<DomainsListPage />} />
</Route>

<Route path="/domains" element={<PrivateRoute permission="domains:write" />}>
  <Route path="new" element={<DomainNewPage />} />
  <Route path=":id/edit" element={<DomainEditPage />} />
</Route>

Et une règle UX complémentaire : le bouton "Add Domain" dans DomainsListPage doit être masqué si l'utilisateur n'a pas domains:write — via hasPermission('domains:write') du store auth.
typescript

// DomainsListPage.tsx
const canWrite = hasPermission('domains:write');

<PageHeader
  title="Domains"
  action={canWrite ? {
    label: "Add Domain",
    onClick: () => navigate('/domains/new')
  } : undefined}
/>

Résumé
Couche	Verrouillage	Statut dans les specs
Backend API	@RequirePermission('domains:write') → 403	✅ Documenté FS-02 RM-04
Frontend routing	PrivateRoute permission="domains:write"	⚠️ Trou dans FS-02
Frontend UX	Bouton "Add Domain" masqué si pas domains:write	⚠️ Trou dans FS-02

Veux-tu que je génère un patch FS-02 v0.5 qui comble ces deux trous ?

oui
18:52
Consulté un fichier, fichier créé, lu un fichier
Terminé

Voici ce qui a changé par rapport à v0.4, réparti sur 3 zones :

Section 4 — RM-06 ajoutée : règle métier explicite sur le masquage conditionnel des actions d'écriture via hasPermission('domains:write'), avec le code TypeScript de référence pour PageHeader et les IconButton.

Section 6 — Câblage App.tsx documenté : la colonne "Guard" est ajoutée dans le tableau des routes, et le bloc de code App.tsx est fourni avec les deux PrivateRoute distincts — lecture (token seul) et écriture (token + permission). Ce bloc est marqué 🟡 Manuel car c'est le patron à reproduire dans tous les modules suivants.

Section 7 — 4 tests Cypress ajoutés : les deux cas d'absence de boutons dans le DOM et les deux cas de redirection /403 sur navigation directe, tous délégables à OpenCode.

La probabilité de couverture complète monte de ~93% à ~96%.
Fs 02 domains
Document · MD 

ce principe de vérification des permissions est-il intégrable dans le template de specs ?
18:56

Bonne question de gouvernance documentaire. Laisse-moi lire le template actuel avant de répondre.
Check if there's a template file in the project
Terminé

Il n'y a pas de fichier template dans les fichiers projet — il est référencé dans la Roadmap (ARK - Template FeatureSpec.md) mais pas encore créé. C'est donc l'occasion de le créer directement avec ce principe intégré dès le départ.

Probabilité que cette analyse soit correcte : 94%

Ce que ça implique concrètement

En regardant FS-02 v0.5, le principe de vérification des permissions se décline en 4 éléments systématiques à intégrer dans le template :
Zone du template	Ce qui est standardisé
Section 4 — Règles Métier	RM-XX — Droits requis (backend) + RM-YY — Masquage conditionnel UI (frontend) — toujours les deux
Section 6 — Composants Frontend	Colonne "Guard" dans le tableau des routes + bloc câblage App.tsx
Section 7 — Tests	Catégorie "Droits UI" Cypress systématique + catégorie "Sécurité / RBAC" Manuel
Section 10 — Checklist	Item "Câblage App.tsx réalisé manuellement"

Veux-tu que je génère le template complet ARK-Template-FeatureSpec.md avec ces 4 zones pré-remplies, en utilisant des placeholders [RESSOURCE] / [ACTION] pour les permissions ?

voici le template actuel . mets là à jour en fonction
18:58

Probabilité que la mise à jour couvre tous les cas sans régression : 93%
Fichier créé, lu un fichier
Terminé

Voici ce qui a changé par rapport à v0.2, section par section :

Section 4 — Deux règles RM pré-câblées avec des placeholders [ressource] : RM-0X Droits requis (tableau backend permission/guard) et RM-0Y Masquage conditionnel UI (code TypeScript de référence). Les deux sont marquées ⚠️ Obligatoire pour signaler qu'elles ne peuvent pas être omises.

Section 5 — Un bloc "Droits frontend" ajouté aux cas d'usage, avec les 3 comportements attendus pre-remplis.

Section 6 — Colonne "Guard" dans le tableau des routes + bloc App.tsx standardisé avec les deux PrivateRoute distincts (lecture / écriture), marqué À réaliser manuellement.

Section 7 — Catégorie "Droits UI" Cypress ajoutée avec les 4 cas minimum obligatoires (bouton absent, icônes absentes, redirect /403 sur new, redirect /403 sur edit).

Section 8 — Deux contraintes ajoutées : hasPermission() et câblage App.tsx manuel.

Section 9 — Commande OpenCode enrichie avec le contexte hasPermission, le câblage manuel, et la référence au fichier FS-XX-scenarios.md.

Section 10 — Checklist restructurée en 4 groupes (Modèle & API, Règles métier, Tests, Frontend, Qualité) avec les nouveaux items de vérification des permissions et du fichier Gherkin.
Ark template featurespec
Document · MD 


Claude est une IA et peut faire des erreurs. Veuillez vérifier les réponses.
Ark template featurespec · MD
ARK — Template Feature-Spec

Version 0.3 — Février 2026

    Changelog v0.3 : Intégration systématique de la vérification des permissions à deux niveaux (backend + frontend). Quatre zones impactées : (1) Section 4 — deux règles métier RM standardisées ajoutées (Droits requis et Masquage conditionnel UI). (2) Section 6 — colonne "Guard" ajoutée dans le tableau des routes + bloc câblage App.tsx standardisé. (3) Section 7 — catégorie "Droits UI" Cypress ajoutée systématiquement. (4) Section 10 — item checklist câblage App.tsx ajouté.

    Changelog v0.2 : Intégration de la stratégie de test dans le sprint — section 7 restructurée avec outillage explicite (Jest/Supertest vs Cypress), section 8 enrichie des conventions de fichiers de test, section 9 mise à jour pour inclure la génération des tests dans la session OpenCode, section 10 complétée avec checklist tests.

    Usage : Ce template est le format standard de toute Feature-Spec ARK. Chaque spec est un document autonome, versionné, directement injectable dans Claude Code sans reformatage. Une spec = une feature end-to-end (backend + frontend + tests). Ne pas coder sans spec stabilisée.

Comment utiliser ce template

    Dupliquer ce fichier dans docs/specs/
    Nommer le fichier : FS-<numéro>-<slug>.md (ex: FS-03-providers.md)
    Remplir toutes les sections — les sections marquées ⚠️ sont bloquantes pour la génération
    Faire valider la spec avant de lancer Claude Code
    Injecter la spec complète en début de session Claude Code avec la commande de la section 9

    Module de référence : FS-02 (Domains) est le patron de référence pour tous les modules CRUD. Consulter FS-02 v0.5 avant de rédiger toute nouvelle spec.

En-tête
Champ	Valeur
ID	FS-XX
Titre	Nom court de la feature
Priorité	P1 / P2 / P3
Statut	draft / review / stable / done
Dépend de	IDs des specs dont celle-ci dépend (ex: FS-01)
Estimé	Nb de jours développeur (inclut génération + validation des tests)
Version	0.1
1. Objectif & Périmètre ⚠️

    Décrire en 3-5 phrases ce que cette feature accomplit, pourquoi elle existe, et ce qu'elle ne fait pas (hors périmètre explicite).

Ce que cette feature fait :

Ce qu'elle ne fait pas (hors périmètre) :
2. Modèle Prisma ⚠️

    Coller le bloc Prisma exact correspondant à cette feature. Claude Code utilise ce bloc comme source de vérité pour générer les types TypeScript et les requêtes.

prisma

// Coller ici le modèle Prisma concerné
// Inclure les relations pertinentes

3. Contrat API (OpenAPI) ⚠️

    Définir chaque endpoint de la feature. Format YAML OpenAPI 3.0. Claude Code génère les controllers NestJS à partir de ce contrat — il doit être exhaustif.

yaml

# Coller ici les routes OpenAPI de la feature
# Inclure : path, method, requestBody, responses, security
# Toutes les routes sont protégées par bearerAuth sauf mention @Public()

4. Règles Métier Critiques ⚠️

    Lister toutes les règles qui ne sont pas déductibles du schéma ou du contrat API. Les règles RM-XX et RM-YY ci-dessous sont obligatoires dans toute spec CRUD — adapter les valeurs, ne pas supprimer la structure.

    RM-01 :
    RM-02 :
    RM-0X — Droits requis (backend) : ⚠️ Obligatoire
    Action	Permission requise	Guard NestJS
    GET /[ressource]	[ressource]:read	@RequirePermission('[ressource]:read')
    GET /[ressource]/:id	[ressource]:read	@RequirePermission('[ressource]:read')
    POST /[ressource]	[ressource]:write	@RequirePermission('[ressource]:write')
    PATCH /[ressource]/:id	[ressource]:write	@RequirePermission('[ressource]:write')
    DELETE /[ressource]/:id	[ressource]:write	@RequirePermission('[ressource]:write')

        Le seed (prisma/seed.ts) doit contenir les permissions [ressource]:read et [ressource]:write — vérifier avant de lancer OpenCode.

    RM-0Y — Masquage conditionnel des actions d'écriture dans l'UI (frontend) : ⚠️ Obligatoire Les actions d'écriture sont masquées dans l'UI si l'utilisateur ne possède pas [ressource]:write. Ce masquage est complémentaire à la protection backend — il ne s'y substitue pas.

typescript

  // Pattern standard à reproduire dans chaque page liste
  const canWrite = hasPermission('[ressource]:write'); // import depuis @/store/auth

  // Bouton d'ajout conditionnel dans PageHeader
  <PageHeader
    title="[Titre de la page]"
    action={canWrite ? {
      label: 'Add [Entité]',
      onClick: () => navigate('/[ressource]/new'),
      icon: <AddIcon />,
    } : undefined}
  />

  // Icônes edit/delete conditionnelles par ligne de tableau
  {canWrite && (
    <>
      <IconButton onClick={() => navigate(`/[ressource]/${row.id}/edit`)}>
        <EditIcon />
      </IconButton>
      <IconButton onClick={() => handleDeleteClick(row)}>
        <DeleteIcon />
      </IconButton>
    </>
  )}

    Un utilisateur sans [ressource]:write voit la liste en lecture seule — aucun bouton d'action n'est rendu dans le DOM.

5. Comportement Attendu par Cas d'Usage

    Décrire les scénarios nominaux, les cas d'erreur et les cas de droits. Format : "Quand X, alors Y."

Nominal :

    GET /[ressource] token valide → 200 tableau
    POST /[ressource] payload valide → 201 entité créée
    PATCH /[ressource]/:id payload valide → 200 entité mise à jour
    DELETE /[ressource]/:id sans entités liées → 204

Erreurs :

    Quand ... → HTTP 4XX + message "..."
    DELETE /[ressource]/:id entités liées → 409 + message avec compteurs

Droits frontend :

    Utilisateur sans [ressource]:write sur la page liste → bouton "Add [Entité]" absent du DOM, icônes edit/delete absentes
    Utilisateur sans [ressource]:write naviguant vers /[ressource]/new → redirigé vers /403
    Utilisateur sans [ressource]:write naviguant vers /[ressource]/:id/edit → redirigé vers /403

6. Composants Frontend ⚠️

    Décrire les écrans React, le câblage des routes avec les guards de permission, et les props des composants.

Routes React :
Route	Composant	Guard	Description
/[ressource]	[Ressource]ListPage	PrivateRoute (token seul)	Liste — bouton ajout conditionnel
/[ressource]/new	[Ressource]NewPage	PrivateRoute permission="[ressource]:write"	Création — bloquée si pas [ressource]:write
/[ressource]/:id/edit	[Ressource]EditPage	PrivateRoute permission="[ressource]:write"	Édition — bloquée si pas [ressource]:write

Câblage App.tsx : ⚠️ À réaliser manuellement — ne pas déléguer à OpenCode
typescript

// App.tsx — routes [Ressource]
// Lecture : token requis, pas de permission spécifique
<Route path="/[ressource]" element={<PrivateRoute />}>
  <Route index element={<[Ressource]ListPage />} />
</Route>

// Écriture : token + permission [ressource]:write requis
// → redirect /403 automatique via PrivateRoute si permission absente
<Route path="/[ressource]" element={<PrivateRoute permission="[ressource]:write" />}>
  <Route path="new" element={<[Ressource]NewPage />} />
  <Route path=":id/edit" element={<[Ressource]EditPage />} />
</Route>

    Ce câblage est le patron de référence établi dans FS-02. Le reproduire à l'identique pour chaque module CRUD.

Composant formulaire partagé [Ressource]Form :
typescript

interface [Ressource]FormProps {
  initialValues?: Partial<[Ressource]FormValues>;
  onSubmit: (values: [Ressource]FormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

interface [Ressource]FormValues {
  // champs du formulaire
}

Structure de fichiers frontend :

frontend/src/
├── pages/
│   └── [ressource]/
│       ├── [Ressource]ListPage.tsx
│       ├── [Ressource]NewPage.tsx
│       └── [Ressource]EditPage.tsx
├── components/
│   └── [ressource]/
│       └── [Ressource]Form.tsx
└── types/
    └── [ressource].ts

Comportements UX :

    [Ressource]ListPage : dialog de confirmation avant suppression, message d'erreur 409 si entité liée
    [Ressource]ListPage : bouton "Add [Entité]" et icônes edit/delete rendus uniquement si hasPermission('[ressource]:write') — voir RM-0Y
    [Ressource]NewPage / [Ressource]EditPage : erreur inline sur contrainte unique, bouton désactivé pendant chargement
    [Ressource]EditPage : si GET /[ressource]/:id → 404, rediriger vers /[ressource]
    Snackbar MUI après création / modification / suppression réussie

7. Tests ⚠️

    Stratégie de test à trois niveaux — à remplir exhaustivement. OpenCode génère les tests [Jest], [Supertest] et [Cypress]. Les tests [Manuel] sont toujours écrits à la main.

Outil par niveau
Niveau	Outil	Fichier cible	Délégable à OpenCode
Unit (services NestJS)	Jest	src/[ressource]/[ressource].service.spec.ts	✅ Oui
API / contrat HTTP	Jest + Supertest	test/[ressource].e2e-spec.ts	✅ Oui
Sécurité / RBAC	Jest + Supertest	test/[ressource].e2e-spec.ts	❌ Manuel
E2E browser (UI)	Cypress	cypress/e2e/[ressource].cy.ts	✅ Oui (nominaux + droits UI)

    Règle absolue : Les tests de sécurité (guards, vérification que des champs sensibles ne fuient pas, comportements RBAC backend) ne sont jamais délégués à OpenCode.

Tests Jest — Unit

    [Jest] [Ressource]Service.create() retourne l'entité créée
    [Jest] [Ressource]Service.create() lève ConflictException sur erreur Prisma P2002
    [Jest] [Ressource]Service.remove() lève ConflictException si entités liées
    [Jest] [Ressource]Service.findOne() lève NotFoundException si UUID inexistant
    [Jest] [Ressource]Service.remove() appelle prisma.[ressource].delete() si aucune entité liée
    [Jest] (ajouter les cas spécifiques à la feature)

Tests Supertest — Contrat API

    [Supertest] GET /[ressource] authentifié → 200 avec tableau
    [Supertest] GET /[ressource] liste vide → 200 avec []
    [Supertest] POST /[ressource] payload valide → 201 avec entité créée
    [Supertest] POST /[ressource] contrainte unique violée → 409
    [Supertest] POST /[ressource] champ requis absent → 400
    [Supertest] GET /[ressource]/:id existant → 200
    [Supertest] GET /[ressource]/:id UUID inexistant → 404
    [Supertest] PATCH /[ressource]/:id payload valide → 200
    [Supertest] DELETE /[ressource]/:id sans entités liées → 204
    [Supertest] DELETE /[ressource]/:id avec entités liées → 409 + message avec compteurs
    [Supertest] (ajouter les cas spécifiques à la feature)

Tests Sécurité / RBAC — Manuel ❌

    À écrire et valider à la main. Ne jamais déléguer à OpenCode.

    [Manuel] GET /[ressource] sans token → 401
    [Manuel] POST /[ressource] avec rôle sans [ressource]:write → 403
    [Manuel] PATCH /[ressource]/:id avec rôle sans [ressource]:write → 403
    [Manuel] DELETE /[ressource]/:id avec rôle sans [ressource]:write → 403
    [Manuel] (ajouter les cas de champs sensibles à vérifier si applicable)

Tests Cypress — E2E Browser

Parcours nominaux :

    [Cypress] [Ressource]ListPage affiche la liste après login
    [Cypress] Créer une entité via [Ressource]NewPage → apparaît dans la liste
    [Cypress] Modifier une entité via [Ressource]EditPage → mis à jour dans la liste
    [Cypress] Supprimer une entité sans entités liées → disparaît de la liste
    [Cypress] Tentative de suppression d'une entité utilisée → message d'erreur 409 visible dans l'UI
    [Cypress] [Ressource]EditPage UUID inexistant → redirection vers /[ressource]

Droits UI : ⚠️ Obligatoire — à compléter pour chaque spec

    [Cypress] Utilisateur sans [ressource]:write sur [Ressource]ListPage → bouton "Add [Entité]" absent du DOM
    [Cypress] Utilisateur sans [ressource]:write sur [Ressource]ListPage → icônes edit et delete absentes du DOM
    [Cypress] Utilisateur sans [ressource]:write naviguant vers /[ressource]/new → redirigé vers /403
    [Cypress] Utilisateur sans [ressource]:write naviguant vers /[ressource]/:id/edit → redirigé vers /403

8. Contraintes Techniques

    Tout ce qui contraint l'implémentation : patterns imposés, conventions du projet, points d'attention spécifiques.

    Pattern NestJS : Suivre le module Domains (FS-02) comme référence de structure et de nommage
    Prisma : Toute écriture passe par $executeRaw ark.current_user_id
    Auth : Toutes les routes sont protégées par JwtAuthGuard (global) — @Public() uniquement sur les exceptions explicites
    Guards de permission : @RequirePermission('[ressource]:read') sur GET, @RequirePermission('[ressource]:write') sur POST/PATCH/DELETE
    Gestion erreur P2002 : try/catch ciblé → ConflictException. Ne pas laisser remonter l'erreur Prisma brute.
    Suppression : Pattern _count Prisma avant delete — vérifier les entités liées et retourner un message explicite avec les compteurs
    hasPermission() : Importé depuis @/store/auth (FS-01) — conditionne l'affichage des boutons d'écriture. Ne pas recréer la logique localement.
    Câblage App.tsx : Routes d'écriture sous PrivateRoute permission="[ressource]:write" — réalisé manuellement, ne pas déléguer à OpenCode
    Conventions de fichiers de test :
        Unit : src/[ressource]/[ressource].service.spec.ts
        E2E API : test/[ressource].e2e-spec.ts (dossier test/ à la racine de backend/)
        Cypress : cypress/e2e/[ressource].cy.ts (dossier cypress/ à la racine de frontend/)
    Setup Supertest : @nestjs/testing + supertest. Mocker PrismaService avec jest.mock() dans les tests unit.
    Setup Cypress : cy.login() depuis cypress/support/commands.ts en beforeEach. Utiliser un utilisateur de test sans [ressource]:write pour les tests de droits UI.
    (ajouter ici les contraintes spécifiques à la feature)

9. Commande OpenCode

    Bloc prêt à l'emploi — copier-coller en début de session OpenCode. Tests générés dans la même session que le code de production.

Contexte projet ARK (conventions dans AGENTS.md) :
- Stack : NestJS strict + Prisma + PostgreSQL 16 + React + TypeScript strict
- Toute écriture en base passe par : await prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`
- PrismaModule est global — ne pas le réimporter
- JwtAuthGuard est global — @Public() sur les routes publiques uniquement
- Guards de permission : @RequirePermission('[ressource]:read') et @RequirePermission('[ressource]:write')
- Intercepter l'erreur Prisma P2002 → ConflictException
- Vérifier via _count Prisma avant toute suppression — message avec compteurs explicites
- hasPermission() importé depuis @/store/auth — conditionne l'affichage des boutons d'écriture (RM-0Y)
- Le câblage App.tsx (PrivateRoute permission) est réalisé manuellement — ne pas le générer
- Pattern de référence : module Domains (FS-02 v0.5)
- Stack de test :
  * Unit : Jest — src/[ressource]/[ressource].service.spec.ts
  * API : Supertest — test/[ressource].e2e-spec.ts
  * E2E browser : Cypress — cypress/e2e/[ressource].cy.ts
  * cy.login() disponible dans cypress/support/commands.ts
  * Utiliser un utilisateur sans [ressource]:write pour les tests de droits UI Cypress
  * Tests marqués [Manuel] : NE PAS générer
- Scénarios utilisateurs : FS-XX-scenarios.md — nommer les describe/it avec les labels exacts des Scenario

Implémente la feature "[TITRE]" (FS-XX) en respectant strictement le contrat ci-dessous.
Génère le code de production ET les tests [Jest], [Supertest] et [Cypress] définis en section 7.
Ne génère PAS les tests marqués [Manuel].
Ne fais aucune hypothèse non documentée. Si un point est ambigu, pose une question avant de coder.

[COLLER LE CONTENU COMPLET DE CETTE SPEC ICI]

10. Checklist de Validation Avant Génération

Modèle & API :

    Modèle Prisma testé en base (prisma migrate dev)
    Contrat OpenAPI relu et cohérent avec le modèle
    Seed contient les permissions [ressource]:read et [ressource]:write

Règles métier :

    Règles métier exhaustives — aucune règle implicite non documentée
    RM Droits requis complétée avec les permissions exactes (RM-0X)
    RM Masquage conditionnel UI complétée avec le code TypeScript de référence (RM-0Y)

Tests :

    Section 7 complète — chaque cas étiqueté [Jest] / [Supertest] / [Cypress] / [Manuel]
    Tests sécurité/RBAC backend identifiés et marqués [Manuel]
    Tests droits UI Cypress présents (4 cas minimum : bouton absent, icônes absentes, redirect /403 new, redirect /403 edit)
    Jest + Supertest opérationnels
    Cypress opérationnel, cy.login() disponible
    Utilisateur de test sans [ressource]:write disponible en seed pour les tests Cypress de droits

Frontend :

    Câblage App.tsx documenté en section 6 — routes d'écriture sous PrivateRoute permission="[ressource]:write"
    Câblage App.tsx réalisé manuellement avant de lancer OpenCode

Qualité :

    Dépendances (autres FS) au statut done
    Fichier scénarios FS-XX-scenarios.md rédigé en Gherkin
    Spec relue — aucune hypothèse implicite laissée à OpenCode

Template v0.3 — Projet ARK

Cypress tests et syntaxe Gherkin - Claude
