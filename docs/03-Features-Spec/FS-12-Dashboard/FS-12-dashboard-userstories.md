# ARK — User Stories Dashboard d'Accueil (`/`)

_Version 1.0 — Mai 2026 — Statut : draft_

> **Changelog v1.0 :** Refonte complète post-interview de design. Restructuration en 4 zones orientées valeur persona. Remplacement des widgets ad-hoc (apps critiques, activité récente) par une architecture cohérente issue des décisions d'interview. Ajout zone data quality MVP. Suppression des US redondantes.

---

## Contexte & hypothèses structurantes

- **Personas couverts :** Marc (AE) — point de départ de journée · Thierry (CIO) — lecture risque rapide · utilisateurs à périmètre restreint
- **Ambition P1 :** 4 zones orientées valeur : KPIs portfolio · À traiter · Lifecycle · Data quality
- **Filtre domaine :** Auto-filtrage sur les domaines assignés au user connecté via `user_domain_scope` (N:N, table de présence pure). Aucun sélecteur exposé dans le dashboard
- **Convention périmètre :** 0 domaine assigné dans `user_domain_scope` = portée globale (convention implicite, pas de flag)
- **Transport périmètre :** `GET /api/v1/auth/me` au montage de `App.tsx`, résultat stocké dans `AuthContext` avec `domainIds[]`
- **Endpoint backend :** BFF `HomeModule` — `GET /api/v1/home/summary` orchestre 6 appels internes parallèles via `Promise.allSettled()`. Réponse toujours `200`, champs `null` en cas d'erreur partielle
- **Layout V0 (itérable) :** Zone 1 full width → Zone 2 full width → Zones 3 + 4 côte à côte (2/3 + 1/3). Desktop-first, `maxWidth: xl`

---

## Zone 1 — KPIs Portfolio

---

### US-HOME-01 — Bandeau KPIs du patrimoine

**En tant qu'Architecte Entreprise (Marc),**
je veux voir 4 indicateurs clés du patrimoine en un coup d'œil,
afin d'avoir une lecture instantanée de l'état de mon périmètre en moins de 30 secondes.

**Critères d'acceptation :**
- [ ] 4 tuiles affichées dans l'ordre : **Nb applications · % mission-critical · Nb interfaces · Nb capabilities couvertes**
- [ ] **Nb applications** : `COUNT(*)` des applications du périmètre domaine du user
- [ ] **% mission-critical** : `COUNT(criticality = 'mission-critical') / COUNT(criticality IS NOT NULL)` — affiché `"X% (sur Y apps renseignées)"`. Les apps sans criticité renseignée sont exclues du dénominateur
- [ ] **Nb interfaces** : `COUNT(*)` global, non filtré par domaine (entité transverse)
- [ ] **Nb capabilities couvertes** : `COUNT(DISTINCT capability_id) FROM app_capability_map` jointé sur les apps du périmètre — une BC est "couverte" si elle a au moins une application rattachée
- [ ] Si l'utilisateur n'a aucun domaine assigné → les 4 tuiles portent sur la totalité du patrimoine
- [ ] `LoadingSkeleton` affiché pendant le fetch initial
- [ ] En cas d'erreur partielle (champ `null` dans la réponse BFF) → la tuile concernée affiche `—` avec tooltip `t('home.errors.unavailable')`. Les autres tuiles s'affichent normalement
- [ ] Les 4 valeurs proviennent d'un unique appel `GET /api/v1/home/summary`

---

### US-HOME-02 — Navigation depuis une tuile KPI

**En tant qu'Architecte Entreprise (Marc),**
je veux cliquer sur une tuile KPI pour accéder à la liste correspondante,
afin de plonger immédiatement dans le détail sans chercher dans le menu.

**Critères d'acceptation :**
- [ ] Clic tuile Applications → `navigate('/applications')`
- [ ] Clic tuile % mission-critical → `navigate('/applications')`
- [ ] Clic tuile Interfaces → `navigate('/interfaces')`
- [ ] Clic tuile Capabilities couvertes → `navigate('/business-capabilities')`
- [ ] Chaque tuile est visuellement interactive au hover (cursor pointer, élévation légère — conforme F-01)
- [ ] Navigation directe uniquement — pas de drawer, pas de modal

