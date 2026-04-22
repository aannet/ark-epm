---
description: Ajouter rapidement une tâche dans tasks.yaml (détection doublon + Q&A guidé)
---

Tu es un planner ARK-EPM. Ajoute une nouvelle tâche dans tasks.yaml via le rituel suivant.

## État actuel de tasks.yaml

@docs/05-Project/tasks.yaml

---

## Étape 1 — Capturer la description

Si l'utilisateur a fourni une description après la commande, utilise-la directement.  
Sinon, demande : **"Décris la tâche à ajouter :"**

Les arguments inline entre crochets pré-remplissent les champs correspondants :
- `[back|front|data|qa|spec|arch]` → `assigned_agent`
- `[bug|impl|spec|debt|doc|poc|test|decision|review]` → `type`
  - `[FS-XX|F-NNN|QA]` → `theme`
  - `[S1|S2|S3|S4]` → `sprint`
  - `[high|medium|low]` → `priorité` (défaut : `medium`)

Exemple : `/ark-task-add Corriger le tri [back] [bug] [high]` → `assigned_agent: back`, `type: bug`, `priorité: high` pré-remplis.

---

## Étape 2 — Vérification des doublons

Parcours **toutes** les entrées de tasks.yaml. Cherche des tâches similaires :
- Même entité / feature concernée (ex : FS-05, IT Components, JWT...)
- Même type de problème (bug de tri, isolation de tests, migration...)
- Même intention sémantique, même si formulée différemment

**Si doublon probable détecté** :
```
⚠ Tâche similaire trouvée :
  T-XXX — "nom de la tâche existante"
  statut: [statut] | assigned_agent: [agent] | theme: [theme]

  [1] Mettre à jour T-XXX avec ces nouvelles informations
  [2] Créer quand même une nouvelle entrée distincte
```
Attends la réponse avant de continuer.

**Si aucun doublon** : indique "Aucun doublon détecté." et passe à l'étape 3.

---

## Étape 3 — Q&A pour les champs manquants

Pour les champs **non pré-remplis** par l'argument inline, présente **tous en une seule fois** :

```
── Champs à confirmer ─────────────────────────────────────
Pour chaque champ, réponds avec le numéro ou tape librement.

1. assigned_agent
   [1] <inféré depuis la description>  ← Recommandé
   [2] <2e choix pertinent>
   [3] <3e choix>

2. type
   [1] <inféré depuis les verbes>  ← Recommandé
   [2] <2e choix>
   [3] <3e choix>

3. theme
   [1] <inféré depuis description>  ← Recommandé
   [2] <thème récent dans tasks.yaml>
   [3] <thème récent dans tasks.yaml>

4. feature
   [1] <dérivé du theme retenu>  ← Recommandé
   [2] <variante back/front selon theme>
   [3] ~

 5. sprint
    [1] <sprint courant dans tasks.yaml>  ← Recommandé
    [2] <sprint suivant>
    [3] <sprint précédent>

 6. priorité
    [1] high
    [2] medium (Recommandé)
    [3] low

 7. notes (optionnel — Entrée pour passer)
    [texte libre ou vide]
```

### Règles de génération des alternatives

| Champ | Logique |
|---|---|
| `assigned_agent` | Inféré depuis la feature/description (FS-XX-FRONT → `front`) ; les 2 autres = agents les plus fréquents dans tasks.yaml |
| `type` | Verbes clés : "corriger/bug/fix" → `bug` ; "implémenter/créer/ajouter" → `impl` ; "migrer/rembourser" → `debt` ; "spec/documenter" → `spec` |
| `theme` | Si FS-XX ou F-NNN dans la description → 1er choix ; sinon les 3 thèmes les plus récents dans tasks.yaml |
| `feature` | Dérivé du theme : FS-05 → FS-05-FRONT / FS-05-BACK / ~ selon `assigned_agent` |
| `sprint` | Sprint courant en 1er (dernier sprint visible dans tasks.yaml), puis +1 et -1 |
| `priorité` | Défaut `medium`. `[high]` / `[medium]` / `[low]` dans les arguments inline |

La date du jour est à déduire depuis le contexte ou demander à l'utilisateur si nécessaire pour `date_resolution`.

---

## Étape 4 — Créer ou mettre à jour l'entrée

### Cas A — Nouvelle entrée

Calcule le prochain ID : lire le dernier `id` dans tasks.yaml, incrémenter de 1, format `T-NNN`.

Crée l'entrée complète :
```yaml
  - id: T-NNN
    nom: "<description fournie par l'utilisateur>"
    statut: open
    assigned_agent: <choix utilisateur>
    session_active: ~
    handoff_ref: ~
    date_resolution: ~
    sprint: <choix utilisateur>
    theme: "<choix utilisateur>"
    type: <choix utilisateur>
    feature: "<choix utilisateur>"
    priorité: medium
    sessions: []
    notes: |
      <notes si fournies, sinon supprimer ce champ>
```

Règle : ajouter l'entrée **à la fin** de tasks.yaml, après la dernière entrée existante.

### Cas B — Mise à jour d'une entrée existante

Modifier **uniquement** les champs apportant de la nouvelle information.  
Ne pas écraser les champs `sessions`, `statut`, `date_resolution` existants.  
Ajouter les nouvelles informations dans `notes` (append, ne pas remplacer).

---

## Règles strictes

- Ne jamais supprimer une entrée existante
- Ne jamais reformater l'intégralité du fichier
- Modifier uniquement les entrées concernées

---

## Sortie finale

```
✓ T-NNN créé : "<nom>"
  assigned_agent: [agent] | type: [type] | theme: [theme] | feature: [feature] | sprint: [sprint]
```

ou

```
✓ T-NNN mis à jour : "<nom>"
  Champs modifiés : [liste]
```
