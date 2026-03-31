# EXPLANATION: Test and Understand Day 1 to Day 10 (Web + Postman)

This guide is made for your current monorepo:
- Backend: `apps/api` (NestJS + Prisma + PostgreSQL)
- Frontend: `apps/web` (Next.js)

## 1) What "Web + Postman" Means Here

- Web (browser): best for quick `GET` checks.
- Postman: best for full API testing (`POST`, `PATCH`, `DELETE`, plus body/headers).

Note:
- Browser checks now include both API URLs and frontend dashboard URL.
- Postman is still best for create/update/delete API requests.
- Current API responses are wrapped in a standard envelope:

```json
{
  "data": {},
  "message": "Request completed successfully",
  "statusCode": 200
}
```

## 2) One-Time Setup

1. Open terminal in `apps/api`.
2. Install dependencies:

```powershell
pnpm install
```

3. Ensure `.env` has correct `DATABASE_URL`.
   - For Day 10 embedding script, also add `GEMINI_API_KEY`.
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

### Day 6 to Day 10 frontend one-time setup

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

After one-time setup, every time you want to run the full Day 10 application, use two terminals.

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

0. Day 10 frontend dashboard:
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

6. Day 4 single ticket detail:
   - `http://localhost:3001/tickets/<ticket-id>`

7. Day 9 frontend project detail page:
   - `http://localhost:3000/projects/<project-id>`

8. Day 7 frontend create project page:
   - `http://localhost:3000/projects/new`

9. Day 6 frontend chat placeholder page:
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
const response = pm.response.json();
pm.environment.set("projectId", response.data.id);
```

For create ticket response:

```javascript
const response = pm.response.json();
pm.environment.set("ticketId", response.data.id);
```

For create comment response:

```javascript
const response = pm.response.json();
pm.environment.set("commentId", response.data.id);
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
  "data": {
    "status": "ok"
  },
  "message": "Request completed successfully",
  "statusCode": 200
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
- Expected `data.status` in response: `ARCHIVED`

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
- Expected `data.project.name` to exist
- Expected `data.commentCount` to exist

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
   - Should return 3 seeded projects
   - Example names:
     - `E-Commerce Platform`
     - `Mobile App Redesign`
     - `API Gateway Migration`

2. `GET {{baseUrl}}/tickets`
   - Should return a larger list of seeded tickets across projects
   - Each ticket list item should include `commentCount`

3. Pick one ticket id and call:
   - `GET {{baseUrl}}/tickets/<ticket-id>/comments`
   - Should return multiple seeded comments

4. Check database-backed embedding foundation after running migration:
   - `SELECT * FROM "Embedding";`
   - Table should exist even before you insert embedding rows

## 6A) Day 7 to Day 10 Web Flow Checks

Once both API and web are running:

1. Open `http://localhost:3000`
   - Dashboard should show project cards with ticket counts.
   - Search box and status filter should update the visible list.

2. Open `http://localhost:3000/projects/new`
   - Create a project from the UI.
   - After submit, it should redirect to `/projects/<project-id>`.

3. On the project detail page:
   - Edit the project inline.
   - Archive the project from the action panel.
   - Open the Day 8 ticket board.

4. In the ticket board:
   - Create a new ticket from the UI.
   - Filter by status and priority.
   - Sort by created date, updated date, or priority.
   - Open a ticket in the detail panel.
   - Quick-update ticket status from a card dropdown.
   - Edit or delete the ticket from the detail panel.

5. In the ticket detail panel:
   - View comments in newest-first order.
   - Add a comment with author name and content.
   - Edit a comment inline.
   - Delete a comment.
   - Verify the ticket card comment count updates after comment changes.

6. For Day 10 embedding verification:
   - Add `GEMINI_API_KEY` to `apps/api/.env`.
   - Run `pnpm embeddings:test`.
   - Verify the script:
     - prints vector length and preview values
     - prints cosine similarity comparisons
     - inserts demo rows into `Embedding`
     - runs similarity search against PostgreSQL

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

