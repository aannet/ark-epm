# Orchestration Supervisée ARK-EPM

Statut : active

## Objectif

`ark-orchestrator` coordonne les agents ARK sans devenir propriétaire d'une
tâche métier. Cette politique est commune à OpenCode et Claude Code.

## Règles

1. L'orchestrateur est non-mutant : il ne modifie ni code, ni documentation,
   ni `tasks.yaml`.
2. Les tâches restent affectées uniquement à `arch`, `back`, `front`, `data`,
   `qa` ou `spec` dans `tasks.yaml`.
3. Avant une délégation, l'orchestrateur vérifie la tâche, les gates, la spec,
   les handoffs et les dépendances utiles.
4. Il présente un plan contenant l'ID de tâche, le rôle, le périmètre, les
   fichiers probables, les validations et les risques.
5. Une approbation utilisateur explicite est requise avant toute délégation à
   un agent ARK.
6. Une seule délégation mutante est active à la fois. Les analyses en lecture
   seule peuvent être parallélisées si elles ne touchent pas le registre.
7. Les sous-agents ARK ne délèguent jamais à leur tour et ne committent pas.
8. Le rôle métier relit `tasks.yaml` avant toute mutation de son entrée et
   s'arrête si un verrou concurrent est constaté.

## Cycle

```text
Demande utilisateur
  -> qualification et contrôle des gates
  -> plan supervisé
  -> approbation explicite
  -> un agent métier
  -> validations et résultat
  -> proposition de suite ou de clôture
```

L'orchestrateur transmet au rôle métier le plan approuvé, l'ID de tâche et les
validations attendues. Le rôle conserve ses conventions de domaine et le
rituel de session existant.

## Entrées par runtime

| Runtime | Entrée |
|---|---|
| OpenCode | Sélectionner l'agent primaire `ark-orchestrator`. |
| Claude Code | Démarrer `claude --agent ark-orchestrator`. |

Les commandes Claude `/ark-back`, `/ark-front`, `/ark-data`, `/ark-qa`,
`/ark-arch` et `/ark-spec` restent disponibles pour les sessions manuelles.

## Limite connue

Le verrouillage du registre YAML n'est pas atomique. Cette limite est suivie
par T-120. L'exécution unique des délégations mutantes réduit le risque mais
ne remplace pas un verrou transactionnel.
