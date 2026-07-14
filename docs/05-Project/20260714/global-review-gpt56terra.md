# Revue globale agents et skills ARK-EPM

Horodate : 2026-07-14T18:46:35+02:00
Auteur : GPT-5.6 Terra
Statut : analyse, aucune recommandation appliquee dans ce rapport

## Perimetre

Fichiers et automatisations examines :

- `AGENTS.md` racine, `backend/AGENTS.md`, `frontend/AGENTS.md`, `e2e/AGENTS.md`, `docs/AGENTS.md`
- Commandes ARK sous `.claude/commands/` et `.opencode/commands/`
- Skills projet : `caveman`, `caveman-help`, `caveman-commit`, `caveman-review`, `caveman-compress`, `compress`
- Skill global disponible : `find-skills`
- `Makefile`, `docker-compose.yml` et `docs/05-Project/tasks.yaml` pour verifier les instructions contre les outils reels

Les skills de marketplace presents sous `~/.claude/plugins/` ne sont pas inclus : ils ne sont pas exposes comme skills actifs de cette session et ne font pas partie de la gouvernance ARK.

## Resume executif

La gouvernance est riche, precise et orientee qualite. Elle ralentit toutefois le cycle de livraison pour quatre raisons principales :

1. Les roles, commandes et responsabilites ne sont pas alignes entre Claude Code, OpenCode et les documents.
2. Le gate "backend termine avant front stable" force une serialisation inutile du travail.
3. La separation stricte QA/developpement cree des handoffs obligatoires pour chaque correction.
4. Les guides sont trop longs, dupliques et contiennent des informations operationnelles qui ont deja derive.

Le gain le plus important vient d'un workflow fonde sur un contrat API stable, du travail back/front parallele, et une responsabilite de test partagee : le developpeur livre ses tests de changement, QA assure les parcours transverses et la qualite de la suite.

## Constats prioritaires

### P0 - Identites d'agents et commandes incoherentes

`AGENTS.md` annonce `/back`, `/front`, `/data`, `/qa`, mais les commandes Claude existantes sont `/ark-back`, `/ark-front`, `/ark-data`, `/ark-qa`. Les commandes OpenCode sont seulement disponibles pour le cycle de tache ; elles demandent des roles `arch` et `spec` qui ne correspondent pas aux agents OpenCode exposes dans cet environnement.

Impact : une session peut ne pas charger le bon contexte, ou ne pas savoir quel agent utiliser pour une tache `arch` ou `spec`.

Recommandation :

- Declarer une nomenclature unique : `ark-arch`, `ark-spec`, `ark-data`, `ark-back`, `ark-front`, `ark-qa`.
- Fournir les six commandes dans Claude et OpenCode, ou retirer les roles non executables de `assigned_agent`.
- Distinguer explicitement les commandes, qui changent le contexte de session, des skills, qui apportent une procedure reutilisable.
- Ajouter une courte table "role -> commande -> guide -> droits de modification" dans le document racine.

### P0 - Gate front artificiellement bloque par le backend

`docs/AGENTS.md` interdit de passer la spec front a `stable` tant que la spec back n'est pas `done`. Cette regle transforme chaque feature en chaine lineaire : spec back, implementation back, spec front, implementation front, QA.

Impact : le front attend un backend dont il n'a pas besoin pour etablir le layout, les textes, les types, les cles React Query, les cas de chargement et les parcours utilisateur.

Recommandation : remplacer ce gate par :

```text
Contract API stable (OpenAPI + DTO/response + erreurs + permissions)
  -> spec front stable
  -> implementation back et front en parallele
  -> gate integration : API reelle, tests API, test E2E critique
```

Le backend reste requis avant le test d'integration, pas avant toute conception ou implementation frontend. Pour les endpoints nouveaux, un mock temporaire explicitement limite au contrat est acceptable jusqu'a la disponibilite de l'API.

### P0 - RACI QA incompatible avec le workflow bug

QA est responsable de tous les tests mais ne peut pas modifier le code source. Le guide backend demande pourtant des tests e2e dans la phase backend, et la regle "bug = test avant correction" impose souvent trois transferts : QA reproduit, back/front corrige, QA revalide.

Impact : temps d'attente, conflits sur les memes fichiers de tests, et responsabilite diffusee quand un changement ne possede pas son test de regression.

Recommandation :

- Back/front/data ecrivent et maintiennent les tests directement lies a leur changement : unitaire, API ou UI cible.
- QA possede la strategie, les fixtures communes, les parcours E2E critiques, les tests de regression multi-domaines, la stabilite et la revue de couverture.
- Pour un bug, la meme session peut ajouter un test rouge, corriger, puis verifier vert. QA n'est sollicite que si le test est transverse, instable ou necessite une strategie nouvelle.
- Remplacer le RACI "Tests toutes couches : QA R" par "Qualite de la strategie : QA R; tests lies au changement : implementateur R".

