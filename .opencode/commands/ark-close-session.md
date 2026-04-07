---
description: Clôturer la session ARK — mettre à jour tasks.yaml
---

Tu es en fin de session ARK-EPM. Exécute le rituel de clôture suivant.

## État actuel de tasks.yaml

@docs/05-Project/tasks.yaml

## Date du jour

!`date +%Y-%m-%d`

## Règles du schéma (rappel)

- `id` : format `T-NNN` (padding 3 chiffres, auto-incrémenté depuis le dernier ID)
- `statut` : `open` ou `done`
- `date_resolution` : `~` si open, date ISO `YYYY-MM-DD` si done (utilise la date ci-dessus)
- `type` : `spec | decision | review | debt | impl | test | doc | poc`
- `sessions[].tool` : `OC` pour cette session OpenCode
- `sessions[].id` : 6 caractères hexadécimaux (premiers chars de l'UUID de session)
- `sessions[].nom` : nom court descriptif de ce qui a été fait

## Instructions

1. **Passe en revue** l'historique de cette session : quelles tâches ont été travaillées ou complétées ?

2. **Pour chaque tâche existante dans tasks.yaml touchée durant cette session** :
   - Si complétée → passe `statut: done` + renseigne `date_resolution` avec la date ci-dessus
   - Ajoute une entrée dans `sessions` : `tool: OC`, `id: "<6 chars hex>"`, `nom: "<description courte>"`

3. **Pour chaque nouvelle tâche significative** produite dans cette session et absente de tasks.yaml :
   - Calcule le prochain ID (dernier ID existant + 1, format T-NNN)
   - Crée l'entrée complète avec le bon statut

4. **Règles de modification strictes** :
   - Modifier UNIQUEMENT les entrées concernées — ne jamais reformater l'intégralité du fichier
   - Ne jamais supprimer une entrée existante

5. **En sortie**, liste les changements effectués :
   ```
   T-XXX : [action effectuée]
   T-XXX : [action effectuée]
   ```
