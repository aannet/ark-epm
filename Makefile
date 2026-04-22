# ARK-EPM Makefile

# Auto-detect container names (Docker Compose v1 uses underscores, v2 uses dashes)
BACKEND_CONTAINER = $(shell docker ps --format '{{.Names}}' | grep -E 'ark.epm.backend.1' | head -1)
POSTGRES_CONTAINER = $(shell docker ps --format '{{.Names}}' | grep -E 'ark.epm.postgres.1' | head -1)

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
	docker exec $(BACKEND_CONTAINER) sh -c "cd /app && rm -rf dist && npm run build"

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
	docker exec $(BACKEND_CONTAINER) sh -c "cd /app && rm -rf dist && npm run build"
	docker restart $(BACKEND_CONTAINER)

backend-logs:
	docker logs $(BACKEND_CONTAINER) -f

db-shell:
	docker exec -it $(POSTGRES_CONTAINER) psql -U arkepm -d arkepm

db-push:
	docker exec $(BACKEND_CONTAINER) npx prisma db push --accept-data-loss

db-generate:
	docker exec $(BACKEND_CONTAINER) npx prisma generate

db-reset-id:
	docker exec $(POSTGRES_CONTAINER) psql -U arkepm -d arkepm -c "ALTER TABLE audit_trail ALTER COLUMN id SET DEFAULT gen_random_uuid();"

db-reset-reseed:
	@echo "⚠️  Resetting all business data (users/roles/permissions preserved)..."
	docker exec $(POSTGRES_CONTAINER) psql -U arkepm -d arkepm -c \
		"TRUNCATE TABLE entity_tags, app_capability_map, app_data_object_map, app_it_component_map, app_provider_map, interfaces, applications, business_capabilities, data_objects, it_components, providers, domains, tag_values, tag_dimensions, audit_trail CASCADE;"
	@echo "✅ Tables cleared. Running seeds..."
	docker exec $(BACKEND_CONTAINER) npx ts-node prisma/seed-all.ts
	@echo "✅ Reseed completed."

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
API_BASE_URL ?= http://localhost:3001
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
	docker restart $(BACKEND_CONTAINER)
	@echo "Validating backend..."
	@echo "Waiting for backend to be ready..."; \
	for i in $$(seq 1 20); do \
		curl -s http://localhost:3001/api/v1/health > /dev/null 2>&1 && break; \
		sleep 2; \
	done
	@TOKEN=$$(./backend/scripts/get-token.sh) && \
	curl -s http://localhost:3001/api/v1/applications -H "Authorization: Bearer $$TOKEN" > /dev/null && \
	echo "✅ Backend validation passed" || \
	{ echo "❌ Backend validation failed"; \
	  echo "  Hint: backend mapped to host port 3001 (docker-compose: 3001:3000)"; \
	  echo "  Check: curl http://localhost:3001/api/v1/health"; \
	  echo "  Check: nothing else occupies port 3000 or 3001 (npx serve, etc.)"; \
	  exit 1; }

project-dashboard:
	@echo "Dashboard disponible sur http://localhost:4000/docs/05-Project/tasks-dashboard/"
	npx serve . --listen 4000

# ----------------------------------------------------------------------------------
# Security scanning with Trivy
TRIVY_IMAGE   ?= aquasec/trivy:latest
TRIVY_TPL      = $(PWD)/trivy/html.tpl
TRIVY_REPORTS  = $(PWD)/reports/trivy

scan-backend:
	@mkdir -p $(TRIVY_REPORTS)
	@echo "Scanning backend image with Trivy..."
	@docker run --rm \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(TRIVY_TPL):/tpl/html.tpl \
		-v $(TRIVY_REPORTS):/reports \
		$(TRIVY_IMAGE) image \
		--format template --template "@/tpl/html.tpl" \
		-o /reports/backend.html \
		ark-epm-backend:latest
	@echo "Report: $(TRIVY_REPORTS)/backend.html"

scan-frontend:
	@mkdir -p $(TRIVY_REPORTS)
	@echo "Scanning frontend image with Trivy..."
	@docker run --rm \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(TRIVY_TPL):/tpl/html.tpl \
		-v $(TRIVY_REPORTS):/reports \
		$(TRIVY_IMAGE) image \
		--format template --template "@/tpl/html.tpl" \
		-o /reports/frontend.html \
		ark-epm-frontend:latest
	@echo "Report: $(TRIVY_REPORTS)/frontend.html"

