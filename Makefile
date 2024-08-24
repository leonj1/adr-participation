.PHONY: build run

# Default target
.DEFAULT_GOAL := build

# Build Docker images
build:
	docker-compose build

# Run the application
run:
	docker-compose up -d
