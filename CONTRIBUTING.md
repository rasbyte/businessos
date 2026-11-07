# Contributing

## Setup

1. Install Node.js 26 (see `.node-version`) and pnpm 12.
2. Run `pnpm install`.

## Commands

| Command          | What it does                  |
| ---------------- | ----------------------------- |
| `pnpm dev`       | Start all apps in development |
| `pnpm build`     | Build everything              |
| `pnpm lint`      | Lint with oxlint              |
| `pnpm format`    | Format with Prettier          |
| `pnpm typecheck` | Type-check all packages       |
| `pnpm test`      | Run all tests                 |

## Commit messages

We use Conventional Commits: `type(scope): short description`.

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Scopes: `api`, `web`, `database`, `contracts`, `config`, `docs`, `infra`, `ci`, `deps`.
- Write the description in lowercase, present tense, no full stop.

A Git hook checks the format and formats staged files on every commit.

## Decisions

Technology and design decisions are recorded in `docs/decisions`.

## End-to-end tests

`pnpm --filter @businessos/api test:e2e` runs the API against a real PostgreSQL and Redis, so start them first with `pnpm infra:up` and apply migrations with `pnpm --filter @businessos/database migrate:dev`. CI starts its own services.

## Ports

The API listens on port 3000 and the web app on port 3001 in development.

## Web app settings

The web app reads `API_URL` (default `http://localhost:3000`). To override it locally, put it in `apps/web/.env.local`, which is not committed.