You fully verified Day 1 to Day 10 if:
- Health works
- Projects CRUD works
- Data persists after server restart
- Tickets CRUD works with filters
- Comments CRUD works
- Seed data loads and can be read
- Dashboard at `http://localhost:3000` shows projects from API
- Opening `/projects/<id>` in web shows project details and ticket board
- Project creation/edit/archive works from the UI
- Ticket creation/edit/delete/status updates work from the UI
- Comment creation/edit/delete works from the UI
- Ticket cards show comment count and last updated activity information
- `GET /tickets/:id` returns related project data and comment count
- Seed data contains multiple realistic projects, tickets, and comments
- `Embedding` schema and migration files exist for Day 10
- `pnpm embeddings:test` can generate vectors, store them in PostgreSQL, and query them back with similarity search
- Gemini verification has been completed against the local PostgreSQL 18.3 setup with pgvector installed

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
- Single ticket detail now includes related project info and comment count.

Communication flow:
1. Client hits routes like `/projects/:projectId/tickets` or `/tickets`.
2. `tickets.controller.ts` validates query/path/body values.
3. `tickets.service.ts` checks project existence when needed.
4. Service calls Prisma `ticket` queries.
5. For `GET /tickets/:id`, Prisma includes the related project and comment count.
6. DB returns result and response is sent.

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
- Seed richer sample data for quick testing, UI flows, and later RAG-style retrieval.

Communication flow:
1. Client hits `/tickets/:ticketId/comments` or `/comments/:id`.
2. Controller forwards validated input to service.
3. Service checks ticket/comment existence.
4. Service performs Prisma `comment` queries.
5. Result is returned to client.

Note:
- In this implementation, schema expansion for tickets and comments is applied together in migration `20260315192207_add_tickets_comments`.
- The current seed script now creates:
  - 3 projects
  - 24 tickets total
  - 72 comments total
- This is much closer to the Day 5 plan than the original minimal seed.

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

## Day 7 - Projects UI (Create/Edit/Archive + Dashboard Filters)

Files created/updated:
- `apps/web/app/page.tsx`
- `apps/web/app/projects/new/page.tsx`
- `apps/web/components/DashboardFilters.tsx`
- `apps/web/components/ProjectForm.tsx`
- `apps/web/components/ProjectDetailActions.tsx`
- `apps/web/app/projects/[projectId]/page.tsx`
- `apps/web/lib/api.ts`

Purpose:
- `app/page.tsx`: dashboard now supports search and ACTIVE/ARCHIVED filtering.
- `app/projects/new/page.tsx`: dedicated create-project page.
- `DashboardFilters.tsx`: client-side search + status controls that sync to URL query params.
- `ProjectForm.tsx`: reusable create/edit form for projects.
- `ProjectDetailActions.tsx`: edit and archive controls on project detail page.
- `lib/api.ts`: create/update/archive project helpers for the frontend.

Communication flow (Day 7 web):
1. User opens dashboard or `/projects/new`.
2. Client form submits to NestJS project endpoints through `lib/api.ts`.
3. NestJS validates DTO input and updates PostgreSQL via Prisma.
4. The UI redirects or refreshes and shows updated project data.

## Day 8 - Tickets UI (Board View + CRUD)

Files created/updated:
- `apps/web/components/TicketBoard.tsx`
- `apps/web/app/projects/[projectId]/page.tsx`
- `apps/web/lib/api.ts`
- `src/tickets/tickets.controller.ts`
- `src/tickets/tickets.service.ts`

Purpose:
- `TicketBoard.tsx`: Day 8 ticket board UI grouped by status with filters, sorting, create form, quick status updates, and a ticket detail panel.
- `projects/[projectId]/page.tsx`: project detail page now renders the interactive ticket board instead of a static preview.
- `lib/api.ts`: adds ticket create/update/delete helpers and project-ticket query options.
- `tickets.controller.ts`: project-ticket route now accepts sort options.
- `tickets.service.ts`: returns flattened `commentCount` values and supports richer ticket list sorting for the Day 8 UI.

Communication flow (Day 8 web):
1. User opens a project detail page.
2. Server fetches project data and initial project tickets.
3. `TicketBoard.tsx` renders columns for `TODO`, `IN_PROGRESS`, `IN_REVIEW`, and `DONE`.
4. Filter and sort controls request updated ticket lists from `/projects/:projectId/tickets`.
5. Ticket create/update/delete actions call NestJS ticket endpoints through `lib/api.ts`.
6. NestJS validates DTOs, updates PostgreSQL via Prisma, and returns wrapped API responses.
7. The client board updates with the latest ticket state.

## Day 9 - Comments UI + Activity Indicators

Files created/updated:
- `apps/web/components/TicketComments.tsx`
- `apps/web/components/TicketBoard.tsx`
- `apps/web/lib/api.ts`

