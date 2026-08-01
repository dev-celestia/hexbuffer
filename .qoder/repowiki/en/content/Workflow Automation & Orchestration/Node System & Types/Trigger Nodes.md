# Trigger Nodes

<cite>
**Referenced Files in This Document**
- [src/triggers/index.ts](file://src/triggers/index.ts)
- [src/triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [src/triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [src/triggers/live-traffic/index.ts](file://src/triggers/live-traffic/index.ts)
- [src/triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src/triggers/documents/index.ts](file://src/triggers/documents/index.ts)
- [src/triggers/terminal/index.ts](file://src/triggers/terminal/index.ts)
- [src/pages/workflow/nodes/index.tsx](file://src/pages/workflow/nodes/index.tsx)
- [src/pages/workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)
- [src-tauri/src/automation/scheduled.rs](file://src-tauri/src/automation/scheduled.rs)
- [src-tauri/src/automation/websocket.rs](file://src-tauri/src/automation/websocket.rs)
- [src-tauri/src/automation/page_crawled.rs](file://src-tauri/src/automation/page_crawled.rs)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)
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
This document explains trigger nodes in Apprecon’s workflow system. Trigger nodes are the entry points that start a workflow execution when an event occurs. Events can come from HTTP requests, scheduled tasks, browser interactions, live traffic captures, file changes, and external webhooks. The documentation covers configuration schemas, event binding mechanisms, parameter passing, lifecycle, error handling, and debugging techniques. It also provides examples for common trigger types such as HTTP endpoints, cron schedules, file watchers, and custom event listeners.

## Project Structure
Trigger nodes are implemented across two layers:
- Frontend trigger definitions and UI integrations under src/triggers and src/pages/workflow
- Backend event sources and scheduling under src-tauri/src/automation

```mermaid
graph TB
subgraph "Frontend Triggers"
TIndex["src/triggers/index.ts"]
BIndex["src/triggers/browser/index.ts"]
IIndex["src/triggers/intercept/index.ts"]
LIndex["src/triggers/live-traffic/index.ts"]
RIndex["src/triggers/repeater/index.ts"]
VIndex["src/triggers/invoker/index.ts"]
DIndex["src/triggers/documents/index.ts"]
XIndex["src/triggers/terminal/index.ts"]
WNodes["src/pages/workflow/nodes/index.tsx"]
WReg["src/pages/workflow/node-type-registry.ts"]
end
subgraph "Backend Automation"
AEvents["src-tauri/src/automation/events.rs"]
ASched["src-tauri/src/automation/scheduled.rs"]
AWs["src-tauri/src/automation/websocket.rs"]
ACrawl["src-tauri/src/automation/page_crawled.rs"]
AState["src-tauri/src/automation/state.rs"]
end
TIndex --> BIndex
TIndex --> IIndex
TIndex --> LIndex
TIndex --> RIndex
TIndex --> VIndex
TIndex --> DIndex
TIndex --> XIndex
WNodes --> WReg
WReg --> TIndex
BIndex --> ACrawl
IIndex --> AEvents
LIndex --> AEvents
RIndex --> AEvents
VIndex --> AEvents
DIndex --> AEvents
XIndex --> AEvents
ASched --> AEvents
AWs --> AEvents
AState --> AEvents
```

**Diagram sources**
- [src/triggers/index.ts](file://src/triggers/index.ts)
- [src/triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [src/triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [src/triggers/live-traffic/index.ts](file://src/triggers/live-traffic/index.ts)
- [src/triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src/triggers/documents/index.ts](file://src/triggers/documents/index.ts)
- [src/triggers/terminal/index.ts](file://src/triggers/terminal/index.ts)
- [src/pages/workflow/nodes/index.tsx](file://src/pages/workflow/nodes/index.tsx)
- [src/pages/workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)
- [src-tauri/src/automation/scheduled.rs](file://src-tauri/src/automation/scheduled.rs)
- [src-tauri/src/automation/websocket.rs](file://src-tauri/src/automation/websocket.rs)
- [src-tauri/src/automation/page_crawled.rs](file://src-tauri/src/automation/page_crawled.rs)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)

**Section sources**
- [src/triggers/index.ts](file://src/triggers/index.ts)
- [src/pages/workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

## Core Components
- Trigger registry and index: Centralizes all trigger modules and exposes a unified interface to the workflow engine.
- Node type registry: Maps node IDs to their implementations and metadata (UI, schema, handlers).
- Event bus and state: Bridges frontend triggers with backend automation events and maintains runtime state.

Key responsibilities:
- Define trigger schemas for validation and UI generation
- Bind events from various sources to workflow executions
- Pass parameters from events into subsequent nodes
- Manage lifecycle and error propagation

**Section sources**
- [src/triggers/index.ts](file://src/triggers/index.ts)
- [src/pages/workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)

## Architecture Overview
The trigger architecture spans frontend and backend:
- Frontend defines trigger modules per feature area (browser, intercept, live-traffic, repeater, invoker, documents, terminal)
- Backend emits automation events (scheduled, websocket, page crawled, generic events)
- Workflow engine subscribes to these events and executes corresponding workflows

```mermaid
sequenceDiagram
participant FE as "Frontend Trigger Module"
participant Reg as "Node Type Registry"
participant BE as "Automation Events"
participant WF as "Workflow Engine"
FE->>Reg : Register trigger node (id, schema, handler)
Note over FE,Reg : Schema drives UI and validation
BE-->>WF : Emit event (type, payload)
WF->>FE : Resolve trigger by event type
FE->>FE : Validate payload against schema
FE->>WF : Start workflow with parameters
WF-->>FE : Execution status / errors
```

**Diagram sources**
- [src/triggers/index.ts](file://src/triggers/index.ts)
- [src/pages/workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

## Detailed Component Analysis

### Browser Triggers
Browser triggers initiate workflows based on browser actions or crawl results. They integrate with the page crawler and expose UI controls for configuring conditions and payloads.

```mermaid
classDiagram
class BrowserTrigger {
+string id
+string label
+object schema
+function handle(event) void
}
class PageCrawledEvent {
+string url
+number statusCode
+object headers
+string body
}
BrowserTrigger --> PageCrawledEvent : "consumes"
```

**Diagram sources**
- [src/triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [src-tauri/src/automation/page_crawled.rs](file://src-tauri/src/automation/page_crawled.rs)

**Section sources**
- [src/triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [src-tauri/src/automation/page_crawled.rs](file://src-tauri/src/automation/page_crawled.rs)

### Intercept Triggers
Intercept triggers react to intercepted HTTP requests/responses. They allow filtering by method, path, headers, and response codes, then pass captured data into workflows.

```mermaid
flowchart TD
Start(["Intercept Event"]) --> Filter["Apply Filters<br/>method, path, headers"]
Filter --> Match{"Matched?"}
Match --> |No| End(["Ignore"])
Match --> |Yes| Validate["Validate Payload"]
Validate --> Valid{"Valid?"}
Valid --> |No| Error["Log Error"]
Valid --> |Yes| Execute["Start Workflow"]
Execute --> Done(["Done"])
```

**Diagram sources**
- [src/triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

**Section sources**
- [src/triggers/intercept/index.ts](file://src/triggers/intercept/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

### Live Traffic Triggers
Live traffic triggers subscribe to real-time network events and forward them to workflows. They support target-based routing and payload transformation.

```mermaid
sequenceDiagram
participant Net as "Network Layer"
participant LT as "Live Traffic Trigger"
participant WF as "Workflow Engine"
Net-->>LT : Capture event (url, method, headers, body)
LT->>LT : Apply target filters
LT->>WF : Dispatch workflow with parameters
WF-->>LT : Status / error
```

**Diagram sources**
- [src/triggers/live-traffic/index.ts](file://src/triggers/live-traffic/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

**Section sources**
- [src/triggers/live-traffic/index.ts](file://src/triggers/live-traffic/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

### Repeater Triggers
Repeater triggers enable workflow execution based on repeated API calls or collection runs. They support batch processing and result aggregation.

```mermaid
classDiagram
class RepeaterTrigger {
+string collectionId
+number batchSize
+function onBatchComplete(results) void
}
class BatchResult {
+array items
+number successCount
+number failureCount
}
RepeaterTrigger --> BatchResult : "produces"
```

**Diagram sources**
- [src/triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

**Section sources**
- [src/triggers/repeater/index.ts](file://src/triggers/repeater/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

### Invoker Triggers
Invoker triggers call external functions or services and propagate their results to workflows. They support async execution and error propagation.

```mermaid
flowchart TD
Invoke["Invoke External Function"] --> Async{"Async?"}
Async --> |Yes| Wait["Wait for Result"]
Async --> |No| Direct["Direct Result"]
Wait --> Success{"Success?"}
Direct --> Success
Success --> |Yes| Pass["Pass to Workflow"]
Success --> |No| HandleErr["Handle Error"]
HandleErr --> Log["Log Details"]
Pass --> End(["End"])
```

**Diagram sources**
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

**Section sources**
- [src/triggers/invoker/index.ts](file://src/triggers/invoker/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

### Document Triggers
Document triggers respond to changes in document sections or content updates. They enable workflow automation based on document editing activities.

```mermaid
classDiagram
class DocumentTrigger {
+string documentId
+string sectionId
+function onChange(changes) void
}
class ChangeEvent {
+string operation
+object delta
+timestamp timestamp
}
DocumentTrigger --> ChangeEvent : "emits"
```

**Diagram sources**
- [src/triggers/documents/index.ts](file://src/triggers/documents/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

**Section sources**
- [src/triggers/documents/index.ts](file://src/triggers/documents/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

### Terminal Triggers
Terminal triggers execute workflows based on terminal command outputs or shell events. They capture stdout/stderr and environment context.

```mermaid
sequenceDiagram
participant Term as "Terminal"
participant TT as "Terminal Trigger"
participant WF as "Workflow Engine"
Term-->>TT : Command executed (cmd, args, exitCode)
TT->>TT : Capture output and env
TT->>WF : Start workflow with context
WF-->>TT : Execution result
```

**Diagram sources**
- [src/triggers/terminal/index.ts](file://src/triggers/terminal/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

**Section sources**
- [src/triggers/terminal/index.ts](file://src/triggers/terminal/index.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)

### Conceptual Overview
Common trigger patterns include:
- HTTP endpoints: REST/WebSocket triggers for external integrations
- Cron schedules: Time-based triggers for periodic tasks
- File watchers: FileSystem change triggers for document/code monitoring
- Custom event listeners: Domain-specific event triggers for specialized workflows

```mermaid
flowchart TD
EventSource["Event Source"] --> Router["Event Router"]
Router --> Validator["Schema Validator"]
Validator --> Executor["Workflow Executor"]
Executor --> Logger["Error Logger"]
Executor --> Monitor["Execution Monitor"]
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Dependency Analysis
Trigger nodes depend on:
- Node type registry for registration and lookup
- Automation events for backend communication
- State management for runtime context

```mermaid
graph LR
TR["Trigger Modules"] --> REG["Node Type Registry"]
TR --> EVT["Automation Events"]
EVT --> ST["Runtime State"]
REG --> UI["Workflow UI"]
```

**Diagram sources**
- [src/triggers/index.ts](file://src/triggers/index.ts)
- [src/pages/workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)

**Section sources**
- [src/triggers/index.ts](file://src/triggers/index.ts)
- [src/pages/workflow/node-type-registry.ts](file://src/pages/workflow/node-type-registry.ts)
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)

## Performance Considerations
- Event filtering: Implement efficient filters to reduce unnecessary workflow executions
- Batch processing: Use batching for high-frequency events like live traffic
- Asynchronous handling: Avoid blocking operations in trigger handlers
- Memory management: Clean up event subscriptions and temporary data
- Rate limiting: Implement throttling for external API calls and scheduled tasks

## Troubleshooting Guide
Common issues and solutions:
- Trigger not firing: Verify event source is active and filters match incoming events
- Parameter validation errors: Check schema definitions and input data formats
- Workflow execution failures: Review error logs and stack traces in the debugger
- Performance degradation: Monitor event volume and optimize filters/batching
- State inconsistencies: Ensure proper cleanup of subscriptions and timers

Debugging techniques:
- Enable detailed logging in trigger modules
- Use workflow execution history to trace parameter flows
- Inspect event payloads using developer tools
- Test triggers with sample data before production deployment

**Section sources**
- [src-tauri/src/automation/events.rs](file://src-tauri/src/automation/events.rs)
- [src-tauri/src/automation/state.rs](file://src-tauri/src/automation/state.rs)

## Conclusion
Trigger nodes form the foundation of Apprecon's workflow automation system. By understanding their configuration, event binding mechanisms, and lifecycle management, developers can create robust and efficient automated workflows. The modular architecture allows easy extension with new trigger types while maintaining consistency across different event sources. Proper error handling, performance optimization, and debugging practices ensure reliable operation in production environments.