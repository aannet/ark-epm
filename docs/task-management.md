# Instruction — Implémentation du système Task Log ARK

> À injecter dans une session OpenCode dédiée. Tâche autonome, hors feature métier.

---

## Contexte projet

Projet ARK — Enterprise Architecture Management tool.
Stack : NestJS + Prisma + PostgreSQL + React 18 + TypeScript strict + MUI v5.
Repo structure : `backend/`, `frontend/`, `docs/` (sous-dossiers `01-Product/` à `05-Project/`).
Conventions globales : voir `AGENTS.md` à la racine du repo.

---

## Objectif

Implémenter un système de suivi de tâches léger composé de deux artefacts :

1. **`docs/05-Project/tasks.yaml`** — source de vérité, écrite par OpenCode
2. **`docs/05-Project/tasks-dashboard/index.html`** — dashboard standalone, lisible dans le browser sans build step

---

## Artefact 1 — `tasks.yaml`

### Emplacement

```
docs/05-Project/tasks.yaml
```

### Schema d'une entrée

```yaml
tasks:
  - id: T-001
    nom: "Nom court de la tâche"
    statut: open                        # open | done
    date_resolution: ~                  # null si open, sinon YYYY-MM-DD
    sprint: S2                          # S1, S2, ... ou ~ si non assigné
    theme: "FS-06"                      # slug court : nom feature ou domaine
    type: spec                          # spec | decision | review | debt | impl | test | doc | poc
    feature: "FS-06-BACK"              # ID spec ARK ou ~ si transverse
    sessions: []                        # vide si non démarré
    notes: "Description courte"

  - id: T-002
    nom: "Choix dnd-kit vs MUI X"
    statut: done
    date_resolution: "2026-04-05"
    sprint: S1
    theme: "F-03"
    type: decision
    feature: "F-03"
    sessions:
      - tool: OC
        id: "a3f9d1"                    # 6 premiers caractères de l'UUID session
        nom: "dnd-kit decision"
      - tool: CL
        id: "b88c12"
        nom: "archi tags FS-21"
    notes: "Tranché → @dnd-kit (MIT)"
```

### Règles de validation du schema

- `id` : format `T-NNN` (padding 3 chiffres, auto-incrémenté)
- `statut` : strictement `open` ou `done`
- `date_resolution` : `~` (null YAML) si `statut: open`, date ISO sinon
- `type` : valeur dans l'enum `[spec, decision, review, debt, impl, test, doc, poc]`
- `sessions[].tool` : `OC` (OpenCode) ou `CL` (Claude claude.ai)
- `sessions[].id` : string de 6 caractères hexadécimaux (premiers chars UUID session)
- Les champs `sprint`, `feature`, `sessions` acceptent `~` (null)

### Fichier initial à créer

Créer `tasks.yaml` avec un tableau `tasks: []` vide si le fichier n'existe pas encore.

---

## Artefact 2 — `tasks-dashboard/index.html`

### Emplacement

```
docs/05-Project/tasks-dashboard/index.html
```

### Contraintes techniques

- **Zero build step** — fichier unique HTML+JS+CSS, ouvert via `file://` ou `npx serve docs/05-Project/tasks-dashboard`
- **Zero dépendances npm** — les librairies sont chargées via CDN (`cdnjs.cloudflare.com` uniquement)
- **Parsing YAML côté browser** — utiliser `js-yaml` via CDN
- **Chargement du fichier** — lire `../tasks.yaml` via `fetch('../tasks.yaml')` (chemin relatif)
- **Pas de framework** — vanilla JS uniquement (pas de React, pas de Vue)

### Librairies CDN autorisées

```html
<!-- js-yaml pour parser le YAML -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
```

### Vues requises

#### Vue principale — Table

Afficher toutes les tâches dans un tableau avec les colonnes :

| Colonne | Source champ | Rendu |
|---|---|---|
| Statut | `statut` | ✅ checkbox visuelle (non interactive) |
| ID | `id` | texte monospace |
| Nom | `nom` | texte |
| Sprint | `sprint` | badge coloré ou `—` |
| Thème | `theme` | texte |
| Type | `type` | badge coloré selon type |
| Feature | `feature` | texte ou `—` |
| Sessions | `sessions` | liste inline `OC a3f9d1 "nom"` |
| Date résolution | `date_resolution` | date formatée ou `—` |
| Notes | `notes` | texte tronqué à 60 chars avec title complet au hover |