scan-fs:
	@mkdir -p $(TRIVY_REPORTS)
	@echo "Scanning filesystem with Trivy..."
	@docker run --rm \
		-v $(PWD):/workdir \
		-v $(TRIVY_TPL):/tpl/html.tpl \
		-v $(TRIVY_REPORTS):/reports \
		$(TRIVY_IMAGE) fs \
		--format template --template "@/tpl/html.tpl" \
		-o /reports/fs.html \
		/workdir
	@echo "Report: $(TRIVY_REPORTS)/fs.html"

scan-all: scan-backend scan-frontend scan-fs
	@echo "All reports: $(TRIVY_REPORTS)/"

# ----------------------------------------------------------------------------------
# SAST scanning with Semgrep
SEMGREP_IMAGE   ?= semgrep/semgrep:latest
SEMGREP_REPORTS  = $(PWD)/reports/semgrep
SEMGREP_CONV     = $(PWD)/semgrep/json-to-html.py

semgrep-backend:
	@mkdir -p $(SEMGREP_REPORTS)
	@echo "Scanning backend with Semgrep (TypeScript + Node.js)..."
	@docker run --rm \
		-v $(PWD)/backend:/src \
		-v $(SEMGREP_REPORTS):/reports \
		$(SEMGREP_IMAGE) semgrep scan \
		--config=p/typescript --config=p/nodejs \
		--json --output=/reports/backend.json /src 2>/dev/null || true
	@docker run --rm \
		-v $(SEMGREP_CONV):/to-html.py:ro \
		-v $(SEMGREP_REPORTS):/reports \
		python:3.12-alpine python /to-html.py \
		/reports/backend.json /reports/backend.html "Backend" 2>/dev/null || \
		@echo "⚠️  Semgrep scan completed, but no findings or conversion failed. Check /reports/backend.json"
	@echo "Report: $(SEMGREP_REPORTS)/backend.html"

semgrep-frontend:
	@mkdir -p $(SEMGREP_REPORTS)
	@echo "Scanning frontend with Semgrep (TypeScript + React)..."
	@docker run --rm \
		-v $(PWD)/frontend:/src \
		-v $(SEMGREP_REPORTS):/reports \
		$(SEMGREP_IMAGE) semgrep scan \
		--config=p/typescript --config=p/react \
		--json --output=/reports/frontend.json /src 2>/dev/null || true
	@docker run --rm \
		-v $(SEMGREP_CONV):/to-html.py:ro \
		-v $(SEMGREP_REPORTS):/reports \
		python:3.12-alpine python /to-html.py \
		/reports/frontend.json /reports/frontend.html "Frontend" 2>/dev/null || \
		@echo "⚠️  Semgrep scan completed, but no findings or conversion failed. Check /reports/frontend.json"
	@echo "Report: $(SEMGREP_REPORTS)/frontend.html"

semgrep-all: semgrep-backend semgrep-frontend
	@echo "All Semgrep reports: $(SEMGREP_REPORTS)/"

# ----------------------------------------------------------------------------------
# DAST scanning with ZAProxy (OWASP ZAP)
ZAP_IMAGE       ?= ghcr.io/zaproxy/zaproxy:latest
ZAP_REPORTS     ?= $(PWD)/reports/zap
ZAP_OPENAPI     ?= $(PWD)/docs/04-Tech/openapi.yaml
ZAP_TARGET      ?= http://backend:3000/api/v1

