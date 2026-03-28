# Snippets

```bash
feature/I18N

git switch master
git pull origin master
git branch -D 
git branch feature/F999-technical-debt
git switch feature/F999-technical-debt
```

https://github.com/vtemian/micode

https://github.com/JRedeker/opencode-morph-fast-apply

https://github.com/mailshieldai/opencode-canvas

https://github.com/IgorWarzocha/opencode-planning-toolkit

https://github.com/Octane0411/opencode-plugin-openspec

https://github.com/kenryu42/claude-code-safety-net

https://github.com/Shlomob/ocmonitor-share/blob/main/screenshots/sessions-summary.png
https://github.com/openchamber/openchamber?tab=readme-ov-file



Session d'écriture de PRD. 
Rappel de la roadmap docs\01-Product\ARK-Roadmap.md
FS-06-BACK a été implémentée (et le front aussi).
Je veux maintenant passer à l'écriture de FS-04-back selon le template adéquat et la table associée docs\04-Tech\schema.sql.
1-Vérifie le respect par rapport au NFR
2-Poses moi des questions 

Filtres
Pagination
COntrat à jour docs\04-Tech\openapi.yaml
Gestion des tags cohérentes 
Gestion filtres cohérentes 
GEstion de la pagination cohérente 


* PREPARATION
    - Please check this new feature : 
        - FUNC : Do you see functionnal incoherences ? 
            - ask me questions
        - TECH : Do you see NFR incoherences ? 
        - DESIGN : DO you see new front components that are not yet referenced in the UI KIT ?
        - DESIGN : Check Navigation Patterns coherence
    - OK with recommandations. ADAPT THE SPEC
    - /compact
* IMPLEMENTATION
    - I want to implement this feature : XXXXX.
        - Prepare implementation plan
        - Finish Plan by 
            - Making sure docs\04-Tech\openapi.yaml is uptodate
            - adjusting AGENTS.md
            - updating the status specs
            - updating roadmap
    - adapter docs\04-Tech\openapi.yaml
    - adapter docs\04-Tech\schema.sql
    - EXECUTE PLAN
        - /compact
* FIX
* FEEDBACK 
    - what have you learn for this session that could serve for future implementation ? 
      - Rétrospective de cette session : si tu devais t'améliorer, quels conseils te donnerait-tu ?
    - prépare une release note fonctionelle, minimaliste, et synthétique de cette session
* RELEASE NOTE
  - Prépare une release note fonctionelle, minimaliste, et très synthétique de cette session.
  - Organise le note en TLDR / NEW / FIX. TLDR doit traduire en valeur utilisateur non technique synthétique la release. 



# Opencode
https://github.com/luizov/icon-libraries

https://github.com/nextlevelbuilder/ui-ux-pro-max-skill



https://mui.com/material-ui/react-autocomplete/



# 21/03



- AUTH : KO
- http://localhost:5173/api/v1/auth/login [HTTP/1.1 500 Internal Server Error 8ms]

- [x] FS 06 Application
  - [x] DEBUG : list view : filtres   
  - [ ] 1. Adapter ApplicationForm (single-select → multi-select providers)


- [ ] FS 03 Provider
  - [x] Front spec
  - [ ] REmise à jour du fichier front + roadmap.
  - [X] MODEL issue : necessité d'avoir une APP - N fournisseurs reliés (intégrateur / license logicielle)
  - [ ] Impact front 
  - [ ] DEPENDENCY CONFLICT :  "Provider is used by 3 application(s)"
- [ ] FS 04 It components
  - [X] Front spec
  - [ ] REmise à jour du fichier front + roadmap.


SESSION EVOLUTION : 
docs\03-Features-Spec\FS-03-Providers-back.md a été implementé.
Il y a un soucis de modèle: actuellement un provider peut être associé à plusieurs Applications : applications[] (1:N via applications.provider_id)   
Or j'ai des cas où  je peux avoir l'inverse également en N-N : 
En tant qu'utilisateur, 
Afin d'identifier des relations complètes avec un édtieur et un intégrateur d'une même solutions, 
je dois pouvoir rensiegner plusieurs providers pour une même application. 


