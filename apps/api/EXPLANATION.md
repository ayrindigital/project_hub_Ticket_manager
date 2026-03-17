# EXPLANATION: Test and Understand Day 1 to Day 6 (Web + Postman)

This guide is made for your current monorepo:
- Backend: `apps/api` (NestJS + Prisma + PostgreSQL)
- Frontend: `apps/web` (Next.js)

## 1) What "Web + Postman" Means Here

- Web (browser): best for quick `GET` checks.
- Postman: best for full API testing (`POST`, `PATCH`, `DELETE`, plus body/headers).

Note:
- Browser checks now include both API URLs and frontend dashboard URL.
- Postman is still best for create/update/delete API requests.

## 2) One-Time Setup

1. Open terminal in `apps/api`.
2. Install dependencies:

```powershell
pnpm install
```

3. Ensure `.env` has correct `DATABASE_URL`.
4. Run migration + Prisma client generation:

```powershell
pnpm prisma:migrate
pnpm prisma:generate
```

5. (Optional but recommended) Seed sample data:

```powershell
pnpm prisma:seed
```

6. One-time setup is complete.

### Day 6 frontend one-time setup

In a new terminal:

```powershell
cd C:\Users\sagar\Desktop\project-hub\apps\web
pnpm install
```

If you need custom API URL for web app, create `.env.local` in `apps/web`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Command to run every time (daily startup)

After one-time setup, every time you want to run the full Day 6 application, use two terminals.

Terminal 1 (API):

```powershell
cd C:\Users\sagar\Desktop\project-hub\apps\api
pnpm start:dev
```

Terminal 2 (Web):

```powershell
cd C:\Users\sagar\Desktop\project-hub\apps\web
pnpm dev
```

You can also run from project root with one command each:

```powershell
pnpm --dir apps/api start:dev
pnpm --dir apps/web dev
```

URLs:

```text
API: http://localhost:3001
Web: http://localhost:3000
```

Stop server with `Ctrl + C`.

### First-time startup reference

For first-time setup only, the full sequence is:

```powershell
cd C:\Users\sagar\Desktop\project-hub\apps\api
pnpm install
pnpm prisma:migrate
pnpm prisma:generate
pnpm prisma:seed
pnpm start:dev
```

In second terminal:

```powershell
cd C:\Users\sagar\Desktop\project-hub\apps\web
pnpm install
pnpm dev
```

## 3) Browser (Web) Quick Checks

You can open these in browser directly:

0. Day 6 frontend dashboard:
   - `http://localhost:3000`

1. Day 1 health:
   - `http://localhost:3001/health`

2. Day 2 projects list:
   - `http://localhost:3001/projects`

3. Day 2 projects filter:
   - `http://localhost:3001/projects?status=ACTIVE`

4. Day 4 tickets list:
   - `http://localhost:3001/tickets`

5. Day 4 tickets filter:
   - `http://localhost:3001/tickets?status=TODO&priority=HIGH`

6. Day 6 frontend project detail page:
   - `http://localhost:3000/projects/<project-id>`

7. Day 6 frontend chat placeholder page:
   - `http://localhost:3000/chat`

Important:
- Browser is not practical for `POST`, `PATCH`, `DELETE`.
- Use Postman for full validation.

## 4) Postman Setup (Do This Once)

1. Create collection: `ProjectHub API Day1-Day5`
2. Create environment variable:
   - `baseUrl = http://localhost:3001`
3. Create runtime variables in Postman environment:
   - `projectId`
   - `ticketId`
   - `commentId`

### Useful Postman Test scripts (copy into Tests tab)

For create project response:

```javascript
const data = pm.response.json();
pm.environment.set("projectId", data.id);
```

For create ticket response:

```javascript
const data = pm.response.json();
pm.environment.set("ticketId", data.id);
```

For create comment response:

```javascript
const data = pm.response.json();
pm.environment.set("commentId", data.id);
```

## 5) Day-Wise Postman Endpoint Checklist

## Day 1 - Health

### Request 1
- Method: `GET`
- URL: `{{baseUrl}}/health`
- Expected HTTP: `200`
- Expected body:

```json
{
  "status": "ok"
}
```

## Day 2 - Projects CRUD

### Request 2: Create Project
- Method: `POST`
- URL: `{{baseUrl}}/projects`
- Body (JSON):

