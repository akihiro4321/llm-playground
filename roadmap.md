# 🚀 LLM Playground 拡張ロードマップ (Phase 5 - 13)

このドキュメントは、基本的なLLMアプリ開発（Phase 1-4）を終えた後、フレームワークの導入や非同期アーキテクチャの構築を行い、「実運用レベルのAIプラットフォーム」 へと進化させるためのステップバイステップガイドです。

## 📅 全体スケジュール (目安: 4〜5週間)

| フェーズ | テーマ | 実装内容 |
| :--- | :--- | :--- |
| **Phase 5** | LangChain & Observability | LangChain導入、LangSmithでのトレース可視化 |
| **Phase 6** | LangGraph Agent | 状態管理を持つステートフル・エージェントの構築 |
| **Phase 7** | Multi-Agent | 役割分担した複数のエージェントによる協調作業 |
| **Phase 8** | RAG Ops (ETL) | ベクトルDBの差分更新・同期バッチの実装 |
| **Phase 9** | Async Queue | Redis + BullMQ を用いた非同期ジョブキュー処理 |
| **Phase 10** | AI-OCR with Gemini | Gemini 2.5 Flash を使った高精度なPDF/画像テキスト抽出 |
| **Phase 11** | Advanced LLM Cache | Semantic Cacheによる類似質問のキャッシュと高速化 |
| **Phase 12** | Cost & Model Routing | トークン計算、予算管理、安価なモデルへの自動切り替え |
| **Phase 13** | Monitoring | マルチベンダー対応の利用料・機能別モニタリング |

---

## 🚩 Phase 5: LangChain 移行 & LangSmith 導入

**目標:** コードを宣言的なLCEL記法にリファクタリングし、LangSmithで実行ログを「神の視点」で可視化できるようにする。

### ✅ Step 5.1: LangChain 導入とチャット実装

OpenAI SDKの直接利用をやめ、抽象化レイヤーを導入します。

- **ファイル:** `backend/src/infrastructure/openaiClient.ts`

**🤖 AI指示プロンプト**
```markdown
現在の `backend/src/infrastructure/openaiClient.ts` は OpenAI SDK を直接使っていますが、これを LangChain に置き換えたいです。

1. `npm install @langchain/openai @langchain/core` を実行したと仮定し、コードを修正してください。
2. `ChatOpenAI` クラス (@langchain/openai) を初期化するコードに変更してください。
3. `generateChatReply` 関数を、LangChainの `invoke` または `stream` メソッドを使って書き換えてください。
4. プロンプトの構築には `ChatPromptTemplate` (@langchain/core/prompts) を使用し、System PromptとUser Messageを結合するようにしてください。
```

### ✅ Step 5.2: LangSmith セットアップ (Observability)

**前提:** LangSmith のAPIキーを取得済みであること。

- **ファイル:** `backend/.env`, `backend/src/server.ts`

**🤖 AI指示プロンプト**
```markdown
LangSmith を導入してデバッグを行えるようにします。

1. `backend/src/config/env.ts` (または `server.ts`) で、以下の環境変数が読み込まれているか確認し、設定されていればコンソールに「LangSmith Tracing: ON」と表示するログを追加してください。
   - `LANGCHAIN_TRACING_V2=true`
   - `LANGCHAIN_API_KEY`
   - `LANGCHAIN_PROJECT`

2. コードの変更は不要です。LangChainを使っていれば自動的にトレースが送信されます。
```

### ✅ Step 5.3: RAGの実装 (LCEL & Retriever)

RAGのロジックもLangChainのエコシステムに乗せ替えます。

- **ファイル:** `backend/src/rag/vectorStore.ts`, `backend/src/services/chatService.ts`

**🤖 AI指示プロンプト**
```markdown
RAG部分もLangChainに移行します。これによりLangSmithで「検索で何が取れたか」もトレースできるようになります。

1. `npm install @langchain/qdrant @langchain/text-splitters` を前提とします。
2. `backend/src/rag/vectorStore.ts` を `@langchain/qdrant` の `QdrantVectorStore` を使うように修正してください。
3. `backend/src/services/chatService.ts` で、`createRetrievalChain` または LCEL (`RunnableSequence`) を使って、「検索 → プロンプト埋め込み → LLM実行」のチェーンを構築してください。
```

---

## 🚩 Phase 6: LangGraph によるステートフル・エージェント