### P0 - Verrouillage `tasks.yaml` non atomique

Le rituel ouvre une tache par lecture puis modification de `tasks.yaml`. Deux agents peuvent lire la meme tache ouverte et la verrouiller simultanement. Le prochain ID est obtenu a partir du dernier ID dans un fichier partage, ce qui est egalement sujet aux courses. Le fichier contient deja des chemins de handoff heterogenes et des champs parfois absents.

Impact : collisions de sessions, conflits Git inutiles et perte de confiance dans le coordinateur annonce comme source de verite.

Recommandation minimale :

- Avant ecriture, relire `tasks.yaml`; interrompre si le verrou a change.
- Utiliser une branche ou un worktree par agent pour isoler les changements de code.
- Centraliser les mutations de taches dans une commande unique qui valide le schema et choisit `max(id) + 1`.
- En cas de forte concurrence, remplacer le verrou YAML par une issue GitHub/GitLab ou un petit registre transactionnel. Ne pas tenter de resoudre une course par convention textuelle seule.

## Incoherences documentaires a corriger

### Schema de taches

- Le schema racine indente `feature`, `priorite` et `sessions` sous `type`, ce qui ne correspond pas aux entrees reelles.
- `priorite` est declaree obligatoire dans le schema racine mais absente du template de cloture et de creation de `/ark-task-add`.
- `bug` est utilise dans `tasks.yaml` et dans la commande d'ajout, mais absent de la liste `type` du schema racine.
- `handoff_ref` utilise tantot `docs/05-Project/...`, tantot un chemin date relatif. Un unique chemin relatif a la racine est necessaire.
- Une partie des taches terminees ne possede pas le meme ensemble de champs que les nouvelles taches.

Action : definir un schema YAML unique, le valider en CI et fournir un unique generateur de tache. La commande doit ajouter `priorite`, `handoff_ref: ~` et `sessions: []` sans demander d'inference fragile.

### MUI et tests UI

- `frontend/AGENTS.md` impose MUI v9, tandis que `.claude/commands/ark-front.md` mentionne encore MUI v5.
- Les guides spec et QA presentent Cypress comme requis, alors que la dette technique planifie sa migration vers Playwright et sa suppression.
- Le guide frontend renvoie a des references de design et une arborescence qui peuvent ne plus etre exactes.

Action : declarer Playwright comme framework E2E UI de reference une fois la migration achevee, retirer Cypress des templates et des checklists, puis corriger la commande front vers MUI v9. Toute liste d'entites, composants ou fichiers qui evolue frequemment doit etre retiree des guides normatifs ou generee automatiquement.

### Commandes et environnement Docker

- Le `Makefile` autodetecte les noms de conteneurs et le port backend expose est `3001`, mais plusieurs guides donnent des noms de conteneurs fixes et des URLs en `localhost:3000`.
- Le guide backend fournit des commandes `docker-compose` directes, alors que le `Makefile` encapsule deja une partie de la detection Compose v1/v2 et de la configuration de ports.
- `make db-push` accepte une perte de donnees sans garde supplementaire.

Action : documenter les cibles `make` comme interface principale, conserver les commandes Docker seulement dans un runbook de diagnostic, et marquer les commandes destructrices par une confirmation explicite. Les examples doivent viser le port et les noms effectivement definis par la stack.

### Audit Prisma

Le guide demande `SET LOCAL ark.current_user_id` avant chaque ecriture. `SET LOCAL` est par nature borne a une transaction PostgreSQL; une requete brute puis une requete Prisma separee peut ne pas partager cette transaction.

Action : formaliser un helper transactionnel ou une methode Prisma unique qui regroupe `SET LOCAL` et l'ecriture dans la meme transaction. Ajouter un test d'integration d'audit sur chaque nouveau type d'ecriture. La regle actuelle doit decrire cette contrainte plutot que presenter deux appels separes comme universellement corrects.

## Regles qui freinent sans proteger proportionnellement

### Validation architecture avant toute migration

L'accord `arch` avant chaque modification de `schema.prisma` est un goulot d'etranglement. Il est justifie pour un changement de modele transverse, une rupture de compatibilite, une decision de cardinalite, un index volumineux, un trigger, ou une contrainte de securite. Il ne l'est pas pour un ajout local conforme a un pattern deja valide.