IMPACT Spect front
UNe évolution majeure a été apportée au back: docs\03-Features-Spec\FS-04-IT-Components-back.md
**ÉVOLUTION MAJEURE** — Migration modèle 1:N → N:N. Une application peut désormais être liée à plusieurs providers avec des rôles distincts (éditeur, intégrateur, support). Suppression colonne `applications.provider_id`, création table `app_provider_map` avec colonne `provider_role`. RM-03 adapté pour vérifier `_count.appProviderMaps`. Impact sur FS-06-BACK et DTOs (CreateApplicationDto, UpdateApplicationDto).
Evalue les impacts sur le front:docs\03-Features-Spec\FS-04-IT-Components-front.md


Session d'écriture de PRD sur les IT Components. 
Rappel de la roadmap docs\01-Product\ARK-Roadmap.md
FS-03-Providers-back.md a été implementé
Je veux maintenant passer à l'écriture de FS-03-front selon le template adéquat
1-En respectant 00-UI-Kit.md et 02-Navigation-Patterns.md
2-Poses moi des questions 


Session d'écriture de PRD sur les Providers. 
Rappel de la roadmap docs\01-Product\ARK-Roadmap.md
FS-03-Providers-back.md a été implementé
Je veux maintenant passer à l'écriture de FS-03-front selon le template adéquat
1-En respectant 00-UI-Kit.md et 02-Navigation-Patterns.md
2-Poses moi des questions 


### OK 
Quand je suis sur la vue liste /application, le bloc de filtres a un comportement étrange.
Il présente normalement juste 4 champs de filtres : Cycle de vie, Tag geographie, tag Brand, tag legalentity.
Or je me retrouve maintenant avec 8 nouveau champs Geographie de ce format là : 'Geography 1773868450409' avec des ID différents. Je pense que le système boucle sur tags existants en base et affiche trop de choses.





# 18/03


- [X] FS 03 Provider
  - [ ] Specs
  - [x] BAck
- [x] FS 04 It components
  - [X] Specs
  - [X] devBAck
 
- [X] Playwright : DEBUG & FIX
  - [X] BAck 


# 17/03

- [X] Added Personaes for futures studies

- [ ] Applications : session de FIX
  - [X] Vue liste
    - [x] Pagination
    - [x] Side drawer
      - [x] applications.list.columns.description : manque traduction 
    - [X] Criticité / cycle de vie  rendu chip pas uniformisé entre toutes les vues (surtout liste) 
    - [X] Criticité / cycle de vie : plantage au tri
    - [X] Filtres : autocomplete OK, mais pas erreur si submit de recherche
  - [X] Vue détail
    - [x] applications.list.columns.description : manque traduction 
  - [X] Vue EDIT et probablement NEW
    - [X] Si rajout de tag , enregistrement qui plante 


AGENT.MD -> These are hardcoded English strings

# 16/03



# 13/01 

docs\03-Features-Spec\FS-06-Applications.md

- [x] refresh spec de Claude 
  - [x] de ARK-Roadmap
  - [X] de template back


- [x]  Amélioration sur refresh token

je souhaite retravailler la logique de session décrite ici docs\03-Features-Spec\FS-01-Auth-RBAC.md. 
Voici l'US 
En tant qu'utilisateur connecté 
Afin d'arrêter d'être déconnecté à chaque Reloead de page 
J'aimerais implémenter une mécanique de refresh token qui s'annule soit à l'expiration du token, soit à la deconnexion explicite.  


- [x] Meilleur gestion des tags 
  - [X] Fix 1 : Vue détail / Soucis du nombre d'affichage de tags: un seul tag est affiché par dimension. Tous devrait être affichés. 
  - [X] Fix 2 : Vue liste / Soucis du nombre d'affichage de tags: un seul tag est affiché par dimension. un chip sans X et gris "Tous les tags" devrait permettre d'afficher la totalité instantanément