**目標:** 「検索して、考えて、足りなければまた検索する」といった、人間のような試行錯誤ループを実装する。

### ✅ Step 6.1: StateGraph の構築

- **ファイル:** `backend/src/features/agent/graph.ts` (新規)

**🤖 AI指示プロンプト**
```markdown
LangGraphを使ってエージェントを構築します。
`backend/src/features/agent/graph.ts` を作成し、以下の実装を行ってください：

1. `npm install @langchain/langgraph` を前提とします。
2. `AgentState` インターフェースを定義してください（`messages`: BaseMessage[] を含む）。
3. `StateGraph` を初期化してください。
4. "agent" ノード（思考を担当）と "tools" ノード（ツールの実行を担当）を定義してください。
```

### ✅ Step 6.2: ReActフロー (ループ構造) の実装

- **ファイル:** `backend/src/features/agent/graph.ts`

**🤖 AI指示プロンプト**
```markdown
LangGraphで ReAct パターン（Agent -> Tools -> Agent ...）のフローを構築してください。

1. エッジの定義:
   - START -> "agent"
   - "tools" -> "agent" (ツール実行後は必ず思考に戻る)
   - "agent" -> 条件付きエッジ (`shouldContinue`):
     - `tool_calls` があれば "tools" へ
     - なければ END へ

2. グラフを `compile()` し、`Runnable` としてエクスポートしてください。
3. このグラフを `backend/src/services/chatService.ts` から呼び出せるように統合してください。
```

---

## 🚩 Phase 7: Multi-Agent システム (応用)

**目標:** 「リサーチャー（検索担当）」と「ライター（執筆担当）」など、専門家エージェントを協調させる。

### ✅ Step 7.1: Supervisor アーキテクチャ

- **ファイル:** `backend/src/features/agent/supervisor.ts` (新規)

**🤖 AI指示プロンプト**
```markdown
LangGraphでマルチエージェントシステムを作ります。

1. `ResearchAgent`: Web検索ツール（Tavilyなど）を持ったエージェントノード。
2. `WriterAgent`: 検索結果をもとに記事を書くエージェントノード。
3. `Supervisor`: ユーザーの入力を受け取り、「次はどのエージェントに任せるか」をJSONで出力するルーター用LLMノード。

これらをグラフで接続し、Supervisorが司令塔となってタスクを解決するフローを実装してください。
```

---

## 🚩 Phase 8: RAG データパイプライン (ETL)

**目標:** ファイルを追加・変更したら、自動的にベクトルDBも更新される仕組みを作る。

### ✅ Step 8.1: 差分検知ロジック

- **ファイル:** `backend/src/rag/sync.ts` (新規)

**🤖 AI指示プロンプト**
```markdown
効率的なインデックス更新スクリプト `backend/src/rag/sync.ts` を作成してください。

1. `knowledge` フォルダ内のファイル一覧を取得し、各ファイルのMD5ハッシュを計算する。
2. Qdrantに保存されている既存データのメタデータ（`file_hash`）と比較する。
3. ロジック:
   - **新規:** Embeddingして追加。
   - **変更:** 古いベクトルを削除して再追加。
   - **削除:** Qdrantからも削除。
4. 実行結果（追加数、更新数、削除数）をログ出力する。
```

---

## 🚩 Phase 9: 非同期ジョブキュー (Async Architecture)

**目標:** 重いAgent処理をバックグラウンドに逃がし、ユーザーを待たせないUIにする。

### ✅ Step 9.1: Redis & BullMQ セットアップ

- **ファイル:** `docker-compose.yml`, `backend/src/infrastructure/redis.ts`

**🤖 AI指示プロンプト**
```markdown
非同期処理のために Redis と BullMQ を導入します。

1. `docker-compose.yml` に `redis:alpine` サービス（ポート6379）を追加してください。
2. `backend/src/infrastructure/redis.ts` を作成し、BullMQ用のRedis接続設定をエクスポートしてください。
3. `backend/src/queue/agentQueue.ts` を作成し、`agent-tasks` という名前のQueueを定義してください。
```

### ✅ Step 9.2: Producer (API) & Consumer (Worker)

- **ファイル:** `backend/src/routes/agent.ts`, `backend/src/worker.ts`

