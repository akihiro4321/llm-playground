# Repository Guidelines

## Project Structure
- `backend/`: Express API (`server.js`), `.env` for keys, `package.json` for scripts.
- `frontend/`: Vite + React (`src/App.jsx`, `src/main.jsx`, `styles.css`), `vite.config.js` proxies `/api` to backend.
- `.vscode/tasks.json`: VS Code tasks to run backend/frontend dev servers.
- `.gitignore`: excludes envs, logs, node_modules; keeps VS Code tasks/launch files.

## Build, Test, and Development
- Backend: `cd backend && npm install`, then `npm run dev` (http://localhost:3001). Set `OPENAI_API_KEY` in `backend/.env`.
- Frontend: `cd frontend && npm install`, then `npm run dev` (http://localhost:5173).
- VS Code: `Terminal > Run Task... > dev: all` starts both dev servers; terminate via `Tasks: Terminate Task`.
- No test suite yet; add Jest/Vitest as needed for backend/frontend respectively.

## Coding Style & Naming
- JavaScript (ESM) across backend/frontend; prefer const/let, async/await.
- Indent with 2 spaces; keep functions small and pure where possible.
- Components in `frontend/src` use PascalCase filenames (`App.jsx`); hooks in `hooks/` use camelCase export names.
- Env vars live in `backend/.env`; do not commit secrets. Use `.env` shape documented in README.

## Testing Guidelines
- Add tests near code (`frontend/src/__tests__`, `backend/__tests__` or `tests/`).
- Name test files `*.test.js|jsx`.
- Aim for coverage on API handlers and critical UI flows (form submit, error handling).
- Use `npm test` convention per package once introduced.

## Commit & Pull Requests
- Commit messages: short imperative summaries (e.g., `add chat stub`, `fix proxy config`).
- One logical change per commit; include relevant context in body if needed.
- PRs should describe changes, how to validate (commands/URLs), and screenshots/GIFs for UI tweaks.
- Link issues/tickets when available; call out breaking changes or config steps (.env updates).

## Security & Configuration
- Keep API keys out of git; use `backend/.env` and share via secure channels.
- Backend fails open with a stub reply if no key is set—do not ship that mode to production.
- Validate incoming payloads on new endpoints; add timeouts and error handling around external calls.
