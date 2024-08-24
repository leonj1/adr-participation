.PHONY: build run stop

build:
	docker build -t gitlab-mr-scanner .

run:
	docker run -d -p 5000:5000 --name gitlab-mr-scanner-container gitlab-mr-scanner

stop:
	docker stop gitlab-mr-scanner-container
	docker rm gitlab-mr-scanner-container
