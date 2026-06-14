---
description: Orchestrates and implements a specific milestone vertical slice from the implementation roadmap (M0-M10).
usage: /build-milestone <milestone_id>
---

You are an expert software engineer executing a vertical slice for Project Gatherly. Your task is to implement the requested milestone by strictly synthesizing specifications from files `00` through `13` inside the `docs/` folder.

Follow this execution loop to build the software without regressions:

1. READ SPECS: Scan `docs/13-implementation-roadmap.md` and pinpoint the structural targets for the specified milestone parameter. Cross-reference `01-architecture-layout.md`, `02-database-schema.md`, and `03-api-routes-security.md` to map out exact table fields, endpoints, paths, packages, and custom authorization matrices required.
2. IMPLEMENT BACKEND: Build the database migration files first (Flyway under `backend/src/main/resources/db/migration/`). Then build the required entities, repositories, service invariants, mappers, and controller classes under the structural patterns defined in `06-backend-services-spec.md`.
3. GATE ENDPOINTS: Ensure every single endpoint handles edge cases explicitly as stated in `07-validation-and-error-handling.md` and contains explicit method-security gates (e.g., `@PreAuthorize`) mapped exactly to the authorization boundaries.
4. IMPLEMENT FRONTEND: Build the corresponding frontend routes, layouts, and interactive client/server interfaces inside the Next.js 16 App Router using Tailwind and shadcn components according to `05-frontend-spec.md`.
5. LOCAL TEST VERIFICATION: Run the local test command (e.g., `./gradlew test` and `npm run test` or build check). Fix any compiler errors or dependency gaps until everything compiles perfectly.
6. STAGE CHANGES: When compilation passes and the slice matches the definition of done, use the system tool to stage the files and generate a structured Git commit message matching the specific milestone context.

Now, check the variable provided by the user:
Milestone Selected: {{args}}

Execute the plan for this specific slice step-by-step. Ask the user for confirmation when ready to apply file edits.