Proposition : `data` implemente sans gate les migrations locales conformes au schema existant; `arch` valide les changements de contrat, de modele transverse, de compatibilite, de performance ou de securite. La decision est enregistree dans une ADR courte lorsqu'elle est structurante.

### Interdiction absolue de supprimer du code

La regle "proposer la suppression sans l'executer" bloque les refactors, les suppressions de code mort et les corrections de securite. Elle est egalement contredite par des taches qui demandent explicitement des suppressions apres migration.

Proposition : autoriser la suppression sans confirmation lorsque le code est introduit dans la session, non reference, remplace dans le meme changement, ou couvert par une verification ciblant le comportement conserve. Demander confirmation seulement pour une API publique, une migration de donnees irreversible, un comportement utilisateur incertain, ou une suppression a large perimetre.

### Commentaires `AGENT-DECISION` dans le code

Les decisions d'architecture mises en commentaire dans le code deviennent rapidement obsoletes, se dupliquent et augmentent le bruit de maintenance.

Proposition : creer `docs/04-Tech/decisions/ADR-NNN-<slug>.md`, court et date. La tache, la spec et le code peuvent referencer l'ADR. Les commentaires de code restent reserves aux invariants locaux difficiles a deduire.

### Une question maximum puis execution

Cette regle est bonne pour les choix faibles, mais dangereuse pour les changements irreversibles ou les contrats ambigus.

Proposition :

- Risque faible : annoncer une hypothese, agir, verifier.
- Risque moyen : choisir l'option conforme aux conventions et signaler le compromis.
- Risque eleve : poser une question bloquante avant toute mutation.

## Simplification recommandee des guides

Les instructions chargees par une session front ou backend cumulent plusieurs centaines de lignes, des exemples, des inventaires statiques, des commandes et des anti-patterns redondants. Cela augmente le cout de contexte et la probabilite de divergence.

Architecture documentaire cible :

```text
AGENTS.md                       80-120 lignes : roles, securite, workflow, liens
<domaine>/AGENTS.md             <= 150 lignes : conventions et Definition of Done
docs/runbooks/<sujet>.md        recettes Docker, Prisma, incidents, diagnostics
docs/04-Tech/decisions/ADR-*.md decisions structurantes
scripts/validate-tasks.*        schema et validation du registre de taches
```

Les informations suivantes doivent devenir des runbooks ou etre supprimees si elles ne sont pas verifiees : inventaire d'entites, noms de conteneurs, listes de composants, exemples de commandes repetes, et historique d'incidents deja resolus.

## Workflow de livraison cible

### Definition of Ready

Une tache implementable doit contenir : objectif, perimetre, criteres d'acceptation, contrat impacte, dependances, niveau de risque et proprietaire. Une spec n'a pas besoin de repeter les informations deja normees dans OpenAPI ou une ADR.

### Cycle d'une feature

1. `spec` ou `arch` fixe le besoin et les decisions exceptionnelles.
2. Le contrat API est stabilise : chemins, payloads, erreurs, permissions et pagination.
3. `data`, `back` et `front` travaillent en parallele lorsque leurs dependances sont explicites.
4. Chaque implementateur ajoute les tests directement lies a son changement.
5. `qa` execute ou maintient les tests transverses et les parcours critiques.
6. Une unique gate d'integration valide build, tests cibles et un parcours utilisateur critique.
7. La cloture met a jour une tache compacte et un handoff seulement s'il existe une information non deduisible du code, de la spec ou des tests.

### Definition of Done par changement

- Backend : build, tests unitaires/API impactes, permissions, validation DTO, audit transactionnel si ecriture, OpenAPI mis a jour si contrat public.
- Frontend : build, i18n, etats loading/error/empty, React Query, test UI cible lorsque le parcours est critique.
- Data : migration verifiee, generation Prisma, index/rollback analyses, test d'integration si trigger ou audit impacte.
- Bug : test de regression + correction + test cible vert dans la meme livraison.

Cette definition ciblee remplace une validation complete couteuse apres chaque modification minime. La suite complete reste obligatoire avant merge/release, ou pour les changements transverses et de securite.

## Analyse des skills

### `caveman` et `caveman-help`

Le skill reduit le texte mais ne reduit pas le travail. Son auto-declenchement sur "be brief" est trop large et peut rendre les handoffs, incidents et compromis moins compréhensibles. Les modes wenyan ne contribuent pas au cycle ARK et compliquent la communication. L'exemple `useMemo` est egalement une recommandation generique qui peut contredire une politique React Compiler privilegiee.

Action : garder uniquement un mode `lite` explicite pour les reponses de routine. Desactiver l'activation implicite, supprimer les modes wenyan, et laisser les rapports, decisions, alertes de securite et handoffs en prose normale.

