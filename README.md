# llm-playground

LLM を使った簡易チャットアプリ（backend: Express + TypeScript / frontend: Vite + React + TypeScript）。

## 技術スタック

- バックエンド: Node.js / Express / OpenAI SDK / TypeScript
- フロントエンド: Vite / React 18 / TypeScript
- スタイル: シンプルな CSS（`frontend/src/styles.css`）
- 開発ポート: API `http://localhost:3001`、UI `http://localhost:5173`

## ディレクトリ構成

- `backend/` : `/api/chat` を提供する Express サーバー
- `frontend/`: React のチャット UI（Vite）
- `backend/modelConfig.ts`: 使用する OpenAI モデル名を一元管理（デフォルト: `gpt-5-mini`）

## 機能概要

- `POST /api/chat`: `{ messages: ChatMessage[], systemPrompt?: string }` を受け取り、OpenAI (`gpt-5-mini`) で応答を返す
  - API キー未設定時はスタブで固定メッセージを返す
- `GET /health`: ヘルスチェック
- フロントエンド: 単一ページで入力 → `/api/chat` に送信 → 応答表示

## 使い方

### 前提

- Node.js 18+ 推奨
- OpenAI API キー（`backend/.env` に設定）

### セットアップ

```bash
# backend
cd backend
npm install
npm run dev
npm run build # dist/server.js を生成（必要なら）

# frontend
cd ../frontend
npm install
npm run dev  # http://localhost:5173
```

バックエンドは `http://localhost:3001`、フロントエンドは `http://localhost:5173` で起動します。フロントエンドからの `/api` リクエストは Vite の proxy 設定でバックエンドに転送されます。

### 環境変数

- `backend/.env`
  - `OPENAI_API_KEY`: 必須。未設定時はスタブ応答。
  - `PORT`: 任意。指定しない場合は 3001。

### 備考

- API キーを設定しない場合、バックエンドはスタブの応答を返します。
- `/health` にアクセスするとヘルスチェックができます。
