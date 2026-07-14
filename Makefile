# ARK-EPM Makefile
# Comprehensive task automation for development, testing, and security scanning

.PHONY: \
	dev dev-clean dev-local \
	build build-frontend backend-rebuild \
	start-backend start-backend-dev \
	prisma-studio \
	docker-up docker-down docker-restart \
	backend-logs \
	db-shell db-push db-generate db-fix-audit-id db-reseed \
	auth-token \
	test-backend test-backend-unit test-backend-e2e \
	test-e2e test-e2e-local test-e2e-ci test-e2e-report test-e2e-build test-e2e-debug \
	test-api test-api-local test-api-docker test-api-custom test-api-domains test-api-applications test-api-report \
	validate-backend \
	project-dashboard coverage-report coverage-dashboard reports-manifest reports-dashboard \
	scan-trivy-backend scan-trivy-frontend scan-trivy-fs scan-trivy-all \
	scan-semgrep-backend scan-semgrep-frontend scan-semgrep-all \
	scan-zap scan-zap-baseline scan-zap-report \
	scan-megalinter-quality scan-megalinter-config scan-megalinter-frontend scan-megalinter-all scan-megalinter scan-megalinter-report scan-megalinter-frontend-report

# Auto-detect container names (Docker Compose v1 uses underscores, v2 uses dashes)
BACKEND_CONTAINER = $(shell docker ps --format '{{.Names}}' | grep -E 'ark.epm.backend.1' | head -1)
POSTGRES_CONTAINER = $(shell docker ps --format '{{.Names}}' | grep -E 'ark.epm.postgres.1' | head -1)

# Timestamp for report files (YYYYMMDD-HHMMSS)
TIMESTAMP := $(shell date +%Y%m%d-%H%M%S)

# Backend configuration
BACKEND_PORT ?= 3001
E2E_BASE_URL ?= http://localhost:5173
E2E_DOCKER_BASE_URL ?= http://frontend:5173

# ─────────────────────────────────────────────────────────────────────────────
# Development
# ─────────────────────────────────────────────────────────────────────────────

dev:
	@echo "Starting containerized backend + frontend..."
	@docker compose up -d backend frontend || docker-compose up -d backend frontend
	@docker compose ps backend frontend || docker-compose ps backend frontend

dev-clean:
	@echo "Refreshing frontend container (rebuild + fresh volumes)..."
	@docker compose up -d --build --force-recreate --renew-anon-volumes --no-deps frontend || docker-compose up -d --build --force-recreate --renew-anon-volumes --no-deps frontend
	@echo "Waiting for frontend readiness on http://localhost:5173 ..."
	@for i in $$(seq 1 30); do \
		curl -fsS http://localhost:5173 >/dev/null 2>&1 && break; \
		sleep 1; \
		if [ $$i -eq 30 ]; then echo "Frontend did not become ready in time"; exit 1; fi; \
	done
	@curl -I http://localhost:5173

dev-local:
	@fuser -k 5173/tcp >/dev/null 2>&1 || true
	@fuser -k 5174/tcp >/dev/null 2>&1 || true
	@echo "Starting local Vite dev server on port 5173..."
	cd frontend && npm run dev -- --host 0.0.0.0 --port 5173 --strictPort

# ─────────────────────────────────────────────────────────────────────────────
# Build
# ─────────────────────────────────────────────────────────────────────────────

build:
	cd frontend && npm run build
	cd backend && npm run build

build-frontend:
	cd frontend && npm run build

backend-rebuild:
	docker exec $(BACKEND_CONTAINER) sh -c "cd /app && rm -rf dist && npm run build"
	docker restart $(BACKEND_CONTAINER)

# ─────────────────────────────────────────────────────────────────────────────
# Backend (local development)
# ─────────────────────────────────────────────────────────────────────────────

# [legacy] — local only, hors workflow Docker
start-backend:
	cd backend && npm start

# [legacy] — local only, hors workflow Docker
start-backend-dev:
	cd backend && npm run start:dev

# ─────────────────────────────────────────────────────────────────────────────
# Docker infrastructure
# ─────────────────────────────────────────────────────────────────────────────

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-restart:
	docker-compose down && docker-compose up -d

backend-logs:
	docker logs $(BACKEND_CONTAINER) -f

# ─────────────────────────────────────────────────────────────────────────────
# Database & Prisma
# ─────────────────────────────────────────────────────────────────────────────

prisma-studio:
	cd backend && npm run prisma:studio