```json
{
  "name": "Project Alpha",
  "description": "Day 2 project test",
  "status": "ACTIVE"
}
```

- Expected HTTP: `201`
- Save `projectId` in Tests tab.

### Request 3: List Projects
- Method: `GET`
- URL: `{{baseUrl}}/projects`
- Expected HTTP: `200`

### Request 4: Get Single Project
- Method: `GET`
- URL: `{{baseUrl}}/projects/{{projectId}}`
- Expected HTTP: `200`

### Request 5: Update Project
- Method: `PATCH`
- URL: `{{baseUrl}}/projects/{{projectId}}`
- Body (JSON):

```json
{
  "description": "Updated from Postman"
}
```

- Expected HTTP: `200`

### Request 6: Archive Project (Soft Delete)
- Method: `DELETE`
- URL: `{{baseUrl}}/projects/{{projectId}}`
- Expected HTTP: `200`
- Expected `status` in response: `ARCHIVED`

### Request 7: Validation Negative Test
- Method: `POST`
- URL: `{{baseUrl}}/projects`
- Body (JSON):

```json
{
  "name": "ab"
}
```

- Expected HTTP: `400`

## Day 3 - PostgreSQL + Prisma Persistence Check

### Step A
Create one project with `POST /projects` and save id as `projectId`.

### Step B
Stop server and start again:

```powershell
pnpm start:dev
```

### Step C
Call:
- `GET {{baseUrl}}/projects/{{projectId}}`

Expected:
- Still exists after restart (persistence works)

## Day 4 - Tickets CRUD

### Request 8: Create New Parent Project For Tickets
- Method: `POST`
- URL: `{{baseUrl}}/projects`
- Body (JSON):

```json
{
  "name": "Tickets Demo",
  "description": "Project for ticket testing"
}
```

- Save `projectId` from response.

### Request 9: Create Ticket Under Project
- Method: `POST`
- URL: `{{baseUrl}}/projects/{{projectId}}/tickets`
- Body (JSON):

```json
{
  "title": "Fix login bug",
  "description": "User cannot login",
  "status": "TODO",
  "priority": "HIGH"
}
```

- Expected HTTP: `201`
- Save `ticketId`.

### Request 10: List Tickets By Project
- Method: `GET`
- URL: `{{baseUrl}}/projects/{{projectId}}/tickets`
- Expected HTTP: `200`

### Request 11: List All Tickets With Filters
- Method: `GET`
- URL: `{{baseUrl}}/tickets?status=TODO&priority=HIGH&sortBy=createdAt&sortOrder=desc`
- Expected HTTP: `200`

### Request 12: Get Single Ticket
- Method: `GET`
- URL: `{{baseUrl}}/tickets/{{ticketId}}`
- Expected HTTP: `200`

### Request 13: Update Ticket
- Method: `PATCH`
- URL: `{{baseUrl}}/tickets/{{ticketId}}`
- Body (JSON):

```json
{
  "status": "IN_PROGRESS",
  "priority": "URGENT"
}
```

- Expected HTTP: `200`

### Request 14: Delete Ticket
- Method: `DELETE`
- URL: `{{baseUrl}}/tickets/{{ticketId}}`
- Expected HTTP: `200`

### Request 15: Day 4 Negative Tests

1. Invalid project id in create ticket:
- `POST {{baseUrl}}/projects/<random-uuid>/tickets`
- Expected HTTP: `404`

2. Invalid status filter:
- `GET {{baseUrl}}/tickets?status=INVALID`
- Expected HTTP: `400`

## Day 5 - Comments CRUD + Seed

### Request 16: Recreate Ticket For Comment Test
- First create project, then create ticket (same as Day 4 flow).
- Save `projectId` and `ticketId`.

### Request 17: Create Comment
- Method: `POST`
- URL: `{{baseUrl}}/tickets/{{ticketId}}/comments`
- Body (JSON):

```json
{
  "author": "Sagar",
  "content": "I started working on this ticket."
}
```

- Expected HTTP: `201`
- Save `commentId`.

### Request 18: List Comments By Ticket
- Method: `GET`
- URL: `{{baseUrl}}/tickets/{{ticketId}}/comments`
- Expected HTTP: `200`

