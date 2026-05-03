.PHONY: up up-build down

up:
	docker compose up -d --remove-orphans

up-build:
	docker compose up --build -d --remove-orphans

down:
	docker compose down --remove-orphans