---

## Zone 2 — À traiter

---

### US-HOME-03 — Liste des fiches incomplètes du périmètre

**En tant qu'utilisateur connecté,**
je veux voir les applications de mon périmètre dont les champs structurants sont manquants,
afin d'identifier rapidement ce qui dégrade la qualité des données du patrimoine.

**Critères d'acceptation :**
- [ ] Liste des applications du périmètre domaine du user avec au moins un des 3 champs manquants : `owner_id IS NULL` OU `criticality IS NULL` OU `lifecycle_status IS NULL`
- [ ] Affichage limité à 5 items, triés par `created_at ASC` (les plus anciennes fiches incomplètes en premier)
- [ ] Chaque ligne suit une lecture gauche → droite : contexte métier à gauche, actions de complétion à droite
- [ ] Bloc gauche : nom de l'application (lien vers `/applications/:id`) + sous-titre breadcrumb de la Business Capability (racine → feuille)
- [ ] Si l'application n'a aucune Business Capability rattachée, afficher un fallback neutre (`t('home.todo.incomplete.noBusinessCapability')`)
- [ ] Si l'application a plusieurs Business Capabilities (N:N), afficher celle avec la profondeur la plus élevée ; en cas d'égalité, tie-break stable (nom ASC puis id ASC)
- [ ] Bloc droit : un chip par champ manquant (`"Responsable"`, `"Criticité"`, `"Cycle de vie"`) en style pointillé neutre (sans couleur d'alerte)
- [ ] Si aucune fiche incomplète dans le périmètre → section affichée avec message `t('home.todo.incomplete.empty')`
- [ ] Si l'utilisateur n'a aucun domaine assigné → périmètre global (toutes les apps)
- [ ] Si le user n'a pas la permission `applications:read` → section masquée

---

### US-HOME-04 — Liste des contrats fournisseurs expirant

**En tant qu'utilisateur connecté,**
je veux voir les contrats fournisseurs expirant dans moins de 90 jours pour les fournisseurs liés à mon périmètre applicatif,
afin d'anticiper les renouvellements avant qu'ils deviennent urgents.

**Critères d'acceptation :**
- [ ] Liste des fournisseurs avec `expiry_date IS NOT NULL` ET `expiry_date <= today + 90j`, filtrés via jointure `providers → app_provider_map → applications → domain_id` sur le périmètre du user
- [ ] Affichage limité à 5 items, triés par `expiry_date ASC`
- [ ] Chaque ligne : nom du fournisseur (lien vers `/providers/:id`) + badge délai :
  - `expiry_date <= today + 30j` → badge `error` (rouge) `"Expire dans X jours"`
  - `expiry_date <= today + 90j` → badge `warning` (orange) `"Expire dans X jours"`
- [ ] Un lien "Voir tous les fournisseurs" en footer navigue vers `/providers`
- [ ] Si aucun contrat n'expire dans les 90 jours dans le périmètre → section affichée avec message `t('home.todo.contracts.empty')`
- [ ] Si l'utilisateur n'a aucun domaine assigné → périmètre global (tous les fournisseurs liés à au moins une app)
- [ ] Les fournisseurs sans `expiry_date` sont exclus
- [ ] Si le user n'a pas la permission `providers:read` → section masquée

---

## Zone 3 — Distribution Lifecycle

---

### US-HOME-05 — Bar chart distribution lifecycle

**En tant qu'Architecte Entreprise (Marc) ou DSI (Thierry),**
je veux voir la distribution des applications par statut de cycle de vie,
afin d'évaluer la santé globale du patrimoine applicatif en une lecture.

**Critères d'acceptation :**
- [ ] Bar chart horizontal avec une barre par statut de cycle de vie, dans l'ordre : `draft → in_progress → production → deprecated → retired`
- [ ] Chaque barre : `LinearProgress` MUI, longueur proportionnelle au nombre d'apps dans ce statut
- [ ] Chaque ligne affiche : libellé i18n du statut + `LinearProgress` + valeur `"X apps (Y%)"`
  - X = nombre absolu d'apps dans ce statut dans le périmètre
  - Y = pourcentage sur le total des apps du périmètre (arrondi à l'entier)
- [ ] Les statuts avec 0 app sont affichés avec une barre vide (pas masqués) — la comparaison nécessite les 5 statuts visibles
- [ ] Filtre domaine du user appliqué (périmètre assigné, fallback global)
- [ ] `LoadingSkeleton` affiché pendant le fetch
- [ ] Si aucune application dans le périmètre → message `t('home.lifecycle.empty')`
- [ ] Aucune librairie graphique supplémentaire — MUI uniquement

---

## Zone 4 — Data Quality Score

---

### US-HOME-06 — Gauge de complétude des fiches

**En tant qu'Architecte Entreprise (Marc),**
je veux voir un score de qualité des données du patrimoine applicatif,
afin d'évaluer en un chiffre l'effort de saisie restant et l'exploitabilité du catalogue.

**Critères d'acceptation :**
- [ ] `LinearProgress` MUI affichant `"X / Y applications complètes (Z%)"`
  - Une application est "complète" si `owner_id IS NOT NULL` ET `criticality IS NOT NULL` ET `lifecycle_status IS NOT NULL`
  - X = nb d'apps complètes dans le périmètre · Y = nb total d'apps dans le périmètre · Z = X/Y × 100 (arrondi entier)
- [ ] Couleur dynamique de la `LinearProgress` selon le score :
  - `Z < 50%` → `color="error"` (rouge)
  - `50% ≤ Z < 80%` → `color="warning"` (orange)
  - `Z ≥ 80%` → `color="success"` (vert)
- [ ] Icône `InfoOutlined` MUI à côté du titre de la zone, avec `Tooltip` au hover affichant : `t('home.quality.tooltip')` — clé i18n FR : `"Score calculé sur les applications de votre périmètre ayant un responsable, une criticité et un statut de cycle de vie renseignés"`
- [ ] Filtre domaine du user appliqué (périmètre assigné, fallback global)
- [ ] Si Y = 0 (aucune application dans le périmètre) → afficher `"—"` sans gauge
- [ ] **Lien "Voir les fiches incomplètes" → P2** (conditionné à l'ajout d'un filtre complétude dans FS-06-FRONT)

---

## Zone transverse — États spéciaux & RBAC

---

### US-HOME-07 — Message de bienvenue contextualisé

**En tant qu'utilisateur connecté,**
je veux voir un titre de bienvenue indiquant mon prénom et mon contexte de périmètre,
afin d'avoir une confirmation visuelle immédiate du contexte dans lequel je travaille.

**Critères d'acceptation :**
- [ ] Prénom récupéré depuis `AuthContext` (chargé via `/auth/me` au montage — pas d'appel supplémentaire)
- [ ] Si **1 domaine** assigné : `"Bonjour [Prénom] — [NomDomaine]"`
- [ ] Si **N > 1 domaines** assignés : `"Bonjour [Prénom] — [N] domaines"`
- [ ] Si **0 domaine** assigné (portée globale) : `"Bonjour [Prénom] — Tous les domaines"`
- [ ] `Typography variant="h5"`, sans icône, sans action cliquable

---

### US-HOME-08 — État vide (périmètre sans application)

**En tant qu'utilisateur connecté,**
je veux voir un message d'accompagnement quand mon périmètre ne contient aucune application,
afin de comprendre quoi faire plutôt que de faire face à un dashboard avec des zéros partout.

**Critères d'acceptation :**
- [ ] Si le compteur Applications du périmètre = 0 → affichage d'un `EmptyState` global remplaçant les zones 2, 3 et 4 (la zone 1 reste visible avec ses zéros)
- [ ] `EmptyState` affiche : titre `t('home.empty.title')` + description `t('home.empty.description')` + CTAs conditionnels :
  - `"Importer des données"` → `/admin/import` (visible si `hasPermission('admin:import')`)
  - `"Créer une application"` → `/applications/new` (visible si `hasPermission('applications:write')`)
- [ ] Si aucun CTA visible (user en lecture seule) → message seul, sans CTA
- [ ] Dès qu'au moins 1 application existe dans le périmètre → affichage normal des 4 zones

---

### US-HOME-09 — Attribution des domaines à un utilisateur (admin)

**En tant qu'Administrateur,**
je veux pouvoir assigner un ou plusieurs domaines à un utilisateur depuis la gestion des utilisateurs,
afin de contrôler le périmètre visible par cet utilisateur dans le dashboard et dans toutes les listes.

**Critères d'acceptation :**
- [ ] Page création/édition utilisateur expose un champ multi-select `"Domaines assignés"` (appel `GET /api/v1/domains` pour les options)
- [ ] Sélection vide = portée globale (convention implicite — pas de flag, aucune ligne dans `user_domain_scope`)
- [ ] La sauvegarde met à jour `user_domain_scope` par diff (insertion des nouveaux domaines, suppression des retirés) dans une transaction atomique
- [ ] La liste des domaines assignés est visible en lecture dans la fiche détail de l'utilisateur
- [ ] Seul un utilisateur avec `users:write` peut modifier les domaines assignés
- [ ] La modification est effective au prochain appel `/auth/me` de l'utilisateur cible (rechargement de page ou reconnexion)

---

## Décisions architecturales actées

| Décision | Choix retenu |
|---|---|
| Modèle `user_domain_scope` | Table de présence pure N:N, pas de champ `role` en P1 |
| Sémantique "0 domaine" | Convention implicite = portée globale, pas de flag `is_global_scope` |
| Transport `domainIds[]` | `GET /api/v1/auth/me` au montage `App.tsx`, stocké dans `AuthContext` |
| Endpoint dashboard | BFF `HomeModule` — `GET /api/v1/home/summary` + `Promise.allSettled()` parallèle |
| Erreur partielle BFF | `200` avec champ `null`, card affiche `—` |
| % mission-critical | Numérateur : `criticality = 'mission-critical'` · Dénominateur : `criticality IS NOT NULL` |
| Capabilities couvertes | BC avec ≥ 1 app rattachée via `app_capability_map` |
| Contrats — périmètre | Jointure `providers → app_provider_map → applications → domain_id` |
| Visualisation lifecycle | `LinearProgress` MUI, pas de librairie graphique supplémentaire |
| Data quality — définition | `owner_id + criticality + lifecycle_status` tous non null |
| Data quality — lien action | Différé P2 (filtre complétude inexistant sur FS-06-FRONT) |
| Layout | Zone 1 full width · Zone 2 full width · Zones 3+4 côte à côte (2/3 + 1/3) — V0 itérable |
| Responsive | Desktop-first, `maxWidth: xl`, dégradation mobile non spécifiée en P1 |

---

## Dépendances techniques

| # | Sujet | Nature | Bloque |
|---|---|---|---|
| D-01 | Création table `user_domain_scope` + migration Prisma | Nouveau modèle | Toutes les US |
| D-02 | Endpoint `/auth/me` enrichi avec `domainIds[]` + noms | Amendment FS-01-BACK | US-HOME-07, 08, 09 |
| D-03 | `GET /api/v1/home/summary` — nouveau `HomeModule` NestJS | Nouveau backend | US-HOME-01, 03, 04, 05, 06 |
| D-04 | Filtrage `domainIds` sur `ApplicationsService.count()` | Amendment FS-06-BACK | US-HOME-01, 03, 05, 06 |
| D-05 | Filtrage `domainIds` sur `BusinessCapabilitiesService.count()` | Amendment FS-07-BACK | US-HOME-01 |
| D-06 | Champ multi-select domaines dans la fiche user admin | Amendment FS-01-FRONT | US-HOME-09 |
| D-07 | `expiry_date` sur `providers` | Déjà en base ✅ | — |

---

## Hors périmètre P1 (différé P2)

- Assessments à renouveler dans la zone "À traiter" (dépend FS-06-FRONT stable)
- Lien "Voir les fiches incomplètes" depuis la zone Data Quality (dépend filtre complétude FS-06-FRONT)
- Filtre domaine manuel / sélecteur PNS-08 exposé dans le dashboard
- Comportement responsive mobile spécifié
- Droits différenciés par domaine (`role` dans `user_domain_scope`)
