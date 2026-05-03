.PHONY: up down

up:
	docker compose up --build -d --remove-orphans

down:
	docker compose down --remove-orphans
