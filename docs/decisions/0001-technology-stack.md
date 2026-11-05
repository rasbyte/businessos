# 0001. Technology stack

Date: 2026-11-05
Status: accepted

## Context

BusinessOS starts as a rent system for shops and flats and must grow into a multi-business SaaS. The first beta has a one month deadline, so we choose current stable versions and avoid anything still in release-candidate state.

## Decision

| Part            | Choice                                       |
| --------------- | -------------------------------------------- |
| Runtime         | Node.js 26 LTS                               |
| Package manager | pnpm 12 with workspaces, Turborepo for tasks |
| API             | NestJS 12                                    |
| Web             | Next.js 16 (App Router), Tailwind CSS 4      |
| Database        | PostgreSQL 18 with Prisma 7                  |
| Queue and cache | Redis with BullMQ                            |
| Language        | TypeScript 6                                 |

## Why not the newest

- Prisma 8 is still a release candidate and its CLI drops schema.prisma, generate and migrate dev. We pin Prisma 7 and move to 8 after it is stable.
- TypeScript 7 has no stable programmatic API until 7.1, which tools such as the NestJS CLI and typescript-eslint rely on. We stay on 6 until 7.1.
- PostgreSQL 19 is a release candidate. We use 18.

## Consequences

All versions are pinned exactly (see saveExact in pnpm-workspace.yaml). Upgrades are deliberate commits.