#### Filtres

Barre de filtres au-dessus du tableau :

- **Statut** : `Tous` | `Open` | `Done` — filtre radio ou select
- **Sprint** : select dynamique (valeurs extraites du YAML)
- **Type** : select dynamique (valeurs extraites du YAML)
- **Feature** : select dynamique (valeurs extraites du YAML)
- **Recherche texte** : input free-text, filtre sur `nom` + `notes`

#### Compteurs

En-tête avec compteurs dynamiques (mis à jour selon filtres actifs) :

```
Total : 12  |  Open : 7  |  Done : 5
```

### Design

- Fond sombre (`#1a1a2e` ou similaire) — cohérent avec l'esthétique ARK
- Police monospace pour les IDs et codes sessions
- Badges `type` avec couleurs distinctes par valeur :
  - `spec` → bleu
  - `decision` → violet
  - `review` → orange
  - `debt` → rouge
  - `impl` → vert
  - `test` → cyan
  - `doc` → gris
  - `poc` → jaune
- Badges `sprint` : couleur neutre distincte par sprint
- Tâches `done` : ligne légèrement atténuée (opacity 0.6)
- Responsive minimum : lisible sur écran 1280px+

### Gestion d'erreur

- Si `fetch('../tasks.yaml')` échoue (CORS `file://`) : afficher un message d'aide clair
  ```
  ⚠️ Impossible de charger tasks.yaml via file://.
  Lancer : npx serve docs/05-Project/tasks-dashboard
  puis ouvrir http://localhost:3000
  ```
- Si le YAML est mal formé : afficher l'erreur de parsing

---

## Convention AGENTS.md à ajouter

Après la création des deux artefacts, **ajouter le bloc suivant dans `AGENTS.md`** à la section conventions transverses (ou créer une section `## Task Log` si elle n'existe pas) :

```markdown
## Task Log — Convention d'alimentation

Le fichier `docs/05-Project/tasks.yaml` est la source de vérité du suivi de tâches ARK.

### Quand créer une entrée
Créer une nouvelle entrée à chaque début de tâche significative (spec, décision, implémentation, revue).

### Format d'ID
Lire le dernier `id` dans `tasks.yaml`, incrémenter de 1 avec padding 3 chiffres. Ex : `T-007` → `T-008`.

### Référencer la session courante
Dans le champ `sessions`, ajouter :
- `tool: OC` pour une session OpenCode
- `tool: CL` pour une session Claude (claude.ai)
- `id` : les 6 premiers caractères de l'UUID de session courante
- `nom` : nom court descriptif de la session

### Clôturer une tâche
Quand la tâche est terminée : passer `statut: done` et renseigner `date_resolution` avec la date du jour (YYYY-MM-DD).

### Règle de modification
Ne jamais supprimer une entrée existante. Les corrections se font par mise à jour des champs.
Ne jamais reformater l'intégralité du fichier — modifier uniquement les entrées concernées.
```

---

## Checklist de validation

- [ ] `docs/05-Project/tasks.yaml` créé et valide (parseable par `js-yaml`)
- [ ] Au moins 3 entrées d'exemple dans `tasks.yaml` (mix `open`/`done`, types variés, une avec sessions multiples)
- [ ] `docs/05-Project/tasks-dashboard/index.html` créé
- [ ] Dashboard charge et affiche les tâches via `fetch('../tasks.yaml')`
- [ ] Filtres statut / sprint / type / feature fonctionnels
- [ ] Compteurs mis à jour dynamiquement selon filtres
- [ ] Message d'erreur `file://` affiché si fetch échoue
- [ ] `AGENTS.md` mis à jour avec la convention Task Log
- [ ] Aucune dépendance npm ajoutée (zéro modification de `package.json`)

---

## Ce qu'il ne faut PAS faire

- ❌ Ne pas créer de route dans l'app ARK (NestJS ou React) — le dashboard est standalone
- ❌ Ne pas modifier `schema.prisma` ni créer de migration
- ❌ Ne pas utiliser `localStorage` ou tout autre stockage browser
- ❌ Ne pas créer de backend pour servir le YAML — `fetch` direct sur le fichier statique
- ❌ Ne pas installer de dépendances npm (`package.json` inchangé)
- ❌ Ne pas reformater `tasks.yaml` en entier à chaque mise à jour — modifier uniquement les entrées concernées

---

_Prompt v1.0 — Projet ARK — Système Task Log_