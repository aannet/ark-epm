---
description: Clôturer la session ARK — tasks.yaml + archive handoff
---

Tu es en fin de session ARK-EPM. Exécute le rituel de clôture suivant.

## État actuel de tasks.yaml

@docs/05-Project/tasks.yaml

## Schéma tasks.yaml (rappel complet)

```yaml
id: T-NNN                          # padding 3 chiffres, auto-incrémenté
nom: "..."
statut: open | in_progress | done | blocked
assigned_agent: back|front|data|qa|spec|arch   # optionnel
session_active: ~                  # ~ quand aucune session active, 6 hex quand verrou posé
handoff_ref: "chemin/vers/archive" # optionnel — pointe vers l'archive de handoff de clôture
date_resolution: ~                 # ~ si non terminé, YYYY-MM-DD si done
sprint: S1|S2|S3|S4...
theme: "FS-XX" | "QA" | "F-999" | etc.
type: spec|decision|review|debt|impl|test|doc|poc
feature: "FS-XX-BACK"
priorité: high|medium|low
sessions:
  - tool: CL                       # OC = OpenCode, CL = Claude
    id: "a1b2c3"                   # 6 premiers hex de l'UUID de session
    nom: "description courte"
notes: |
  texte libre
```

---

## Étape 1 — Mettre à jour tasks.yaml

1. **Passe en revue** l'historique de cette session.

2. **Pour chaque tâche touchée dans tasks.yaml** :
   - Si **complétée** → `statut: done` + `date_resolution: <date du jour>` + `session_active: ~`
   - Si **non terminée** → `statut: open` + `session_active: ~` (libère le verrou)
   - Ajoute une entrée `sessions[]` : `tool: CL`, `id: "<6 hex>"`, `nom: "<description>"`

3. **Pour chaque nouvelle tâche significative** absente de tasks.yaml :
   - Calcule le prochain ID (dernier existant + 1, format T-NNN)
   - Crée l'entrée complète avec `assigned_agent` et `session_active: ~`

4. **Règles strictes** :
   - Modifier UNIQUEMENT les entrées concernées
   - Ne jamais reformater l'intégralité du fichier
   - Ne jamais supprimer une entrée existante

---

## Étape 2 — Archiver le contexte de session (si pertinent)

Si la session produit un contexte important à transmettre à un autre agent sur la même feature :

1. Crée le fichier d'archive :
   ```
   docs/05-Project/<date-du-jour>/SESSION-HANDOFF-<agent>-<slug>.md
   ```
   Contenu minimal :
   - Ce qui a été fait (décisions, fichiers modifiés)
   - Points d'attention pour la suite
   - Gates validées / restantes

2. Dans tasks.yaml, sur la tâche concernée, ajoute :
   ```yaml
   handoff_ref: "docs/05-Project/<date>/SESSION-HANDOFF-<agent>-<slug>.md"
   ```

---

## Règle de propriété — SESSION-HANDOFF.md (racine)

**IMPORTANT** : Le fichier `SESSION-HANDOFF.md` à la racine du projet est en **lecture seule** pour les agents `back`, `front`, `data`, `qa`.

- Seuls les agents `spec` et `arch` peuvent modifier ce fichier racine.
- Tous les autres agents → écrire dans `docs/05-Project/<date>/` uniquement.
- Si tu es `spec` ou `arch` et que tu dois mettre à jour le baton de sprint : archiver l'ancien (`docs/05-Project/<date>/SESSION-HANDOFF-<slug>.md`) puis écrire le nouveau.

---

## Sortie attendue

```
tasks.yaml :
  T-XXX : statut → done / session_active libéré
  T-XXX : nouvelle entrée créée
  
Handoff archivé : docs/05-Project/<date>/SESSION-HANDOFF-<agent>-<slug>.md
  (ou : aucun handoff archivé cette session)
```
