# llm-playground Project Context

## Project Overview

`llm-playground` is a full-stack application designed as a simplified chat interface leveraging Large Language Models (LLMs) via the OpenAI API. It demonstrates a Retrieval-Augmented Generation (RAG) architecture using Qdrant as a vector database.

The project is divided into two main parts:
- **Backend:** A Node.js/Express application handling API requests, LLM integration, and RAG logic.
- **Frontend:** A React application (built with Vite) providing the user interface, structured according to Feature-Sliced Design (FSD) principles.

## Architecture & Tech Stack

### Infrastructure
- **Vector Database:** Qdrant (running via Docker Compose on ports 6333/6334)
- **Containerization:** Docker Compose (`docker-compose.yml`) for local infrastructure.

### Backend (`/backend`)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **AI Integration:** OpenAI SDK (`openai`)
- **Vector Search:** `@qdrant/js-client-rest`
- **Development Tooling:** `tsx` for watch mode, `tsc` for building, `eslint` + `prettier` for code quality.
- **Key Directories:**
    - `src/rag/`: Logic for document chunking, embeddings, and vector search.
    - `src/knowledge/`: Source documents for RAG.
    - `src/services/`: Business logic (ChatService).
    - `src/infrastructure/`: External service clients (OpenAI).

### Frontend (`/frontend`)
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Architecture:** Feature-Sliced Design (FSD)
    - `app/`: Global app configuration and styles.
    - `pages/`: Page composition (e.g., `ChatPage`).
    - `widgets/`: Major UI blocks (e.g., `ChatWindow`, `ChatLog`).
    - `features/`: User interactions (e.g., `ChatForm`, `SystemPromptSettings`).
    - `entities/`: Domain business logic (e.g., `message`).
    - `shared/`: Reusable utils and API clients.
- **Styling:** CSS Modules / Global CSS (`app/styles/index.css`)

## Development Workflow

### Prerequisites
- Node.js (v18+ recommended)
- Docker & Docker Compose (for Qdrant)
- OpenAI API Key

### Getting Started

1.  **Start Infrastructure (Qdrant):**
    ```bash
    docker compose up -d
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    # Create .env file with OPENAI_API_KEY if needed
    npm run dev
    ```
    - Runs on: `http://localhost:3001`
    - API Endpoint: `POST /api/chat`
    - Health Check: `GET /health`

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    - Runs on: `http://localhost:5173`
    - Proxies `/api` requests to `http://localhost:3001` (configured in `vite.config.ts`).

### Build Commands
- **Backend:** `npm run build` (Outputs to `dist/`, copies knowledge docs via `postbuild`)
- **Frontend:** `npm run build` (Outputs to `dist/`)

## Code Conventions

- **TypeScript:** Strict mode is enabled. Use explicit types where possible.
- **Linting:** ESLint is configured. Respect existing rules.
- **Formatting:** Prettier is used.
- **Imports:**
    - Backend: Uses standard ES modules import style.
    - Frontend: FSD layers should respect the hierarchy (e.g., `features` can import `entities` and `shared`, but not `pages`).
- **RAG/Knowledge:**
    - New knowledge documents should be placed in `backend/src/knowledge/docs/` (or similar, check `backend/src/rag/loader.ts` logic).
    - The backend handles indexing on startup or demand (verify implementation details in `vectorIndexer.ts`).

## Key Files for Context

- `README.md`: Detailed project documentation (Japanese).
- `docker-compose.yml`: Qdrant service definition.
- `backend/src/server.ts`: Backend entry point.
- `backend/src/rag/`: Core RAG implementation details.
- `frontend/src/app/index.tsx`: Frontend entry point.
- `frontend/vite.config.ts`: Proxy configuration.
