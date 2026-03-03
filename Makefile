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
	cd backend && npm run build

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
