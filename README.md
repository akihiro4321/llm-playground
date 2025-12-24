# llm-playground

LLM を使った簡易チャットアプリ（backend: Hono + TypeScript + Prisma / frontend: Vite + React + TypeScript）。

## 技術スタック

- バックエンド: Node.js / Hono / OpenAI SDK / TypeScript / Prisma (SQLite)
- フロントエンド: Vite / React 18 / TypeScript
- スタイル: シンプルな CSS（`frontend/src/app/styles/index.css`）
- データベース: SQLite (Prisma ORM)
- ベクトル検索: Qdrant
- 開発ポート: API `http://localhost:3001`、UI `http://localhost:5173`

## ディレクトリ構成

```
llm-playground/
├─ backend/            # API サーバー一式（Hono, OpenAI, Prisma）
│  ├─ src/
│  │  ├─ config/          # 環境変数の読込・正規化
│  │  ├─ routes/          # API ルート定義（/api/chat, /history など集約）
│  │  ├─ lib/             # 共通ロジック（Prismaクライアント, バリデーション）
│  │  ├─ services/        # ドメインサービス（チャット処理）
│  │  ├─ middleware/      # 共通ミドルウェア（エラーハンドラ等）
│  │  ├─ infrastructure/  # 外部サービスクライアント（OpenAI など）
│  │  ├─ knowledge/       # 参照ドキュメントと設定
│  │  ├─ rag/             # RAGロジック（Qdrant 連携）
│  │  ├─ types/           # 型定義
│  │  ├─ modelConfig.ts   # モデル名・デフォルトプロンプト
│  │  └─ server.ts        # アプリ起動とルーティング設定
│  ├─ prisma/             # Prisma スキーマとマイグレーション
│  └─ dist/               # ビルド成果物
├─ frontend/           # チャット UI（Vite + React, Feature-Sliced Design）
│  ├─ src/
│  │  ├─ app/              # エントリ/App構成・グローバルスタイル
│  │  ├─ pages/chat/       # ページコンテナ
│  │  ├─ features/         # UI＋ロジック単位（チャット・サイドバー・設定）
│  │  ├─ widgets/          # ページを構成する大きめ部品（チャットウィンドウ）
│  │  ├─ entities/         # ドメイン型（メッセージ）
│  │  ├─ shared/api/       # API クライアント（chat, history, knowledge）
│  │  ├─ shared/config/    # 設定
│  │  └─ app/styles/       # グローバルスタイル
│  └─ vite.config.ts   # `/api` のバックエンドプロキシ設定
└─ README.md           # 本ドキュメント
```

### Backend コード構成（backend/src 配下）

- `server.ts`: エントリーポイント。`buildApiRouter` を使用して `/api` 以下のルーティングを一括登録。
- `routes/index.ts`: ルーターの集約（`/chat`, `/knowledge`, `/history`）。
- `routes/history.ts`: チャット履歴（スレッド・メッセージ）の取得・削除。
- `services/chatService.ts`: チャット処理。Prisma を使用して会話履歴の保存、RAG 検索、OpenAI 応答生成を行う。
- `lib/prisma.ts`: Prisma Client のインスタンス化。
- `rag/`: RAG 関連（Qdrant 連携）。
- `prisma/schema.prisma`: SQLite データベーススキーマ定義（ChatThread, ChatMessage）。

### Frontend コード構成（Feature-Sliced Design）

- `src/widgets/chat-window/ui/ChatWindow.tsx`: メイン画面。サイドバーとチャットエリアをレイアウト。
- `src/features/chat/ui/ChatSidebar.tsx`: 左側のサイドバー。チャット履歴（スレッド）一覧を表示。
- `src/features/chat/model/useChat.ts`: チャットの全状態管理（メッセージ、スレッド、設定）。
- `src/shared/api/history.ts`: 履歴取得・削除用 API クライアント。

## 機能概要

- `POST /api/chat`: メッセージ送信。履歴保存、RAG 検索（オプション）、回答生成を行い、ストリーミングで応答。
- `GET /api/history/threads`: 過去のチャットスレッド一覧を取得。
- `GET /api/history/threads/:id/messages`: 特定スレッドのメッセージ履歴を取得。
- `DELETE /api/history/threads/:id`: スレッド削除。
- `GET /health`: ヘルスチェック。

## 使い方

### 前提

- Node.js 18+
- Docker (Qdrant 用)
- OpenAI API キー

### セットアップ

```bash
# 1. バックエンド (依存インストール & DBセットアップ)
cd backend
npm install
npm run dev
# 初回は自動的に Prisma マイグレーションが適用され、dev.db が作成されます

# 2. フロントエンド
cd ../frontend
npm install
npm run dev  # http://localhost:5173

# 3. インフラ (Qdrant)
cd ..
docker compose up -d
```

### 環境変数 (.env)

`backend/.env` に以下を設定（`.env.example` 参考）:
```
OPENAI_API_KEY=sk-...
# DATABASE_URL="file:./dev.db" (デフォルト)
# QDRANT_URL="http://localhost:6333" (デフォルト)
```