### Request 19: Update Comment
- Method: `PATCH`
- URL: `{{baseUrl}}/comments/{{commentId}}`
- Body (JSON):

```json
{
  "content": "Updated progress note"
}
```

- Expected HTTP: `200`

### Request 20: Delete Comment
- Method: `DELETE`
- URL: `{{baseUrl}}/comments/{{commentId}}`
- Expected HTTP: `200`

### Request 21: Day 5 Negative Tests

1. Invalid ticket id:
- `POST {{baseUrl}}/tickets/<random-uuid>/comments`
- Expected HTTP: `404`

2. Invalid comment id:
- `PATCH {{baseUrl}}/comments/<random-uuid>`
- Expected HTTP: `404`

## 6) Verify Seed Data (Postman + Browser)

Run seed:

```powershell
pnpm prisma:seed
```

Then verify in browser or Postman:

1. `GET {{baseUrl}}/projects`
   - Look for `Intern Demo Project`

2. `GET {{baseUrl}}/tickets`
   - Should contain seeded tickets

3. Pick one ticket id and call:
   - `GET {{baseUrl}}/tickets/<ticket-id>/comments`

## 7) Fast Troubleshooting

1. `P1000` auth error:
- DB username/password in `.env` is wrong

2. `P1001` cannot reach DB:
- PostgreSQL server not running

3. `400` bad request:
- Usually wrong enum or invalid DTO fields

4. `404` not found:
- Usually wrong `projectId` / `ticketId` / `commentId`

## 8) Final Learning Checklist

You fully verified Day 1 to Day 6 if:
- Health works
- Projects CRUD works
- Data persists after server restart
- Tickets CRUD works with filters
- Comments CRUD works
- Seed data loads and can be read
- Dashboard at `http://localhost:3000` shows projects from API
- Opening `/projects/<id>` in web shows project details and ticket list

## 9) Day-Wise Files, Purpose, and Communication

## Day 1 - Core NestJS Setup

Files:
- `src/main.ts`
- `src/app.module.ts`
- `src/app.controller.ts`
- `src/app.service.ts`

Purpose:
- `src/main.ts`: Starts Nest app and enables global validation pipe.
- `src/app.module.ts`: Root module that wires feature modules.
- `src/app.controller.ts`: Provides `GET /health` endpoint.
- `src/app.service.ts`: Basic service template (not heavy logic yet).

Communication flow:
1. App starts from `src/main.ts`.
2. `AppModule` is loaded from `src/app.module.ts`.
3. Request `GET /health` goes to `src/app.controller.ts`.
4. Controller returns JSON response.

## Day 2 - Projects Module

Files:
- `src/projects/projects.module.ts`
- `src/projects/projects.controller.ts`
- `src/projects/projects.service.ts`
- `src/projects/dto/create-project.dto.ts`
- `src/projects/dto/update-project.dto.ts`

Purpose:
- Module file wires controller + service.
- Controller defines routes for project CRUD.
- Service contains business logic for create/list/get/update/archive.
- DTO files validate request body structure.

Communication flow:
1. Client hits `/projects` endpoints.
2. `projects.controller.ts` receives request.
3. DTO validation runs (via global `ValidationPipe` from `main.ts`).
4. Controller calls method in `projects.service.ts`.
5. Service returns result to controller.
6. Controller sends response to client.

## Day 3 - Prisma + PostgreSQL Integration

