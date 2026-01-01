# Specification: Multi-Agent System Enhancement

## Context
The project currently has a basic multi-agent implementation in `backend/src/modules/learning`. To make this a robust playground, we need to formalize the tool definitions and add testing to ensure the orchestration logic (supervisor pattern) works as expected.

## Goals
1.  **Refactor Tool Definitions:** Standardize how tools are defined and exposed to agents, ensuring they are typed and easy to extend.
2.  **Add Unit Tests:** Implement unit tests for the agent orchestration logic to verify that the supervisor correctly delegates tasks.
3.  **Verify Orchestration:** Ensure that the interaction between the supervisor and sub-agents (e.g., simple agent, OCR agent) flows correctly.

## Scope
-   **Files to Modify:**
    -   `backend/src/modules/learning/core/tools.ts`: Enhance tool definitions.
    -   `backend/src/modules/learning/core/multiAgent.ts`: Refactor to use new tool definitions if necessary.
-   **New Files:**
    -   `backend/src/modules/learning/core/multiAgent.test.ts`: Unit tests for orchestration.

## Requirements
-   Tools must use LangChain's `StructuredTool` or compatible interfaces.
-   Tests must mock OpenAI responses to avoid consuming credits during testing.
-   The supervisor must be able to route to at least two distinct tools/agents.
