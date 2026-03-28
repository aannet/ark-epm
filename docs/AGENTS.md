# Spec / Documentation — Guide Op\u00e9rationnel

> Guide sp\u00e9cialis\u00e9 pour l'Agent `spec` sur ARK-EPM.  
> Ce fichier compl\u00e8te le `AGENTS.md` racine \u2014 charger les deux avant toute intervention.

---

## 1. Structure Documentaire

```
docs/
\u251c\u2500\u2500 01-Product/
\u2502   \u251c\u2500\u2500 ARK-Product-Brief.md        # Brief produit (contexte, objectifs)
\u2502   \u251c\u2500\u2500 ARK-Roadmap.md              # Roadmap fonctionnelle par sprint
\u2502   \u251c\u2500\u2500 ARK-Glossary.md             # Glossaire EA (entit\u00e9s, termes m\u00e9tier)
\u2502   \u251c\u2500\u2500 ARK-Personae.md             # Profils utilisateurs cibles
\u2502   \u2514\u2500\u2500 ARK-Release-Note-template.md
\u251c\u2500\u2500 02-Design/
\u2502   \u251c\u2500\u2500 00-UI-Kit.md                # Design tokens, palette, typographie
\u2502   \u2514\u2500\u2500 02-Navigation-Patterns.md   # Patterns de navigation UI
\u251c\u2500\u2500 03-Features-Spec/              # Specs fonctionnelles (coeur du workflow)
\u2502   \u251c\u2500\u2500 _template.md                # Index/routeur des templates (v0.4)
\u2502   \u251c\u2500\u2500 _template_back.md           # Template spec backend
\u2502   \u251c\u2500\u2500 _template_front.md          # Template spec frontend
\u2502   \u251c\u2500\u2500 F-XX-<slug>.md              # Fondations (format libre)
\u2502   \u251c\u2500\u2500 FS-XX-<slug>-back.md        # Specs backend
\u2502   \u251c\u2500\u2500 FS-XX-<slug>-front.md       # Specs frontend
\u2502   \u2514\u2500\u2500 P2/                         # Phase 2 (backlog)
\u251c\u2500\u2500 04-Tech/
\u2502   \u251c\u2500\u2500 ARK-Architecture-Setup.md   # Architecture technique
\u2502   \u251c\u2500\u2500 ARK-NFR.md                  # Exigences non fonctionnelles
\u2502   \u251c\u2500\u2500 openapi.yaml                # Contrat API (source de v\u00e9rit\u00e9)
\u2502   \u2514\u2500\u2500 schema.sql                  # Sch\u00e9ma SQL g\u00e9n\u00e9r\u00e9
\u2514\u2500\u2500 05-Project/
    \u2514\u2500\u2500 Import-Data-Template.md     # Template d'import de donn\u00e9es
```

---

## 2. Workflow Feature Spec

### D\u00e9cision : Split back / front (depuis Sprint 2)

Chaque Feature Spec est d\u00e9coup\u00e9e en deux documents distincts :

| Document | P\u00e9rim\u00e8tre | Template |
|---|---|---|
| `FS-XX-<slug>-back.md` | NestJS + Prisma + tests Jest | `_template_back.md` |
| `FS-XX-<slug>-front.md` | React + MUI + i18n + Cypress | `_template_front.md` |

**Pourquoi** : le contexte d'une spec unifi\u00e9e est trop dense et h\u00e9t\u00e9rog\u00e8ne pour un agent IA. Le signal/bruit est meilleur dans deux sessions sp\u00e9cialis\u00e9es.

### S\u00e9quencement

```
FS-XX-BACK : draft \u2192 stable \u2192 [session Agent back] \u2192 done
                                                                \u2193 gate d\u00e9bloqu\u00e9e
FS-XX-FRONT : draft \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2192 stable \u2192 [session Agent front] \u2192 done
```

La spec front **ne peut pas** passer \u00e0 `stable` tant que la spec back n'est pas `done`.

### Statuts

| Statut | Signification |
|---|---|
| `draft` | Spec en cours de r\u00e9daction |
| `review` | Spec compl\u00e8te, en attente de validation |
| `stable` | Spec valid\u00e9e \u2014 pr\u00eate pour l'agent de d\u00e9veloppement |
| `in-progress` | Impl\u00e9mentation en cours |
| `done` | Impl\u00e9ment\u00e9e, test\u00e9e, merg\u00e9e |

---

## 3. Conventions de Nommage

