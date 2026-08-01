# Invoker AI Integration

<cite>
**Referenced Files in This Document**
- [src/pages/invoker/index.tsx](file://src/pages/invoker/index.tsx)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src/triggers/invoker/ai-tool.ts](file://src/triggers/invoker/ai-tool.ts)
- [src/triggers/invoker/attack.ts](file://src/triggers/invoker/attack.ts)
- [src/triggers/invoker/send-to.ts](file://src/triggers/invoker/send-to.ts)
- [src/triggers/invoker/ui.ts](file://src/triggers/invoker/ui.ts)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/tools/invoker.rs](file://src-tauri/src/tools/invoker.rs)
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/types.rs](file://src-tauri/src/ai/types.rs)
- [src-tauri/src/ai/chat.rs](file://src-tauri/src/ai/chat.rs)
- [src-tauri/src/ai/auto_mark.rs](file://src-tauri/src/ai/auto_mark.rs)
- [src-tauri/src/automation/actions.rs](file://src-tauri/src/automation/actions.rs)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)
- [src-tauri/src/automation/types.rs](file://src-tauri/src/automation/types.rs)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains how the Invoker module integrates AI to enhance security testing workflows. It covers intelligent payload generation, vulnerability assessment, attack simulation, automated exploit development assistance, parameter brute-forcing support, and result interpretation. It also details how AI suggestions integrate with existing attack workflows and provides guidance for custom payload development.

## Project Structure
The Invoker AI integration spans both frontend (TypeScript/React) and backend (Rust/Tauri):
- Frontend: Invoker page, store, triggers, and UI hooks orchestrate user interactions and state updates.
- Backend: Tauri commands expose AI capabilities, tools execute attacks, and automation modules handle event-driven flows.

```mermaid
graph TB
subgraph "Frontend"
INV_PAGE["Invoker Page<br/>index.tsx"]
INV_STORE["Invoker Store<br/>stores/invoker.ts"]
INV_TRIGGERS["Invoker Triggers<br/>triggers/invoker/*"]
end
subgraph "Backend (Tauri)"
CMD_INVOKER["Commands: invoker.rs"]
TOOL_INVOKER["Tools: invoker.rs"]
AI_CORE["AI Core<br/>ai/mod.rs + providers.rs"]
AI_CHAT["AI Chat<br/>chat.rs"]
AUTO_MARK["Auto Mark<br/>auto_mark.rs"]
AUTOMATION["Automation Engine<br/>actions/events/execution/state"]
end
INV_PAGE --> INV_STORE
INV_PAGE --> INV_TRIGGERS
INV_TRIGGERS --> CMD_INVOKER
CMD_INVOKER --> TOOL_INVOKER
TOOL_INVOKER --> AI_CORE
AI_CORE --> AI_CHAT
TOOL_INVOKER --> AUTOMATION
TOOL_INVOKER --> AUTO_MARK
```

**Diagram sources**
- [src/pages/invoker/index.tsx](file://src/pages/invoker/index.tsx)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/tools/invoker.rs](file://src-tauri/src/tools/invoker.rs)
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/chat.rs](file://src-tauri/src/ai/chat.rs)
- [src-tauri/src/ai/auto_mark.rs](file://src-tauri/src/ai/auto_mark.rs)
- [src-tauri/src/automation/actions.rs](file://src-tauri/src/automation/actions.rs)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)

**Section sources**
- [src/pages/invoker/index.tsx](file://src/pages/invoker/index.tsx)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/tools/invoker.rs](file://src-tauri/src/tools/invoker.rs)

## Core Components
- Invoker Store: Centralized state for payloads, results, and AI-assisted actions.
- Invoker Triggers: Event-driven hooks that connect UI actions to backend commands and automation.
- Tauri Commands: Expose AI-powered operations to the frontend via secure IPC.
- Tools: Execute attacks, mutate payloads, and coordinate with automation and AI services.
- AI Core: Provider abstraction, settings, chat session management, and auto-marking logic.

Key responsibilities:
- Generate and mutate payloads using AI context (request/response, parameters, headers).
- Assist in brute-force campaigns by suggesting high-probability values.
- Validate vulnerabilities by synthesizing targeted follow-up requests.
- Interpret results and propose next steps or mitigations.

**Section sources**
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/tools/invoker.rs](file://src-tauri/src/tools/invoker.rs)
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/types.rs](file://src-tauri/src/ai/types.rs)
- [src-tauri/src/ai/chat.rs](file://src-tauri/src/ai/chat.rs)
- [src-tauri/src/ai/auto_mark.rs](file://src-tauri/src/ai/auto_mark.rs)

## Architecture Overview
The Invoker AI flow connects user actions to AI-enhanced execution and feedback loops:

```mermaid
sequenceDiagram
participant UI as "Invoker UI"
participant Store as "Invoker Store"
participant Trigger as "Invoker Trigger"
participant Cmd as "Tauri Command"
participant Tool as "Invoker Tool"
participant AI as "AI Core/Chat"
participant Auto as "Automation Engine"
UI->>Store : User edits request/payload
Store-->>Trigger : Emit change events
Trigger->>Cmd : Invoke AI-assisted action
Cmd->>Tool : Execute operation
Tool->>AI : Request suggestions/mutations
AI-->>Tool : Return suggestions
Tool->>Auto : Queue mutations/validation tasks
Auto-->>Tool : Results and status
Tool-->>Cmd : Aggregate outcomes
Cmd-->>Trigger : Streamed updates
Trigger-->>Store : Update state
Store-->>UI : Render results and suggestions
```

**Diagram sources**
- [src/pages/invoker/index.tsx](file://src/pages/invoker/index.tsx)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/tools/invoker.rs](file://src-tauri/src/tools/invoker.rs)
- [src-tauri/src/ai/chat.rs](file://src-tauri/src/ai/chat.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

## Detailed Component Analysis

### Invoker Triggers and AI Tooling
The triggers layer bridges UI actions to backend commands and orchestrates AI tool usage. The AI tool trigger enables contextual prompts and structured responses for payload generation and validation.

```mermaid
flowchart TD
Start(["User Action"]) --> Detect["Detect Context<br/>parameters, headers, body"]
Detect --> Prompt["Build AI Prompt<br/>context + goal"]
Prompt --> CallAI["Call AI Provider"]
CallAI --> Parse["Parse Suggestions"]
Parse --> Apply{"Apply to Payload?"}
Apply --> |Yes| Mutate["Mutate Request"]
Apply --> |No| Keep["Keep Original"]
Mutate --> Validate["Validate & Test"]
Keep --> Validate
Validate --> Report["Report Findings"]
Report --> End(["Update UI"])
```

**Diagram sources**
- [src/triggers/invoker/ai-tool.ts](file://src/triggers/invoker/ai-tool.ts)
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src-tauri/src/ai/chat.rs](file://src-tauri/src/ai/chat.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)

**Section sources**
- [src/triggers/invoker/ai-tool.ts](file://src/triggers/invoker/ai-tool.ts)
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)

### Attack Orchestration and Automation
Attack orchestration leverages automation actions and events to run sequences of tests, including brute-force campaigns and targeted validations.

```mermaid
classDiagram
class Actions {
+sendRequest()
+mutatePayload()
+validateResponse()
}
class Events {
+onMutation()
+onValidation()
+onResult()
}
class Execution {
+runSequence()
+handleError()
+streamProgress()
}
class State {
+queue
+status
+results
}
Actions --> Events : "emits"
Execution --> Actions : "uses"
Execution --> State : "updates"
Events --> Execution : "drives"
```

**Diagram sources**
- [src-tauri/src/automation/actions.rs](file://src-tauri/src/automation/actions.rs)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)

**Section sources**
- [src-tauri/src/automation/actions.rs](file://src-tauri/src/automation/actions.rs)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)

### Tauri Commands and Tools
Commands expose AI-invoked operations to the frontend; tools implement the actual attack logic, mutation strategies, and integration with AI and automation.

```mermaid
sequenceDiagram
participant FE as "Frontend Trigger"
participant CMD as "Tauri Command"
participant TOOL as "Invoker Tool"
participant AI as "AI Core"
participant AUT as "Automation"
FE->>CMD : invoke_ai_assist(params)
CMD->>TOOL : build_context_and_suggestions()
TOOL->>AI : generate_payloads(context)
AI-->>TOOL : suggestions[]
TOOL->>AUT : queue_validation_tasks(suggestions[])
AUT-->>TOOL : results[]
TOOL-->>CMD : aggregated_results
CMD-->>FE : stream_updates(results[])
```

**Diagram sources**
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/tools/invoker.rs](file://src-tauri/src/tools/invoker.rs)
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

**Section sources**
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/tools/invoker.rs](file://src-tauri/src/tools/invoker.rs)

### AI Core, Providers, and Settings
The AI core abstracts provider selection, configuration, and chat sessions. Settings manage model selection, API keys, and behavior flags. Types define payloads, suggestions, and results.

```mermaid
classDiagram
class AI_Core {
+select_provider()
+create_session()
+send_message()
}
class Providers {
+get_client()
+configure_model()
}
class Settings {
+model
+api_key
+timeout
}
class Types {
+Payload
+Suggestion
+Result
}
AI_Core --> Providers : "instantiates"
AI_Core --> Settings : "reads config"
AI_Core --> Types : "serializes"
```

**Diagram sources**
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/types.rs](file://src-tauri/src/ai/types.rs)

**Section sources**
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/types.rs](file://src-tauri/src/ai/types.rs)

### Send-To Integration and Workflow Hooks
Send-to functionality allows moving crafted payloads into other workflows (e.g., Repeater, Browser Automation). This ensures AI-generated payloads can be reused across modules seamlessly.

```mermaid
flowchart TD
A["AI Suggestion"] --> B["Send-To Builder"]
B --> C{"Target Module?"}
C --> |Repeater| D["Create Craft Entry"]
C --> |Browser| E["Queue Browser Action"]
C --> |Interceptor| F["Add Intercept Rule"]
D --> G["Persist & Notify"]
E --> G
F --> G
```

**Diagram sources**
- [src/triggers/invoker/send-to.ts](file://src/triggers/invoker/send-to.ts)

**Section sources**
- [src/triggers/invoker/send-to.ts](file://src/triggers/invoker/send-to.ts)

### UI Enhancements and Feedback
The UI trigger layer renders AI suggestions, highlights mutated fields, and streams progress. It supports inline acceptance/rejection of suggestions and displays validation outcomes.

```mermaid
flowchart TD
UStart["User Edits Request"] --> Hint["Show AI Hint"]
Hint --> Accept{"Accept Suggestion?"}
Accept --> |Yes| Apply["Apply Mutation"]
Accept --> |No| Skip["Skip"]
Apply --> Run["Run Validation"]
Skip --> Run
Run --> Show["Display Results"]
Show --> UEnd["User Review"]
```

**Diagram sources**
- [src/triggers/invoker/ui.ts](file://src/triggers/invoker/ui.ts)

**Section sources**
- [src/triggers/invoker/ui.ts](file://src/triggers/invoker/ui.ts)

## Dependency Analysis
The Invoker AI integration depends on a layered architecture:
- Frontend triggers depend on Tauri commands for IPC.
- Commands delegate to tools for execution.
- Tools rely on AI core for suggestions and automation for sequencing.
- AI core uses providers and settings to configure models and credentials.

```mermaid
graph LR
TRIGGERS["Triggers"] --> COMMANDS["Commands"]
COMMANDS --> TOOLS["Tools"]
TOOLS --> AI_CORE["AI Core"]
AI_CORE --> PROVIDERS["Providers"]
TOOLS --> AUTOMATION["Automation"]
TOOLS --> AUTO_MARK["Auto Mark"]
```

**Diagram sources**
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/tools/invoker.rs](file://src-tauri/src/tools/invoker.rs)
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src-tauri/src/ai/auto_mark.rs](file://src-tauri/src/ai/auto_mark.rs)

**Section sources**
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/tools/invoker.rs](file://src-tauri/src/tools/invoker.rs)
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src-tauri/src/ai/auto_mark.rs](file://src-tauri/src/ai/auto_mark.rs)

## Performance Considerations
- Streamed Updates: Use streaming responses from AI and automation to keep UI responsive.
- Batch Mutations: Group related mutations to reduce redundant network calls.
- Rate Limiting: Respect provider rate limits and target server constraints.
- Caching: Cache frequent suggestions based on stable request fingerprints.
- Concurrency Control: Limit parallel tasks per campaign to avoid overwhelming targets.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- AI Provider Errors: Verify API keys, model names, and timeouts in settings. Check provider availability and quotas.
- No Suggestions: Ensure context is complete (parameters, headers, body). Validate prompt construction in AI tool trigger.
- Slow Campaigns: Reduce concurrency, enable batching, and filter low-value payloads early.
- Misinterpreted Results: Refine validation rules and add explicit indicators in response parsing.
- UI Not Updating: Confirm IPC channels are open and events are emitted correctly from triggers.

**Section sources**
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src/triggers/invoker/ai-tool.ts](file://src/triggers/invoker/ai-tool.ts)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

## Conclusion
The Invoker module’s AI integration enhances security testing by automating payload generation, assisting in brute-force campaigns, validating vulnerabilities, and interpreting results within existing workflows. Its modular design—triggers, commands, tools, AI core, and automation—enables flexible customization and robust performance.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### AI-Suggested Attack Patterns
- Parameter Tampering: Suggests value ranges and encodings based on observed types.
- Injection Vectors: Proposes SQLi, XSS, and command injection variants tailored to endpoints.
- Authentication Bypass: Generates tokens or header manipulations aligned with observed auth schemes.

[No sources needed since this section provides conceptual examples]

### Intelligent Payload Mutation
- Type-Aware Mutation: Adjusts payloads according to parameter types and expected formats.
- Contextual Encoding: Applies encoding strategies derived from observed server behavior.
- Adaptive Sequencing: Orders mutations to maximize discovery while minimizing noise.

[No sources needed since this section provides conceptual examples]

### Result Interpretation Guidance
- Indicator Extraction: Highlights HTTP status changes, response size deltas, and error patterns.
- Confidence Scoring: Ranks findings based on consistency across multiple probes.
- Next Steps: Recommends focused follow-ups to confirm or dismiss suspected vulnerabilities.

[No sources needed since this section provides conceptual examples]

### Custom Payload Development
- Define Context: Capture relevant request attributes and environment variables.
- Build Prompts: Provide clear goals and constraints for AI to generate targeted payloads.
- Validate Early: Implement quick checks before launching full campaigns.
- Iterate: Use feedback loops to refine suggestions and improve accuracy.

[No sources needed since this section provides conceptual examples]