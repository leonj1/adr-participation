.PHONY: build up down logs clean install-deps start-dev

# Build Docker images
build:
	docker-compose build

# Start the application in detached mode
up:
	docker-compose up -d

# Stop and remove containers, networks
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Remove all build artifacts, node_modules, etc.
clean:
	rm -rf frontend/node_modules backend/node_modules
	rm -rf frontend/build backend/build
	docker-compose down -v

# Install dependencies for local development
install-deps:
	cd frontend && npm install
	cd backend && npm install

# Start the application in development mode
start-dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Build for production
build-prod:
	docker-compose build

# Run in production mode
run-prod:
	docker-compose up -d

# Stop production services
stop-prod:
	docker-compose down

# Show help
help:
	@echo "Available targets:"
	@echo "  build        - Build Docker images"
	@echo "  up           - Start the application in detached mode"
	@echo "  down         - Stop and remove containers, networks"
	@echo "  logs         - View logs"
	@echo "  clean        - Remove all build artifacts, node_modules, etc."
	@echo "  install-deps - Install dependencies for local development"
	@echo "  start-dev    - Start the application in development mode"
	@echo "  build-prod   - Build for production"
	@echo "  run-prod     - Run in production mode"
	@echo "  stop-prod    - Stop production services"
	@echo "  help         - Show this help message"
