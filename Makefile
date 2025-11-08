.PHONY: pre-commit help

help:
	@echo "Available targets:"
	@echo "  pre-commit  - Run pre-commit hooks (type-check and lint)"

pre-commit:
	@echo "Running pre-commit checks..."
	npm run type-check
	npm run lint

