# Frontend Guidelines

## Communication
- やり取りは日本語で行うこと。

## Project Structure (FSD)
```
src/
├─ app/
│  ├─ index.tsx            # エントリ + グローバルスタイル読込
│  └─ styles/index.css     # グローバルCSS
├─ pages/
│  └─ chat/ui/ChatPage.tsx # 薄いページコンテナ
├─ widgets/
│  ├─ chat-window/ui/ChatWindow.tsx # チャット画面全体
│  ├─ chat-log/ui/ChatLog.tsx       # メッセージ履歴表示
│  └─ header/ui/Header.tsx          # ヒーローヘッダー
├─ features/
│  └─ chat/
│     ├─ model/useChat.ts           # チャット状態・送信ロジック
│     ├─ ui/ChatForm.tsx            # 入力フォーム＋送信ボタン
│     ├─ ui/SystemPromptSettings.tsx# プリセット/カスタム/RAGトグル
│     └─ index.ts                   # エクスポート集約
├─ entities/
│  └─ message/
│     ├─ model/types.ts             # メッセージ/ロール/プリセット型
│     └─ index.ts                   # 再エクスポート
└─ shared/
   ├─ api/chat.ts                   # `/api/chat` クライアント
   └─ config/chatConfig.ts          # エンドポイント/プリセット設定
```

## Commands
- セットアップ: `cd frontend && npm install`
- 開発: `npm run dev` (http://localhost:5173)
- フォーマット/Lint: `npm run lint`（eslint + simple-import-sort）
- 型チェック: `npx tsc --noEmit`
- ビルド: `npm run build`

## Coding Style
- TypeScript/React 18、エイリアス `@/*`
- インポート順は simple-import-sort に従う
- コンポーネントは PascalCase、hooks は camelCase
- コメントは必要最小限で意図のみを簡潔に

## Testing / Validation
- 変更後は `npm run lint` と `npx tsc --noEmit` を実行
- FSDの依存方向: Pages → Widgets → Features → Entities/Shared を遵守
