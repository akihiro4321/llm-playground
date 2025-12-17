# Coding Style and Conventions

## Formatting & Linting
- **Prettier:** Double quotes, ES5 trailing commas, 100 character print width.
- **ESLint:** Strict TypeScript rules, simple import sort (imports must be sorted).
- **Naming:** CamelCase for variables/functions, PascalCase for classes/components/types.

## Backend Patterns
- **Dependency Injection (Awilix):**
    - Use `awilix` for dependency management.
    - Register dependencies in `backend/src/app/container/` modules (`config.module.ts`, `clients.module.ts`, `repositories.module.ts`).
    - Define types in `types.ts` and extend `Cradle`.
    - Access dependencies via `req.cradle` in routes.
- **Modularity:** Logic is organized into `modules/` (e.g., `modules/chat`, `modules/rag`).

## Frontend Patterns (Feature-Sliced Design)
- **Layers:** `app`, `pages`, `widgets`, `features`, `entities`, `shared`.
- **Import Rules:** Follow the FSD hierarchy (e.g., `features` cannot import from `pages` or `widgets`).
- **Paths:** Use `@` alias for `src/` (e.g., `@/shared/api/chat`).

## General Guidelines
- **TypeScript:** Use strict mode and explicit types.
- **Async/Await:** Prefer async/await over promises.
- **Error Handling:** Use centralized error handling (middleware in backend).
- **Comments:** Prefer Japanese for documentation and high-level comments in this project (as per memory).
