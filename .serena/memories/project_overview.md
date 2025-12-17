# llm-playground Project Overview

## Purpose
`llm-playground` is a simplified chat application utilizing Large Language Models (LLMs) via the OpenAI API, demonstrating a Retrieval-Augmented Generation (RAG) architecture with Qdrant as a vector database.

## Tech Stack
### Infrastructure
- **Vector Database:** Qdrant (Docker Compose)
- **Database:** SQLite (Prisma ORM)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Dependency Injection:** `awilix`
- **AI Integration:** OpenAI SDK, LangChain (`@langchain/openai`, `@langchain/core`)
- **Vector Search:** `@qdrant/js-client-rest`, `@langchain/qdrant`

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Architecture:** Feature-Sliced Design (FSD)
- **Styling:** CSS Modules / Global CSS

## Codebase Structure
- `backend/src/`: Backend source code.
    - `app/`: Server entry point, DI container, routes.
    - `modules/`: Feature-specific modules (chat, history, rag, agent, learning).
    - `shared/`: Shared utilities, middleware, types.
    - `knowledge/`: Knowledge documents for RAG.
- `frontend/src/`: Frontend source code (FSD layers).
    - `app/`: Global app configuration and styles.
    - `pages/`: Page composition.
    - `widgets/`: Major UI blocks.
    - `features/`: User interactions.
    - `entities/`: Domain business logic.
    - `shared/`: Reusable utils and API clients.
- `docker-compose.yml`: Infrastructure services (Qdrant).
