# Tech Stack - llm-playground

## Core Technologies
- **Language:** TypeScript (Strict mode enabled)
- **Backend Framework:** Node.js / Hono
- **Frontend Framework:** Vite / React 18

## Architecture & Infrastructure
- **Frontend Architecture:** Feature-Sliced Design (FSD)
- **Dependency Injection:** Awilix (Backend)
- **API Communication:** REST (Hono)

## Data & Search
- **Database:** SQLite
- **ORM:** Prisma
- **Vector Database:** Qdrant (for RAG and semantic search)

## AI & Agentic Logic
- **SDKs:** OpenAI SDK
- **Orchestration:** LangChain, LangGraph (for multi-agent workflows)
- **Tracing:** LangSmith (configured for observability)

## Development & Quality
- **Linting:** ESLint
- **Formatting:** Prettier
- **Runtime Tooling:** tsx (for development), tsc (for builds)
