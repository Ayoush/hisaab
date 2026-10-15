.PHONY: dev test lint typecheck format clean

dev: install lint typecheck test

install:
	pnpm install

test:
	pnpm test

lint:
	pnpm lint

typecheck:
	pnpm typecheck

format:
	pnpm format

clean:
	rm -rf node_modules packages/*/node_modules packages/*/dist
