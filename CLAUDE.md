# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack LLM playground with streaming chat, RAG (Retrieval-Augmented Generation), and persistent conversation history. Backend uses Express + TypeScript with LangChain (OpenAI integration) and Qdrant vector search. Frontend is React + Vite with Feature-Sliced Design architecture.

**Migration Status:** Chat functionality has been migrated to LangChain (`@langchain/openai`). RAG/Embeddings still use OpenAI SDK directly (to be migrated in Phase 5.3).

## Development Commands

### Starting the Application

**All services (Qdrant + Backend + Frontend):**
```bash
# VS Code Task: "dev: all"
# Or manually:
docker compose up -d          # Start Qdrant vector DB
cd backend && npm run dev     # Start API server on :3001
cd frontend && npm run dev    # Start UI on :5173
```

**Backend:**
```bash
cd backend
npm install
npm run dev                   # Development mode with tsx watch
npm run build                 # Build to dist/ and copy knowledge docs
npm start                     # Production mode (runs dist/server.js)

# Error Checking (IMPORTANT: Always run before committing)
npm run lint                  # ESLint check
npm run lint -- --fix         # ESLint auto-fix
npx tsc --noEmit              # TypeScript type check
npm run lint && npx tsc --noEmit  # Run both checks together
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                   # Development server on :5173
npm run build                 # Build to dist/
npm run preview               # Preview production build

# Error Checking (IMPORTANT: Always run before committing)
npm run lint                  # ESLint check
npm run lint -- --fix         # ESLint auto-fix
npx tsc --noEmit              # TypeScript type check
npm run lint && npx tsc --noEmit  # Run both checks together
```

**Database (Prisma):**
```bash
cd backend
npx prisma migrate dev        # Create and apply migration
npx prisma generate           # Generate Prisma client to src/generated/client
npx prisma studio             # Open Prisma Studio UI
```

## Architecture

### Backend Structure

**Path Aliases:** `@/*` maps to `src/*` (defined in [tsconfig.json](backend/tsconfig.json))

**Core Flow:**
- [server.ts](backend/src/server.ts) → Initializes Express app, LangChain ChatOpenAI model, registers routes (`/api/chat`, `/api/history`, `/api/knowledge`, `/api/learning`), error handler
- [routes/chat.ts](backend/src/routes/chat.ts) → Validates request → [services/chatService.ts](backend/src/services/chatService.ts) → Returns streaming response
- [services/chatService.ts](backend/src/services/chatService.ts) → Handles chat logic:
  1. Creates/retrieves chat thread (Prisma)
  2. Saves user message to DB
  3. If `useKnowledge=true`, searches relevant chunks via [rag/search.ts](backend/src/rag/search.ts) (OpenAI embeddings)
  4. Calls LangChain ChatOpenAI with streaming via [infrastructure/repositories/openaiRepository.ts](backend/src/infrastructure/repositories/openaiRepository.ts)
  5. Saves assistant response to DB after stream completes
  6. Returns `{ stream, threadId }`

**Key Directories:**
- `config/` - Environment variable loading ([env.ts](backend/src/config/env.ts)), LangChain ChatOpenAI initialization ([openai.ts](backend/src/config/openai.ts))
- `routes/` - Express route handlers
- `services/` - Business logic (ChatService)
- `infrastructure/` - External integrations and DI setup:
  - [container.ts](backend/src/infrastructure/container.ts) - **Awilix DI container configuration**
  - `repositories/` - External service adapters:
    - [openaiRepository.ts](backend/src/infrastructure/repositories/openaiRepository.ts) - LangChain ChatOpenAI streaming with tool calling
    - [chatRepository.ts](backend/src/infrastructure/repositories/chatRepository.ts) - Prisma database operations
    - [knowledgeRepository.ts](backend/src/infrastructure/repositories/knowledgeRepository.ts) - Qdrant vector search
- `rag/` - RAG implementation (chunking, embeddings, Qdrant search)
- `features/` - Domain features:
  - `agent/` - Tool definitions and function calling
  - `learning/` - Learning agent implementation (synchronous, OpenAI SDK)