**🤖 AI指示プロンプト**
```markdown
非同期処理の Producer と Consumer を実装します。

1. **Producer (`backend/src/routes/agent.ts`)**:
   - `POST /api/agent/run` でリクエストを受け、`agentQueue.add` でジョブを追加。
   - 即座に `{ jobId, status: "queued" }` を返す。

2. **Consumer (`backend/src/worker.ts`)**:
   - `agent-tasks` キューを監視する Worker プロセス。
   - ジョブを受け取ったら Phase 6 の LangGraph エージェントを実行。
   - 結果を DB (`ChatMessage`) に保存。
   - `job.updateProgress()` で進捗を更新。
```

---

## 🚩 Phase 10: AI-OCR with Gemini (Multimodal)

**目標:** PDFや画像を Gemini 2.5 Flash に直接読み込ませ、高精度にテキスト化してRAGに取り込む。

### ✅ Step 10.1: Google AI SDK セットアップ

- **ファイル:** `backend/src/infrastructure/geminiClient.ts` (新規)

**🤖 AI指示プロンプト**
```markdown
Google Gemini API を使用するためのクライアントをセットアップします。

1. `npm install @google/generative-ai` をインストールしたと仮定します。
2. `backend/src/config/env.ts` に `GOOGLE_API_KEY` を追加してください。
3. `backend/src/infrastructure/geminiClient.ts` を作成し、`GoogleGenerativeAI` クラスを初期化してください。
4. ファイルアップロード用の `GoogleAIFileManager` も初期化してエクスポートしてください。
```

### ✅ Step 10.2: Gemini OCR サービスの実装

Gemini にファイルをアップロードし、テキスト抽出させるロジックを実装します。

- **ファイル:** `backend/src/services/ocrService.ts`

**🤖 AI指示プロンプト**
```markdown
Gemini 2.5 Flash を使った OCR サービス `backend/src/services/ocrService.ts` を実装してください。

1. `extractTextWithGemini(filePath: string, mimeType: string): Promise<string>` 関数を実装。
2. 処理フロー:
   - `fileManager.uploadFile` でファイルを Google AI Studio にアップロード。
   - アップロード完了までポーリング待機（`state` が `ACTIVE` になるまで）。
   - `getGenerativeModel({ model: "gemini-2.5-flash" })` を取得。
   - プロンプト「このドキュメントのすべてのテキストを、構造（見出しや段落）を維持したままMarkdown形式で抽出してください」と共に、アップロードしたファイルのURIを `generateContent` に渡す。
   - 生成されたテキストを返す。
   - 最後に `fileManager.deleteFile` でクラウド上のファイルを削除（クリーンアップ）。
```

### ✅ Step 10.3: アップロード処理への統合

- **ファイル:** `backend/src/routes/upload.ts` (新規)

**🤖 AI指示プロンプト**
```markdown
ファイルアップロードAPIを実装し、Gemini OCR と RAG 登録を繋ぎ込みます。

1. `backend/src/routes/upload.ts` を作成し、`POST /api/upload` を実装。
2. `multer` を使い、一時ディレクトリ (`uploads/`) にファイルを保存。
3. 保存されたファイルを `ocrService.extractTextWithGemini` に渡してテキスト化。
4. 抽出されたテキストを、Phase 3 のチャンク分割ロジック経由で Qdrant に登録。
5. 処理完了後、ローカルの一時ファイルを削除し、成功レスポンスを返す。
```

---

## 🚩 Phase 11: Advanced LLM Cache (Semantic Cache)

**目標:** 完全に同じ質問だけでなく、「意味が似ている質問」もキャッシュヒットさせ、応答速度向上とコスト削減を最大化する。

### ✅ Step 11.1: Exact Match Cache (Redis)

まずは基本の完全一致キャッシュを導入します。

- **ファイル:** `backend/src/infrastructure/cache.ts`, `backend/src/infrastructure/openaiClient.ts`

**🤖 AI指示プロンプト**
```markdown
LangChain のキャッシュ機能を Redis で実装します。

1. `npm install @langchain/community ioredis` を使用します。
2. `backend/src/infrastructure/openaiClient.ts` で、`RedisCache` を初期化し、モデルに適用してください。
3. ログ出力でキャッシュヒットが分かるようにしてください。
```

### ✅ Step 11.2: Semantic Cache 実装 (Qdrant活用)

Qdrant (ベクトルDB) をキャッシュストアとしても利用します。質問文をベクトル化し、過去の質問と類似度が高ければ（例: 0.95以上）、その時の回答を返します。

