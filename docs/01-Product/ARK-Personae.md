# ARK — Personas Utilisateurs

_Version 1.0 — Mars 2026_

> Ce document décrit les trois personas principaux d'ARK. Il est conçu pour être injecté comme contexte dans un agent IA (OpenCode / Claude Code) afin d'orienter les décisions UX, les priorités fonctionnelles et le wording de l'interface.
>
> Chaque persona est accompagné d'une probabilité de rôle (acheteur, utilisateur régulier, sponsor) et d'une probabilité par douleur, estimées sur la base de l'analyse produit.

---

## Lecture rapide — Matrice des personas

| Persona                       | Rôle ARK                     | Probabilité rôle   | Douleur principale                                  |
| ----------------------------- | ---------------------------- | ------------------ | --------------------------------------------------- |
| Marc — Architecte Entreprise  | Utilisateur primaire / Admin | ~85% primary buyer | Inventaire obsolète, analyse d'impact manuelle      |
| Sophie — Owner Applicatif CRM | Utilisateur régulier         | ~70% regular user  | Visibilité sur son périmètre, contrats fournisseurs |
| Thierry — DSI                 | Sponsor / Décideur budget    | ~80% sponsor achat | Coût des outils, risques invisibles                 |

---

## Persona 1 — Marc, Architecte Entreprise

**Contexte :** ETI ~800 personnes. Seul EA de l'organisation.
**Citation clé :** "Mon patrimoine applicatif, c'est un Excel de 340 lignes que j'ai bâti tout seul sur 3 ans. Personne d'autre ne peut le lire."
**Probabilité primary buyer : ~85%**

### Douleurs

* **[CRITIQUE ~90%] Mise à jour manuelle — dégradation de la qualité de donnée** Chaque fin de projet nécessite une mise à jour manuelle des fiches. Résultat : ~30% du catalogue est en permanence obsolète. La perte de confiance des autres équipes s'ensuit.
* **[CRITIQUE ~85%] Analyse d'impact avant projet — 2 jours de travail manuel** La question "si on migre SAP, qu'est-ce qui tombe ?" déclenche une reconstitution mentale des dépendances depuis des notes dispersées. C'est du reverse engineering répété à chaque initiative.
* **[MAJEUR ~75%] Absence de support pour la communication direction** L'Excel ne peut pas être présenté en comité. Des PowerPoints sont produits à la main, périmés dès le lendemain d'une modification.

### Ce qu'ARK lui apporte

- Source de vérité unique, accessible et maintenue collaborativement
- Graphe de dépendances pour répondre en minutes aux questions d'impact
- Vues exportables / présentables sans resaisie manuelle

### Rôle dans ARK

`ARCHITECT` — accès complet lecture/écriture sur l'ensemble du patrimoine. Administre les domaines, les standards, les tags de dimension.

---

## Persona 2 — Sophie, Owner Applicatif CRM

**Contexte :** IT Manager, responsable de 5 à 10 applications dont le CRM.
**Citation clé :** "Marc me demande de mettre à jour 'ma fiche application' dans son outil. Je ne sais pas quoi remplir, et je ne vois pas ce que ça m'apporte à moi."
**Probabilité utilisateur régulier : ~70%**

### Douleurs

* **[MAJEUR ~80%] Visibilité sur les consommateurs de son application** Identifier qui utilise le CRM avant une maintenance nécessite d'envoyer un mail et d'attendre 3 jours de réponses. L'information devrait être instantanée et centralisée.
* **[MAJEUR ~70%] Gestion des contrats fournisseurs — risque de non-renouvellement** Un contrat Salesforce a failli ne pas être renouvelé parce qu'il était dans la boîte mail d'un collègue parti. Une date d'expiration visible dans ARK = zéro surprise.
* **[SIGNIFICATIF ~65%] Absence de vue filtrée sur son périmètre** Besoin de voir uniquement ses 5 applications, leurs dépendances directes, leurs owners. Pas l'architecture globale de 200 applications.

### Ce qu'ARK lui apporte

