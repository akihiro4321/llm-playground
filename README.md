# llm-playground

LLM を使った簡易チャットアプリ（backend: Express + TypeScript / frontend: Vite + React + TypeScript）。

## 技術スタック

- バックエンド: Node.js / Express / OpenAI SDK / TypeScript
- フロントエンド: Vite / React 18 / TypeScript
- スタイル: シンプルな CSS（`frontend/src/styles.css`）
- 開発ポート: API `http://localhost:3001`、UI `http://localhost:5173`

## ディレクトリ構成

```
llm-playground/
├─ backend/            # API サーバー一式（Express, OpenAI 連携）
│  ├─ src/
│  │  ├─ config/          # 環境変数の読込・正規化
│  │  ├─ routes/          # API ルート定義（/api/chat など）
│  │  ├─ lib/             # 入力バリデーションなどの共通ロジック
│  │  ├─ services/        # 外部サービス連携（OpenAI クライアント）
│  │  ├─ middleware/      # 共通ミドルウェア（エラーハンドラ等）
│  │  ├─ knowledge/       # 参照ドキュメントと設定
│  │  ├─ rag/             # チャンク分割・埋め込み・検索ロジック
│  │  ├─ types/           # 型定義
│  │  ├─ modelConfig.ts   # モデル名・デフォルトプロンプト
│  │  └─ server.ts        # アプリ起動とルーティング設定
│  └─ dist/             # ビルド成果物（tsc / tsc-alias 実行後）
├─ frontend/           # チャット UI（Vite + React）
│  ├─ src/             # React コンポーネント・スタイル
│  └─ vite.config.ts   # `/api` のバックエンドプロキシ設定
└─ README.md           # 本ドキュメント
```

### Backend コード構成（backend/src 配下）

- `server.ts`: アプリのエントリーポイント。ミドルウェア登録、`/api` ルート、`/health`、エラーハンドラの組み立てを担当。
- `config/env.ts`: `PORT` と `OPENAI_API_KEY` の読み込み・正規化。起動時に一度だけ評価して再利用する。
- `routes/chat.ts`: `/api/chat` のルーティング層。入力整形と OpenAI 呼び出しをそれぞれのモジュールへ委譲し、レスポンスを返す。
- `lib/chatValidation.ts`: リクエストボディの検証・整形ロジック（role の許可チェックや空文字の排除、system プロンプトの補完）。
- `services/openaiClient.ts`: OpenAI クライアント生成とチャット API 呼び出し。API キー未設定時のスタブ応答や、API エラーの HTTP 変換を担う。
- `middleware/errorHandler.ts`: 共通エラーハンドラ。`HttpError` を HTTP ステータス付きで返し、それ以外を 500 にフォールバック。
- `types/chat.ts`: チャットメッセージとリクエストボディの型定義。フロントと共有しやすい形で管理。
- `modelConfig.ts`: デフォルトのモデル名とシステムプロンプトを一元管理。

### Frontend コード構成

- `src/App.tsx`: チャット UI の中核。入力フォーム、送信処理（/api/chat）、メッセージリスト表示、ローディング/エラー表示をまとめている。
- `src/main.tsx`: React のエントリーポイント。`App` を root にマウント。
- `src/styles.css`: 全体レイアウト・フォーム・メッセージリストなどのスタイル定義。
- `vite.config.ts`: フロントの開発サーバーで `/api` をバックエンド (http://localhost:3001) へプロキシする設定。

## アーキテクチャ構成（Mermaid）

```mermaid
flowchart LR
  subgraph Frontend["Frontend (Vite + React)"]
    UI["App.tsx<br/>チャット画面"]
    Styles["styles.css<br/>UI スタイル"]
    ConfigFE["vite.config.ts<br/>/api プロキシ"]
  end

  subgraph Backend["Backend (Express + TypeScript)"]
    Server["server.ts<br/>アプリ起動・ルート登録"]
    Routes["routes/chat.ts<br/>/api/chat ルート"]
    Validation["lib/chatValidation.ts<br/>入力検証・整形"]
    OpenAI["services/openaiClient.ts<br/>OpenAI 呼び出し/スタブ"]
    Env["config/env.ts<br/>環境変数読込"]
    ErrorMW["middleware/errorHandler.ts<br/>エラーハンドラ"]
    ModelCfg["modelConfig.ts<br/>モデル/システムプロンプト"]
  end

  User["ユーザー<br/>ブラウザ"]
  OpenAISDK["OpenAI API"]

  User --> UI
  UI -- fetch /api/chat --> Server
  ConfigFE -. dev proxy .- Server
  Server --> Routes
  Routes --> Validation
  Routes --> OpenAI
  Routes --> ErrorMW
  Validation --> ModelCfg
  OpenAI --> ModelCfg
  Env --> Server
  Routes --> Env
  OpenAI --> OpenAISDK
```

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
