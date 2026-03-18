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

# ----------------------------------------------------------------------------------
# Test utilities
test-backend:
	cd backend && npm test

test-backend-unit:
	cd backend && npm test -- --testPathPattern='.spec.ts$$' --passWithNoTests

test-backend-e2e:
	cd backend && npm run test:e2e

# E2E Tests (Playwright)
test-e2e:
	@echo "Running E2E tests against dev environment..."
	docker-compose run --rm playwright

test-e2e-ci:
	@echo "Running E2E tests in isolated environment..."
	docker-compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit

test-e2e-report:
	@echo "Opening E2E test report..."
	cd e2e && npm run test:report

test-e2e-build:
	@echo "Building Playwright image..."
	docker-compose build playwright

test-e2e-debug:
	@echo "Running E2E tests with debug output..."
	docker-compose run --rm playwright sh -c "npx wait-on http://frontend:5173 http://backend:3000 --timeout 60000 && npm run test:headed"

# API Backend Tests (Playwright) - Strategy: Hybrid Local/Docker
# Variables configurable via environment or make arguments
API_BASE_URL ?= http://localhost:3000
API_VERSION ?= /api/v1
API_USER_EMAIL ?= admin@ark.io
API_USER_PASSWORD ?= admin123456

# Auto-detection: Uses local npx if Node available and backend responds, otherwise Docker
test-api-backend:
	@echo "🔍 Detecting backend on $(API_BASE_URL)..."
	@curl -s $(API_BASE_URL)$(API_VERSION)/health > /dev/null 2>&1 && echo "✅ Backend is accessible" || echo "⚠️  Backend not accessible"
	@if command -v npx >/dev/null 2>&1 && curl -s $(API_BASE_URL)$(API_VERSION)/health > /dev/null 2>&1; then \
		echo "🚀 Local mode (npx)..."; \
		cd e2e && API_BASE_URL=$(API_BASE_URL) API_VERSION=$(API_VERSION) API_USER_EMAIL=$(API_USER_EMAIL) API_USER_PASSWORD=$(API_USER_PASSWORD) npx playwright test --project=api-backend; \
	else \
		echo "🐙 Docker mode (isolated)..."; \
		docker-compose run --rm --no-deps \
			-e API_BASE_URL=$(API_BASE_URL) \
			-e API_VERSION=$(API_VERSION) \
			-e API_USER_EMAIL=$(API_USER_EMAIL) \
			-e API_USER_PASSWORD=$(API_USER_PASSWORD) \
			playwright npx playwright test --project=api-backend; \
	fi

# Explicit local mode - requires Node/npm and backend running locally
test-api-local:
	@echo "🚀 Local mode: $(API_BASE_URL)$(API_VERSION)"
	cd e2e && API_BASE_URL=$(API_BASE_URL) API_VERSION=$(API_VERSION) API_USER_EMAIL=$(API_USER_EMAIL) API_USER_PASSWORD=$(API_USER_PASSWORD) npx playwright test --project=api-backend

# Explicit Docker mode - runs in container without starting frontend
test-api-docker:
	@echo "🐙 Docker mode: http://backend:3000$(API_VERSION)"
	docker-compose run --rm --no-deps \
		-e API_BASE_URL=http://backend:3000 \
		-e API_VERSION=$(API_VERSION) \
		-e API_USER_EMAIL=$(API_USER_EMAIL) \
		-e API_USER_PASSWORD=$(API_USER_PASSWORD) \
		playwright npx playwright test --project=api-backend

# Custom URL mode - for staging, external APIs, etc.
test-api-custom:
	@echo "🔧 Custom mode: $(API_URL)$(API_VERSION)"
	docker-compose run --rm --no-deps \
		-e API_BASE_URL=$(API_URL) \
		-e API_VERSION=$(API_VERSION) \
		-e API_USER_EMAIL=$(API_USER_EMAIL) \
		-e API_USER_PASSWORD=$(API_USER_PASSWORD) \
		playwright npx playwright test --project=api-backend

# Test specific domains or applications
test-api-domains:
	@echo "Running API tests for Domains..."
	@if command -v npx >/dev/null 2>&1 && curl -s $(API_BASE_URL)$(API_VERSION)/health > /dev/null 2>&1; then \
		cd e2e && API_BASE_URL=$(API_BASE_URL) API_VERSION=$(API_VERSION) npx playwright test --project=api-backend --grep "domains"; \
	else \
		docker-compose run --rm --no-deps \
			-e API_BASE_URL=$(API_BASE_URL) \
			-e API_VERSION=$(API_VERSION) \
			playwright npx playwright test --project=api-backend --grep "domains"; \
	fi

test-api-applications:
	@echo "Running API tests for Applications..."
	@if command -v npx >/dev/null 2>&1 && curl -s $(API_BASE_URL)$(API_VERSION)/health > /dev/null 2>&1; then \
		cd e2e && API_BASE_URL=$(API_BASE_URL) API_VERSION=$(API_VERSION) npx playwright test --project=api-backend --grep "applications"; \
	else \
		docker-compose run --rm --no-deps \
			-e API_BASE_URL=$(API_BASE_URL) \
			-e API_VERSION=$(API_VERSION) \
			playwright npx playwright test --project=api-backend --grep "applications"; \
	fi

test-api-report:
	@echo "Opening API test report..."
	cd e2e && npx playwright show-report reports/html

# Full validation pipeline
validate-backend: build-backend
	docker restart ark-epm_backend_1
	@echo "Validating backend..."
	@sleep 3
	@TOKEN=$$(./backend/scripts/get-token.sh) && \
	curl -s http://localhost:3000/api/v1/applications -H "Authorization: Bearer $$TOKEN" > /dev/null && \
	echo "✅ Backend validation passed" || \
	echo "❌ Backend validation failed"
