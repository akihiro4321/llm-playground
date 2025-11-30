# Backend Guidelines

## Communication
- やり取りは日本語で行うこと。

## Project Structure
```
backend/
├─ src/
│  ├─ config/          # 環境変数の読込・正規化
│  ├─ routes/          # API ルート（/api/chat）
│  ├─ lib/             # 入力バリデーションなど共通ロジック
│  ├─ services/        # OpenAI クライアント生成・呼び出し
│  ├─ middleware/      # エラーハンドラ等
│  ├─ knowledge/       # 参照ドキュメントと設定（sample.txt）
│  ├─ rag/             # チャンク分割・埋め込み・類似検索
│  ├─ types/           # 型定義
│  ├─ modelConfig.ts   # モデル名/プロンプト設定
│  └─ server.ts        # アプリ起動・ルーティング
└─ .env                # OPENAI_API_KEY など（秘匿）
```

## Commands
- セットアップ: `cd backend && npm install`
- 開発: `npm run dev` (http://localhost:3001)
- フォーマット: `npx prettier --write "**/*.{ts,js,json}"`
- Lint: `npm run lint`
- 型チェック: `npm run build -- --noEmit`

## Coding Style
- TypeScript/ESM, async/await, 狭い型を優先
- import は `@/...` のエイリアスを使用
- Prettier 2-space indent、eslint + simple-import-sort 準拠
- コメントは必要最小限で意図を簡潔に
- 関数/メソッドにはTSDocを基本とし、@param/@returnsを簡潔に記載する

## Testing / Validation
- 変更後は `prettier` → `npm run lint` → `npm run build -- --noEmit` を推奨
- APIキー未設定時はスタブ応答になる点に留意
