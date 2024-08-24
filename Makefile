.PHONY: build run down stop

# Default target
.DEFAULT_GOAL := build

# Build Docker images
build:
	docker build -t gitlab-mr-scanner-backend:latest ./backend
	docker build -t gitlab-mr-scanner-frontend:latest ./frontend

# Run the application
run:
	docker-compose up -d

# Stop and remove containers
down stop:
	docker-compose down

# Build and run
build-and-run: build run