- **ファイル:** `backend/src/services/semanticCacheService.ts` (新規)

**🤖 AI指示プロンプト**
```markdown
Qdrant を利用した Semantic Cache (意味論的キャッシュ) を実装してください。

1. `backend/src/services/semanticCacheService.ts` を作成。
2. Qdrantに `cache_collection` という新しいコレクションを作成するロジックを追加（なければ作成）。
3. `findCachedAnswer(query: string): Promise<string | null>` を実装:
   - クエリを Embedding 化。
   - Qdrant で `cache_collection` を検索。
   - スコアが 0.95 以上なら、その Payload にある `answer` を返す。
4. `cacheAnswer(query: string, answer: string): Promise<void>` を実装:
   - クエリベクトルと回答テキストを保存。
5. `chatService.ts` で LLM を呼ぶ前に `findCachedAnswer` をチェックするように統合。
```

---

## 🚩 Phase 12: Cost & Model Routing (Cost Management)

**目標:** 予算管理と、コスト効率の良いモデルへの自動切り替えを実装する。

### ✅ Step 12.1: トークン計算と予算チェック

- **ファイル:** `backend/src/lib/tokenCounter.ts` (新規), `backend/src/services/budgetService.ts` (新規)

**🤖 AI指示プロンプト**
```markdown
トークン使用量とコストを管理する機能を実装します。

1. `npm install tiktoken` を使用。
2. `backend/src/lib/tokenCounter.ts`:
   - 入力文字列とモデル名を受け取り、トークン数を概算する関数を実装。
   - モデルごとの単価（入力/出力）を定数定義し、コスト計算を行う関数を実装。
3. `backend/src/services/budgetService.ts`:
   - データベース（Prisma）に `UsageLog` テーブル（userId, model, tokens, cost, date）を追加。
   - `checkBudget(userId: string): Promise<boolean>`: 今月の利用料が上限（例: 5ドル）を超えていないかチェック。超えていれば例外を投げる。
```

### ✅ Step 12.2: スマートモデルルーター

- **ファイル:** `backend/src/services/modelRouter.ts` (新規)

**🤖 AI指示プロンプト**
```markdown
コスト削減のため、クエリの難易度や予算状況に応じてモデルを切り替えるルーターを作成してください。

1. `backend/src/services/modelRouter.ts` を作成し、`selectModel(query: string, userId: string): Promise<string>` を実装。
2. ロジック:
   - 予算使用率が 80% を超えている -> 強制的に安価な `gpt-4o-mini` を選択。
   - クエリ文字数が 100文字未満 -> `gpt-4o-mini` を選択。
   - それ以外 -> 高性能な `gpt-4o` (またはユーザー設定) を選択。
3. `chatService.ts` で、LLM初期化時にこの関数で決定したモデル名を使うように修正。
```

---

## 🚩 Phase 13: Monitoring (Multi-Vendor Analytics)

**目標:** OpenAI, Anthropic, Google 等、複数のモデルを使った場合の利用状況を横断的に監視する。

### ✅ Step 13.1: 統一ロギング基盤

- **ファイル:** `backend/src/infrastructure/logger.ts`, `backend/src/services/chatService.ts`

**🤖 AI指示プロンプト**
```markdown
マルチベンダー対応の利用ログ収集基盤を作ります。

1. Prismaスキーマの `UsageLog` に `vendor` (例: "openai", "anthropic") と `feature` (例: "chat", "agent-search", "summarize") カラムを追加。
2. `backend/src/services/chatService.ts` や Agent 実行後の処理で、必ずログ保存を行うように修正。
   - LangChain のコールバックを利用して、トークン使用量とベンダー情報を自動的に取得・保存するのが望ましい。
```

### ✅ Step 13.2: 簡易アナリティクス API

- **ファイル:** `backend/src/routes/analytics.ts` (新規)

**🤖 AI指示プロンプト**
```markdown
利用状況を可視化するためのAPIエンドポイントを作成してください。

1. `GET /api/analytics/usage`:
   - 期間（直近30日など）ごとの日次コスト推移。
   - モデル別 / ベンダー別のコスト比率。
   - 機能別（Chat vs Agent）の使用回数。
2. これらを Prisma の集計クエリ (`groupBy`, `aggregate`) を使って計算し、JSONで返す実装を行ってください。
```