### Fichiers

| Type | Nom de fichier | Dossier |
|---|---|---|
| Spec backend | `FS-XX-<slug>-back.md` | `docs/03-Features-Spec/` |
| Spec frontend | `FS-XX-<slug>-front.md` | `docs/03-Features-Spec/` |
| Fondation | `F-XX-<slug>.md` | `docs/03-Features-Spec/` |
| Sc\u00e9narios Gherkin | `FS-XX-<slug>-scenarios.md` | `docs/03-Features-Spec/` |

### Num\u00e9rotation

- **F-XX** : Fondations transverses (F-00 Scaffolding, F-01 Design System, F-02 i18n, F-03 Tags, F-99 Tech Debt)
- **FS-XX** : Feature Specs par entit\u00e9 (FS-01 Auth, FS-02 Domains, FS-03 Providers, ..., FS-10 Import Excel)
- **P2/** : Backlog Phase 2

### Specs existantes

| Ref | Entit\u00e9 | Back | Front | Statut |
|-----|---------|------|-------|--------|
| FS-01 | Auth & RBAC | `FS-01-Auth-RBAC.md` (unifi\u00e9) | \u2014 | done |
| FS-02 | Domains | `FS-02-Domains-back.md` | `FS-02-Domains-front.md` | done |
| FS-03 | Providers | `FS-03-Providers-back.md` | `FS-03-Providers-front.md` | done |
| FS-04 | IT Components | `FS-04-IT-Components-back.md` | `FS-04-IT-Components-front.md` | done |
| FS-05 | Data Objects | `FS-05-Data-Objects.md` | \u2014 | draft |
| FS-06 | Applications | `FS-06-Applications-back.md` | `FS-06-Applications-front.md` | done |
| FS-07 | Business Capabilities | `FS-07-Business-Capabilities.md` | \u2014 | draft |
| FS-08 | Interfaces | `FS-08-Interfaces.md` | \u2014 | draft |
| FS-09 | Dependency Graph | `FS-09-Dependency-Graph.md` | \u2014 | draft |
| FS-10 | Import Excel | `FS-10-Import-Excel.md` | \u2014 | draft |

---

## 4. Checklist de Cr\u00e9ation d'une Paire de Specs

### \u00c9tape 1 \u2014 R\u00e9daction back

- [ ] Dupliquer `_template_back.md` \u2192 `FS-XX-<slug>-back.md`
- [ ] Remplir toutes les sections obligatoires
- [ ] Valider le contrat API contre `schema.prisma`
- [ ] R\u00e9f\u00e9rencer dans la roadmap
- [ ] Passer au statut `stable`

### \u00c9tape 2 \u2014 R\u00e9daction front (apr\u00e8s que la spec back est `done`)

- [ ] Dupliquer `_template_front.md` \u2192 `FS-XX-<slug>-front.md`
- [ ] R\u00e9f\u00e9rencer le contrat API (pointer vers back, ne pas red\u00e9finir)
- [ ] D\u00e9finir le Layout Contract (YAML par page)
- [ ] Ajouter les cl\u00e9s i18n dans `fr.json`
- [ ] Passer au statut `stable`

---

## 5. R\u00e8gles de Mise \u00e0 Jour

- **Nouvelle entit\u00e9 EA** = cr\u00e9er la paire de specs **avant** le code
- **D\u00e9cision d'architecture** = reporter dans `AGENTS.md` + spec concern\u00e9e + `docs/04-Tech/`
- **Nouvelle entit\u00e9 EA** = ajouter dans le glossaire `docs/01-Product/ARK-Glossary.md`
- **Fin de sprint** = mettre \u00e0 jour roadmap + release notes

---

## 6. R\u00e9f\u00e9rences Crois\u00e9es

| Document | R\u00f4le | Lien avec les specs |
|---|---|---|
| `AGENTS.md` | Conventions IA (transverse) | \u00c0 injecter dans chaque session agent |
| `F-99-Technical-Debt.md` | Registre dette technique | Gates de fin de sprint |
| `ARK-NFR.md` | Exigences non fonctionnelles | NFR \u00e0 mettre \u00e0 jour apr\u00e8s chaque sprint |
| `F-01-Design-System.md` | Composants shared | Liste inject\u00e9e dans les specs front |
| `F-02-i18n.md` | Convention i18n | Pr\u00e9requis gate front |
| `ARK-Glossary.md` | Glossaire EA | Validation de toute nouvelle entit\u00e9 |
