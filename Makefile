up:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

logs:
	docker compose -f logs -f

down:
	docker compose -f down