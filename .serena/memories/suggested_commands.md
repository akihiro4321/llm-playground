# Suggested Commands for llm-playground

## Infrastructure (Qdrant)
- `docker compose up -d`: Start Qdrant.
- `docker compose down`: Stop Qdrant.

## Backend Commands
- `cd backend && npm run dev`: Start backend in watch mode.
- `cd backend && npm run build`: Build backend.
- `cd backend && npm start`: Start production server.
- `cd backend && npm run lint`: Run ESLint.
- `cd backend && npm run db:delete-qdrant`: Delete Qdrant index.

## Frontend Commands
- `cd frontend && npm run dev`: Start frontend dev server (Vite).
- `cd frontend && npm run build`: Build frontend.
- `cd frontend && npm run preview`: Preview production build.
- `cd frontend && npm run lint`: Run ESLint.

## General Commands (Darwin)
- `git status`: Check git status.
- `git log -n 3`: View recent commits.
- `ls -R`: List files recursively.
- `grep -r "pattern" .`: Search for pattern in files.
- `find . -name "filename"`: Find files by name.
