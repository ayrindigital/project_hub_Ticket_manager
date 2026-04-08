# ProjectHub Master Guide (Day-Wise + Complete Fresher Handbook)


1. What this project is
2. What was completed each day (Day 1 to Day 15)
3. How each module/file fits into the system
4. How to run and test everything end to end

---

## 0) Project Summary

ProjectHub is a full-stack project management app with AI features.

Core features:

- Projects CRUD
- Tickets CRUD (inside projects)
- Comments CRUD (inside tickets)
- Embedding pipeline for project data
- Chat assistant with sources
- Streaming chat responses (SSE)
- Tool-calling style agent behavior in chat
- Dockerized run path

Tech stack:

- Frontend: Next.js (App Router), React, Tailwind
- Backend: NestJS, Prisma
- Database: PostgreSQL + pgvector
- AI: Gemini APIs (with offline fallback mode)

---

## 1) Day-Wise Detailed Explanation (What We Did)

This section explains exactly what was done day by day.

## Day 1 - Setup + NestJS Base

### Goal
Set up backend foundation and confirm server health.

### Implemented
- NestJS app scaffold in `apps/api`
- Core app module/controller/service wiring
- `GET /health` endpoint
- Global bootstrap started from `src/main.ts`

### Why this matters
Everything depends on having a stable backend process with known entrypoint and a health check.

### Main files
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/app.controller.ts`
- `apps/api/src/app.service.ts`

### Test done
- `GET /health` -> `{ status: "ok" }` envelope response

---

## Day 2 - Projects CRUD (Module Pattern)

### Goal
Create first real domain module with validation and CRUD flow.

### Implemented
- `ProjectsModule`, `ProjectsController`, `ProjectsService`
- DTO validation for project create/update
- Endpoints:
  - `POST /projects`
  - `GET /projects`
  - `GET /projects/:id`
  - `PATCH /projects/:id`
  - `DELETE /projects/:id` (archive behavior)

### Why this matters
Introduces NestJS architecture pattern used for all other domains.

### Main files
- `apps/api/src/projects/projects.module.ts`
- `apps/api/src/projects/projects.controller.ts`
- `apps/api/src/projects/projects.service.ts`
- `apps/api/src/projects/dto/create-project.dto.ts`
- `apps/api/src/projects/dto/update-project.dto.ts`

### Test done
Project create/list/get/update/archive through API.

---

## Day 3 - PostgreSQL + Prisma Integration

### Goal
Move from temporary storage to persistent relational storage.

### Implemented
- Prisma setup and DB connection
- `Project` model in Prisma schema
- Migration workflow introduced
- `PrismaService` + `PrismaModule`
- Projects service switched to Prisma queries

### Why this matters
Data now survives restart and forms the base for relations.

### Main files
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260315185433_init/migration.sql`
- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/src/prisma/prisma.module.ts`

### Test done
Created projects persisted in PostgreSQL after restart.

---

## Day 4 - Tickets Module + Relations

### Goal
Add second domain with relation to projects and filtering/sorting.

### Implemented
- `Ticket` model + enums for status/priority
- Ticket CRUD endpoints and relation checks
- Filters and sorting support in query params
- Project existence checks before ticket operations

### Endpoints
- `POST /projects/:projectId/tickets`
- `GET /projects/:projectId/tickets`
- `GET /tickets`
- `GET /tickets/:id`
- `PATCH /tickets/:id`
- `DELETE /tickets/:id`

### Main files
- `apps/api/src/tickets/tickets.module.ts`
- `apps/api/src/tickets/tickets.controller.ts`
- `apps/api/src/tickets/tickets.service.ts`
- `apps/api/src/tickets/dto/create-ticket.dto.ts`
- `apps/api/src/tickets/dto/update-ticket.dto.ts`
- `apps/api/prisma/migrations/20260315192207_add_tickets_comments/migration.sql`

### Test done
Tickets created under valid projects, filtered by status/priority.

---

## Day 5 - Comments Module + Seed Data

### Goal
Complete backend CRUD chain and add realistic data.

### Implemented
- `Comment` model and relations
- Comment CRUD endpoints
- Seed script with realistic multi-project ticket/comment data

### Endpoints
- `POST /tickets/:ticketId/comments`
- `GET /tickets/:ticketId/comments`
- `PATCH /comments/:id`
- `DELETE /comments/:id`

### Main files
- `apps/api/src/comments/comments.module.ts`
- `apps/api/src/comments/comments.controller.ts`
- `apps/api/src/comments/comments.service.ts`
- `apps/api/src/comments/dto/create-comment.dto.ts`
- `apps/api/src/comments/dto/update-comment.dto.ts`
- `apps/api/prisma/seed.js`

### Test done
End-to-end chain verified: project -> ticket -> comment.

---

## Day 6 - Next.js Frontend Scaffold

### Goal
Start UI and connect to backend read operations.

### Implemented
- Next.js app structure
- Root layout + sidebar
- Dashboard route with project listing from API
- Shared API client (`lib/api.ts`)

### Main files
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/components/Sidebar.tsx`
- `apps/web/lib/api.ts`

