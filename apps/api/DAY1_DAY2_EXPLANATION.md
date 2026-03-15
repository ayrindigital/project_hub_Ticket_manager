# Day 1 and Day 2 Explanation (Beginner Friendly)

This file explains what you built, why each file exists, and how they connect.

You are currently working on backend only (NestJS API).
Next.js frontend is not started yet.

## 1) Big picture

Your backend has one job right now:
- Health check endpoint
- Projects CRUD API (Create, Read, Update, Archive)

Think of NestJS like this:
- Module = app section
- Controller = receives HTTP request (like Django view or Flask route)
- Service = business logic (actual work)
- DTO = input validation rules (like serializer/schema validation)

## 2) Folder structure and purpose

apps/api/
- src/
  - main.ts
  - app.module.ts
  - app.controller.ts
  - app.service.ts
  - projects/
    - projects.module.ts
    - projects.controller.ts
    - projects.service.ts
    - dto/
      - create-project.dto.ts
      - update-project.dto.ts

Purpose of each file:

1. src/main.ts
- Entry point of app.
- Starts NestJS server on port 3001.
- Enables ValidationPipe globally.
- ValidationPipe means DTO rules run automatically for request body.

2. src/app.module.ts
- Root module.
- Registers global app parts.
- Imports ProjectsModule, so projects routes become active. 

3. src/app.controller.ts
- Simple endpoint: GET /health
- Returns status ok.
- Useful to confirm API is running.

4. src/app.service.ts
- Default template service from Nest.
- Not very important for your Day 1 and Day 2 logic.

5. src/projects/projects.module.ts
- Groups -related controller and service together.
- Connects ProjectsController with ProjectsprojectsService.

6. src/projects/projects.controller.ts
- Defines HTTP routes under /projects.
- Receives request data.
- Calls ProjectsService methods.
- Does not store data by itself.

7. src/projects/projects.service.ts
- Contains core logic for projects.
- Stores data in memory array (temporary, reset on restart).
- Handles create, list, get by id, update, archive.
- Throws not found error when id is missing.

8. src/projects/dto/create-project.dto.ts
- Validation rules for project creation.
- name is required, 3 to 100 chars.
- description is optional.
- status is optional enum: ACTIVE or ARCHIVED.

9. src/projects/dto/update-project.dto.ts
- Validation rules for project update.
- Uses PartialType so all create fields become optional.

## 3) How files communicate (request flow)

Example: POST /projects

Step 1: Request enters app through main.ts
- App is running and ValidationPipe is active.

Step 2: Nest router sends request to ProjectsController.create
- Because route matches POST /projects.

Step 3: Body is checked against CreateProjectDto
- Invalid body gives automatic 400 error.
- Valid body continues.

Step 4: Controller calls ProjectsService.create(dto)
- Controller forwards validated data.

Step 5: Service creates project object
- id generated using nextId.
- status default ACTIVE if not provided.
- object pushed into projects array.

Step 6: Service returns created object
- Controller returns it as JSON response.

Same idea for other routes:
- GET /projects -> controller.findAll -> service.findAll
- GET /projects/:id -> controller.findOne -> service.findOne
- PATCH /projects/:id -> controller.update -> service.update
- DELETE /projects/:id -> controller.remove -> service.archive (soft delete)

## 4) Why this design is used

Reason for separating files:
- Easy to understand responsibility of each layer.
- Easy to test in future (controller and service separately).
- Easy to replace in-memory storage with database later.

This is why NestJS feels like many files.
But each file has one clear purpose.

## 5) Day 1 and Day 2 checklist status

Day 1:
- NestJS app setup: done
- Health endpoint: done
- Basic structure (module/controller/service): done

Day 2:
- Projects module: done
- CRUD routes: done
- DTO validation: done
- Soft delete via ARCHIVED status: done
- In-memory storage: done

## 6) Important limitation right now

Data is in memory array inside projects.service.ts.
If server restarts, all projects are lost.

This is expected for Day 2.
Day 3 will move data to PostgreSQL + Prisma.

## 7) Suggested reading order (very short)

Read in this order:
1. src/main.ts
2. src/app.module.ts
3. src/projects/projects.module.ts
4. src/projects/projects.controller.ts
5. src/projects/projects.service.ts
6. src/projects/dto/create-project.dto.ts
7. src/projects/dto/update-project.dto.ts

## 8) Django and Flask comparison

Django style mapping:
- urls.py route -> Nest controller decorator
- view function/class -> controller method
- business logic in service/helper -> Nest service
- serializer validation -> DTO + class-validator

Flask style mapping:
- @app.route -> Nest route decorators like @Get, @Post
- function body -> split into controller + service

So you already know the concept.
Nest just organizes it into files more strictly.

## 9) One sentence summary

You built a clean beginner backend where routes are in controller, logic is in service, input rules are in DTO, and module wires everything together.
