# Day 1 to Day 5 Explanation (Beginner Friendly)

This file explains what was implemented, why each folder/file exists, and how the files communicate.

Current scope: backend only (NestJS + PostgreSQL + Prisma).

## 1) Big Picture

Your backend now has 3 features:
- Projects
- Tickets
- Comments

NestJS architecture used:
- Module = feature container
- Controller = HTTP layer (receives API request)
- Service = business logic layer
- DTO = input validation layer
- Prisma = database access layer

## 2) Day 1 (Setup + Health)

Goal: run a basic NestJS server.

Implemented:
- App bootstrap in `src/main.ts`
- Root module in `src/app.module.ts`
- Health endpoint `GET /health` in `src/app.controller.ts`
- Global validation pipe enabled in `main.ts`

Result:
- Server runs on port 3001
- Basic NestJS project structure is ready

## 3) Day 2 (Projects CRUD + Validation)

Goal: build projects feature with validation.

Implemented:
- `src/projects` module with controller + service
- DTO validation for create/update
- Endpoints:
  - `POST /projects`
  - `GET /projects`
  - `GET /projects/:id`
  - `PATCH /projects/:id`
  - `DELETE /projects/:id` (soft delete by ARCHIVED)

Result:
- Project API works with validation

## 4) Day 3 (PostgreSQL + Prisma)

Goal: replace in-memory data with real DB persistence.

Implemented:
- Prisma setup:
  - `prisma/schema.prisma`
  - `.env.example`
  - Prisma scripts in `package.json`
- Prisma infrastructure:
  - `src/prisma/prisma.module.ts`
  - `src/prisma/prisma.service.ts`
- Refactor ProjectsService to Prisma queries
- Database migration executed successfully

Result:
- Projects are stored in PostgreSQL
- Data persists across server restarts

## 5) Day 4 (Tickets Module - Minimum Required)

Goal: add Tickets CRUD with Project relation and basic filtering.

### 5.1 Prisma schema changes

Added to `prisma/schema.prisma`:
- `Ticket` model
- `TicketStatus` enum
- `Priority` enum
- Relation: `Project (1) -> (many) Tickets`

Ticket model fields:
- `id`
- `title`
- `description`
- `status` (TODO/IN_PROGRESS/IN_REVIEW/DONE)
- `priority` (LOW/MEDIUM/HIGH/URGENT)
- `projectId`
- `createdAt`
- `updatedAt`

### 5.2 Tickets backend files

Created:
- `src/tickets/tickets.module.ts`
- `src/tickets/tickets.controller.ts`
- `src/tickets/tickets.service.ts`
- `src/tickets/dto/create-ticket.dto.ts`
- `src/tickets/dto/update-ticket.dto.ts`

Wired in app root:
- `src/app.module.ts` imports `TicketsModule`

### 5.3 Tickets endpoints (minimum)

Implemented endpoints:
- `POST /projects/:projectId/tickets`
- `GET /projects/:projectId/tickets`
- `GET /tickets`
- `GET /tickets/:id`
- `PATCH /tickets/:id`
- `DELETE /tickets/:id`

Supported filters:
- `status`
- `priority`
- `projectId` (for `/tickets`)
- basic sorting (`sortBy`, `sortOrder`)

Edge case handled:
- Invalid `projectId` for ticket create/list returns `404`

## 6) Day 5 (Comments Module + Seed - Minimum Required)

Goal: add Comments CRUD linked to Ticket and basic seed data.

### 6.1 Prisma schema changes

Added to `prisma/schema.prisma`:
- `Comment` model
- Relation: `Ticket (1) -> (many) Comments`

Comment model fields:
- `id`
- `content`
- `author`
- `ticketId`
- `createdAt`
- `updatedAt`

### 6.2 Comments backend files

Created:
- `src/comments/comments.module.ts`
- `src/comments/comments.controller.ts`
- `src/comments/comments.service.ts`
- `src/comments/dto/create-comment.dto.ts`
- `src/comments/dto/update-comment.dto.ts`

Wired in app root:
- `src/app.module.ts` imports `CommentsModule`

### 6.3 Comments endpoints (minimum)

Implemented endpoints:
- `POST /tickets/:ticketId/comments`
- `GET /tickets/:ticketId/comments`
- `PATCH /comments/:id`
- `DELETE /comments/:id`

Edge cases handled:
- Invalid `ticketId` returns `404`
- Invalid `comment id` returns `404`

### 6.4 Seed script (minimum)

Created:
- `prisma/seed.js`

Package scripts:
- `prisma:seed`
- Prisma `seed` config in `package.json`

What seed adds:
- 1 project
- 2 tickets
- 3 comments

This is intentionally minimal and beginner-friendly for Day 5.

## 7) Request Flow (How files communicate now)

### Example A: Create ticket

`POST /projects/:projectId/tickets`

Flow:
1. Request enters Nest app in `main.ts`
2. DTO validates body in controller
3. Controller method in `tickets.controller.ts` calls service
4. Service in `tickets.service.ts` checks project exists
5. Service writes ticket using Prisma (`prisma.ticket.create`)
6. PostgreSQL stores data
7. API returns created ticket JSON

### Example B: Add comment

`POST /tickets/:ticketId/comments`

Flow:
1. Request hits `comments.controller.ts`
2. DTO validates `author` and `content`
3. Service checks ticket exists
4. Service inserts row via `prisma.comment.create`
5. API returns created comment JSON

## 8) Current Folder Map (Day 1 to Day 5)

- `src/main.ts` -> app startup + global validation
- `src/app.module.ts` -> root module, imports all feature modules
- `src/prisma/*` -> Prisma client lifecycle and DI export
- `src/projects/*` -> project APIs
- `src/tickets/*` -> ticket APIs (Day 4)
- `src/comments/*` -> comment APIs (Day 5)
- `prisma/schema.prisma` -> DB models and enums
- `prisma/migrations/*` -> DB migration history
- `prisma/seed.js` -> minimal seed data script

## 9) Commands You Need (Day 4 and Day 5)

Run in `apps/api`:

1. `pnpm prisma migrate dev --name add-tickets-comments`
2. `pnpm prisma generate`
3. `pnpm prisma:seed`
4. `pnpm start:dev`

## 10) What is intentionally kept basic

To keep this fresher-friendly, this implementation avoids advanced patterns:
- No auth
- No pagination layer
- No repository abstraction
- No event system
- No background jobs

Only the minimum needed Day 4 and Day 5 backend work is implemented.

## 11) One Sentence Summary

By Day 5, you now have a complete minimal backend flow: Project -> Ticket -> Comment with PostgreSQL persistence, Prisma migrations, basic filtering, and seed data.
