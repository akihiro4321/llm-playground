# Repository Guidelines (Common Rules)

## Communication
- やり取りは日本語で行うこと。

## Structure Overview
- `backend/`: Express + TypeScript。詳細は `backend/AGENTS.md` を参照。
- `frontend/`: Vite + React + TypeScript（FSD）。詳細は `frontend/AGENTS.md` を参照。
- 共通設定: `.vscode/`, `.prettierrc`, eslint configs, `.gitignore`。

## Development / Validation
- 依存インストール: `npm install` を各パッケージで実行。
- 開発: `npm run dev`（backend:3001 / frontend:5173）。VS Code タスク `dev: all` で Qdrant（Docker Compose）→ backend → frontend を順に起動可能。
- 検証: 各パッケージで `npm run lint` / `npx tsc --noEmit`（または backend: `npm run build -- --noEmit`）。
- フォーマット: `prettier` + simple-import-sort（eslintのfixで整列）。

## Coding Style
- TypeScript優先、async/await、狭い型、`@/*` エイリアス。
- インデント2スペース、コメントは意図を簡潔に。
- コンポーネントはPascalCase、hooksはcamelCase。

## Testing
- 重要ロジックは近傍にテストを追加（backend/tests, frontend/src/__tests__ など）。
- UI/フローやAPIハンドラのリグレッションを重視。

## Security / Secrets
- `.env` を秘匿し、キーはコミットしない。新規環境変数はREADMEや各AGENTSに追記。
- Qdrant の接続先は `QDRANT_URL` で指定（デフォルト `http://localhost:6333`）。Docker Compose で起動する場合は `docker compose up -d` を使用。

## Commits / PR
- 短い命令形メッセージで1変更1コミットを基本とする。
- PRでは実行した検証コマンドを明記し、設定変更やbreaking changeを記載。
