# llm-playground

LLM を使った簡易チャットアプリ（backend: Express / frontend: Vite + React）。

## 技術スタック
- バックエンド: Node.js / Express / OpenAI SDK
- フロントエンド: Vite / React 18
- スタイル: シンプルな CSS（`frontend/src/styles.css`）
- 開発ポート: API `http://localhost:3001`、UI `http://localhost:5173`

## ディレクトリ構成

- `backend/` : `/api/chat` を提供する Express サーバー
- `frontend/`: React のチャット UI（Vite）

## 機能概要
- `POST /api/chat`: `{ message: string }` を受け取り、OpenAI (`gpt-4.1-mini`) で生成した応答を返す
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
