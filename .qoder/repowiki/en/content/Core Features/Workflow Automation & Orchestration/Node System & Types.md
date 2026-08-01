# Node System & Types

<cite>
**Referenced Files in This Document**
- [workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [workflow/types.ts](file://src/pages/workflow/types.ts)
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)
- [triggers/index.ts](file://src/triggers/index.ts)
- [triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
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

## Introduction
This document explains the Node System architecture used by Apprecon’s workflow automation. It covers the three primary node types—Trigger nodes (event-driven), Action nodes (processing tasks), and Condition nodes (decision logic)—along with the node interface contract, property definitions, execution methods, factory pattern for instantiation, profile mapping for configuration schemas, validation, input/output handling, data transformation, built-in examples, and guidelines for implementing custom node types.

## Project Structure
The Node System spans both the frontend (TypeScript) and backend (Rust Tauri). The frontend defines node types, registry, templates, and UI integration. The backend defines runtime types, execution flow, event bus, and state management.

```mermaid
graph TB
subgraph "Frontend"
WF["Workflow Page<br/>index.tsx"]
TYPES["Node Types<br/>types.ts"]
REG["Node Type Registry<br/>node-type-registry.ts"]
TPL["Templates<br/>templates.ts"]
TRIG["Triggers Index<br/>triggers/index.ts"]
BTR["Browser Triggers<br/>triggers/browser/index.ts"]
INT["Intercept Triggers<br/>triggers/intercept/index.ts"]
REP["Repeater Triggers<br/>triggers/repeater/index.ts"]
end
subgraph "Backend"
AT["Automation Types<br/>automation/types.rs"]
EXE["Execution Engine<br/>automation/execution.rs"]
EVT["Event Bus<br/>automation/events.rs"]
ST["State Manager<br/>automation/state.rs"]
end
WF --> TYPES
WF --> REG
WF --> TPL
WF --> TRIG
TRIG --> BTR
TRIG --> INT
TRIG --> REP
WF --> EXE
EXE --> AT
EXE --> EVT
EXE --> ST
```

**Diagram sources**
- [workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [workflow/types.ts](file://src/pages/workflow/types.ts)
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [triggers/index.ts](file://src/triggers/index.ts)
- [triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)

**Section sources**
- [workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [workflow/types.ts](file://src/pages/workflow/types.ts)
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [triggers/index.ts](file://src/triggers/index.ts)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)

## Core Components
- Node Interface Contract: Defines common properties and methods shared across all node types, including identifiers, labels, categories, inputs, outputs, and execution behavior.
- Trigger Nodes: Event-driven nodes that initiate workflows based on external events (e.g., browser actions, HTTP intercepts, repeater commands).
- Action Nodes: Processing nodes that perform transformations, API calls, or other side effects using provided inputs to produce outputs.
- Condition Nodes: Decision nodes that evaluate boolean expressions and route execution along different branches based on results.
- Profile Mapping: A schema-driven system that maps user-configurable properties to typed fields, enabling dynamic forms and validation.
- Factory Pattern: Centralized creation of node instances from serialized definitions, ensuring consistent initialization and default values.
- Validation: Schema-based checks for node properties and connections, preventing invalid configurations at design time and runtime.
- Input/Output Handling: Strongly typed ports for passing data between nodes, supporting transformation pipelines.

**Section sources**
- [workflow/types.ts](file://src/pages/workflow/types.ts)
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)

## Architecture Overview
The Node System integrates a frontend registry and templates with a backend execution engine. Triggers emit events into an event bus; the execution engine consumes these events, evaluates conditions, and invokes actions. State is persisted and synchronized across components.

```mermaid
sequenceDiagram
participant UI as "Workflow UI"
participant Reg as "Node Type Registry"
participant Tpl as "Templates"
participant Eng as "Execution Engine"
participant Bus as "Event Bus"
participant St as "State Manager"
UI->>Reg : "Register node types"
UI->>Tpl : "Load template for new node"
Tpl-->>UI : "Default node definition"
UI->>Eng : "Create instance from definition"
Eng->>Bus : "Subscribe to trigger events"
Bus-->>Eng : "Event payload"
Eng->>St : "Update execution state"
Eng-->>UI : "Progress and results"
```

**Diagram sources**
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)

## Detailed Component Analysis

### Node Interface Contract
- Common properties include unique identifiers, display labels, category tags, versioning, and metadata.
- Execution methods define how nodes run, handle errors, and report progress.
- Input and output ports are strongly typed and validated against schemas.

```mermaid
classDiagram
class Node {
+string id
+string label
+string category
+object inputs
+object outputs
+execute(context) Result
+validate() bool
}
class TriggerNode {
+onEvent(event) void
+subscribe(bus) void
}
class ActionNode {
+process(inputs) Output
+transform(data) Data
}
class ConditionNode {
+evaluate(inputs) bool
+route(result) Branch
}
Node <|-- TriggerNode
Node <|-- ActionNode
Node <|-- ConditionNode
```

**Diagram sources**
- [workflow/types.ts](file://src/pages/workflow/types.ts)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)

**Section sources**
- [workflow/types.ts](file://src/pages/workflow/types.ts)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)

### Trigger Nodes (Event-Driven)
- Examples include browser events, intercept lifecycle hooks, and repeater triggers.
- They subscribe to internal buses and emit standardized payloads to the execution engine.

```mermaid
sequenceDiagram
participant Browser as "Browser Trigger"
participant Intercept as "Intercept Trigger"
participant Repeater as "Repeater Trigger"
participant Bus as "Event Bus"
participant Eng as "Execution Engine"
Browser->>Bus : "Page navigated"
Intercept->>Bus : "Request intercepted"
Repeater->>Bus : "Collection sent"
Bus-->>Eng : "Normalized event"
Eng->>Eng : "Route to next nodes"
```

**Diagram sources**
- [triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)

**Section sources**
- [triggers/index.ts](file://src/triggers/index.ts)
- [triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)

### Action Nodes (Processing Tasks)
- Perform data transformations, API invocations, file operations, and integrations.
- Accept typed inputs, validate them, and produce structured outputs consumed by downstream nodes.

```mermaid
flowchart TD
Start(["Action Node Entry"]) --> Validate["Validate Inputs"]
Validate --> Valid{"Valid?"}
Valid --> |No| Error["Return Validation Error"]
Valid --> |Yes| Transform["Transform Data"]
Transform --> Execute["Execute Task"]
Execute --> Success{"Success?"}
Success --> |No| HandleErr["Handle Error"]
Success --> |Yes| EmitOut["Emit Outputs"]
EmitOut --> End(["Action Node Exit"])
HandleErr --> End
Error --> End
```

**Diagram sources**
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)

**Section sources**
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)

### Condition Nodes (Decision Logic)
- Evaluate boolean expressions over inputs and route execution to true/false branches.
- Support complex expressions and safe evaluation contexts.

```mermaid
flowchart TD
CStart(["Condition Node Entry"]) --> Eval["Evaluate Expression"]
Eval --> Branch{"Result?"}
Branch --> |True| TruePath["Proceed True Branch"]
Branch --> |False| FalsePath["Proceed False Branch"]
TruePath --> CEnd(["Condition Node Exit"])
FalsePath --> CEnd
```

**Diagram sources**
- [automation/types.rs](file://src-tauri/src/automation/types.rs)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)

**Section sources**
- [automation/types.rs](file://src-tauri/src/automation/types.rs)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)

### Node Factory Pattern
- Centralized creation of node instances from serialized definitions ensures consistent defaults and type safety.
- Supports cloning, version migration, and environment-specific overrides.

```mermaid
sequenceDiagram
participant UI as "Workflow UI"
participant Tpl as "Templates"
participant Reg as "Registry"
participant Inst as "Instance Factory"
UI->>Tpl : "Get template for type"
Tpl-->>UI : "Template definition"
UI->>Reg : "Lookup type handler"
Reg-->>UI : "Handler metadata"
UI->>Inst : "Create instance from template"
Inst-->>UI : "Initialized node"
```

**Diagram sources**
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)

**Section sources**
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)

### Profile Mapping System
- Maps configuration schemas to UI forms and runtime validators.
- Enables dynamic property editing, required field enforcement, and type coercion.

```mermaid
flowchart TD
PStart(["Profile Mapping Entry"]) --> LoadSchema["Load Schema"]
LoadSchema --> BuildForm["Build Form Fields"]
BuildForm --> UserEdit["User Edits Values"]
UserEdit --> Validate["Validate Against Schema"]
Validate --> Valid{"Valid?"}
Valid --> |No| ShowErrors["Show Field Errors"]
Valid --> |Yes| Persist["Persist Configuration"]
Persist --> PEnd(["Profile Mapping Exit"])
ShowErrors --> PEnd
```

**Diagram sources**
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [workflow/types.ts](file://src/pages/workflow/types.ts)

**Section sources**
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [workflow/types.ts](file://src/pages/workflow/types.ts)

### Built-in Node Examples
- Trigger examples:
  - Browser navigation and page events.
  - Intercept lifecycle hooks for request/response interception.
  - Repeater collection send triggers.
- Action examples:
  - Data transformation utilities.
  - HTTP requests and response parsing.
  - File I/O and storage operations.
- Condition examples:
  - Boolean expression evaluators.
  - Status code checks and payload validations.

**Section sources**
- [triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)

### Guidelines for Implementing Custom Node Types
- Define a node type with clear inputs, outputs, and execution semantics.
- Provide a template with default values and a schema for profile mapping.
- Register the node type in the registry with metadata and handlers.
- Implement robust validation and error handling in both frontend and backend.
- Ensure strong typing for inputs/outputs to support reliable data pipelines.
- Test edge cases, especially condition branching and asynchronous execution.

**Section sources**
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [workflow/types.ts](file://src/pages/workflow/types.ts)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)

## Dependency Analysis
The Node System exhibits clear separation between UI orchestration, type registration, and backend execution. Triggers decouple event sources from processing logic, while the execution engine centralizes control flow.

```mermaid
graph TB
WF["Workflow Page"] --> REG["Node Type Registry"]
WF --> TPL["Templates"]
WF --> TRIG["Triggers Index"]
TRIG --> BTR["Browser Triggers"]
TRIG --> INT["Intercept Triggers"]
TRIG --> REP["Repeater Triggers"]
WF --> EXE["Execution Engine"]
EXE --> AT["Automation Types"]
EXE --> EVT["Event Bus"]
EXE --> ST["State Manager"]
```

**Diagram sources**
- [workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [triggers/index.ts](file://src/triggers/index.ts)
- [triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)

**Section sources**
- [workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [workflow/templates.ts](file://src/pages/workflow/templates.ts)
- [triggers/index.ts](file://src/triggers/index.ts)
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/types.rs](file://src-tauri/src/automation/types.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)

## Performance Considerations
- Prefer lazy loading of node templates and heavy dependencies to reduce startup time.
- Use streaming where possible for large payloads between nodes.
- Cache frequently evaluated conditions and reusable transformations.
- Minimize synchronous blocking operations in action nodes; offload to background tasks when feasible.
- Batch event emissions to avoid overwhelming the event bus under high throughput.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Validation failures: Check schema definitions and ensure all required fields are present and correctly typed.
- Execution errors: Inspect logs from the execution engine and verify input/output contracts between connected nodes.
- Event routing issues: Confirm trigger subscriptions and event normalization steps.
- State inconsistencies: Review state manager updates and ensure atomic transitions during node execution.

**Section sources**
- [automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)

## Conclusion
Apprecon’s Node System provides a robust, extensible foundation for workflow automation through clearly defined node types, a factory-based instantiation model, schema-driven configuration, and a centralized execution engine. By adhering to the interface contract and leveraging built-in triggers, actions, and conditions, developers can compose powerful automation flows while maintaining reliability and performance.

[No sources needed since this section summarizes without analyzing specific files]