# 12/03

- [x] Implementation Drawer
  - [X] US - Consultation Rapide
  En tant qu'utilisateur, je veux cliquer sur le corps d'une ligne du tableau pour ouvrir un Side Drawer, afin de consulter les métadonnées du domaine sans perdre ma position dans la liste ni mes filtres actifs s'il y en a.
  - [X] US - Accès Direct Détail
  En tant qu'utilisateur, je veux cliquer sur le nom du domaine (mis en évidence par un lien hypertexte) pour naviguer directement vers la Page Détail complète, afin d'accéder aux détails ou fonctionnalités avancées en un seul clic.
  - [X] US - Transition Drawer vers Détail
  En tant qu'utilisateur, je veux trouver un bouton "View Full Details" en footer du Side Drawer, afin de pouvoir basculer vers la vue complète si mon besoin d'analyse dépasse le simple aperçu.
  - [X] US Transition Drawer vers Edit
  En tant qu'utilisateur, je veux trouver un bouton "Edit" en footer du du Side Drawer, afin de pouvoir basculer vers la vue édition.
  - [X] US Fermeture Drawer 
  En tant qu'utilisateur,je veux trouver une croix grise dans le coin haut droit du drawer permettant de fermer le drawer


## 11/03 
- [ ] Feature Tags chips on Domains : Fix
  - [X] ListView (even if not perfect)
  - [x] Detail view
  - [X] Forms
    - [X] add
    - [X] edit

## 10/03

> [!WARNING] Arrêt 10/03 1:30
>
> Pas d'erreurs, mais les tags ne s'affichent pas correctement
> Back implementation done
> Ai lancé pendant la nuit front implementation

- [X] Feature Tags chips on Domains
  - [X] adapt specs
  - [X] first implementation 


## 09/03

- [ ] MODEL
    - [ ] Application assessement: nouvelle table
    - [ ] Vérifier que toutes les tables contiennent les mêmes champs : comment, created_at, updated_at
    - [ ] table application : 
        - [ ] add column ? @opencode
        - [ ] un applicatif plusieurs business capabilities




# 08/03 

> [!WARNING] Arrêt 08/03 00:30
>
> BLocage : la page domaine affiche toujours "Une erreur inattendue s'est produite
> Une erreur technique est survenue. Veuillez recharger la page."
> l'URL appelée contient toujours double appel : /api/v1/api/v1/domains

- [x] Feature Domain Evolution
    - [x]  Impacts Domains Feature Tag Foundations
        - [x] Evaluer impacts
    - [x] mise en conformité  NFR domains
- [x] Feature Tag Foundations
    - [x] Ecrire feature
    - [x] changer roadmap
    - [x] changer NFR
    - [x] Developpement feature
        - [x] REview 
        - [x] Implement
        - [x] Fix
    - [x] release note
- [x] Feature P2 Tag Administration
    - [x] Ecrire feature

# 07/03

- [ ] Reupload fichiers Mistral
- [ ] Reupload fichiers Claude
- [ ] Reupload fichiers Gemini
- [x] FS02 Domains FIX
    - [x] Règle d'unicité : pas de message de feedback qui apparait pour prévenir l'utilisateur
        - [x] Commencer par adapter la specs (et I18N) docs\03-Features-Spec\FS-02-Domains-front.md si besoin. 
    - [x] La tableau devrait être rafraichi après suppression d'un enregistrement.
    - [x] rajout de tests CYpress dans ce sens 
    - [x] UI
        - [x] Edit et New qui occupent toute la page