db-shell:
	docker exec -it $(POSTGRES_CONTAINER) psql -U arkepm -d arkepm

db-push:
	docker exec $(BACKEND_CONTAINER) npx prisma db push --accept-data-loss

db-generate:
	docker exec $(BACKEND_CONTAINER) npx prisma generate

# One-time fix for audit_trail.id DEFAULT constraint
db-fix-audit-id:
	docker exec $(POSTGRES_CONTAINER) psql -U arkepm -d arkepm -c "ALTER TABLE audit_trail ALTER COLUMN id SET DEFAULT gen_random_uuid();"

# Reset and reseed business data (users/roles/permissions preserved)
db-reseed:
	@echo "⚠️  Resetting all business data (users/roles/permissions preserved)..."
	docker exec $(POSTGRES_CONTAINER) psql -U arkepm -d arkepm -c \
		"TRUNCATE TABLE entity_tags, app_capability_map, app_data_object_map, app_it_component_map, app_provider_map, interfaces, applications, business_capabilities, data_objects, it_components, providers, domains, tag_values, tag_dimensions, audit_trail CASCADE;"
	@echo "✅ Tables cleared. Running seeds..."
	docker exec $(BACKEND_CONTAINER) npx ts-node prisma/seed-all.ts
	@echo "✅ Reseed completed."

# ─────────────────────────────────────────────────────────────────────────────
# Authentication
# ─────────────────────────────────────────────────────────────────────────────

auth-token:
	@./backend/scripts/get-token.sh

# ─────────────────────────────────────────────────────────────────────────────
# Tests — Backend
# ─────────────────────────────────────────────────────────────────────────────

test-backend:
	cd backend && npm test

test-backend-unit:
	cd backend && npm test -- --testPathPattern='.spec.ts$$' --passWithNoTests

test-backend-e2e:
	cd backend && npm run test:e2e

# ─────────────────────────────────────────────────────────────────────────────
# Tests — E2E UI (Playwright)
# ─────────────────────────────────────────────────────────────────────────────

test-e2e:
	@echo "🔍 Detecting frontend on $(E2E_BASE_URL) and backend on $(API_BASE_URL)..."
	@if command -v npx >/dev/null 2>&1 && curl -s $(E2E_BASE_URL) >/dev/null 2>&1 && curl -s $(API_BASE_URL)$(API_VERSION)/health >/dev/null 2>&1; then \
		echo "🚀 Local mode (npx)..."; \
		cd e2e && BASE_URL=$(E2E_BASE_URL) API_BASE_URL=$(API_BASE_URL) API_VERSION=$(API_VERSION) API_USER_EMAIL=$(API_USER_EMAIL) API_USER_PASSWORD=$(API_USER_PASSWORD) npx playwright test --project=ui; \
	else \
		echo "🐙 Docker mode (isolated)..."; \
		docker-compose run --rm --no-deps \
			-e BASE_URL=$(E2E_DOCKER_BASE_URL) \
			-e API_BASE_URL=http://backend:3000 \
			-e API_VERSION=$(API_VERSION) \
			-e API_USER_EMAIL=$(API_USER_EMAIL) \
			-e API_USER_PASSWORD=$(API_USER_PASSWORD) \
			playwright npx playwright test --project=ui; \
	fi

test-e2e-local:
	@echo "🚀 Local mode: $(E2E_BASE_URL)"
	cd e2e && BASE_URL=$(E2E_BASE_URL) API_BASE_URL=$(API_BASE_URL) API_VERSION=$(API_VERSION) API_USER_EMAIL=$(API_USER_EMAIL) API_USER_PASSWORD=$(API_USER_PASSWORD) npx playwright test --project=ui

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

# ─────────────────────────────────────────────────────────────────────────────
# Tests — API (Playwright)
# ─────────────────────────────────────────────────────────────────────────────

# Variables configurable via environment or make arguments
API_BASE_URL ?= http://localhost:3001
API_VERSION ?= /api/v1
API_USER_EMAIL ?= admin@ark.io
API_USER_PASSWORD ?= admin123456

# Auto-detection: Uses local npx if Node available and backend responds, otherwise Docker
test-api:
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

# ─────────────────────────────────────────────────────────────────────────────
# Validation
# ─────────────────────────────────────────────────────────────────────────────

