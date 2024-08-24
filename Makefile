.PHONY: build run down stop

# Default target
.DEFAULT_GOAL := build

# Build Docker images
build:
	docker-compose build

# Run the application
run:
	docker-compose up -d

# Stop and remove containers
down stop:
	docker-compose down

# Build and run
build-and-run: build run