```sql
// Dénormalisation correspondante sur applications :
ALTER TABLE applications ADD COLUMN last_technical_fit  SMALLINT;
ALTER TABLE applications ADD COLUMN last_functional_fit SMALLINT;
ALTER TABLE applications ADD COLUMN last_tco_annual_eur BIGINT;
ALTER TABLE applications ADD COLUMN last_assessed_at    TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN last_assessed_by    UUID REFERENCES users(id);



CREATE TABLE application_assessments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    assessed_by    UUID REFERENCES users(id),
    assessed_at    TIMESTAMPTZ,
    status         VARCHAR(11) NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published', 'unpublished')),

    -- Fits subjectifs (SMALLINT 1-4, affichés en % dans l'UI)
    technical_fit  SMALLINT CHECK (technical_fit  BETWEEN 1 AND 4),
    functional_fit SMALLINT CHECK (functional_fit BETWEEN 1 AND 4),

    -- TCO annuel estimé en EUR
    tco_annual_eur BIGINT CHECK (tco_annual_eur >= 0 AND tco_annual_eur < 10000000000),

    comment        TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

- 

Fixes : 
**Auth token + permissions should always travel together** - The login response missing permissions was a subtle but critical bug that affected the entire UI permission system.
Session persistence: Currently tokens are in-memory only (lost on refresh). 
Should implement a token refresh mecanism. 

1. **Client-side 401 handling requires nuance** - Clearing session on every 401 is too aggressive; need to distinguish between "session expired" vs "API call rejected".

Ask me questions. 

Adapt 

# 06/03

> [!WARNING] Arrêt 05/03 00:30

- [x] SYSTEM 
    - [x] Optimiser AGENTS.MD 
- [x] SYSTEM
    - [x] Séparation FRONT/BACK dans les specs
    - [x] Adapter FS02-Domains
    - [x] Soumettre les 2 specs à CLaude pour validation
    - [x] Adapter _template en front et back
    - [x]  _template.md ARK-Roadmap.md
- [x] PS-02-DOMAIN Fixes 2: 
    - [x] Evol : manque de feedback selon les actions avec https://mui.com/material-ui/react-alert/. Succès ou erreur. 
        - [x] Adapt UI Kit 
        - [x] Adapt specs : 
            - [x] confirmation d'ajout (success)
            - [x] confirmation d'edit (success)
            - [x] affichage d'erreur avec raison d'erreur : 
            - [x]  Attention à prendre en compte I18N si nouveaux messages 
            - [x] confirmation de suppression
            - [x] Adapte les tests Gherkins également 
            - [x] la suppression fonctionne bien mais devrait rediriger sur le listing une fois fini
        - [x] Lancer analyse FSDOmain Back avec existant
        - [x] Lancer analyse FSDomain Front avec existant
- [x] SYSTEM 
    - [x] Add release note mecanism

# 05/03

> [!WARNING] Arrêt 05/03 00:30
>
> Je bénéficie bien de la fonction nouveau domaine
> mais l'écran nouveau domaine ne se charge pas dans le frame du reste de l'appli (sidebar estc). Et un nouveau pack de fix est à faire FIXE2 

- [x] Session FEATURE DOMAIN
    - [x] Implement
    - [x] Fixes 1
- [ ] Session TEST
    - [ ] Séparer les tests Gherkins et les laisser dans un doc scenarios à part
    - [ ] voIR fin de discussion https://claude.ai/chat/61f7516f-ab42-4b37-ae74-9918710d420c
    - [ ] STACK : lancer les tests CYPRESS 
    - [ ] cd frontend && npx cypress run

    -> Cypress: error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory

# 04/03 

- [x] Session FEATURE DOMAIN - partial
    - [x] Review specs
    - [x] Implement - partial
- [x] Session DOCUMENTATION
    - [x] DOCS : Réorganiser les specs
    - [x] Intégrer NFR
    - [x] Push et merge branche 
- [x] Session TechDEBT
    - [x] Push et merge branche 
    - [x] Le backend /health ne répond pas, ce qui empêche de se connecter 
    - [x] TECHDEBT - Demander une vérification du la tech debt à chaque fin de sprint
    - [x] TECHDEBT - push
    - [x] Réuploader toutes les specs dans CLaude

### PROJECT PROCESS

### TECH

- [x] Intégrer NFR https://claude.ai/chat/b9e762ab-c2fd-428d-aefa-5b8a3efc2f79

### STACK / PLATFORM

- [x] Remettre de l'ordre dans les documents 
- [ ] hot reload ou reload qui expire systémtiquement la session. 

### MODELE

* Vérifier une app plusieurs business cap

EN COURS (voir conv claude)
https://claude.ai/chat/21fffd27-64b9-4a52-9b10-39e2982b2f71

La contrainte actuelle est simple et visible dans le schéma : domain_id UUID REFERENCES domains(id) sur applications et business_capabilities — une FK directe, donc une application = exactement un domaine.

or une application de gestion de notes de frais appartient logiquement à "Finance" ET à "RH". Avec la FK actuelle, tu dois choisir — et ce choix est arbitraire et frustrant.

```
-- Remplace applications.domain_id (FK directe)
CREATE TABLE app_domain_map (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    domain_id      UUID REFERENCES domains(id) ON DELETE CASCADE,
    is_primary     BOOLEAN DEFAULT false,  -- domaine "principal" pour l'affichage et les filtres
    PRIMARY KEY (application_id, domain_id)
);

