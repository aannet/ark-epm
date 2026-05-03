---
description: Ouvrir une session ARK — choisir sa tâche et marquer in_progress
---

Tu es en début de session ARK-EPM. Exécute le rituel d'ouverture suivant.

## Contexte sprint actif

@SESSION-HANDOFF.md

## État actuel de tasks.yaml

@docs/05-Project/tasks.yaml

## Date du jour

!`date +%Y-%m-%d`

## Ton rôle dans cette session

Identifie ton rôle : `back` | `front` | `data` | `qa` | `spec` | `arch`

## Instructions

### Étape 1 — Identifier tes tâches disponibles

Dans tasks.yaml, filtre les tâches qui te concernent :

- `assigned_agent` = ton rôle
- `statut: open` → prête à démarrer
- `statut: in_progress` avec `session_active: ~` → interrompue, à reprendre
- Ignorer : `statut: in_progress` avec `session_active` rempli (autre session active — conflit)
- Ignorer : `statut: blocked` (gate non levée)
- Ignorer : `statut: done`

**P2 — contrôle de traçabilité** : si la tâche cible un ID `FS-09-P2` ou `F-999-*`, vérifie `docs/05-Project/roadmap-crosswalk.md` avant de la verrouiller.

### Étape 2 — Vérifier les gates

Certaines tâches ont des prérequis explicites dans leurs `notes`. Vérifie qu'ils sont levés.
En cas de doute :
- lire la spec correspondante dans `docs/03-Features-Spec/`.
- lire `docs/05-Project/roadmap-crosswalk.md` si c'est une tâche P2.

### Étape 3 — Choisir et verrouiller la tâche

Pour la tâche choisie, modifier tasks.yaml :
- `statut: in_progress`
- `session_active: "<6 premiers caractères hex de ton UUID de session>"`

Règle stricte : modifier UNIQUEMENT les champs `statut` et `session_active` de cette entrée.

### Étape 4 — Charger le contexte

- Lire la Feature Spec correspondante dans `docs/03-Features-Spec/`
- Si `handoff_ref` est renseigné dans la tâche → lire ce fichier pour le contexte de clôture de la session précédente
- Lire `SESSION-HANDOFF.md` (déjà chargé ci-dessus) pour le contexte sprint global

### Sortie attendue

```
Agent     : [back|front|data|qa|spec|arch]
Tâche     : T-XXX — nom
Statut    : in_progress (session_active: xxxxxx)
Gates OK  : oui / non [liste des gates]
Contexte  : [liste des fichiers chargés]
```
