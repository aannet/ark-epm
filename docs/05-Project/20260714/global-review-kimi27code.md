# Global Review — Kimi K2.7 Code

> Audit des AGENTS.md, skills et mécanismes d’activation agents sur ARK-EPM.  
> Date : 2026-07-14

---

## 1. Vue d’ensemble — ce qui fonctionne bien

| Élément | Appréciation |
|---|---|
| **RACI / périmètres** | Très clair. La séparation `back` / `front` / `data` / `qa` / `spec` / `arch` est cohérente avec le fichier racine `AGENTS.md`. |
| **tasks.yaml** | Bien structuré, à jour, utilisé comme coordinateur principal. |
| **Rituels open / close / task-add** | Bons. Les commandes slash `.claude/commands/ark-*.md` encadrent le cycle de travail. |
| **Commandes Makefile** | Centralisées et pratiques. |
| **Anti-patterns** | Bonne idée de capitaliser les erreurs passées dans `AGENTS.md` racine. |
| **Skills caveman** | Installés et prêts à être exploités pour réduire la consommation de tokens. |

---

## 2. Problèmes critiques à corriger d’abord

### 🔴 A. Incohérence MUI v5 / v9 — risque de bug immédiat

- `frontend/package.json` et toutes les specs récentes utilisent **MUI v9** (`@mui/material: ^9.0.0`).
- Mais `.claude/commands/ark-front.md` et `opencode.json:ark-front.prompt` mentionnent encore **MUI v5**.
- **Impact** : un agent front peut générer du code incompatible (`InputProps`, `PaperProps`, etc.) → build cassé, corrections en boucle.
- **Fichiers concernés** : `opencode.json`, `.claude/commands/ark-front.md`.

### 🔴 B. Agents `arch` et `spec` absents des outils d’activation

- Ils sont définis dans `AGENTS.md` racine, mais :
  - absents de `opencode.json`
  - pas de commandes slash `.claude/commands/ark-arch.md` / `ark-spec.md`
- **Impact** : en pratique, ces rôles ne sont pas invoquables proprement ; ils restent théoriques.

### 🟡 C. `SESSION-HANDOFF.md` racine est obsolète

- Dernière mise à jour : **2026-05-06**.
- `tasks.yaml` est plus récent (T-116/T-117 datés du **2026-07-14**).
- **Impact** : les agents qui lisent le handoff racine au démarrage partent sur un contexte figé.

### 🟡 D. Section “Specs existantes” de `docs/AGENTS.md` figée

- Indique FS-05, FS-07, FS-08, FS-09, FS-10 comme `draft`.
- En réalité FS-09, FS-12, FS-13 sont implémentés ou en cours.
- **Impact** : perte de confiance dans la doc, mauvais gates.

### 🟡 E. Les guides AGENTS.md sont très longs

- `AGENTS.md` racine : ~1000 lignes.
- `frontend/AGENTS.md` : 340 lignes.
- `backend/AGENTS.md` : 426 lignes.
- **Impact** : chaque session agent consomme beaucoup de tokens avant de toucher au code. Les skills `caveman-compress` pourraient réduire ce bruit.

---

## 3. Propositions d’amélioration pour accélérer le cycle

### P1 — Aligner la configuration technique (fort impact, faible effort)

| Fichier | Action |
|---|---|
| `opencode.json` | Passer `ark-front` à **MUI v9**. Ajouter `ark-arch` et `ark-spec`. Réduire les prompts aux règles critiques. |
| `.claude/commands/ark-front.md` | Corriger **MUI v5 → v9**. Ajouter les règles v9 les plus fréquentes (`slotProps`, pas de Grid imbriqué). |
| `.claude/commands/` | Créer `ark-arch.md` et `ark-spec.md`. |

### P2 — Créer des “agent cards” compressées (fort impact sur les tokens)

Au lieu de charger les `AGENTS.md` complets à chaque session, créer des fichiers `.claude/context/ark-*.md` très courts (20-40 lignes) contenant :
- périmètre
- 3-5 règles non-négociables
- commande de validation finale
- lien vers le guide complet

Les commandes slash pointeraient vers ces **agent cards** plutôt que vers les `AGENTS.md` entiers.

### P3 — Compresser les guides mémoire avec les skills caveman

Utiliser `/caveman:compress` sur :
- `AGENTS.md` racine
- `frontend/AGENTS.md`
- `backend/AGENTS.md`
- `e2e/AGENTS.md`
- `docs/AGENTS.md`

Cela génère des `.original.md` et réduit l’input token de ~40-50% tout en préservant le sens technique.

### P4 — Synchroniser le handoff racine et la section specs

- Mettre à jour `SESSION-HANDOFF.md` avec l’état réel (S5 en cours, T-116 done, T-117 open, etc.).
- Rafraîchir la table des “Specs existantes” dans `docs/AGENTS.md` (FS-09 done, FS-12/13 ajoutés, etc.).

### P5 — Optimiser les hooks `opencode.json`

Les hooks actuels sont expérimentaux :
- `schema.prisma` : affiche un message, pas d’action concrète.
- `frontend/src/**/*.tsx` : lance `tsc --noEmit` à chaque sauvegarde.

Propositions :
- Garder le hook Prisma mais en faire une vérification explicite avant migration.
- Remplacer le hook tsc par une étape de clôture ou un hook plus léger.

### P6 — Ajouter des “gates de clôture” obligatoires

Dans `ark-close-session.md`, ajouter une checklist selon l’agent :
- `back` : `npm run build` + tests unitaires + tests API concernés
- `front` : `npm run build` + `tsc --noEmit` + mentionner `Ctrl+F5`
- `qa` : tests passent + rapport mis à jour
- `data` : `prisma generate` + migration validée

Cela évite que des tâches passent `done` avec des tests rouges.

---

## 4. Plan d’action recommandé (ordre de priorité)

1. **Corriger `opencode.json` + `ark-front.md`** (MUI v9 + agents `arch`/`spec`) — ~10 min.
2. **Créer `ark-arch.md` et `ark-spec.md`** — ~10 min.
3. **Mettre à jour `SESSION-HANDOFF.md` racine** — ~15 min.
4. **Rafraîchir la section specs de `docs/AGENTS.md`** — ~15 min.
5. **Compresser les 5 `AGENTS.md` avec `/caveman:compress`** — ~10 min.
6. **Créer les agent cards `.claude/context/ark-*.md`** — ~30 min.
7. **Ajouter les gates de clôture dans `ark-close-session.md`** — ~15 min.

---

## 5. Questions / arbitrages restants

1. **Compression caveman** : faut-il compresser les 5 `AGENTS.md` ? Cela crée des `.original.md` et réduit les tokens, mais les fichiers deviennent plus “bruts”.
2. **Agent cards** : faut-il créer des contextes courts `.claude/context/ark-*.md` (20-40 lignes) comme contexte par défaut, tout en gardant les `AGENTS.md` complets comme référence ?
3. **SESSION-HANDOFF.md** : le fichier racine est en lecture seule pour `back/front/data/qa`. Seuls `arch`/`spec` peuvent le modifier. Qui est habilité à le mettre à jour ?

---

*Document généré par OpenCode — Kimi K2.7 Code — 2026-07-14*
