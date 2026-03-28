# BRIEF PROJET — Site Institutionnel / Vitrine
> Document de référence pour les agents IA intervenant sur ce projet.  
> Version : 0.2 — Mise à jour : précisions backend existant, contrat OpenAPI, objectif acquisition leads.

---

## 1. Contexte & Objectif

Ce projet consiste à développer un **site institutionnel/vitrine et canal d'acquisition principal** reposant sur une architecture **headless ou semi-découplée** combinant :

- **Frontend** : Next.js (React) avec une approche Styleguide pilotée par Storybook
- **Backend / CMS** : Distribution custom Drupal 10 **existante** (source de vérité éditoriale)

### Objectif business primaire
Le site est le **principal canal d'acquisition de leads**. Toute décision technique (performance, SEO, UX) doit être évaluée à l'aune de son impact sur la conversion. L'architecture doit supporter :
- Des **landing pages dédiées par campagne** (création autonome par les équipes marketing via Drupal)
- Des **formulaires de contact / demande de démo** intégrés au CRM
- Un **tracking analytics** fiable (GA4 et/ou Matomo) sans dégrader le score Core Web Vitals
- Une **intégration CRM** (HubSpot ou Salesforce — à préciser) pour la qualification et le routage des leads

### Contrainte backend
Le backend Drupal 10 **existe déjà**. Il n'est pas reconstruit — il est consommé et étendu si nécessaire. Un **audit de surface API** est requis en amont (cf. section 4 bis) pour identifier les endpoints exposés vs. manquants avant tout développement frontend.

---

## 2. Domaines Métier

| Domaine | Responsabilité | Technologie principale |
|---|---|---|
| **Contenu** | Gestion éditoriale, types de contenu, taxonomies | Drupal 10 (existant) |
| **Présentation** | Rendu UI, composants, accessibilité | Next.js + React |
| **Design System** | Tokens, composants documentés, guidelines | Storybook |
| **Intégration CMS** | Contrat API entre Drupal et Next.js | JSON:API (natif) — contrat OpenAPI à auditer |
| **Acquisition / CRM** | Formulaires, tracking, routage leads | HubSpot ou Salesforce + GA4/Matomo |
| **Qualité** | Tests, accessibilité, performance, Core Web Vitals | Vitest, Playwright, Axe, Lighthouse CI |

---

## 3. Stack Technique

