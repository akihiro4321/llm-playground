# Product Guidelines - llm-playground

## Voice and Tone
- **Technical & Precise:** Our communication is accurate and grounded in architectural clarity. We prioritize configuration details and technical depth for a developer audience.
- **Experimental & Bold:** We embrace the cutting-edge nature of AI. We are transparent about the experimental status of multi-agent patterns and encourage exploration of new architectures.

## Visual Identity and UI Design
- **Interactive Clarity:** The UI must provide clear visual feedback for complex agent states. Users should see exactly when an agent is "thinking," calling a tool, or synthesizing a response.
- **Modern & polished:** We use a clean, modern design system to make complex experimental technology feel professional and accessible.

## Error Handling and Feedback
- **Transparent Debugging:** We provide raw logs and execution traces within the UI for developers who need to see the "under the hood" details of an interaction.
- **User-Friendly Feedback:** Technical failures are translated into clear, actionable messages so users aren't left guessing.
- **State Visualization:** Where possible, we use visual cues or diagrams to represent the flow of a multi-agent workflow and where it currently stands.

## Documentation and Code Style
- **Self-Documenting Code:** We prioritize expressive naming and modular functions. Comments are used sparingly and focus on explaining the "why" behind complex logic rather than describing what the code does.
- **Markdown-Centric Knowledge:** Detailed architectural guides and feature explanations should reside in Markdown files within the repository to keep the codebase clean.

## Naming Conventions
- **Functional & Descriptive:** Names should immediately communicate purpose (e.g., `VectorSearchService`, `SupervisorNode`).
- **Domain-Driven:** We use established AI, RAG, and Graph terminology (e.g., `Embeddings`, `Retriever`, `State`) to maintain consistency with the broader ecosystem.