- `lib/` - Utilities ([chatValidation.ts](backend/src/lib/chatValidation.ts), [prisma.ts](backend/src/lib/prisma.ts))
- `middleware/` - Express middleware (error handler)
- `types/` - TypeScript type definitions:
  - [awilix.d.ts](backend/src/types/awilix.d.ts) - DI container type extensions for Express Request
- `knowledge/docs/` - Source documents for RAG (copied to `dist/knowledge/docs/` on build)
- `generated/client/` - Prisma client (generated, don't edit)

**Model Configuration:**
- **Central Config:** [modelConfig.ts](backend/src/modelConfig.ts) defines all model names
  - `MODEL_NAME = "gpt-5-mini"` - Default LLM model for chat and agents
  - `EMBEDDING_MODEL = "text-embedding-3-small"` - Embedding model for RAG
  - `DEFAULT_SYSTEM_PROMPT` - Default system prompt for Japanese assistant
- **Usage:**
  - Chat (LangChain): Uses `MODEL_NAME` via [config/openai.ts](backend/src/config/openai.ts)
  - Learning Agent: Uses `MODEL_NAME` in [features/learning/simpleAgent.ts](backend/src/features/learning/simpleAgent.ts)
  - Embeddings: Uses `EMBEDDING_MODEL` in [rag/embeddings.ts](backend/src/rag/embeddings.ts)
- **Changing Models:** Edit `modelConfig.ts` to change models globally

**Database:**
- SQLite database managed by Prisma
- Schema: [prisma/schema.prisma](backend/prisma/schema.prisma)
- Models: `ChatThread` (id, title, timestamps), `ChatMessage` (role, content, threadId)
- Prisma client outputs to `src/generated/client/` (custom path)

**Dependency Injection (DI) Architecture:**
- **DI Container:** [Awilix](https://github.com/jeffijoe/awilix) for dependency injection
- **Modular Container Structure:** [infrastructure/container/](backend/src/infrastructure/container/)
  - **Prevents container file bloat** by splitting into domain-specific modules
  - **Module Files:**
    - [config.module.ts](backend/src/infrastructure/container/config.module.ts) - Environment & configuration
    - [clients.module.ts](backend/src/infrastructure/container/clients.module.ts) - External API clients (OpenAI, LangChain)
    - [repositories.module.ts](backend/src/infrastructure/container/repositories.module.ts) - Data access layer
    - [types.ts](backend/src/infrastructure/container/types.ts) - Type-safe `Cradle` interface
    - [index.ts](backend/src/infrastructure/container/index.ts) - Composes all modules
  - **Adding New Dependencies:**
    1. Add to appropriate module file (or create new module)
    2. Update `types.ts` `Cradle` interface
    3. Register in `index.ts` if new module
- **Request-scoped DI:**
  - `scopePerRequest` middleware from `awilix-express` creates a scoped container per request
  - Dependencies accessible via `req.cradle` in route handlers
  ```typescript
  router.post("/", async (req, res) => {
    const { chatModel, openaiClient } = req.cradle; // Type-safe DI
    // ...
  });
  ```
- **Registered Dependencies:**
  - **Config:** `env`
  - **Clients:** `chatModel`, `openaiClient`
  - **Repositories:** `chatRepository`, `knowledgeRepository`, `openaiRepository`
- **Type Safety:** Express Request extended with `container` and `cradle` properties ([types/awilix.d.ts](backend/src/types/awilix.d.ts))
- **Benefits:**
  - **Scalable:** Each module stays small even as dependencies grow
  - **Organized:** Dependencies grouped by domain/layer
  - Easy testing (mock dependencies by replacing in container)
  - Loose coupling between layers
  - No manual dependency passing through function arguments

**RAG Implementation:**
- Documents in `knowledge/docs/` are split into chunks ([rag/loader.ts](backend/src/rag/loader.ts))
- Chunks are embedded using OpenAI embeddings ([rag/embeddings.ts](backend/src/rag/embeddings.ts))
- Vectors stored in Qdrant ([rag/vectorStore.ts](backend/src/rag/vectorStore.ts))
- Search via cosine similarity ([rag/search.ts](backend/src/rag/search.ts))
- When `useKnowledge=true`, top-K chunks are injected as system message

**Streaming Chat:**
- Routes use `res.setHeader('Content-Type', 'text/event-stream')` and `res.write()`
- LangChain streaming chunks (`{ content: string }`) are forwarded directly
- Thread ID sent via `X-Thread-Id` header
- Response saved to DB after stream completes via wrapped generator

**LangChain Integration:**
- **Chat Model:** `ChatOpenAI` from `@langchain/openai` (initialized in [config/openai.ts](backend/src/config/openai.ts))
  - Model: `gpt-5-mini` (configured via `MODEL_NAME` in [modelConfig.ts](backend/src/modelConfig.ts))
- **Message Conversion:** `ChatMessage` → LangChain `BaseMessage` (SystemMessage, HumanMessage, AIMessage, ToolMessage)
- **Tool Calling:** `.bindTools()` for function calling, recursive execution for multi-turn agent flows
- **Streaming:** `.stream()` method yields chunks as `{ content: string }` objects
- **Migration Path:**
  - ✅ Phase 5.1: Chat functionality migrated to LangChain, unified model configuration, Awilix DI container introduced
  - ⏳ Phase 5.2: LangSmith observability (planned)
  - ⏳ Phase 5.3: RAG/Embeddings migration to LangChain (planned)

### Frontend Structure

**Feature-Sliced Design (FSD) layers** (import rules: higher layers can import lower, not vice versa):
- `app/` - Application setup, global styles, entry point ([index.tsx](frontend/src/app/index.tsx))
- `pages/` - Page-level components ([pages/chat/ui/ChatPage.tsx](frontend/src/pages/chat/ui/ChatPage.tsx))
- `widgets/` - Composite UI blocks ([chat-window/](frontend/src/widgets/chat-window/), [chat-log/](frontend/src/widgets/chat-log/), [header/](frontend/src/widgets/header/))
- `features/` - User interactions ([chat/model/useChat.ts](frontend/src/features/chat/model/useChat.ts), [chat/ui/ChatForm.tsx](frontend/src/features/chat/ui/ChatForm.tsx))
- `entities/` - Business entities ([message/](frontend/src/entities/message/))
- `shared/` - Reusable code ([api/chat.ts](frontend/src/shared/api/chat.ts), [config/chatConfig.ts](frontend/src/shared/config/chatConfig.ts))

**Key Files:**
- [features/chat/model/useChat.ts](frontend/src/features/chat/model/useChat.ts) - Chat state management, streaming response handling
- [shared/api/chat.ts](frontend/src/shared/api/chat.ts) - Fetch to `/api/chat` endpoint
- [vite.config.ts](frontend/vite.config.ts) - Proxies `/api/*` to `http://localhost:3001` in dev mode

**Path Aliases:** `@/*` maps to `src/*` (defined in [vite.config.ts](frontend/vite.config.ts))

## Key Patterns

### Adding New Chat Features

1. **Backend:** Update [types/chat.ts](backend/src/types/chat.ts) for request/response types
2. **Backend:** Modify [services/chatService.ts](backend/src/services/chatService.ts) for business logic
3. **Frontend:** Update [shared/api/chat.ts](frontend/src/shared/api/chat.ts) API client
4. **Frontend:** Modify [features/chat/model/useChat.ts](frontend/src/features/chat/model/useChat.ts) state management
5. **Frontend:** Update UI in [widgets/chat-window/](frontend/src/widgets/chat-window/) or [features/chat/ui/](frontend/src/features/chat/ui/)

### Working with RAG

- Documents go in `backend/knowledge/docs/` (plain text `.txt` files)
- Configure document metadata in [rag/docsConfig.ts](backend/src/rag/docsConfig.ts)
- Run indexing: implement and call functions from [rag/vectorIndexer.ts](backend/src/rag/vectorIndexer.ts)
- Search parameters (topK, threshold) configured in [services/chatService.ts](backend/src/services/chatService.ts):66

### Working with Dependency Injection

**Adding a New Dependency:**
1. Define the dependency type in [infrastructure/container.ts](backend/src/infrastructure/container.ts) → `Cradle` interface
2. Register the dependency in `configureContainer()` using `asValue`, `asFunction`, or `asClass`
3. Access in route handlers via `req.cradle.yourDependency`

**Example:**
```typescript
// 1. Add to Cradle interface
export interface Cradle {
  myService: MyService;
}

// 2. Register in container
container.register({
  myService: asClass(MyService).singleton(),
});

// 3. Use in route
router.post("/", async (req, res) => {
  const { myService } = req.cradle;
  const result = await myService.doSomething();
});
```

**Testing with DI:**
- Create a test container with mocked dependencies
- Easier to isolate and test individual components

### Database Schema Changes

1. Edit [prisma/schema.prisma](backend/prisma/schema.prisma)
2. Run `npx prisma migrate dev --name <description>`
3. Prisma client auto-regenerates to `src/generated/client/`
4. Import from `@/lib/prisma` or `@/generated/client`

## Environment Variables

**backend/.env:**
```
# Required
OPENAI_API_KEY=sk-...          # Required for LLM (falls back to stub if missing)

# Optional - Server
PORT=3001                      # Optional, defaults to 3001

# Optional - Database & Vector Store
QDRANT_URL=http://localhost:6333  # Optional, defaults to localhost:6333
DATABASE_URL=file:./dev.db     # SQLite database path

# Optional - LangSmith Observability (Phase 5.2+)
LANGCHAIN_TRACING_V2=true      # Enable LangSmith tracing
LANGCHAIN_API_KEY=lsv2_...     # LangSmith API key
LANGCHAIN_PROJECT=llm-playground  # Project name in LangSmith
```

## Important Notes

- **OpenAI API Key:** Backend runs with stub responses if `OPENAI_API_KEY` is not set
- **LangChain:** Chat functionality uses `@langchain/openai` for abstraction and future observability
- **Dependency Injection:** Uses Awilix for DI - dependencies accessible via `req.cradle` in route handlers, no manual passing required
- **Dual Client Setup:** DI container manages both LangChain ChatOpenAI (for chat) and OpenAI SDK (for embeddings) as singletons
- **Qdrant:** Must be running (`docker compose up -d`) for RAG features
- **Streaming:** Chat responses use Server-Sent Events (SSE) format with LangChain streaming chunks
- **TypeScript:** Strict mode enabled, use explicit types - DI container is fully typed via `Cradle` interface
- **Build:** Backend uses `tsc-alias` to resolve `@/*` imports in build output
- **Prisma:** Custom output path `src/generated/client/` instead of `node_modules/.prisma/client`
- **Code Quality:** ESLint auto-fix enabled on save (including import sorting via `simple-import-sort`)

## Error Checking Best Practices

**CRITICAL: Always run these checks before committing code:**

1. **TypeScript Type Check:**
   ```bash
   npx tsc --noEmit
   ```
   - Catches type errors without generating output files
   - Must pass with zero errors before commit

2. **ESLint Check:**
   ```bash
   npm run lint
   ```
   - Checks code style and potential issues
   - Auto-fix available: `npm run lint -- --fix`

3. **Combined Check (Recommended):**
   ```bash
   npm run lint && npx tsc --noEmit
   ```
   - Runs both checks in sequence
   - Fails fast if either check fails

4. **Build Test:**
   ```bash
   npm run build
   ```
   - Final verification that code compiles and builds successfully
   - Ensures `@/*` path aliases resolve correctly

**Common Issues:**
- **Import order errors:** Run `npm run lint -- --fix` to auto-sort imports
- **Unused variables:** Remove or prefix with `_` (e.g., `_unusedVar`)
- **Type errors:** Check return types, function signatures, and type annotations
- **cSpell warnings:** Add technical terms to `.vscode/settings.json` → `cSpell.words` array