-- Remplace business_capabilities.domain_id (FK directe)
CREATE TABLE capability_domain_map (
    capability_id UUID REFERENCES business_capabilities(id) ON DELETE CASCADE,
    domain_id     UUID REFERENCES domains(id) ON DELETE CASCADE,
    is_primary    BOOLEAN DEFAULT false,
    PRIMARY KEY (capability_id, domain_id)
);
```

### UX & DESIGN

https://stitch.withgoogle.com/

- [x] App flow
    - [x] 2 livrables claude à produire / intégrer 

      - https://claude.ai/chat/ac8d8035-9a16-497e-87f9-d7282f13d8f9
    - [x] vérifier cohérence avec specs design existantes 
    - [x] enrichir la page design 

#  03/03

> [!CAUTION]
>
> Arrêt 04/03 00:11 : plus de quota opencode
> Le backend /health ne répond pas, ce qui empêche de se connecter 

- [x] App flow 
    - [x] Premières études
- [x] feature i18N
- [x] sanitizers pour les champs libres (ex : description d’une application) pour éviter les XSS/CSRF
    - [x] Nouvelle version à mettre à jour F999 https://claude.ai/chat/b9e762ab-c2fd-428d-aefa-5b8a3efc2f79

# ARRET au 03/03   1:40

- [x] Réuploader toutes les specs dans CLaude et Gemini
- [x] Toujours pas de bouton ou de /logout visible. 

---

# TECH

- Mots de passe 

admin@ark.io / admin123456

http://localhost:5174/applications
http://localhost:5174/design
http://localhost:3000/api/v1/health

---

# ROADMAP FUTURE

- [ ] Feature Homepage
    - [ ] Préparer feature





- ***contrôle de la stack existante***
- créer new feature 
- créer des tests automatisés

**P2 - View the domains list : Add pagination**

- @CLAUDE - ***ajuster design system*** 



**P1 - MVP - FS11**
- Intégrer Menu utilisateur 


P1 - Feature Homepage

**HARDCODED VALUE Edit backend/src/auth/jwt.strategy.ts** 
constructor(private configService: ConfigService) {
super({
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
ignoreExpiration: false,
secretOrKey: configService.get('JWT_SECRET') || 'fallback-secret-do-not-use-in-prod',
});
}

**SOFT DELETE**
NEW FEATURE for each new object

**P2 - une seule image docker**
DéploiementOn-premise Docker ComposeSelf-hosted (Linux/macOS/Docker) ou Managed

**P3 - Intégrer RWD**
- Créer new feature
- ajuster design system
- créer tests automatisés




**P2 - renew de mot de passe avec OTP**


**P3 - Enterprise Authentication and SSO**
SCIM compliant




