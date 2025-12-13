import { deleteQdrantCollection } from "./vectorIndexer";

// Qdrantコレクションを削除するスクリプト
(async () => {
  await deleteQdrantCollection();
})();
