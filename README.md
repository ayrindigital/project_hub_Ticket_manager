# ProjectHub

ProjectHub is a monorepo project management app with an AI assistant.

- `apps/api`: NestJS + Prisma + PostgreSQL/pgvector
- `apps/web`: Next.js App Router frontend

## Architecture

- Projects, Tickets, and Comments CRUD
- Embedding pipeline (`/embeddings/sync`, `/embeddings/search`)
- Chat assistant (`/chat`, `/chat/stream`) with tool-calling orchestration (Day 14)
- SSE token streaming to the frontend chat page

## Local Setup

### 1. API

```bash
cd apps/api
cp .env.example .env
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma:seed
pnpm start
```

### 2. Web

```bash
cd apps/web
cp .env.example .env.local
pnpm install
pnpm build
pnpm start
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- API health: `http://localhost:3001/health`

## Docker Setup

From repository root:

```bash
docker compose up --build
```

Services:

- `db` (pgvector): `localhost:5432`
- `api`: `localhost:3001`
- `web`: `localhost:3000`

Notes:

- API runs Prisma migrations on startup.
- Seed script runs automatically only when the database is empty.

## Environment Variables

### API (`apps/api/.env`)

- `DATABASE_URL`: PostgreSQL connection
- `GEMINI_API_KEY`: Gemini key for live LLM calls
- `CHAT_AGENT_OFFLINE`: set `true` to run tool-routing without model calls
- `SEED_ON_STARTUP`: set `true` to auto-seed empty DB at container start

### Web (`apps/web/.env.local`)

- `NEXT_PUBLIC_API_URL`: browser-facing API URL
- `API_INTERNAL_URL`: server-side API URL used by Next.js server components

## Day 15 Completion Summary

- Added production Dockerfiles for API and Web
- Added `docker-compose.yml` with db/api/web services and health checks
- Added API startup orchestration (migrate + conditional seed)
- Hardened frontend API client:
  - internal vs public base URL resolution
  - request timeout and error wrapping
- Updated root/docs/env templates for reproducible setup