validate-backend: backend-rebuild
	@echo "Validating backend..."
	@echo "Waiting for backend to be ready..."; \
	for i in $$(seq 1 20); do \
		curl -s http://localhost:$(BACKEND_PORT)/api/v1/health > /dev/null 2>&1 && break; \
		sleep 2; \
	done
	@TOKEN=$$(./backend/scripts/get-token.sh) && \
	curl -s http://localhost:$(BACKEND_PORT)/api/v1/applications -H "Authorization: Bearer $$TOKEN" > /dev/null && \
	echo "✅ Backend validation passed" || \
	{ echo "❌ Backend validation failed"; \
	  echo "  Hint: backend mapped to host port $(BACKEND_PORT) (docker-compose: $(BACKEND_PORT):3000)"; \
	  echo "  Check: curl http://localhost:$(BACKEND_PORT)/api/v1/health"; \
	  echo "  Check: nothing else occupies port 3000 or $(BACKEND_PORT) (npx serve, etc.)"; \
	  exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
# Miscellaneous
# ─────────────────────────────────────────────────────────────────────────────

project-dashboard:
	@echo "Dashboard disponible sur http://localhost:4000/docs/05-Project/tasks-dashboard/"
	npx serve . --listen 4000

coverage-report:
	@echo "Generating test reports for coverage dashboard..."
	@mkdir -p backend/reports e2e/reports
	@echo "- Jest unit (coverage + json)"
	@cd backend && npm run test:cov -- --json --outputFile=reports/jest-unit-results.json || true
	@echo "- Jest e2e (json)"
	@cd backend && npm run test:e2e -- --json --outputFile=reports/jest-e2e-results.json || true
	@echo "- Playwright (list + html + json reporters)"
	@cd e2e && BASE_URL=$(E2E_BASE_URL) API_BASE_URL=$(API_BASE_URL) API_VERSION=$(API_VERSION) PLAYWRIGHT_JSON_OUTPUT_NAME=reports/results.json npx playwright test --reporter=list,html,json || true
	@echo "- Aggregate dashboard payload"
	@node scripts/aggregate-coverage.js

coverage-dashboard:
	@echo "Coverage dashboard disponible sur http://localhost:4001/docs/05-Project/test-coverage-dashboard/"
	npx serve . --listen 4001

reports-manifest:
	@node scripts/build-reports-manifest.js --analyze

reports-dashboard: reports-manifest
	@echo "Reports dashboard disponible sur http://localhost:4002/docs/05-Project/reports-dashboard/"
	npx serve . --listen 4002

# ─────────────────────────────────────────────────────────────────────────────
# Security Scanning — Trivy (Container & Filesystem)
# ─────────────────────────────────────────────────────────────────────────────

TRIVY_IMAGE   ?= aquasec/trivy:latest
TRIVY_TPL      = $(PWD)/trivy/html.tpl
TRIVY_REPORTS  = $(PWD)/reports/trivy

scan-trivy-backend:
	@mkdir -p $(TRIVY_REPORTS)
	@echo "Scanning backend image with Trivy..."
	@docker run --rm \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(TRIVY_TPL):/tpl/html.tpl \
		-v $(TRIVY_REPORTS):/reports \
		$(TRIVY_IMAGE) image \
		--format template --template "@/tpl/html.tpl" \
		-o /reports/$(TIMESTAMP)-backend.html \
		ark-epm-backend:latest
	@docker run --rm \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(TRIVY_REPORTS):/reports \
		$(TRIVY_IMAGE) image \
		--format json \
		-o /reports/$(TIMESTAMP)-backend.json \
		ark-epm-backend:latest
	@echo "Reports: $(TRIVY_REPORTS)/$(TIMESTAMP)-backend.html and $(TRIVY_REPORTS)/$(TIMESTAMP)-backend.json"

scan-trivy-frontend:
	@mkdir -p $(TRIVY_REPORTS)
	@echo "Scanning frontend image with Trivy..."
	@docker run --rm \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(TRIVY_TPL):/tpl/html.tpl \
		-v $(TRIVY_REPORTS):/reports \
		$(TRIVY_IMAGE) image \
		--format template --template "@/tpl/html.tpl" \
		-o /reports/$(TIMESTAMP)-frontend.html \
		ark-epm-frontend:latest
	@docker run --rm \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(TRIVY_REPORTS):/reports \
		$(TRIVY_IMAGE) image \
		--format json \
		-o /reports/$(TIMESTAMP)-frontend.json \
		ark-epm-frontend:latest
	@echo "Reports: $(TRIVY_REPORTS)/$(TIMESTAMP)-frontend.html and $(TRIVY_REPORTS)/$(TIMESTAMP)-frontend.json"

scan-trivy-fs:
	@mkdir -p $(TRIVY_REPORTS)
	@echo "Scanning filesystem with Trivy..."
	@docker run --rm \
		-v $(PWD):/workdir \
		-v $(TRIVY_TPL):/tpl/html.tpl \
		-v $(TRIVY_REPORTS):/reports \
		$(TRIVY_IMAGE) fs \
		--format template --template "@/tpl/html.tpl" \
		-o /reports/$(TIMESTAMP)-fs.html \
		/workdir
	@docker run --rm \
		-v $(PWD):/workdir \
		-v $(TRIVY_REPORTS):/reports \
		$(TRIVY_IMAGE) fs \
		--format json \
		-o /reports/$(TIMESTAMP)-fs.json \
		/workdir
	@echo "Reports: $(TRIVY_REPORTS)/$(TIMESTAMP)-fs.html and $(TRIVY_REPORTS)/$(TIMESTAMP)-fs.json"

scan-trivy-all: scan-trivy-backend scan-trivy-frontend scan-trivy-fs
	@echo "All Trivy reports: $(TRIVY_REPORTS)/"
	@node scripts/build-reports-manifest.js --analyze

# ─────────────────────────────────────────────────────────────────────────────
# Security Scanning — Semgrep (SAST)
# ─────────────────────────────────────────────────────────────────────────────

SEMGREP_IMAGE   ?= semgrep/semgrep:latest
SEMGREP_REPORTS  = $(PWD)/reports/semgrep
SEMGREP_CONV     = $(PWD)/semgrep/json-to-html.py

scan-semgrep-backend:
	@mkdir -p $(SEMGREP_REPORTS)
	@echo "Scanning backend with Semgrep (TypeScript + Node.js)..."
	@docker run --rm \
		-v $(PWD)/backend:/src \
		-v $(SEMGREP_REPORTS):/reports \
		$(SEMGREP_IMAGE) semgrep scan \
		--config=p/typescript --config=p/nodejs \
		--json --output=/reports/$(TIMESTAMP)-backend.json /src 2>/dev/null || true
	@docker run --rm \
		-v $(SEMGREP_CONV):/to-html.py:ro \
		-v $(SEMGREP_REPORTS):/reports \
		python:3.12-alpine python /to-html.py \
		/reports/$(TIMESTAMP)-backend.json /reports/$(TIMESTAMP)-backend.html "Backend" 2>/dev/null || \
		@echo "⚠️  Semgrep scan completed, but no findings or conversion failed. Check $(SEMGREP_REPORTS)/$(TIMESTAMP)-backend.json"
	@echo "Report: $(SEMGREP_REPORTS)/$(TIMESTAMP)-backend.html"

scan-semgrep-frontend:
	@mkdir -p $(SEMGREP_REPORTS)
	@echo "Scanning frontend with Semgrep (TypeScript + React)..."
	@docker run --rm \
		-v $(PWD)/frontend:/src \
		-v $(SEMGREP_REPORTS):/reports \
		$(SEMGREP_IMAGE) semgrep scan \
		--config=p/typescript --config=p/react \
		--json --output=/reports/$(TIMESTAMP)-frontend.json /src 2>/dev/null || true
	@docker run --rm \
		-v $(SEMGREP_CONV):/to-html.py:ro \
		-v $(SEMGREP_REPORTS):/reports \
		python:3.12-alpine python /to-html.py \
		/reports/$(TIMESTAMP)-frontend.json /reports/$(TIMESTAMP)-frontend.html "Frontend" 2>/dev/null || \
		@echo "⚠️  Semgrep scan completed, but no findings or conversion failed. Check $(SEMGREP_REPORTS)/$(TIMESTAMP)-frontend.json"
	@echo "Report: $(SEMGREP_REPORTS)/$(TIMESTAMP)-frontend.html"

scan-semgrep-all: scan-semgrep-backend scan-semgrep-frontend
	@echo "All Semgrep reports: $(SEMGREP_REPORTS)/"
	@node scripts/build-reports-manifest.js --analyze

# ─────────────────────────────────────────────────────────────────────────────
# Security Scanning — ZAP (DAST)
# ─────────────────────────────────────────────────────────────────────────────

ZAP_IMAGE       ?= ghcr.io/zaproxy/zaproxy:latest
ZAP_REPORTS     ?= $(PWD)/reports/zap
ZAP_OPENAPI     ?= $(PWD)/docs/04-Tech/openapi.yaml
ZAP_TARGET      ?= http://backend:3000/api/v1

# DAST scan using ZAP API Scan with OpenAPI specification
# -l WARN: fail on Medium+ severity (INFO and LOW pass, MEDIUM and HIGH fail)
# -r: generate HTML report
# -J: generate JSON report
# --hook: authentication hook (optional)
scan-zap:
	@echo "🔍 Starting ZAProxy DAST scan..."
	@echo "   Target: $(ZAP_TARGET)"
	@echo "   OpenAPI: $(ZAP_OPENAPI)"
	@mkdir -p $(ZAP_REPORTS)
	@echo "🔍 Checking backend accessibility..."
	@curl -s --fail http://localhost:$(BACKEND_PORT)/api/v1/health > /dev/null 2>&1 && echo "✅ Backend is accessible" || { echo "❌ Backend not accessible at http://localhost:$(BACKEND_PORT)/api/v1. Is docker-compose up?"; exit 1; }
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
		-r reports/$(TIMESTAMP)-zap-report.html \
		-J reports/$(TIMESTAMP)-zap-report.json \
		-I; \
	ZAP_EXIT=$$?; \
	rm -f $(ZAP_REPORTS)/openapi-zap.yaml; \
	if [ $$ZAP_EXIT -eq 0 ]; then \
		echo "✅ DAST scan completed. No Medium+ findings."; \
	elif [ $$ZAP_EXIT -eq 1 ]; then \
		echo "⚠️  DAST scan completed with Medium+ findings (exit code 1). Review reports:"; \
	elif [ $$ZAP_EXIT -eq 2 ]; then \
		echo "❌ DAST scan failed with error (exit code 2)."; \
	else \
		echo "❌ DAST scan exited with code $$ZAP_EXIT."; \
	fi; \
	echo "   HTML: $(ZAP_REPORTS)/$(TIMESTAMP)-zap-report.html"; \
	echo "   JSON: $(ZAP_REPORTS)/$(TIMESTAMP)-zap-report.json"; \
	node scripts/build-reports-manifest.js --analyze || true; \
	exit $$ZAP_EXIT

# Quick baseline scan (spider only, no active attacks)
# Less thorough but safer for production-like environments
scan-zap-baseline:
	@echo "🔍 Starting ZAProxy baseline scan (passive only)..."
	@echo "   Target: $(ZAP_TARGET)"
	@mkdir -p $(ZAP_REPORTS)
	@echo "🔍 Checking backend accessibility..."
	@curl -s --fail http://localhost:$(BACKEND_PORT)/api/v1/health > /dev/null 2>&1 && echo "✅ Backend is accessible" || { echo "❌ Backend not accessible at http://localhost:$(BACKEND_PORT)/api/v1. Is docker-compose up?"; exit 1; }
	@docker run --rm \
		-v $(ZAP_REPORTS):/zap/wrk/reports \
		--network ark-epm_default \
		$(ZAP_IMAGE) zap-baseline.py \
		-t $(ZAP_TARGET) \
		-l WARN \
		-r reports/$(TIMESTAMP)-baseline-report.html \
		-J reports/$(TIMESTAMP)-baseline-report.json \
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
	echo "   HTML: $(ZAP_REPORTS)/$(TIMESTAMP)-baseline-report.html"; \
	echo "   JSON: $(ZAP_REPORTS)/$(TIMESTAMP)-baseline-report.json"; \
	node scripts/build-reports-manifest.js --analyze || true; \
	exit $$ZAP_EXIT

# Open ZAP report in browser
scan-zap-report:
	@REPORT=$$(ls -t $(ZAP_REPORTS)/*.html 2>/dev/null | head -1); \
	if [ -z "$$REPORT" ]; then \
		echo "❌ No ZAP report found in $(ZAP_REPORTS)."; \
		echo "   Run 'make scan-zap' or 'make scan-zap-baseline' first."; \
		exit 1; \
	fi; \
	if command -v xdg-open >/dev/null 2>&1; then \
		xdg-open "$$REPORT" || echo "📄 Report: $$REPORT (xdg-open failed, no browser available)"; \
	elif command -v open >/dev/null 2>&1; then \
		open "$$REPORT" || echo "📄 Report: $$REPORT (open failed, no browser available)"; \
	else \
		echo "📄 Report: $$REPORT"; \
	fi

# ─────────────────────────────────────────────────────────────────────────────
# Security Scanning — MegaLinter (Code Quality)
# ─────────────────────────────────────────────────────────────────────────────

MEGALINTER_IMAGE          ?= oxsecurity/megalinter:v8
MEGALINTER_REPORTS        ?= $(PWD)/reports/megalinter
MEGALINTER_FRONTEND_REPORTS ?= $(PWD)/reports/megalinter-frontend

# Code quality backend: ESLint (backend/src) + duplication (backend/src + frontend/src)
scan-megalinter-quality:
	@echo "🔍 Running MegaLinter — code quality (ESLint + duplication)..."
	@mkdir -p $(MEGALINTER_REPORTS)
	@docker run --rm \
		-v $(PWD):/tmp/lint:ro \
		-v $(MEGALINTER_REPORTS):/reports \
		-e REPORT_OUTPUT_FOLDER=/reports/$(TIMESTAMP) \
		-e DISABLE_ERRORS=false \
		$(MEGALINTER_IMAGE)

# Config/docs lint: YAML, JSON, ENV — separate concern from code quality
scan-megalinter-config:
	@echo "🔍 Running MegaLinter — config & docs lint (YAML, JSON, ENV)..."
	@mkdir -p $(MEGALINTER_REPORTS)
	@docker run --rm \
		-v $(PWD):/tmp/lint:ro \
		-v $(MEGALINTER_REPORTS):/reports \
		-e REPORT_OUTPUT_FOLDER=/reports/$(TIMESTAMP) \
		-e DISABLE_ERRORS=false \
		-e MEGALINTER_CONFIG=.mega-linter-config.yml \
		$(MEGALINTER_IMAGE)

# Code quality frontend: ESLint (frontend/src) + duplication (frontend/src)
scan-megalinter-frontend:
	@echo "🔍 Running MegaLinter — frontend quality (ESLint + duplication)..."
	@mkdir -p $(MEGALINTER_FRONTEND_REPORTS)
	@docker run --rm \
		-v $(PWD):/tmp/lint:ro \
		-v $(MEGALINTER_FRONTEND_REPORTS):/reports \
		-e REPORT_OUTPUT_FOLDER=/reports/$(TIMESTAMP) \
		-e MEGALINTER_CONFIG=.mega-linter-frontend.yml \
		-e DISABLE_ERRORS=false \
		$(MEGALINTER_IMAGE)

# Run both backend and frontend quality checks in sequence
scan-megalinter-all: scan-megalinter-quality scan-megalinter-frontend
	@node scripts/build-reports-manifest.js --analyze

# Alias: runs quality check only (convenience shorthand)
scan-megalinter: scan-megalinter-quality

# Show SUMMARY of latest backend run in console
scan-megalinter-report:
	@DIR=$$(ls -dt $(MEGALINTER_REPORTS)/*/ 2>/dev/null | head -1); \
	if [ -z "$$DIR" ]; then \
		echo "❌ No MegaLinter report found in $(MEGALINTER_REPORTS)."; \
		echo "   Run 'make scan-megalinter' first."; \
		exit 1; \
	fi; \
	echo "📁 Report: $$DIR"; \
	echo ""; \
	grep -A 15 "SUMMARY" "$$DIR/megalinter.log" 2>/dev/null || true; \
	echo ""; \
	if [ -f "$$DIR/megalinter-report.html" ]; then \
		echo "📄 HTML: $${DIR}megalinter-report.html"; \
		xdg-open "$${DIR}megalinter-report.html" 2>/dev/null || true; \
	else \
		echo "📋 Full log: $${DIR}megalinter.log"; \
	fi

# Show SUMMARY of latest frontend run in console
scan-megalinter-frontend-report:
	@DIR=$$(ls -dt $(MEGALINTER_FRONTEND_REPORTS)/*/ 2>/dev/null | head -1); \
	if [ -z "$$DIR" ]; then \
		echo "❌ No MegaLinter frontend report found in $(MEGALINTER_FRONTEND_REPORTS)."; \
		echo "   Run 'make scan-megalinter-frontend' first."; \
		exit 1; \
	fi; \
	echo "📁 Frontend Report: $$DIR"; \
	echo ""; \
	grep -A 15 "SUMMARY" "$$DIR/megalinter.log" 2>/dev/null || true; \
	echo ""; \
	if [ -f "$$DIR/megalinter-report.html" ]; then \
		echo "📄 HTML: $${DIR}megalinter-report.html"; \
		xdg-open "$${DIR}megalinter-report.html" 2>/dev/null || true; \
	else \
		echo "📋 Full log: $${DIR}megalinter.log"; \
	fi