# DAST scan using ZAP API Scan with OpenAPI specification
# -l WARN: fail on Medium+ severity (INFO and LOW pass, MEDIUM and HIGH fail)
# -r: generate HTML report
# -J: generate JSON report
# --hook: authentication hook (optional)
test-dast:
	@echo "🔍 Starting ZAProxy DAST scan..."
	@echo "   Target: $(ZAP_TARGET)"
	@echo "   OpenAPI: $(ZAP_OPENAPI)"
	@mkdir -p $(ZAP_REPORTS)
	@echo "🔍 Checking backend accessibility..."
	@curl -s --fail http://localhost:3001/api/v1/health > /dev/null 2>&1 && echo "✅ Backend is accessible" || { echo "❌ Backend not accessible at http://localhost:3001/api/v1. Is docker-compose up?"; exit 1; }
	@echo "🔍 Preparing OpenAPI spec for ZAP container..."
	@sed 's|http://localhost:3000/api/v1|http://backend:3000/api/v1|g' $(ZAP_OPENAPI) > $(ZAP_REPORTS)/openapi-zap.yaml
	@ZAP_TOKEN=$$(./backend/scripts/get-token.sh 2>/dev/null) || { echo "⚠️  Warning: get-token.sh failed, using fallback token"; ZAP_TOKEN="test-token"; }; \
	docker run --rm \
		-v $(ZAP_REPORTS)/openapi-zap.yaml:/zap/wrk/openapi.yaml:ro \
		-v $(ZAP_REPORTS):/zap/wrk/reports \
		--network ark-epm_default \
		-e ZAP_AUTH_HEADER=Authorization \
		-e ZAP_AUTH_HEADER_VALUE="Bearer $$ZAP_TOKEN" \
		$(ZAP_IMAGE) zap-api-scan.py \
		-t /zap/wrk/openapi.yaml \
		-f openapi \
		-l WARN \
		-r reports/zap-report.html \
		-J reports/zap-report.json \
		-I; \
	ZAP_EXIT=$$?; \
	if [ $$ZAP_EXIT -eq 0 ]; then \
		echo "✅ DAST scan completed. No Medium+ findings."; \
	elif [ $$ZAP_EXIT -eq 1 ]; then \
		echo "⚠️  DAST scan completed with Medium+ findings (exit code 1). Review reports:"; \
	elif [ $$ZAP_EXIT -eq 2 ]; then \
		echo "❌ DAST scan failed with error (exit code 2)."; \
	else \
		echo "❌ DAST scan exited with code $$ZAP_EXIT."; \
	fi; \
	echo "   HTML: $(ZAP_REPORTS)/zap-report.html"; \
	echo "   JSON: $(ZAP_REPORTS)/zap-report.json"; \
	exit $$ZAP_EXIT

# Quick baseline scan (spider only, no active attacks)
# Less thorough but safer for production-like environments
test-dast-baseline:
	@echo "🔍 Starting ZAProxy baseline scan (passive only)..."
	@echo "   Target: $(ZAP_TARGET)"
	@mkdir -p $(ZAP_REPORTS)
	@echo "🔍 Checking backend accessibility..."
	@curl -s --fail http://localhost:3001/api/v1/health > /dev/null 2>&1 && echo "✅ Backend is accessible" || { echo "❌ Backend not accessible at http://localhost:3001/api/v1. Is docker-compose up?"; exit 1; }
	@docker run --rm \
		-v $(ZAP_REPORTS):/zap/wrk/reports \
		--network ark-epm_default \
		$(ZAP_IMAGE) zap-baseline.py \
		-t $(ZAP_TARGET) \
		-l WARN \
		-r reports/baseline-report.html \
		-J reports/baseline-report.json \
		-I; \
	ZAP_EXIT=$$?; \
	if [ $$ZAP_EXIT -eq 0 ]; then \
		echo "✅ Baseline scan completed. No Medium+ findings."; \
	elif [ $$ZAP_EXIT -eq 1 ]; then \
		echo "⚠️  Baseline scan completed with Medium+ findings (exit code 1). Review reports:"; \
	elif [ $$ZAP_EXIT -eq 2 ]; then \
		echo "❌ Baseline scan failed with error (exit code 2)."; \
	else \
		echo "❌ Baseline scan exited with code $$ZAP_EXIT."; \
	fi; \
	echo "   HTML: $(ZAP_REPORTS)/baseline-report.html"; \
	echo "   JSON: $(ZAP_REPORTS)/baseline-report.json"; \
	exit $$ZAP_EXIT

# Open ZAP report in browser
open-dast-report:
	@if [ -f $(ZAP_REPORTS)/zap-report.html ]; then \
		REPORT=$(ZAP_REPORTS)/zap-report.html; \
	elif [ -f $(ZAP_REPORTS)/baseline-report.html ]; then \
		REPORT=$(ZAP_REPORTS)/baseline-report.html; \
	else \
		echo "❌ No ZAP report found in $(ZAP_REPORTS)."; \
		echo "   Run 'make test-dast' or 'make test-dast-baseline' first."; \
		exit 1; \
	fi; \
	if command -v xdg-open >/dev/null 2>&1; then \
		xdg-open "$$REPORT" || echo "📄 Report: $$REPORT (xdg-open failed, no browser available)"; \
	elif command -v open >/dev/null 2>&1; then \
		open "$$REPORT" || echo "📄 Report: $$REPORT (open failed, no browser available)"; \
	else \
		echo "📄 Report: $$REPORT"; \
	fi