### Test done
Dashboard loads projects from API.

---

## Day 7 - Projects UI CRUD

### Goal
Enable complete project lifecycle from UI.

### Implemented
- Project creation page/form
- Project edit/archive controls
- Dashboard filters (search + status)

### Main files
- `apps/web/app/projects/new/page.tsx`
- `apps/web/components/ProjectForm.tsx`
- `apps/web/components/ProjectDetailActions.tsx`
- `apps/web/components/DashboardFilters.tsx`
- `apps/web/components/ProjectCard.tsx`

### Test done
Create/edit/archive projects through browser.

---

## Day 8 - Tickets UI (Board + CRUD)

### Goal
Build ticket management workflow in project page.

### Implemented
- Ticket board grouped by status
- Create/edit/delete ticket flows
- Priority/status updates
- Sorting/filtering controls

### Main file
- `apps/web/components/TicketBoard.tsx`

### Test done
Full ticket operations via UI with immediate updates.

---

## Day 9 - Comments UI + Activity

### Goal
Complete UI chain with comments and activity context.

### Implemented
- Comments list/create/edit/delete UI
- Ticket comment counts and update indicators

### Main file
- `apps/web/components/TicketComments.tsx`

### Test done
Comments managed directly from ticket detail panel.

---

## Day 10 - Embeddings Foundation

### Goal
Introduce vector storage and semantic search base.

### Implemented
- `Embedding` model in Prisma
- pgvector migration setup
- embedding test script

### Main files
- `apps/api/prisma/migrations/20260329090000_add_embeddings/migration.sql`
- `apps/api/scripts/test-embeddings.ts`
- `apps/api/scripts/pgvector-example.sql`

### Test done
Vector generation and similarity operations tested.

---

## Day 11 - Embedding Pipeline + Auto Sync

### Goal
Convert structured project data into searchable embeddings continuously.

### Implemented
- Embedding service to sync per project/all projects
- Search endpoint for semantic lookup
- Event listener + event emission from CRUD modules

### Endpoints
- `POST /embeddings/sync`
- `POST /embeddings/sync/:projectId`
- `GET /embeddings/search?q=...`

### Main files
- `apps/api/src/embeddings/embeddings.module.ts`
- `apps/api/src/embeddings/embeddings.controller.ts`
- `apps/api/src/embeddings/embeddings.service.ts`
- `apps/api/src/embeddings/embeddings.listener.ts`
- `apps/api/src/embeddings/embedding.events.ts`

### Test done
Data sync and semantic search working on seeded content.

---

## Day 12 - Chat Endpoint (RAG Backend)

### Goal
Answer user questions from project data with persisted history.

### Implemented
- Chat module with non-stream response endpoint
- Session-based chat history storage
- Source references attached to responses

### Endpoints
- `POST /chat`
- `GET /chat/history/:sessionId`
- `DELETE /chat/history/:sessionId`

### Main files
- `apps/api/src/chat/chat.module.ts`
- `apps/api/src/chat/chat.controller.ts`
- `apps/api/src/chat/chat.service.ts`
- `apps/api/src/chat/dto/create-chat.dto.ts`