### Frontend
- **Framework** : Next.js 14+ (App Router)
- **Langage** : TypeScript strict
- **CSS Framework** : À décider — options retenues : **Tailwind CSS v4** (utilitaire, rapide) ou **CSS Modules + Style Dictionary** (plus proche d'un vrai design token system). Recommandation : Tailwind CSS v4 + CSS custom properties pour les tokens sémantiques.
- **Styleguide** : Storybook 8 (CSF3, autodocs, a11y addon)
- **State / Data fetching** : React Query ou SWR (selon complexité)
- **Tests** : Vitest (unitaires), Playwright (e2e), Storybook Test (composants)

### Backend
- **CMS** : Drupal 10 — distribution custom
- **API** : JSON:API (natif Drupal) — GraphQL (module contrib) à évaluer si les besoins de composition de contenu sont complexes
- **Auth** : Simple OAuth (pour les previews et zones protégées)
- **Preview** : Next.js Draft Mode + Drupal Content Preview

### Infrastructure (à préciser)
- Hébergement frontend : Vercel / Netlify / self-hosted (TBD)
- Hébergement Drupal : Plateforme PHP managée / Docker (TBD)
- CDN, cache : à définir avec l'équipe infra

---

## 4. Décision Architecturale Ouverte : Niveau de Couplage

> ⚠️ Cette décision structurante doit être prise avant le sprint 1.

### Option A — Headless découplé complet (recommandé pour la maintenabilité)
- Next.js consomme **uniquement** l'API Drupal (JSON:API / GraphQL)
- Drupal ne génère aucun rendu HTML public
- **Avantages** : séparation claire, frontend indépendant, performances optimisables
- **Inconvénients** : preview plus complexe, effort d'intégration initial plus élevé

### Option B — Semi-découplé
- Certaines pages restent rendues par Drupal (ex : formulaires, pages admin)
- Next.js prend en charge les pages à forte valeur UI
- **Avantages** : migration progressive, moins de risque initial
- **Inconvénients** : deux systèmes de routing à maintenir, dette technique potentielle

**Recommandation** : Choisir l'Option A dès le départ en utilisant le module **`next_drupal`** (Next.js for Drupal) qui fournit les utilitaires d'intégration (DrupalClient, preview, revalidation).

---

## 4 bis. Contrat OpenAPI — Audit & Gouvernance

### Contexte
Le backend Drupal 10 étant existant, **l'état réel de la surface API est inconnu**. Avant tout développement frontend, l'Agent Architecture doit conduire un audit d'exposition.

### Protocole d'audit (à exécuter en sprint 0)
1. **Générer le contrat OpenAPI** depuis Drupal via le module `openapi` ou `openapi_jsonapi`
2. **Versionner le fichier** dans le repo frontend : `contracts/drupal-api.openapi.yaml`
3. **Identifier les gaps** : endpoints manquants pour les besoins frontend listés ci-dessous
4. **Décider de l'exposition** des endpoints manquants (équipe contrôle le Drupal — décision interne)
5. **Générer les types TypeScript** depuis le contrat : `npx openapi-typescript contracts/drupal-api.openapi.yaml -o types/drupal-api.ts`

### Endpoints critiques à vérifier (besoins frontend)
| Besoin | Endpoint attendu | Priorité |
|---|---|---|
| Pages de contenu | `GET /jsonapi/node/page` | P0 |
| Landing pages campagne | `GET /jsonapi/node/landing_page` | P0 |
| Navigation / menus | `GET /jsonapi/menu_items/{menu}` | P0 |
| Formulaire de contact | `POST /webform_rest/submit` ou webhook CRM | P0 |
| Médias / images | `GET /jsonapi/media/image` | P1 |
| Taxonomies | `GET /jsonapi/taxonomy_term/{vocab}` | P1 |
| Preview (brouillons) | Auth + Draft Mode endpoint | P1 |
| Revalidation webhook | `POST /api/revalidate` (côté Next.js) | P1 |

### Règle de gestion des gaps
> Si un endpoint nécessaire n'est pas exposé : l'Agent Backend ouvre l'exposition dans Drupal **avant** que l'Agent Frontend commence l'intégration du composant concerné. Le contrat `drupal-api.openapi.yaml` est mis à jour et commité.

### Outillage recommandé
- **`openapi-typescript`** : génération de types TS depuis le contrat
- **`msw` (Mock Service Worker)** : mocking des endpoints non encore exposés en développement frontend
- **Swagger UI** (optionnel) : documentation interne du contrat

---

## 5. Conventions de Développement

### Structure des répertoires (Frontend)
```
/
├── app/                    # Next.js App Router
│   ├── [lang]/             # i18n routing (si multilingue)
│   └── api/                # API routes Next.js (revalidate, CRM webhooks)
├── components/
│   ├── ui/                 # Composants atomiques (Button, Card…)
│   ├── blocks/             # Blocs Drupal mappés (Hero, Teaser…)
│   ├── acquisition/        # Composants dédiés conversion (Form, CTA, LandingHero…)
│   └── layout/             # Header, Footer, Navigation
├── contracts/
│   └── drupal-api.openapi.yaml   # Contrat OpenAPI Drupal (source de vérité)
├── lib/
│   ├── drupal/             # DrupalClient, helpers API
│   ├── analytics/          # Wrappers GA4 / Matomo, événements de tracking
│   ├── crm/                # Intégration HubSpot / Salesforce
│   └── utils/              # Fonctions utilitaires
├── stories/                # Storybook stories (co-localisées ou ici)
├── styles/                 # Tokens CSS, globals
└── types/
    ├── drupal-api.ts       # Généré depuis le contrat OpenAPI
    └── index.ts            # Types applicatifs
```

### Contrat de nommage Drupal → React
- Chaque **Content Type Drupal** est mappé à un **Block component React**
- Ex : `node--article` → `<ArticleTeaser />`, `node--page` → `<BasicPage />`
- Les **Paragraph types** Drupal sont mappés à des composants `blocks/`

### CSS Framework décision
- Utiliser **Tailwind CSS v4** avec un fichier `design-tokens.css` centralisé
- Les tokens sémantiques (couleurs, typographie, espacement) sont définis en CSS custom properties et exposés à Storybook via `preview.js`

---

## 6. Workflow Éditorial

```
Éditeur Drupal
    │
    ▼
Contenu publié (ou brouillon)
    │
    ├─► API JSON:API ──► Next.js (SSG/ISR) ──► Site public
    │                                               │
    │                                         Visiteur / Lead
    │                                               │
    │                              ┌────────────────┼────────────────┐
    │                              ▼                ▼                ▼
    │                         Formulaire       Analytics        Landing page
    │                         contact/démo     GA4/Matomo       campagne
    │                              │
    │                              ▼
    │                    CRM (HubSpot / Salesforce)
    │                    Qualification + routage lead
    │
    └─► Draft Mode ──► Preview URL ──► Prévisualisation éditeur
```

- **ISR** : pages de contenu à faible fréquence de mise à jour
- **On-demand revalidation** : webhook Drupal → Next.js `/api/revalidate` à chaque publication
- **Landing pages campagne** : pages ISR avec revalidation manuelle déclenchable depuis Drupal
- **Tracking** : événements analytics déclenchés côté client via `lib/analytics/` (aucun script tiers en SSR pour préserver les Core Web Vitals)

---

## 7. Critères de Qualité

| Critère | Cible |
|---|---|
| Performance Lighthouse (mobile) | Score ≥ 90 |
| Core Web Vitals — LCP | ≤ 2,5 s |
| Core Web Vitals — CLS | ≤ 0,1 |
| Core Web Vitals — INP | ≤ 200 ms |
| Accessibilité | WCAG 2.1 AA |
| Couverture tests composants | ≥ 80% (Storybook + Vitest) |
| Couverture tests e2e | Parcours critiques + parcours conversion couverts |
| TypeScript | Strict mode, 0 `any` non justifié |
| Tracking | 0 événement de conversion perdu (validation via GA4 DebugView) |

---

## 8. Hors Périmètre (v1)

- Authentification utilisateur front-end (espace membre)
- E-commerce
- Application mobile
- Multilingue (à prévoir dans l'architecture mais non implémenté en v1)
- Reconstruction du backend Drupal (existant — extension uniquement)

---

## 9. Glossaire

| Terme | Définition |
|---|---|
| **Distribution Drupal** | Ensemble de modules, configuration et profil d'installation custom |
| **Content Type** | Type de contenu Drupal (équivalent d'un modèle de données) |
| **Paragraph** | Module Drupal permettant la composition de contenu flexible |
| **ISR** | Incremental Static Regeneration — régénération partielle des pages Next.js |
| **Draft Mode** | Fonctionnalité Next.js permettant de contourner le cache pour les previews |
| **Design Token** | Variable de design (couleur, taille, espacement) partagée entre le code et Storybook |
| **OpenAPI** | Spécification standard décrivant les endpoints, paramètres et schémas d'une API REST |
| **Core Web Vitals** | Métriques Google mesurant l'expérience utilisateur réelle (LCP, CLS, INP) |
| **CRM** | Customer Relationship Management — outil de gestion et qualification des leads |
| **Lead** | Contact commercial identifié via un formulaire ou une interaction sur le site |

---

*Ce brief est un document vivant. Toute décision architecturale prise en cours de projet doit être reportée ici et dans `AGENTS.MD`.*