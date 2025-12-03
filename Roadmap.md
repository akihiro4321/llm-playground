🚀 LLM Playground 開発ロードマップ & 実装ガイド
このドキュメントは、llm-playground アプリケーションを拡張し、LLMアプリ開発スキルを習得するための詳細なステップバイステップガイドです。
前提: 現在のプロジェクトは Feature-Sliced Design (FSD) と Qdrant (RAG) を導入済みです。
📅 全体スケジュール概要 (目安: 3週間)
| フェーズ | 期間 | テーマ | 主な実装内容 |
|---|---|---|---|
| Phase 1 | Day 1-3 | UX改善 | ストリーミング応答 (Server-Sent Events) |
| Phase 2 | Day 4-10 | データ永続化 | Prisma + SQLite 導入、会話履歴の保存・表示 |
| Phase 3 | Day 11-14 | RAG高度化 | チャンク分割ロジックの改善 (Recursive Split) |
| Phase 4 | Day 15-21 | Agent機能 | Function Calling (Tool Use) の実装 |
🚩 Phase 1: ストリーミング応答の実装 (UX改善)
目標: ユーザーの待機時間をなくし、ChatGPTのように文字が逐次表示されるようにする。
✅ Step 1.1: Backend - OpenAIクライアントのストリーム対応
現在の await で一括取得している部分を、stream: true に変更し、イテレータを返すようにします。
ファイル: backend/src/infrastructure/openaiClient.ts
🤖 Codex用プロンプト
`backend/src/infrastructure/openaiClient.ts` を修正してください。
`generateChatReply` 関数を改修し、OpenAI APIの `stream: true` オプションを有効にしてください。
戻り値の型を `Promise<string>` から `Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>>` (または適切なストリーム型) に変更し、ストリームオブジェクトをそのまま返却するようにしてください。
スタブ応答の場合も、非同期イテレータを使って少しずつ文字を返すように擬似的に実装してください。

✅ Step 1.2: Backend - APIレスポンスのストリーム化
Expressのレスポンスオブジェクトに対して、データを細切れに書き込む処理を実装します。
ファイル: backend/src/services/chatService.ts, backend/src/routes/chat.ts
🤖 Codex用プロンプト
1. `backend/src/services/chatService.ts` の `handleChat` 関数を修正し、文字列ではなく `AsyncIterable` (ストリーム) を返すように変更してください。
2. `backend/src/routes/chat.ts` を修正してください。
   - レスポンスヘッダーに `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive` を設定してください。
   - `handleChat` から受け取ったストリームを `for await` で回し、`res.write()` を使ってチャンクごとにデータをクライアントへ送信してください。
   - 処理完了後に `res.end()` を呼ぶようにしてください。

✅ Step 1.3: Frontend - ストリーム受信とState更新
fetch APIを使ってストリームを読み込み、ReactのStateをリアルタイムに更新します。
ファイル: frontend/src/shared/api/chat.ts, frontend/src/features/chat/model/useChat.ts
🤖 Codex用プロンプト
1. `frontend/src/shared/api/chat.ts` の `sendChat` 関数を修正し、ストリーミングレスポンスに対応させてください。
   - `fetch` の戻り値から `response.body.getReader()` を取得し、`callback` 関数を通じて受信したテキストチャンクを逐次呼び出し元に渡す設計に変更してください。
2. `frontend/src/features/chat/model/useChat.ts` を修正してください。
   - `sendChat` を呼び出す際、コールバック関数で受け取ったテキストを現在の `messages` の最後の要素（アシスタントの応答）に追記更新するようにしてください。
   - 初回受信時にアシスタントの空メッセージを追加し、その後はコンテンツを更新していくロジックにしてください。

🚩 Phase 2: 会話履歴のデータベース保存 (永続化)
目標: ブラウザをリロードしても会話が消えないように、SQLiteにデータを保存する。
✅ Step 2.1: DB環境構築 (Prisma + SQLite)
作業:
 * cd backend
 * npm install prisma @prisma/client
 * npx prisma init --datasource-provider sqlite
🤖 Codex用プロンプト
`backend/prisma/schema.prisma` に以下のモデルを定義してください：

1. `ChatThread` (スレッド)
   - `id`: String (UUID)
   - `title`: String
   - `createdAt`: DateTime (default now)
   - `updatedAt`: DateTime (updatedAt)
   - `messages`: ChatMessage[] (リレーション)

2. `ChatMessage` (メッセージ)
   - `id`: Int (Autoincrement)
   - `role`: String (user / assistant / system)
   - `content`: String
   - `createdAt`: DateTime (default now)
   - `threadId`: String (ChatThreadへの外部キー)

定義後、`npx prisma migrate dev --name init` を実行する想定です。

✅ Step 2.2: Backend - 履歴保存ロジックの実装
チャットの送受信時にDBへ保存する処理を追加します。
ファイル: backend/src/services/chatService.ts
🤖 Codex用プロンプト
`backend/src/services/chatService.ts` を修正し、Prisma Client をインポートしてください。
`handleChat` 関数の処理フローを以下のように変更してください：

1. リクエストボディに `threadId` がない場合は新規 `ChatThread` を作成する。
2. ユーザーのメッセージを `ChatMessage` としてDBに保存する。
3. OpenAI (またはRAG) で回答を生成する。
4. アシスタントの回答（完了後）を `ChatMessage` としてDBに保存する。
5. 戻り値として、回答テキストだけでなく `threadId` も返却するようにしてください（フロントエンドでURLを更新するため）。

