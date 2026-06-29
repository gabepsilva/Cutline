COMPOSE := docker compose -f compose.yaml

.DEFAULT_GOAL := help

.PHONY: help dev-up dev-up-d dev-down dev-logs dev-ps dev-migrate dev-rebuild dev-ui dev-shell-app dev-shell-worker

help: ## Show available dev targets
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  %-18s %s\n", $$1, $$2}'

dev-up: ## Start app + worker (foreground)
	$(COMPOSE) up

dev-up-d: ## Start app + worker (detached)
	$(COMPOSE) up -d

dev-down: ## Stop and remove containers
	$(COMPOSE) down

dev-logs: ## Tail all service logs
	$(COMPOSE) logs -f

dev-ps: ## List running dev services
	$(COMPOSE) ps

dev-migrate: ## Run migrations once (same as migrate init service)
	$(COMPOSE) run --rm migrate

dev-rebuild: ## Rebuild dev images (after Dockerfile.dev / lockfile change)
	$(COMPOSE) build --no-cache

dev-ui: ## Open lazydocker TUI (install: pacman -S lazydocker)
	lazydocker

dev-shell-app: ## Shell into the app container
	$(COMPOSE) exec app sh

dev-shell-worker: ## Shell into the worker container
	$(COMPOSE) exec worker sh
