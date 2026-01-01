# Plan: Phase 1: 双方向データ基盤の構築

## Phase 1.1: Multi-Collection Support
- [ ] Task: Define schemas and extend `knowledgeConfig.ts` for Jobs and Candidates.
    - [ ] Sub-task: Write Tests: Create `knowledgeConfig.test.ts` (if applicable) or verify schema types.
    - [ ] Sub-task: Implement Feature: Update `knowledgeConfig.ts` with collection definitions.
- [ ] Task: Refactor `vectorIndexer.ts` to support named collections.
    - [ ] Sub-task: Write Tests: Create `vectorIndexer.test.ts` mocking Qdrant client.
    - [ ] Sub-task: Implement Feature: Update `ensureCollection` and `indexDocument` to accept collection names.
- [ ] Task: Conductor - User Manual Verification 'Phase 1.1: Multi-Collection Support' (Protocol in workflow.md)

## Phase 1.2: OCR Persistence Pipeline
- [ ] Task: Implement `saveCandidate` function in a repository or service.
    - [ ] Sub-task: Write Tests: Create unit test for the saving logic.
    - [ ] Sub-task: Implement Feature: Create `CandidateRepository` (or extend existing) to handle vector upserts.
- [ ] Task: Integrate persistence into `ocrAgent.ts`.
    - [ ] Sub-task: Write Tests: Verify `ocrAgent` calls the save function.
    - [ ] Sub-task: Implement Feature: Call `saveCandidate` after successful OCR.
- [ ] Task: Conductor - User Manual Verification 'Phase 1.2: OCR Persistence Pipeline' (Protocol in workflow.md)
