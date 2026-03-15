# ProjectHub Backend API

NestJS backend for the AI-powered Project Management application.

## Day 1 & 2 Implementation Summary

### Day 1 - Environment Setup + NestJS Scaffold

Completed:
- Set up NestJS project with TypeScript
- Created `/health` endpoint that returns `{ status: "ok" }`
- Installed validation dependencies: `class-validator`, `class-transformer`, `@nestjs/mapped-types`
- Enabled global validation pipe for automatic DTO validation
- Project structure ready with modules, controllers, and services

Key files created:
- `src/main.ts` - Application bootstrap
- `src/app.module.ts` - Root module
- `src/app.controller.ts` - Health check endpoint

### Day 2 - Projects Module (CRUD API)

Completed:
- Built Projects REST API with in-memory storage
- Created ProjectsModule with controller + service
- Implemented 5 endpoints:
  - `POST /projects` - Create a new project
  - `GET /projects` - List all projects
  - `GET /projects/:id` - Get single project by ID
  - `PATCH /projects/:id` - Update project (name, description, status)
  - `DELETE /projects/:id` - Archive project (soft delete)

Validation implemented:
- Project name: 3-100 characters (required)
- Description: 0-500 characters (optional)
- Status: ACTIVE or ARCHIVED enum (optional, defaults to ACTIVE)

Key files created:
- `src/projects/projects.module.ts` - ProjectsModule
- `src/projects/projects.controller.ts` - HTTP routes with return types
- `src/projects/projects.service.ts` - Business logic (CRUD + archive)
- `src/projects/dto/create-project.dto.ts` - Create validation rules
- `src/projects/dto/update-project.dto.ts` - Update validation rules

## Project setup

```bash
# Install dependencies
pnpm install
```

## Run the API

```bash
# Development mode (watch for changes)
pnpm start:dev

# Production build
pnpm run build
pnpm start:prod
```

Server runs on `http://localhost:3001`

## Test the API

```bash
# Create a project
curl -X POST http://localhost:3001/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Project Alpha","description":"First project"}'

# List all projects
curl http://localhost:3001/projects

# Get single project
curl http://localhost:3001/projects/1

# Update project
curl -X PATCH http://localhost:3001/projects/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"ARCHIVED"}'

# Archive project (soft delete)
curl -X DELETE http://localhost:3001/projects/1
```

## Project structure

```text
src/
|- main.ts                      # Bootstrap (runs validation pipe)
|- app.module.ts                # Root module (imports ProjectsModule)
|- app.controller.ts            # Health endpoint
|- app.service.ts               # Optional service
|- projects/
   |- projects.module.ts        # Projects module definition
   |- projects.controller.ts    # HTTP routes
   |- projects.service.ts       # Business logic (in-memory)
   |- dto/
      |- create-project.dto.ts
      |- update-project.dto.ts
```

## Next steps

- Day 3: Replace in-memory storage with PostgreSQL + Prisma ORM
- Day 4: Build Tickets module with project relations
- Day 5: Add Comments and seed data script