Files:
- `prisma/schema.prisma`
- `prisma/migrations/20260315185433_init/migration.sql`
- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`
- `.env` and `.env.example`

Purpose:
- `schema.prisma` defines database models/enums.
- Migration SQL creates DB tables/constraints.
- `prisma.service.ts` creates shared DB client connection.
- `prisma.module.ts` exports PrismaService globally.
- `.env` stores `DATABASE_URL` connection string.

Communication flow:
1. App starts and PrismaService connects to DB.
2. Projects service calls Prisma methods (`prisma.project.*`).
3. Prisma converts method call to SQL.
4. PostgreSQL runs SQL and returns data.
5. Service -> controller -> API response.

## Day 4 - Tickets Module

Files:
- `src/tickets/tickets.module.ts`
- `src/tickets/tickets.controller.ts`
- `src/tickets/tickets.service.ts`
- `src/tickets/dto/create-ticket.dto.ts`
- `src/tickets/dto/update-ticket.dto.ts`

Purpose:
- Add ticket CRUD linked to a project.
- Add filter support (status, priority, sorting).
- Validate ticket payload with DTOs.

Communication flow:
1. Client hits routes like `/projects/:projectId/tickets` or `/tickets`.
2. `tickets.controller.ts` validates query/path/body values.
3. `tickets.service.ts` checks project existence when needed.
4. Service calls Prisma `ticket` queries.
5. DB returns result and response is sent.

## Day 5 - Comments Module + Seed Data

Files:
- `src/comments/comments.module.ts`
- `src/comments/comments.controller.ts`
- `src/comments/comments.service.ts`
- `src/comments/dto/create-comment.dto.ts`
- `src/comments/dto/update-comment.dto.ts`
- `prisma/seed.js`

Purpose:
- Add comment CRUD linked to tickets.
- Seed sample data for quick testing and learning.

Communication flow:
1. Client hits `/tickets/:ticketId/comments` or `/comments/:id`.
2. Controller forwards validated input to service.
3. Service checks ticket/comment existence.
4. Service performs Prisma `comment` queries.
5. Result is returned to client.

Note:
- In this implementation, schema expansion for tickets and comments is applied together in migration `20260315192207_add_tickets_comments`.

## Day 6 - Next.js Frontend (Basic Fresher Version)

Files created/updated:
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/projects/[projectId]/page.tsx`
- `apps/web/app/chat/page.tsx`
- `apps/web/components/Sidebar.tsx`
- `apps/web/components/ProjectCard.tsx`
- `apps/web/lib/api.ts`
- `apps/web/app/globals.css`
- `apps/api/src/main.ts` (CORS enabled for `http://localhost:3000`)

Purpose:
- `layout.tsx`: app shell with sidebar + main content area.
- `page.tsx`: dashboard page that fetches and renders project cards.
- `projects/[projectId]/page.tsx`: simple project detail page with basic ticket preview.
- `chat/page.tsx`: placeholder for upcoming AI chat UI.
- `Sidebar.tsx`: navigation links to dashboard and chat.
- `ProjectCard.tsx`: reusable card for each project.
- `lib/api.ts`: API helper functions (`getProjects`, `getProjectById`, `getTicketsByProject`).
- `globals.css`: Day 6 styling/theme.
- API `main.ts`: enables CORS so frontend can call backend from browser.

Communication flow (Day 6 web):
1. Open `http://localhost:3000`.
2. Next.js dashboard (`app/page.tsx`) calls helper in `lib/api.ts`.
3. Helper fetches data from `http://localhost:3001/projects`.
4. NestJS controller/service fetches from DB via Prisma.
5. Response comes back to web and renders project cards.
6. Clicking a project card navigates to `/projects/[projectId]`, which fetches project + tickets.

## 10) Database Setup and How It Works (Day 3 Onward)

## A) Setup Steps

1. Install PostgreSQL and keep service running.
2. Put DB URL in `.env`:
   - `DATABASE_URL="postgresql://<user>:<password>@localhost:5432/projecthub_dev?schema=public"`
3. Run migration:
   - `pnpm prisma:migrate`
4. Generate Prisma client:
   - `pnpm prisma:generate`
5. Optional demo data:
   - `pnpm prisma:seed`

## B) What Prisma is doing internally

1. `schema.prisma` is the source of truth for models.
2. `prisma migrate` compares schema with DB and creates SQL migration files.
3. Migration SQL is applied to PostgreSQL.
4. `prisma generate` creates type-safe client in `node_modules/.prisma/client`.
5. `PrismaService` (Nest injectable) uses that generated client.

## C) Runtime Query Flow

1. API request arrives at controller.
2. Controller calls service method.
3. Service calls Prisma client (for example `prisma.ticket.findMany`).
4. Prisma executes SQL in PostgreSQL.
5. PostgreSQL returns rows.
6. Service maps/returns data to controller.
7. Controller returns HTTP response.

## D) Why data persists now

- Day 2 in-memory data was lost on restart.
- Day 3+ stores data in PostgreSQL tables.
- So restart does not delete records.

## E) Seed data behavior

- `prisma/seed.js` currently clears existing records and inserts demo project/tickets/comments.
- Use seed when you want a clean practice dataset.
