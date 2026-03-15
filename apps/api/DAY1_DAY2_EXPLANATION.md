# Day 1, Day 2, and Day 3 Explanation (Beginner Friendly)

This file explains what you built, why each file exists, and how the files communicate.

Current scope: backend only (NestJS API). Next.js frontend starts later.

## 1) Big Picture

Your backend currently provides:
- `GET /health`
- `Projects` CRUD API

Architecture idea in NestJS:
- Module = feature container
- Controller = HTTP layer (receives requests)
- Service = business logic layer
- DTO = validation rules for input
- Prisma = database access layer (ORM)

## 2) Day 1: What We Built

Goal: basic NestJS app should run.

Done on Day 1:
- NestJS project setup in `apps/api`
- App bootstrap in `src/main.ts`
- Health endpoint in `src/app.controller.ts`
- Root module in `src/app.module.ts`
- Global validation pipe in `main.ts`

Why this matters:
- You got a running server on port `3001`
- You learned how a module/controller/service structure looks

## 3) Day 2: What We Built

Goal: Projects feature with CRUD and validation.

Done on Day 2:
- Created `projects` feature folder
- Added DTOs for create and update
- Added routes:
  - `POST /projects`
  - `GET /projects`
  - `GET /projects/:id`
  - `PATCH /projects/:id`
  - `DELETE /projects/:id` (soft delete via ARCHIVED)

Important Day 2 behavior:
- Storage was in-memory array
- Data disappeared on server restart

## 4) Day 3: What We Implemented (Detailed)

Goal: replace in-memory storage with PostgreSQL persistence using Prisma.

### 4.1 Dependencies added

In `apps/api/package.json`:
- `@prisma/client`
- `prisma` (dev dependency)

Scripts added:
- `prisma:generate`
- `prisma:migrate`
- `prisma:studio`

### 4.2 Prisma setup added

New files:
- `prisma/schema.prisma`
- `.env.example`

Schema includes:
- `Project` model with fields:
  - `id` (UUID string)
  - `name`
  - `description`
  - `status` enum (`ACTIVE`, `ARCHIVED`)
  - `createdAt`
  - `updatedAt`

Why this is important:
- Database now defines source of truth for project data
- IDs are now UUID strings (not numeric auto-increment from memory array)

### 4.3 Prisma module added to NestJS

New files:
- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`

What they do:
- `PrismaService` extends `PrismaClient`
- Connects on module init and disconnects on module destroy
- `PrismaModule` is global, so other modules can use PrismaService

### 4.4 App module wiring changed

File changed:
- `src/app.module.ts`

What changed:
- `PrismaModule` imported into root module
- This makes DB client available app-wide

### 4.5 Projects service refactored from memory to DB

File changed:
- `src/projects/projects.service.ts`

Before:
- Used `projects[]` array in memory

Now:
- Uses `this.prisma.project.create/findMany/findUnique/update`
- Data is read/written in PostgreSQL
- `findAll` supports optional status filter
- `archive` updates status to `ARCHIVED` in database

### 4.6 Projects controller updated for DB IDs

File changed:
- `src/projects/projects.controller.ts`

What changed:
- ID param changed from `number` to `string` (UUID)
- Added optional query filter: `GET /projects?status=ACTIVE`
- Added status validation for query value
- Return types now use Prisma `Project` model type

### 4.7 DTO alignment

File changed:
- `src/projects/dto/create-project.dto.ts`

What changed:
- `ProjectStatus` now imported from Prisma generated types
- Keeps validation aligned with DB enum

## 5) Request Flow After Day 3

Example: `POST /projects`

1. Request enters app in `main.ts`
2. `ValidationPipe` validates request body against `CreateProjectDto`
3. Router sends request to `ProjectsController.create`
4. Controller calls `ProjectsService.create(dto)`
5. Service uses `PrismaService` -> `prisma.project.create(...)`
6. Prisma sends SQL to PostgreSQL
7. Created row returned to API response

Now data persists across restarts if DB is configured correctly.

## 6) Current Status and One Blocker

Day 3 code is implemented and builds successfully.

Current blocker on your machine:
- Prisma migration failed with `P1000` authentication error
- Reason: PostgreSQL username/password in `DATABASE_URL` does not match local DB credentials

How to fix quickly:
1. Check your real PostgreSQL username/password
2. Update `.env` in `apps/api`
3. Run:
   - `pnpm prisma migrate dev --name init`
   - `pnpm prisma generate`

## 7) Folder Purpose Map (Now Including Prisma)

`src/main.ts`
- Bootstraps Nest app and global validation

`src/app.module.ts`
- Root module, imports feature modules

`src/prisma/prisma.module.ts`
- Exposes PrismaService globally

`src/prisma/prisma.service.ts`
- Database client lifecycle management

`src/projects/projects.module.ts`
- Projects feature wiring

`src/projects/projects.controller.ts`
- HTTP routes for projects

`src/projects/projects.service.ts`
- Business logic + Prisma DB calls

`src/projects/dto/create-project.dto.ts`
- Validation rules for create request

`src/projects/dto/update-project.dto.ts`
- Partial validation rules for update request

`prisma/schema.prisma`
- Database model and enums

`.env.example`
- Example DB connection string

## 8) Django/Flask Mapping (Day 3 View)

Django:
- Serializer + model validation = DTO + Prisma model
- ORM query in view/service = Prisma query in Nest service

Flask:
- Route function = controller method
- DB session queries = Prisma calls in service

You already know the concepts. Day 3 mostly changed the storage layer.

## 9) One Sentence Summary

By Day 3, you upgraded the Projects API from temporary in-memory data to a real PostgreSQL-backed architecture using Prisma, with cleaner layering and persistent storage.