Purpose:
- `TicketComments.tsx`: Day 9 comments UI inside the ticket detail panel, including list, create form, inline edit, and delete actions.
- `TicketBoard.tsx`: now shows activity details on ticket cards such as comment count and last updated date, and wires comment count updates back into board state.
- `lib/api.ts`: adds frontend helpers for `getCommentsByTicket`, `createComment`, `updateComment`, and `deleteComment`.

Communication flow (Day 9 web):
1. User opens a ticket from the Day 8 board.
2. The ticket detail panel renders `TicketComments.tsx`.
3. `TicketComments.tsx` fetches comments from `/tickets/:ticketId/comments`.
4. Add, edit, and delete actions call the comments API endpoints through `lib/api.ts`.
5. NestJS comments controller/service validates input and updates PostgreSQL through Prisma.
6. The comment list refreshes in local state, and the parent ticket card updates its `commentCount`.

Implementation note:
- The Day 9 UI is implemented.
- Full integration testing from the Day 9 plan is still a separate step and is not being claimed as completed in this document.

## Day 10 - Embeddings Intro + pgvector Setup

Files created/updated:
- `prisma/schema.prisma`
- `prisma/migrations/20260329090000_add_embeddings/migration.sql`
- `prisma/migrations/20260331110000_switch_to_gemini_embeddings/migration.sql`
- `scripts/test-embeddings.ts`
- `scripts/pgvector-example.sql`
- `package.json`

Purpose:
- `schema.prisma`: adds the `Embedding` model with a pgvector-backed `vector(3072)` field for Gemini embeddings.
- `migration.sql`: first creates the `vector` extension and the `Embedding` table/index, then switches the embedding column to Gemini-sized vectors.
- `test-embeddings.ts`: standalone script that loads sample ticket titles, generates embeddings with `gemini-embedding-001`, prints vector previews, compares cosine similarity, stores the generated vectors in PostgreSQL, and performs similarity search against the `Embedding` table.
- `pgvector-example.sql`: raw SQL reference for inserting a valid `vector(3072)` row and doing similarity search with `<=>`.
- `package.json`: adds the `embeddings:test` script and the Gemini/LangChain dependencies needed for Day 10 work.

Communication flow (Day 10 backend):
1. Developer runs `pnpm embeddings:test` from `apps/api`.
2. The script loads `.env`, checks `GEMINI_API_KEY`, and creates Gemini embedding clients for document and query retrieval tasks.
3. Sample ticket titles are embedded with `gemini-embedding-001`.
4. The script prints vector length/previews and cosine similarity comparisons.
5. The script ensures the `vector` extension exists in PostgreSQL.
6. The script inserts generated vectors into the `Embedding` table using raw SQL and pgvector casting.
7. The script runs similarity search against stored rows using the `<=>` distance operator.
8. The `Embedding` Prisma model and migration define the database shape that makes this possible.

Implementation note:
- Day 10 schema, script, and raw SQL example are implemented.
- The script requires `GEMINI_API_KEY` in `apps/api/.env`.
- Without that key, the script fails fast with a clear configuration error before making API calls.
- Verified locally after pgvector installation:
  - `CREATE EXTENSION vector;` works on PostgreSQL 18.3
  - `pnpm prisma:migrate` applies both embedding migrations
  - `pnpm embeddings:test` completes successfully with `gemini-embedding-001`
  - generated vectors are length `3072`
  - similarity search returns the expected authentication-related match near the top

## 10) Database Setup and How It Works (Day 3 Onward)

## A) Setup Steps

1. Install PostgreSQL and keep service running.
2. Put DB URL in `.env`:
   - `DATABASE_URL="postgresql://<user>:<password>@localhost:5432/projecthub_dev?schema=public"`
3. For Day 10, also add:
   - `GEMINI_API_KEY="<your-gemini-key>"`
4. Run migration:
   - `pnpm prisma:migrate`
5. Generate Prisma client:
   - `pnpm prisma:generate`
6. Optional demo data:
   - `pnpm prisma:seed`
7. Optional Day 10 embedding demo:
   - `pnpm embeddings:test`

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

- `prisma/seed.js` currently clears existing records and inserts a larger practice dataset.
- It also clears existing embedding rows before reseeding.
- Current seeded volume:
  - 3 projects
  - 24 tickets
  - 72 comments
- Use seed when you want a clean practice dataset.
- Do not run it casually on a database containing anything you want to keep, because it deletes existing records first.
