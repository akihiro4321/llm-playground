# Repository Guidelines

## Communication

- やり取りは日本語で行うこと。

## Project Structure

- `backend/`: Express API in TypeScript (`server.ts`, `modelConfig.ts`), env vars in `backend/.env`.
- `frontend/`: Vite + React + TypeScript (`src/App.tsx`, `src/main.tsx`, `styles.css`), `vite.config.ts` proxies `/api`.
- `.vscode/`: launch/tasks/settings for dev servers and auto-format/lint on save.
- `.prettierrc`, eslint configs per package; `.gitignore` tracks only VS Code config needed for tasks.

## Build, Test, and Development

- Backend: `cd backend && npm install`, run `npm run dev` (http://localhost:3001). Requires `OPENAI_API_KEY` in `backend/.env`.
- Frontend: `cd frontend && npm install`, run `npm run dev` (http://localhost:5173).
- VS Code: `Terminal > Run Task... > dev: all` starts both dev servers; stop via “Tasks: Terminate Task”.
- No automated tests yet; add Vitest/Jest when expanding coverage.

## Coding Style & Naming

- TypeScript first; use `const`/`let`, async/await, narrow types, and shared message types where possible.
- Formatting: Prettier (settings in `.prettierrc`), 2-space indent. Save-on-format enabled via VS Code.
- Imports: eslint + simple-import-sort enforce ordering; unused imports removed automatically on save.
- Components use PascalCase filenames; hooks/use-functions in camelCase.
- Keep secrets out of git (`backend/.env`); document new env keys in README.

## Validation Checklist (run after changes)

- Backend formatting/lint/type: `cd backend && npx prettier --write "**/*.{ts,js,json}" && npm run lint && npm run build -- --noEmit`
- Frontend formatting/lint/type: `cd frontend && npx prettier --write "**/*.{ts,tsx,js,jsx,css,json}" && npm run lint && npm run build -- --noEmit`
- Confirm dev servers still start via `npm run dev` in each package or VS Code task.

## Testing Guidelines

- Add tests near code (`frontend/src/__tests__`, `backend/tests` or similar); name `*.test.ts[x]`.
- Cover API handlers and key UI flows (submit, error states, loading). Use `npm test` per package once added.

## Commit & Pull Requests

- Messages: short imperative (e.g., `add prompt selector`, `fix chat layout`).
- One logical change per commit; include validation commands in PR descriptions plus screenshots/GIFs for UI.
- Link issues and call out breaking changes or env/config updates.

## Security & Configuration

- Never commit secrets; share `.env` securely. Validate payloads and handle external API errors/timeouts defensively.