✅ Step 2.3: Backend - 履歴取得APIの作成
サイドバーに表示するスレッド一覧と、特定スレッドのメッセージを取得するAPIを作ります。
ファイル: backend/src/routes/history.ts (新規), backend/src/server.ts
🤖 Codex用プロンプト
`backend/src/routes/history.ts` を新規作成し、以下のエンドポイントを実装してください：

1. `GET /api/history/threads`: 全てのスレッドを `updatedAt` の降順で取得する（タイトルとIDのみ）。
2. `GET /api/history/threads/:threadId/messages`: 指定したスレッドのメッセージ一覧を昇順で取得する。

実装後、`backend/src/server.ts` でこのルーターを `/api` 配下に登録してください。

✅ Step 2.4: Frontend - サイドバーと履歴表示
ファイル: frontend/src/widgets/chat-window/ui/ChatWindow.tsx, frontend/src/features/chat/model/useChat.ts
🤖 Codex用プロンプト
フロントエンドにチャット履歴機能を追加してください。

1. `frontend/src/shared/api/history.ts` を作成し、スレッド一覧取得とメッセージ取得のAPIクライアント関数を実装してください。
2. `frontend/src/features/chat/model/useChat.ts` に、現在の `threadId` を管理するStateと、履歴をロードする機能を追加してください。
3. `frontend/src/widgets/chat-window/ui/ChatWindow.tsx` のレイアウトを変更し、左側にサイドバー（スレッド一覧）を追加してください。
   - スレッドをクリックすると、その会話内容がメインエリアに表示されるようにしてください。
   - 「新規チャット」ボタンも配置し、押すと `threadId` をクリアして新しい会話を始められるようにしてください。

🚩 Phase 3: RAGチャンク分割の高度化
目標: 文脈を断ち切らないスマートな分割ロジックを実装し、検索精度を上げる。
✅ Step 3.1: 再帰的な文字分割ロジックの実装
ファイル: backend/src/rag/loader.ts
🤖 Codex用プロンプト
`backend/src/rag/loader.ts` の `splitIntoChunks` 関数を高度化したいです。
現在は単純な文字数分割ですが、LangChainの `RecursiveCharacterTextSplitter` のようなロジックをTypeScriptで実装してください。

要件:
1. `chunkSize` (例: 500) と `chunkOverlap` (例: 50) を引数に取る。
2. 区切り文字のリスト `["\n\n", "\n", "。", "、", " ", ""]` を定義し、優先順位の高い区切り文字でテキストを分割する。
3. 分割された各パーツを結合していき、`chunkSize` を超えそうになったらそこでチャンクを確定させる。
4. 次のチャンクを作る際は、前のチャンクの末尾 `chunkOverlap` 文字分を含めて開始する（文脈維持のため）。

✅ Step 3.2: インデックスの再作成
ロジック変更後、Qdrantのデータを入れ替える必要があります。
🤖 作業指示 (コマンド操作)
 * DockerのQdrantコンテナを再起動（データをクリアするためボリュームを削除しても良い）。
 * backend で npm run dev を実行し、起動時の ensureQdrantIndexed (vectorIndexer.ts) を走らせて、新しいロジックでチャンクを登録し直す。
🚩 Phase 4: Function Calling (Agent化)
目標: LLMに「道具」を使わせる。まずは天気予報などの単純なAPI連携から。
✅ Step 4.1: ツール定義と実行ロジックの作成
ファイル: backend/src/features/agent/tools.ts (新規), backend/src/infrastructure/openaiClient.ts
🤖 Codex用プロンプト
Function Callingを実装します。

1. `backend/src/features/agent/tools.ts` を作成し、以下の内容を定義してください：
   - `get_current_weather(location: string)` という関数の定義（OpenAIのtoolsパラメータ用JSON Schema）。
   - 実際に天気を返す（今回はランダムな天気と気温を返すスタブでOK）実行関数。

2. `backend/src/infrastructure/openaiClient.ts` の `generateChatReply` を修正してください：
   - APIリクエスト時に `tools` パラメータを渡す。
   - レスポンスの `finish_reason` が `tool_calls` だった場合：
     1. レスポンスメッセージ（tool_calls含む）を会話履歴に追加。
     2. 指定されたツール関数を実行し、結果を `role: tool` のメッセージとして履歴に追加。
     3. 更新された履歴でもう一度OpenAI APIを呼び出し（再帰処理）、最終的な回答を得る。

✅ Step 4.2: チャットサービスへの統合
ファイル: backend/src/services/chatService.ts
🤖 Codex用プロンプト
`backend/src/services/chatService.ts` で、RAGによる検索結果（システムプロンプトへの注入）と、Function Callingが共存できるように調整してください。

- RAGはあくまで「知識ベースの参照」としてシステムプロンプトにコンテキストを追加する役割。
- Function Callingは「リアルタイム情報の取得や計算」として動的に実行される役割。

OpenAIクライアント呼び出し時に、RAGで取得したコンテキストを含んだ状態でツール利用が可能になるようにコードを確認・修正してください。

💡 開発のヒント
 * エラーが出たら: エラーログをコピーし、そのままCodexに「このエラーの原因と修正方法は？」と聞いてください。
 * テスト: 特にPhase 3のチャンク分割ロジックなどは、単体テスト（VitestやJest）を書くと動作確認が楽になります。
 * コミット: 各Stepが完了するごとにGitコミットすることをお勧めします（git commit -m "feat: implement streaming response" など）。
 * 
