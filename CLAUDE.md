# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack LLM playground with streaming chat, RAG (Retrieval-Augmented Generation), and persistent conversation history. Backend uses Express + TypeScript with OpenAI integration and Qdrant vector search. Frontend is React + Vite with Feature-Sliced Design architecture.

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
npm run lint                  # ESLint
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                   # Development server on :5173
npm run build                 # Build to dist/
npm run preview               # Preview production build
npm run lint                  # ESLint
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
- [server.ts](backend/src/server.ts) → Initializes Express app, registers routes (`/api/chat`, `/api/history`, `/api/knowledge`), error handler
- [routes/chat.ts](backend/src/routes/chat.ts) → Validates request → [services/chatService.ts](backend/src/services/chatService.ts) → Returns streaming response
- [services/chatService.ts](backend/src/services/chatService.ts) → Handles chat logic:
  1. Creates/retrieves chat thread (Prisma)
  2. Saves user message to DB
  3. If `useKnowledge=true`, searches relevant chunks via [rag/search.ts](backend/src/rag/search.ts)
  4. Calls OpenAI with streaming
  5. Saves assistant response to DB after stream completes
  6. Returns `{ stream, threadId }`

**Key Directories:**
- `config/` - Environment variable loading ([env.ts](backend/src/config/env.ts))
- `routes/` - Express route handlers
- `services/` - Business logic (ChatService)
- `infrastructure/` - External service clients ([openaiClient.ts](backend/src/infrastructure/openaiClient.ts))
- `rag/` - RAG implementation (chunking, embeddings, Qdrant search)
- `lib/` - Utilities ([chatValidation.ts](backend/src/lib/chatValidation.ts), [prisma.ts](backend/src/lib/prisma.ts))
- `middleware/` - Express middleware (error handler)
- `types/` - TypeScript type definitions
- `knowledge/docs/` - Source documents for RAG (copied to `dist/knowledge/docs/` on build)
- `generated/client/` - Prisma client (generated, don't edit)

**Database:**
- SQLite database managed by Prisma
- Schema: [prisma/schema.prisma](backend/prisma/schema.prisma)
- Models: `ChatThread` (id, title, timestamps), `ChatMessage` (role, content, threadId)
- Prisma client outputs to `src/generated/client/` (custom path)

**RAG Implementation:**
- Documents in `knowledge/docs/` are split into chunks ([rag/loader.ts](backend/src/rag/loader.ts))
- Chunks are embedded using OpenAI embeddings ([rag/embeddings.ts](backend/src/rag/embeddings.ts))
- Vectors stored in Qdrant ([rag/vectorStore.ts](backend/src/rag/vectorStore.ts))
- Search via cosine similarity ([rag/search.ts](backend/src/rag/search.ts))
- When `useKnowledge=true`, top-K chunks are injected as system message

**Streaming Chat:**
- Routes use `res.setHeader('Content-Type', 'text/event-stream')` and `res.write()`
- OpenAI streaming chunks are forwarded with `data: ${JSON.stringify(chunk)}\n\n` format
- Thread ID sent as final `data: [THREAD_ID]${threadId}\n\n` message
- Response saved to DB after stream completes via wrapped generator

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

### Database Schema Changes

1. Edit [prisma/schema.prisma](backend/prisma/schema.prisma)
2. Run `npx prisma migrate dev --name <description>`
3. Prisma client auto-regenerates to `src/generated/client/`
4. Import from `@/lib/prisma` or `@/generated/client`

## Environment Variables

**backend/.env:**
```
OPENAI_API_KEY=sk-...          # Required for LLM (falls back to stub if missing)
PORT=3001                      # Optional, defaults to 3001
QDRANT_URL=http://localhost:6333  # Optional, defaults to localhost:6333
DATABASE_URL=file:./dev.db     # SQLite database path
```

## Important Notes

- **OpenAI API Key:** Backend runs with stub responses if `OPENAI_API_KEY` is not set
- **Qdrant:** Must be running (`docker compose up -d`) for RAG features
- **Streaming:** Chat responses use Server-Sent Events (SSE) format
- **TypeScript:** Strict mode enabled, use explicit types
- **Build:** Backend uses `tsc-alias` to resolve `@/*` imports in build output
- **Prisma:** Custom output path `src/generated/client/` instead of `node_modules/.prisma/client`