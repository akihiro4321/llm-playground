# Product Guide - llm-playground

## Initial Concept
`llm-playground` is a full-stack application designed as a modular environment for experimenting with Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and multi-agent architectures.

## Target Users
- **Developers:** Those experimenting with RAG and LLM integrations who need a robust, modular starting point.

## Primary Goals
- **Multi-Agent Playground:** Serve as a specialized environment for testing complex multi-agent workflows, including supervisor patterns and collaborative agent logic.

## Key Features
- **Flexible Agent Management:** Support for defining agents and managing their interactions through graph-based workflows (utilizing LangGraph).
- **Advanced Task Orchestration:** Implementation of centralized supervisor patterns to delegate tasks to specialized sub-agents.
- **Structured Workflows:** Support for predefined static workflows using state machines for predictable execution paths.

## Developer Experience (DX)
- **High Modularity:** Use of Dependency Injection (Awilix) to ensure that LLM providers, databases, and other infrastructure components are easily swappable.
- **Architectural Clarity:** Strict separation of concerns between agent orchestration, RAG retrieval logic, and the React-based frontend (Feature-Sliced Design).
- **Observability:** Integration with tools like LangSmith for comprehensive tracing and debugging of agentic interactions and RAG pipelines.
