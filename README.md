# BusinessOS

Multi-business management platform, starting with a rent system for shops and flats in Bangladesh.

## Local development

Requirements: Node.js 26, pnpm 12 and Docker.

```bash
pnpm install
cp .env.example .env
pnpm infra:up
```

This starts PostgreSQL 18 on port 5432 and Redis on port 6379. Stop them with `pnpm infra:down`.
