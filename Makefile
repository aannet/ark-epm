# ARK-EPM Makefile

dev:
	cd frontend && npm run dev

dev-clean:
	@fuser -k 5173/tcp 2>/dev/null || true
	@fuser -k 5174/tcp 2>/dev/null || true
	@echo "Starting clean dev server on port 5173..."
	cd frontend && npm run dev

build:
	cd frontend && npm run build
	cd backend && npm run build

build-frontend:
	cd frontend && npm run build

build-backend:
	docker exec ark-epm_backend_1 sh -c "cd /app && rm -rf dist && npm run build"

start-backend:
	cd backend && npm start

start-backend-dev:
	cd backend && npm run start:dev

prisma-studio:
	cd backend && npm run prisma:studio

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-restart:
	docker-compose down && docker-compose up -d

# Backend utilities
backend-rebuild:
	docker exec ark-epm_backend_1 sh -c "cd /app && rm -rf dist && npm run build"
	docker restart ark-epm_backend_1

backend-logs:
	docker logs ark-epm_backend_1 -f

db-shell:
	docker exec -it ark-epm_postgres_1 psql -U arkepm -d arkepm

db-push:
	docker exec ark-epm_backend_1 npx prisma db push --accept-data-loss

db-generate:
	docker exec ark-epm_backend_1 npx prisma generate

db-reset-id:
	docker exec ark-epm_postgres_1 psql -U arkepm -d arkepm -c "ALTER TABLE audit_trail ALTER COLUMN id SET DEFAULT gen_random_uuid();"

get-token:
	@./backend/scripts/get-token.sh

# Test utilities
test-backend:
	cd backend && npm test

test-backend-unit:
	cd backend && npm test -- --testPathPattern='.spec.ts$$' --passWithNoTests

test-backend-e2e:
	cd backend && npm run test:e2e

# Full validation pipeline
validate-backend: build-backend
	docker restart ark-epm_backend_1
	@echo "Validating backend..."
	@sleep 3
	@TOKEN=$$(./backend/scripts/get-token.sh) && \
	curl -s http://localhost:3000/api/v1/applications -H "Authorization: Bearer $$TOKEN" > /dev/null && \
	echo "✅ Backend validation passed" || \
	echo "❌ Backend validation failed"