### `caveman-commit`

Les conventions Conventional Commits sont utiles. L'auto-declenchement lors du staging est inapproprie : un agent ne doit pas deduire qu'un commit est souhaite. Le skill doit seulement generer un message sur demande explicite et ne doit jamais etre couple au staging ou au commit.

Action : conserver le skill, retirer la promesse d'auto-declenchement et ajouter une verification de la convention reelle du depot avant de proposer le message.

### `caveman-review`

Le format concis est bon pour les findings simples. Les emojis de severite sont incoherents avec la convention de communication sans emojis. Un declenchement automatique de toute demande de revue peut supprimer le raisonnement necessaire pour les risques architecture, securite ou tests manquants.

Action : utiliser `[P0]`, `[P1]`, `[P2]`, `[P3]` et activer ce format uniquement avec `/ark-review-brief`. Conserver le format de revue normal pour les revisions completes.

### `caveman-compress` et `compress`

Les deux skills sont des doublons quasi identiques et emploient le meme declencheur. Ils ecrasent le document source apres appel d'un LLM distant. La validation protege les titres, blocs de code et URLs, mais ne prouve pas la preservation des inline code, commandes, listes, tableaux, liens Markdown, ni de la semantique. Le filtrage de fichiers sensibles est heuristique et fonde surtout sur le nom du fichier.

Action : ne conserver qu'un seul skill. Exiger une confirmation explicite `--allow-remote`, generer d'abord un fichier de proposition et un diff, puis ecraser seulement apres acceptation. Interdire par defaut la compression des fichiers de gouvernance, specs, docs de securite et fichiers contenant des references a credentials. Ajouter des tests de validation structurelle complets.

### `find-skills`

Le skill propose une installation globale non interactive. Cela peut introduire des instructions non auditees dans tout l'environnement et ne garantit pas la compatibilite avec ARK.

Action : rechercher librement, mais installer seulement apres revue du contenu, de la reputation, de la licence, de la version et du comportement reseau. Preferer une installation locale au projet, versionnee et documentee.

## Skills a creer en priorite

Les skills actuels sont principalement des modes de communication. Les gains de cycle viendront de procedures ARK executables et courtes :

1. `ark-task`: valide/ouvre/clot une tache avec schema, verrou et handoff compact.
2. `ark-feature`: charge uniquement la spec, ADR, contrat et Definition of Done pertinents; verifie les gates avant de commencer.
3. `ark-data-migration`: checklist migration, transaction audit, generation Prisma, verification schema et rollback.
4. `ark-validate`: choisit le plus petit ensemble de build/tests couvrant les fichiers modifies, puis propose la suite complete si necessaire.
5. `ark-review`: revue centre sur bugs, securite, regressions et tests manquants, avec severite uniforme.

Chaque skill doit indiquer clairement ses effets de bord, les fichiers modifies et la commande de verification. Aucun ne doit faire de commit, installation globale ou appel reseau sans demande explicite.

## Plan d'amelioration priorise

### Phase 1 - Corrections de coherence

- Unifier noms de roles et commandes entre `AGENTS.md`, Claude et OpenCode.
- Corriger MUI v9, le statut Cypress/Playwright et les exemples Docker/ports.
- Corriger le schema `tasks.yaml`, les valeurs enumerees et les templates de commandes.
- Ajouter une validation automatique du registre de taches.

### Phase 2 - Acceleration du flux

- Remplacer le gate backend termine par le gate contrat API stable.
- Redistribuer la responsabilite des tests entre implementateurs et QA.
- Ajouter Definition of Ready et Definition of Done ciblees.
- Introduire worktrees ou branches d'agent pour les taches simultanees.

### Phase 3 - Reduction de cout de contexte

- Reduire le guide racine et les guides de domaine.
- Deplacer les recettes et diagnostics dans des runbooks charges a la demande.
- Migrer les decisions structurantes vers des ADR.
- Supprimer les doublons et faits statiques non verifies.

### Phase 4 - Skills utiles et securises

- Supprimer le doublon de compression et renforcer son consentement/validation.
- Retirer les auto-declenchements ambigus de caveman, commit et review.
- Creer les cinq skills ARK operationnels ci-dessus.

## Criteres de succes

- Une feature avec contrat stable peut commencer back et front sans attente artificielle.
- Une correction de bug avec test cible ne requiert pas plus d'un handoff.
- Toute tache est schema-valide et ne peut etre verrouillee par deux sessions.
- Les guides de contexte charges sont courts, exacts et sans duplication operationnelle.
- Les skills reduisent des etapes de travail mesurables plutot que seulement la longueur des reponses.
