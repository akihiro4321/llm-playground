# Specification: Phase 1: 双方向データ基盤の構築

## Context
As defined in the `roadmap.md`, the first phase of the Recruiting Agent development is to establish a bidirectional data infrastructure. This involves preparing vector data for both "Resumes" (Candidates) and "Job Descriptions" (Jobs) so that agents can search and reference them effectively.

## Goals
1.  **Define Schemas:** Establish clear schemas for Job and Candidate data in Qdrant.
2.  **Create Collections:** Implement functionality to create and manage separate Qdrant collections for `jobs` and `candidates`.
3.  **OCR Pipeline:** Automate the process of converting OCR'd resume text into vector embeddings stored in the `candidates` collection.

## Scope
-   **Files to Modify:**
    -   `backend/src/modules/rag/core/vectorIndexer.ts`: Extend to handle multiple collections.
    -   `backend/src/modules/rag/knowledge/knowledgeConfig.ts`: Define collection configs.
    -   `backend/src/modules/learning/core/ocrAgent.ts`: Update to persist results.
-   **New Files:**
    -   `backend/src/modules/rag/core/vectorIndexer.test.ts`: Unit tests for indexer.
    -   `backend/src/modules/rag/core/types.ts`: Update with new schema definitions (if not already present).

## Requirements
-   **Collections:**
    -   `jobs`: Metadata includes `requirements`, `benefits`, `culture`, `tech_stack`.
    -   `candidates`: Metadata includes `skills`, `aptitude_score`, `ocr_resume_text`.
-   **Persistence:** The OCR agent must not just output text but also trigger an indexing job (or call a repository) to save the candidate data.
