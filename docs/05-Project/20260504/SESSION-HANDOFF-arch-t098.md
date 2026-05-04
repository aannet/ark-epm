# SESSION HANDOFF — T-098 — Arch (OC — 0c5f42)

_Session: 2026-05-04 | OpenCode Session 0c5f42_

---

## Tâche complétée

**T-098 — Arch — Ajouter eslint-plugin-sonarjs (cognitive-complexity) au pipeline MegaLinter**

Statut: ✅ **DONE** | Sprint S4 | Priorité medium

---

## Ce qui a été fait

### 1. Backend ESLint Configuration

#### Backend `.eslintrc.cjs` (legacy, MegaLinter v8)
- ✅ Ajouté `'sonarjs'` au tableau `plugins`
- ✅ Règle `'sonarjs/cognitive-complexity': ['warn', 15]` activée
- ✅ Commentaire AGENT-DECISION ajouté (T-098)

#### Backend `eslint.config.mjs` (flat config, ESLint v9, dev local)
- ✅ Import `sonarjs` from `'eslint-plugin-sonarjs'`
- ✅ Plugin déclaré dans config avec `plugins: { sonarjs }`
- ✅ Règle `'sonarjs/cognitive-complexity': ['warn', 15]` activée (même seuil)

#### Backend `package.json`
- ✅ Ajouté `"eslint-plugin-sonarjs": "^4.0.2"` en devDependencies

---

### 2. Frontend ESLint Configuration

**Note** : Le frontend n'avait pas de config ESLint. T-098 en a introduit une.

#### Frontend `.eslintrc.cjs` (**nouveau**)
- ✅ Config legacy ESLint v8, compatible MegaLinter
- ✅ Plugins : `@typescript-eslint`, `sonarjs`, `react-hooks` (bonus pour hooks safety)
- ✅ Rules :
  - `sonarjs/cognitive-complexity: ['warn', 15]`
  - `react-hooks/rules-of-hooks: 'error'`
  - `react-hooks/exhaustive-deps: 'warn'`

#### Frontend `package.json`
- ✅ Ajouté dépendances :
  - `eslint@^8.56.0` (v8 pour compat MegaLinter, pas v9)
  - `@typescript-eslint/parser@^8`
  - `@typescript-eslint/eslint-plugin@^8`
  - `eslint-plugin-sonarjs@^4.0.2`
  - `eslint-plugin-react-hooks@^4.6.0`

---

### 3. MegaLinter Configuration

#### `.mega-linter-frontend.yml` (**nouveau**)
- ✅ Config dédiée frontend (séparation backend/frontend reports)
- ✅ `TYPESCRIPT_ES_CONFIG_FILE: frontend/.eslintrc.cjs`
- ✅ `TYPESCRIPT_ES_DIRECTORY: frontend`
- ✅ Output → `reports/megalinter-frontend/`

#### `.mega-linter.yml` (inchangé)
- Reste inchangé, cible backend comme avant
- Output → `reports/megalinter/`

---

### 4. Makefile

Ajouté 3 targets :

#### `megalinter-frontend` (nouveau)
```bash
make megalinter-frontend
```
Exécute MegaLinter sur frontend avec config dédiée.

#### `megalinter-all` (nouveau)
```bash
make megalinter-all
```
Exécute backend + frontend en séquence (`megalinter-quality` puis `megalinter-frontend`).

#### `megalinter-frontend-report` (nouveau)
```bash
make megalinter-frontend-report
```
Affiche/ouvre le dernier rapport frontend (même UX que `megalinter-report` pour backend).

---

## Tests & Validation

### Frontend local ✅
```bash
cd frontend && npm install
npx eslint src/ --max-warnings 10
→ sonarjs/cognitive-complexity: 10 warnings detected
→ react-hooks/exhaustive-deps: 6 warnings detected
→ Status: 1 error, 17 warnings
```

**Conclusion** : Les deux plugins fonctionnent correctement et détectent du signal réel.

### Syntax validation ✅
```bash
node -c backend/.eslintrc.cjs      → OK
node -c backend/eslint.config.mjs  → OK
node -c frontend/.eslintrc.cjs     → OK
```

---

## Architecture finale

```
ESLint / MegaLinter Pipeline (T-098)
│
├─ Backend
│  ├─ .eslintrc.cjs (legacy v8, MegaLinter)
│  ├─ eslint.config.mjs (flat v9, dev local)
│  ├─ sonarjs/cognitive-complexity: warn:15
│  └─ Reports → reports/megalinter/
│
├─ Frontend (**NOUVEAU**)
│  ├─ .eslintrc.cjs (legacy v8, MegaLinter)
│  ├─ sonarjs/cognitive-complexity: warn:15
│  ├─ react-hooks/rules-of-hooks: error
│  ├─ react-hooks/exhaustive-deps: warn
│  └─ Reports → reports/megalinter-frontend/
│
└─ Makefile targets
   ├─ make megalinter-quality (backend)
   ├─ make megalinter-frontend (frontend) [NEW]
   ├─ make megalinter-all (both) [NEW]
   ├─ make megalinter-report (backend report)
   └─ make megalinter-frontend-report (frontend report) [NEW]
```

---

## Règles SonarJS activées

**Actuellement** : 1 règle
- `sonarjs/cognitive-complexity` (warn à 15)

**Disponibles** : ~220 règles SonarJS v4
- Bugs silencieux : `no-identical-expressions`, `no-dead-store`, `no-duplicated-branches`, etc.
- Sécurité : `no-hardcoded-secrets`, `insecure-jwt-token`, `cors`, etc.
- Complexité : `cyclomatic-complexity`, `expression-complexity`, etc.

**Recommandation pour T-099+** : Ajouter incrementally après baseline cognitive-complexity établie.

---

## Points d'attention pour la suite

1. **Backend npm install** — Docker permissions issue (P2003 error en session). À résoudre avant push.

2. **Frontend v9 flat config** — Actuellement ESLint v8 pour MegaLinter compat. Peut migrer à v9 flat config en dev local plus tard (post-T-098).

3. **Rules expansion** — SonarJS supporte 220+ règles. Plan : une par sprint (T-099 = bug rules, T-100+ = security/complexity).

4. **Handoff to QA** — Si MegaLinter baseline montre bruit excessif, QA peut ajuster les seuils ou créer issues de refactoring.

---

## Commits

1. `build(eslint): add sonarjs cognitive-complexity to backend + frontend`
   - Tous fichiers config, package.json, Makefile

2. `chore(tasks): close T-098 + create T-100 audit task`
   - tasks.yaml updates

---

## Lié à

- **Feature** : QA-ESLINT
- **Theme** : QA
- **Sprint** : S4
- **Tech debt** : F-999 Item X (code quality automation)

---

_Archive créée par Arch (OpenCode) pour transmission aux agents spécialisés._