### Test done
Chat responses and history persisted correctly.

---

## Day 13 - Streaming Chat UI + SSE

### Goal
Real-time token streaming to frontend chat page.

### Implemented
- Backend SSE streaming endpoint
- Frontend streaming parser and live token rendering
- Session-aware chat UI with source links

### Endpoint
- `POST /chat/stream`

### Main files
- `apps/api/src/chat/chat.controller.ts` (stream route)
- `apps/web/app/chat/page.tsx`

### Test done
Streaming tokens and final source payload received in UI.

---

## Day 14 - Agentic Chat (Tool-Calling Style)

### Goal
Upgrade chat from plain retrieval to tool-based decision flow.

### Implemented
- Agent loop in `ChatService`
- Tool actions:
  - `search_projects`
  - `get_project_details`
  - `get_ticket_details`
  - `list_tickets`
  - `get_project_stats`
- Source merge/dedupe logic
- Offline-safe mode with deterministic fallback behavior

### Main file
- `apps/api/src/chat/chat.service.ts`

### Test done
Tool-driven paths and streamed responses validated.

---

## Day 15 - Docker + Robustness + Docs

### Goal
Make project reproducible, deployable, and safer for real usage.

### Implemented
- API Dockerfile
- Web Dockerfile
- `docker-compose.yml` with db/api/web and healthchecks
- API startup script: migrate + conditional seed + start
- Web API client robustness improvements:
  - internal/public API URL resolution
  - timeout + normalized errors
- Root README and env examples improved

### Main files
- `docker-compose.yml`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `apps/api/docker/start.sh`
- `apps/web/lib/api.ts`
- `README.md`

### Test done
Builds + runtime smoke checks + compose config validation completed.

---

## 2) Current Status Snapshot

- Day 1 to Day 15 functionality implemented
- Full local build passing (API + Web)
- Runtime checks passing for core routes and chat stream
- Live LLM behavior depends on valid Gemini API key

---

## 3) Complete Project Structure (What Each Part Means)

## Root

- `README.md`: overall guide
- `package.json`: root package metadata
- `docker-compose.yml`: container orchestration
- `apps/`: backend + frontend
- `plan/`: original internship plan document

## Backend folder (`apps/api`)

### Setup/config
- `package.json`: scripts/dependencies
- `tsconfig.json`: TS compile config
- `nest-cli.json`: Nest build config
- `.env`, `.env.example`: environment setup
- `Dockerfile`: backend container image
- `.dockerignore`: docker build exclude rules
- `EXPLANATION.md`: this guide

### Runtime bootstrap
- `src/main.ts`: app start, CORS, global pipes/interceptors/filters
- `src/app.module.ts`: imports all feature modules
- `src/app.controller.ts`: health endpoint
- `src/app.service.ts`: simple service

### Common infrastructure
- `src/common/interceptors/response.interceptor.ts`: unified success response shape
- `src/common/filters/api-exception.filter.ts`: unified error shape

### Prisma layer
- `src/prisma/prisma.module.ts`: exports Prisma globally
- `src/prisma/prisma.service.ts`: DB client lifecycle

### Domain modules
- Projects: `src/projects/*`
- Tickets: `src/tickets/*`
- Comments: `src/comments/*`
- Embeddings: `src/embeddings/*`
- Chat: `src/chat/*`

### DB schema/migrations
- `prisma/schema.prisma`: all models/enums/relations
- `prisma/migrations/*`: schema evolution history
- `prisma/seed.js`: sample dataset

### Utility scripts
- `scripts/test-embeddings.ts`: embedding functionality check
- `scripts/pgvector-example.sql`: SQL reference for vectors

### Docker startup helper
- `docker/start.sh`: migrate + optional seed + start

## Frontend folder (`apps/web`)

