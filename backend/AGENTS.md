# Backend Development Guide

## Quick Troubleshooting

### Problème: P2011 Null constraint violation sur ID

**Symptôme :** `Null constraint violation on the fields: (id)` malgré `@default(dbgenerated())` dans le schéma

**Checklist :**
1. Vérifier la table cible a son DEFAULT:
   ```bash
   docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "\d table_name"
   # Doit afficher: DEFAULT gen_random_uuid()
   ```

2. **⚠️ Vérifier audit_trail.id (SI TRIGGER AUDIT ACTIF) :**
   ```bash
   docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "
     SELECT column_default 
     FROM information_schema.columns 
     WHERE table_name='audit_trail' AND column_name='id';
   "
   ```
   Si NULL ou vide :
   ```bash
   docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "
     ALTER TABLE audit_trail ALTER COLUMN id SET DEFAULT gen_random_uuid();
   "
   ```

**Root cause :** Le trigger `fn_audit_trigger()` tente d'insérer dans `audit_trail` sans ID. Si `audit_trail.id` n'a pas de DEFAULT, l'insertion échoue et l'opération originale (CREATE sur applications/domains/etc.) rollback.

### Workflow Backend Test Rapide

```bash
# 1. Get auth token
TOKEN=$(./scripts/get-token.sh)

# 2. Test POST
 curl -X POST http://localhost:3000/api/v1/ENDPOINT \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"test"}'

# 3. Test GET list
curl http://localhost:3000/api/v1/ENDPOINT \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
```

### Prisma Client Cache Issues

**Symptôme :** Changements schéma non pris en compte malgré `prisma generate`

**Solution :**
```bash
# Force full regeneration
docker exec ark-epm_backend_1 sh -c "rm -rf node_modules/.prisma && npx prisma generate"

# Puis rebuild
docker exec ark-epm_backend_1 sh -c "rm -rf dist && npm run build"
docker restart ark-epm_backend_1
```

### Jest ES6 Import Errors

**Symptôme :** `SyntaxError: Unexpected token 'export'` pour `uuid` ou autres packages ES6

**Solutions :**
1. **Préférer crypto.randomUUID()** (natif Node.js) - pas besoin d'import
2. Ou configurer Jest (package.json) :
   ```json
   "jest": {
     "transformIgnorePatterns": [
       "node_modules/(?!(uuid|other-esm-package)/)"
     ]
   }
   ```

### Validation Pipeline

```bash
# Run this sequence after any backend change:
npm run build          # G-06: TypeScript compilation
npm test -- PATTERN    # G-03: Unit tests  
npm run test:e2e       # G-04: E2E tests (optionnel)
docker restart ark-epm_backend_1  # Deploy

# Quick API test
curl http://localhost:3000/api/v1/health  # ou endpoint healthcheck
```

### Database Schema Verification

```bash
# Vérifier une table spécifique
docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "\d table_name"

# Vérifier les colonnes avec leurs defaults
docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "
  SELECT column_name, column_default, is_nullable 
  FROM information_schema.columns 
  WHERE table_name = 'TABLE_NAME' 
  ORDER BY ordinal_position;
"

# Vérifier les triggers
docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "
  SELECT trigger_name, event_manipulation, action_statement
  FROM information_schema.triggers
  WHERE event_object_table = 'table_name';
"
```

### Convention Checklist

- [ ] `@@map("table_name")` en snake_case
- [ ] `@map("column_name")` pour chaque champ camelCase → snake_case
- [ ] `@default(dbgenerated("gen_random_uuid()"))` pour tous les IDs
- [ ] `@db.Uuid` pour les champs UUID
- [ ] Audit trail ID a DEFAULT gen_random_uuid()
- [ ] `SET LOCAL "ark.current_user_id"` avant chaque write (audit context)
- [ ] Tests Jest avec mocks PrismaService
- [ ] Permissions `[entity]:read` et `[entity]:write` seedées

### Docker Commands Reference

```bash
# Rebuild full stack
docker-compose down && docker-compose up -d --build

# Backend only rebuild
docker exec ark-epm_backend_1 sh -c "rm -rf dist && npm run build"
docker restart ark-epm_backend_1

# Database shell
docker exec -it ark-epm_postgres_1 psql -U arkepm -d arkepm

# Logs
docker logs ark-epm_backend_1 -f
docker logs ark-epm_postgres_1 -f

# Prisma Studio
docker exec ark-epm_backend_1 npx prisma studio
```