- Vue filtrée par owner applicatif — son périmètre uniquement
- Dates d'expiration de contrats fournisseurs visibles et alertables
- Interface de saisie guidée — elle sait exactement quoi remplir et pourquoi

### Rôle dans ARK

`APP_OWNER` — accès en écriture limité à ses applications. Lecture sur les dépendances de son périmètre.

### Note UX importante

Sophie est le persona le plus à risque d'abandon. Si la saisie est perçue comme une charge sans bénéfice visible, elle ne met pas à jour. ARK doit lui montrer immédiatement la valeur retournée (ex. : "3 équipes dépendent de votre CRM").

---

## Persona 3 — Thierry, DSI

**Contexte :** DSI d'une ETI, décideur budget IT, expérience d'un déploiement LeanIX à 40k€/an.
**Citation clé :** "On m'a vendu LeanIX à 40k€/an. J'ai 12 utilisateurs, dont 10 qui ne s'y connectent jamais."
**Probabilité sponsor achat : ~80%**

### Douleurs

* **[CRITIQUE ~85%] Outils du marché surdimensionnés et trop coûteux** TOGAF complet, méta-modèle extensible, 50 connecteurs... Le besoin réel est : quelles applications j'ai, qui en est responsable, comment elles communiquent. Pas un ERP d'architecture.
* **[CRITIQUE ~80%] Absence de visibilité sur les risques du patrimoine** Applications en fin de vie, contrats expirant dans 6 mois, systèmes critiques sans plan de continuité — ces informations n'existent nulle part de façon consolidée. Ce sont des bombes à retardement silencieuses.
* **[MAJEUR ~70%] Onboarding des nouveaux arrivants — 3 mois pour comprendre le patrimoine** Un nouveau DSI adjoint ou CTO met 3 mois à construire une vision du patrimoine. Avec ARK, une vue claire devrait être accessible en 1 heure.

### Ce qu'ARK lui apporte

- Coût proportionné à l'usage (SME/ETI, pas enterprise)
- Dashboard de risques : fin de vie, expiration contrats, criticité sans backup
- Onboarding accéléré : vue patrimoine immédiatement lisible pour un arrivant

### Rôle dans ARK

`ADMIN` ou `READER` selon l'organisation. Thierry valide l'achat mais peut ne pas être utilisateur quotidien. Son critère d'évaluation est le ROI visible et la réduction du risque.

### Note produit importante

Thierry est la référence anti-LeanIX. Chaque décision de périmètre fonctionnel doit être testée contre : "est-ce que ça m'éloigne du positionnement 'simple, proportionné et pragmatique' ?" Le risque de feature creep est maximum pour ce persona.

---

## Tensions entre personas à gérer dans ARK

| Tension              | Description                                                                              | Résolution recommandée                                                             |
| -------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Marc vs Sophie       | Marc veut un catalogue complet. Sophie veut remplir le minimum.                          | Saisie guidée, champs obligatoires limités, valeur retournée immédiate pour Sophie |
| Sophie vs Thierry    | Sophie veut une vue filtrée. Thierry veut une vue globale des risques.                   | Vues paramétrables par rôle, pas une interface universelle                         |
| Thierry vs le marché | Thierry a été brûlé par la complexité. ARK doit résister à l'ajout de features inutiles. | Chaque nouvelle feature évaluée : "est-ce que ça sert Marc dans son quotidien ?"   |

---

## Usage recommandé de ce document

Injecter dans le contexte OpenCode / Claude Code pour :

1. **Valider les décisions UX** — "Est-ce que ce flux convient à Sophie ?"
2. **Prioriser les fonctionnalités** — "Thierry a besoin du dashboard risques avant le graphe full"
3. **Rédiger les labels et messages UI** — ton orienté valeur, pas technique
4. **Écrire les Gherkin / tests Cypress** — les scénarios se basent sur des cas d'usage réels de ces personas

---

_Document de travail v1.0 — Projet ARK — À maintenir en cohérence avec ARK-Product-Brief.md_