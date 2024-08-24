.PHONY: build run stop

build:
	docker build -t gitlab-mr-scanner-frontend .
	docker build -t gitlab-mr-scanner-backend ./backend

run:
	docker network create gitlab-mr-scanner-network || true
	docker run -d --name gitlab-mr-scanner-backend --network gitlab-mr-scanner-network -p 5000:5000 -e GITLAB_TOKEN=${GITLAB_TOKEN} -e PROJECT_ID=${PROJECT_ID} gitlab-mr-scanner-backend
	docker run -d --name gitlab-mr-scanner-frontend --network gitlab-mr-scanner-network -p 80:80 -e REACT_APP_BACKEND_URL=http://gitlab-mr-scanner-backend:5000 gitlab-mr-scanner-frontend

stop:
	docker stop gitlab-mr-scanner-frontend gitlab-mr-scanner-backend
	docker rm gitlab-mr-scanner-frontend gitlab-mr-scanner-backend
	docker network rm gitlab-mr-scanner-network