### Setup/config
- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`
- `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`
- `Dockerfile`, `.dockerignore`

### App routes
- `app/layout.tsx`: root UI shell
- `app/page.tsx`: dashboard
- `app/projects/new/page.tsx`: new project
- `app/projects/[projectId]/page.tsx`: project details
- `app/chat/page.tsx`: chat UI + SSE handling
- `app/loading.tsx`, route loading files

### Components
- `components/Sidebar.tsx`
- `components/ProjectCard.tsx`
- `components/DashboardFilters.tsx`
- `components/ProjectForm.tsx`
- `components/ProjectDetailActions.tsx`
- `components/TicketBoard.tsx`
- `components/TicketComments.tsx`

### API integration
- `lib/api.ts`: typed request wrappers and endpoint helpers

---

## 4) How to Run Everything (Exact Commands)

## 4.1 Backend local run

```bash
cd apps/api
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma:seed
pnpm start
```

## 4.2 Frontend local run

```bash
cd apps/web
pnpm install
pnpm build
pnpm start
```

## 4.3 Docker full stack

```bash
# from repo root
docker compose up --build
```

## 4.4 Useful checks

```bash
# API build
cd apps/api
pnpm run build

# Web build
cd apps/web
pnpm run build

# Compose validation
# from root
docker compose config
```

---

## 5) What You Can Test (Manual Full Checklist)

## 5.1 API health + basics

1. `GET /health`
2. `GET /projects`
3. `GET /tickets?status=IN_PROGRESS`

## 5.2 Complete CRUD chain

1. Create project -> `POST /projects`
2. Create ticket under that project -> `POST /projects/:projectId/tickets`
3. Add comment -> `POST /tickets/:ticketId/comments`
4. Update project/ticket/comment
5. Delete/archive operations

## 5.3 Embedding flow

1. `POST /embeddings/sync`
2. `GET /embeddings/search?q=payment&limit=5`

## 5.4 Chat flow

1. `POST /chat` with `sessionId`
2. `GET /chat/history/:sessionId`
3. `POST /chat/stream` and verify `token` + final `done:true`
4. `DELETE /chat/history/:sessionId`

## 5.5 Frontend flow

1. Open `/` dashboard
2. Create new project from UI
3. Go to project page
4. Create/update/delete ticket
5. Create/update/delete comment
6. Open `/chat`, send prompt, watch streaming tokens
7. Verify source links navigate back to relevant pages

---

## 6) How to Use Offline vs Live AI Modes

## Live mode (real model)
- Set valid `GEMINI_API_KEY` in `apps/api/.env`
- Keep `CHAT_AGENT_OFFLINE=false`

## Offline mode (no model dependency)
- Set `CHAT_AGENT_OFFLINE=true`
- Tool flow still works for local tests
- Useful when API key is unavailable/invalid

---

## 7) Common Errors and Fixes

## Error: Prisma types missing / many TS errors
Fix:

```bash
cd apps/api
pnpm prisma generate
```

## Error: DB connection fails
- Check PostgreSQL running
- Validate `DATABASE_URL`
- Re-run migrations

## Error: chat 500 due to API key
- Use valid key
- Or set `CHAT_AGENT_OFFLINE=true` to continue testing

## Error: web build fails fetching Google fonts
- Ensure internet access during build
- Re-run build

## Error: compose up issues
- Run `docker compose config`
- Check health logs for db/api

---

## 8) Suggested Freshers' Study Sequence

1. `apps/api/src/main.ts`
2. `apps/api/src/app.module.ts`
3. Projects module
4. Tickets module
5. Comments module
6. Prisma schema + migrations
7. Embeddings module
8. Chat module
9. `apps/web/lib/api.ts`
10. Web pages + components
11. Docker files + compose

---

## 9) What Makes This Project Production-Ready Directionally

- Structured modules and DTO validation
- Uniform response/error handling
- Event-driven embedding sync
- Tool-based chat orchestration
- Streaming chat support
- Containerized services and health checks
- Environment-based configuration separation

---

## 10) Next Improvements (After Internship Plan)

1. Add auth (JWT/session)
2. Add user/team ownership checks
3. Add unit tests + e2e tests
4. Add CI pipeline (lint + build + tests)
5. Add observability (structured logs/metrics/traces)
6. Improve agent ranking/reasoning and citation quality

---

This file is your full map of the project. Read day-wise section first, then open the files listed in sequence.
