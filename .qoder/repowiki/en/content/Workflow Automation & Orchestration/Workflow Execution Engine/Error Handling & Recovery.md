# Error Handling & Recovery

<cite>
**Referenced Files in This Document**
- [workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [workflow/types.ts](file://src/pages/workflow/types.ts)
- [workflow/constants.ts](file://src/pages/workflow/constants.ts)
- [workflow/lib/executor.ts](file://src/pages/workflow/lib/executor.ts)
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)
- [workflow/lib/retry-strategy.ts](file://src/pages/workflow/lib/retry-strategy.ts)
- [workflow/lib/fallback-manager.ts](file://src/pages/workflow/lib/fallback-manager.ts)
- [workflow/nodes/custom-node.ts](file://src/pages/workflow/nodes/custom-node.ts)
- [stores/log.ts](file://src/stores/log.ts)
- [components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [components/ui/alert-dialog.tsx](file://src/components/ui/alert-dialog.tsx)
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
This document explains the error handling mechanisms for workflow execution, focusing on error propagation, retry logic, fallback strategies, categorization, logging, and reporting. It also covers exception handling in custom nodes, timeout management, graceful degradation, and debugging failed executions with concrete patterns you can apply.

## Project Structure
The workflow subsystem is implemented under src/pages/workflow with supporting UI and stores:
- Workflow orchestration and state live in the workflow directory (index, types, constants).
- Execution engine and node runner handle step-by-step processing and error flow.
- Dedicated modules implement retry strategies, fallback management, and centralized error handling.
- Custom node templates show how to integrate robust error handling into user-defined steps.
- Logging and user-facing notifications are provided by shared stores and UI components.

```mermaid
graph TB
subgraph "Workflow"
WIndex["workflow/index.tsx"]
WTypes["workflow/types.ts"]
WConst["workflow/constants.ts"]
end
subgraph "Execution Engine"
Executor["workflow/lib/executor.ts"]
NodeRunner["workflow/lib/node-runner.ts"]
end
subgraph "Resilience"
ErrorHandler["workflow/lib/error-handler.ts"]
RetryStrategy["workflow/lib/retry-strategy.ts"]
FallbackManager["workflow/lib/fallback-manager.ts"]
end
subgraph "Custom Nodes"
CustomNode["workflow/nodes/custom-node.ts"]
end
subgraph "Observability"
LogStore["stores/log.ts"]
Toast["components/ui/toast.tsx"]
Alert["components/ui/alert-dialog.tsx"]
end
WIndex --> Executor
Executor --> NodeRunner
NodeRunner --> ErrorHandler
NodeRunner --> RetryStrategy
NodeRunner --> FallbackManager
CustomNode --> ErrorHandler
ErrorHandler --> LogStore
ErrorHandler --> Toast
ErrorHandler --> Alert
```

**Diagram sources**
- [workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [workflow/lib/executor.ts](file://src/pages/workflow/lib/executor.ts)
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)
- [workflow/lib/retry-strategy.ts](file://src/pages/workflow/lib/retry-strategy.ts)
- [workflow/lib/fallback-manager.ts](file://src/pages/workflow/lib/fallback-manager.ts)
- [workflow/nodes/custom-node.ts](file://src/pages/workflow/nodes/custom-node.ts)
- [stores/log.ts](file://src/stores/log.ts)
- [components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [components/ui/alert-dialog.tsx](file://src/components/ui/alert-dialog.tsx)

**Section sources**
- [workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [workflow/types.ts](file://src/pages/workflow/types.ts)
- [workflow/constants.ts](file://src/pages/workflow/constants.ts)

## Core Components
- Executor: Drives workflow execution, manages step lifecycle, and coordinates retries and fallbacks.
- Node Runner: Executes individual nodes, captures exceptions, and normalizes errors for downstream handling.
- Error Handler: Categorizes errors, enriches context, logs details, and triggers user notifications.
- Retry Strategy: Implements backoff policies, max attempts, and jitter; decides whether to continue or fail fast.
- Fallback Manager: Selects alternative paths or default outputs when primary execution fails.
- Custom Node Template: Demonstrates safe execution boundaries, timeouts, and structured error reporting.
- Logging Store and UI: Centralized logging and user-visible alerts for failed runs and partial successes.

Key responsibilities:
- Propagate errors up the call stack while preserving context.
- Apply retry policies based on error categories.
- Switch to fallbacks deterministically when configured.
- Record actionable diagnostics for debugging.

**Section sources**
- [workflow/lib/executor.ts](file://src/pages/workflow/lib/executor.ts)
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)
- [workflow/lib/retry-strategy.ts](file://src/pages/workflow/lib/retry-strategy.ts)
- [workflow/lib/fallback-manager.ts](file://src/pages/workflow/lib/fallback-manager.ts)
- [workflow/nodes/custom-node.ts](file://src/pages/workflow/nodes/custom-node.ts)
- [stores/log.ts](file://src/stores/log.ts)
- [components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [components/ui/alert-dialog.tsx](file://src/components/ui/alert-dialog.tsx)

## Architecture Overview
The execution pipeline enforces a consistent error model across all nodes. Errors are captured at the boundary, categorized, and then either retried, routed to a fallback, or escalated to the executor and UI.

```mermaid
sequenceDiagram
participant Orchestrator as "Executor"
participant Runner as "Node Runner"
participant Node as "Custom Node"
participant EH as "Error Handler"
participant RS as "Retry Strategy"
participant FM as "Fallback Manager"
participant Log as "Log Store"
participant UI as "Toast/Alert"
Orchestrator->>Runner : Execute next node
Runner->>Node : Run with timeout and context
Node-->>Runner : Result or throw error
alt Error occurred
Runner->>EH : Normalize and categorize error
EH->>RS : Should we retry?
RS-->>EH : Yes/No + delay
alt Retry allowed
EH->>UI : Show transient warning
EH->>Log : Log attempt details
Runner->>Node : Re-run after delay
else No retry
EH->>FM : Choose fallback path
FM-->>EH : Fallback result or null
alt Fallback available
EH->>UI : Notify fallback used
EH->>Log : Log fallback decision
Runner-->>Orchestrator : Return fallback output
else No fallback
EH->>UI : Show failure alert
EH->>Log : Log final failure
Runner-->>Orchestrator : Fail fast
end
end
else Success
Runner-->>Orchestrator : Return node output
end
```

**Diagram sources**
- [workflow/lib/executor.ts](file://src/pages/workflow/lib/executor.ts)
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)
- [workflow/lib/retry-strategy.ts](file://src/pages/workflow/lib/retry-strategy.ts)
- [workflow/lib/fallback-manager.ts](file://src/pages/workflow/lib/fallback-manager.ts)
- [stores/log.ts](file://src/stores/log.ts)
- [components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [components/ui/alert-dialog.tsx](file://src/components/ui/alert-dialog.tsx)

## Detailed Component Analysis

### Error Propagation and Categorization
Errors are normalized at the node boundary and tagged with category metadata (e.g., network, validation, resource, timeout). The error handler enriches each event with node identity, step index, timestamps, and correlation IDs. Categories drive retry decisions and fallback selection.

```mermaid
classDiagram
class ErrorCategory {
+string code
+string label
+boolean retryable
+boolean recoverable
}
class NormalizedError {
+string message
+string category
+any context
+number timestamp
+string nodeId
+number stepIndex
}
class ErrorHandler {
+categorize(error) ErrorCategory
+normalize(error) NormalizedError
+enrich(context) NormalizedError
+shouldRetry(error) boolean
+notify(message, severity) void
+log(event) void
}
ErrorHandler --> ErrorCategory : "uses"
ErrorHandler --> NormalizedError : "produces"
```

**Diagram sources**
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)
- [workflow/types.ts](file://src/pages/workflow/types.ts)

**Section sources**
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)
- [workflow/types.ts](file://src/pages/workflow/types.ts)

### Retry Logic and Backoff
The retry strategy evaluates whether an error is retryable and computes delay using exponential backoff with jitter. It tracks attempts and enforces maximum limits. Non-retryable errors bypass retries and proceed to fallback or fail-fast.

```mermaid
flowchart TD
Start(["Start Retry Decision"]) --> CheckRetryable{"Is error retryable?"}
CheckRetryable --> |No| SkipRetry["Skip retry<br/>Proceed to fallback or fail"]
CheckRetryable --> |Yes| AttemptsLeft{"Attempts remaining?"}
AttemptsLeft --> |No| MaxReached["Max attempts reached<br/>Proceed to fallback or fail"]
AttemptsLeft --> |Yes| ComputeDelay["Compute delay with backoff + jitter"]
ComputeDelay --> Wait["Wait for delay"]
Wait --> ReRun["Re-execute node"]
ReRun --> Outcome{"Success?"}
Outcome --> |Yes| Done["Return success"]
Outcome --> |No| AttemptsLeft
SkipRetry --> End(["End"])
MaxReached --> End
Done --> End
```

**Diagram sources**
- [workflow/lib/retry-strategy.ts](file://src/pages/workflow/lib/retry-strategy.ts)

**Section sources**
- [workflow/lib/retry-strategy.ts](file://src/pages/workflow/lib/retry-strategy.ts)

### Fallback Strategies
Fallbacks are selected based on configuration and error category. Options include returning cached data, executing an alternate node, or producing a safe default. The manager records which fallback was chosen and why.

```mermaid
flowchart TD
Enter(["Fallback Request"]) --> HasConfig{"Fallback configured?"}
HasConfig --> |No| FailFast["Fail fast"]
HasConfig --> |Yes| Type{"Fallback type"}
Type --> |Alternate Node| RunAlt["Execute alternate node"]
Type --> |Cached Data| UseCache["Return cached value"]
Type --> |Default Value| UseDefault["Return default payload"]
RunAlt --> AltResult{"Alt success?"}
AltResult --> |Yes| ReturnAlt["Return alternate result"]
AltResult --> |No| FailFast
UseCache --> ReturnCache["Return cached value"]
UseDefault --> ReturnDefault["Return default payload"]
ReturnAlt --> Exit(["Exit"])
ReturnCache --> Exit
ReturnDefault --> Exit
FailFast --> Exit
```

**Diagram sources**
- [workflow/lib/fallback-manager.ts](file://src/pages/workflow/lib/fallback-manager.ts)

**Section sources**
- [workflow/lib/fallback-manager.ts](file://src/pages/workflow/lib/fallback-manager.ts)

### Exception Handling in Custom Nodes
Custom nodes should encapsulate their logic within try/catch blocks, enforce timeouts, and return structured results or typed errors. They must avoid leaking internal stack traces to the UI and instead rely on the error handler for enrichment and logging.

```mermaid
sequenceDiagram
participant Caller as "Node Runner"
participant CN as "Custom Node"
participant TO as "Timeout Guard"
participant EH as "Error Handler"
Caller->>CN : Invoke with context and timeout
CN->>TO : Start timeout timer
TO-->>CN : Timer active
CN->>CN : Execute business logic
alt Timeout
TO-->>CN : Throw timeout error
CN->>EH : Normalize timeout error
EH-->>Caller : Category=timeout, retryable=false
else Exception
CN->>EH : Normalize caught error
EH-->>Caller : Category=runtime/validation/network
else Success
CN-->>Caller : Return result
end
```

**Diagram sources**
- [workflow/nodes/custom-node.ts](file://src/pages/workflow/nodes/custom-node.ts)
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)

**Section sources**
- [workflow/nodes/custom-node.ts](file://src/pages/workflow/nodes/custom-node.ts)
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)

### Timeout Management
Timeouts are enforced per node execution to prevent hangs. When exceeded, a standardized timeout error is raised, categorized as non-retryable unless explicitly configured otherwise. Timeouts are logged with elapsed time and node metadata.

```mermaid
flowchart TD
TStart(["Node Start"]) --> SetTimer["Set timeout guard"]
SetTimer --> Exec["Execute node"]
Exec --> OK{"Completed before timeout?"}
OK --> |Yes| ReturnOK["Return result"]
OK --> |No| RaiseTimeout["Raise timeout error"]
RaiseTimeout --> LogTimeout["Log timeout event"]
LogTimeout --> ReturnTimeout["Return timeout error"]
ReturnOK --> TEnd(["End"])
ReturnTimeout --> TEnd
```

**Diagram sources**
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)

**Section sources**
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)

### Graceful Degradation
When failures occur, the system degrades gracefully by:
- Returning partial results where possible.
- Using fallbacks to maintain core functionality.
- Notifying users via toast or dialog without blocking the workflow.
- Persisting diagnostic logs for later analysis.

```mermaid
flowchart TD
DStart(["Degradation Trigger"]) --> Assess["Assess impact and options"]
Assess --> Partial{"Partial output available?"}
Partial --> |Yes| EmitPartial["Emit partial result"]
Partial --> |No| FallbackCheck{"Fallback available?"}
FallbackCheck --> |Yes| UseFallback["Use fallback path"]
FallbackCheck --> |No| FailPath["Fail fast with clear message"]
EmitPartial --> Notify["Notify user"]
UseFallback --> Notify
FailPath --> Notify
Notify --> DEnd(["End"])
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

### Logging and Reporting
All errors and decisions are recorded in a central log store with structured fields: category, node id, step index, timestamps, and messages. User-facing notifications use toast and alert dialogs to inform about transient issues, fallback usage, and final failures.

```mermaid
classDiagram
class LogEntry {
+string level
+string category
+string nodeId
+number stepIndex
+string message
+object context
+timestamp createdAt
}
class LogStore {
+append(entry) void
+query(filters) LogEntry[]
+export() string
}
class Notification {
+showToast(message, severity) void
+showDialog(title, message, actions) void
}
LogStore <.. ErrorHandler : "writes"
Notification <.. ErrorHandler : "reads"
```

**Diagram sources**
- [stores/log.ts](file://src/stores/log.ts)
- [components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [components/ui/alert-dialog.tsx](file://src/components/ui/alert-dialog.tsx)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)

**Section sources**
- [stores/log.ts](file://src/stores/log.ts)
- [components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [components/ui/alert-dialog.tsx](file://src/components/ui/alert-dialog.tsx)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)

## Dependency Analysis
The execution layer depends on resilience modules and observability primitives. Coupling is minimized through interfaces and explicit contracts for error normalization and retry decisions.

```mermaid
graph LR
Executor["Executor"] --> NodeRunner["Node Runner"]
NodeRunner --> ErrorHandler["Error Handler"]
NodeRunner --> RetryStrategy["Retry Strategy"]
NodeRunner --> FallbackManager["Fallback Manager"]
ErrorHandler --> LogStore["Log Store"]
ErrorHandler --> Toast["Toast"]
ErrorHandler --> Alert["Alert Dialog"]
CustomNode["Custom Node"] --> ErrorHandler
```

**Diagram sources**
- [workflow/lib/executor.ts](file://src/pages/workflow/lib/executor.ts)
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)
- [workflow/lib/retry-strategy.ts](file://src/pages/workflow/lib/retry-strategy.ts)
- [workflow/lib/fallback-manager.ts](file://src/pages/workflow/lib/fallback-manager.ts)
- [stores/log.ts](file://src/stores/log.ts)
- [components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [components/ui/alert-dialog.tsx](file://src/components/ui/alert-dialog.tsx)

**Section sources**
- [workflow/lib/executor.ts](file://src/pages/workflow/lib/executor.ts)
- [workflow/lib/node-runner.ts](file://src/pages/workflow/lib/node-runner.ts)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)
- [workflow/lib/retry-strategy.ts](file://src/pages/workflow/lib/retry-strategy.ts)
- [workflow/lib/fallback-manager.ts](file://src/pages/workflow/lib/fallback-manager.ts)
- [stores/log.ts](file://src/stores/log.ts)
- [components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [components/ui/alert-dialog.tsx](file://src/components/ui/alert-dialog.tsx)

## Performance Considerations
- Prefer bounded retries with jitter to avoid thundering herds.
- Cache fallback responses when appropriate to reduce repeated failures.
- Keep timeout values realistic per node type; avoid overly aggressive timeouts that trigger unnecessary retries.
- Batch logging writes to minimize overhead during high-error scenarios.
- Avoid deep exception stacks in hot paths; normalize early and keep payloads small.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Intermittent network errors: Verify retry policy and backoff settings; check if the error category is marked retryable.
- Timeouts: Inspect node execution duration; adjust timeout thresholds and ensure async operations complete promptly.
- Missing fallbacks: Confirm fallback configuration exists for the failing node and category.
- Excessive noise: Filter logs by category and node id; suppress transient warnings if acceptable.
- Partial failures: Review partial result emission and ensure downstream consumers handle incomplete payloads.

Debugging steps:
- Open the log store and filter by the failing node id and step index.
- Inspect normalized error details for category and context.
- Reproduce with increased verbosity and capture toast/dialog events.
- Validate custom node boundaries and ensure proper error normalization.

**Section sources**
- [stores/log.ts](file://src/stores/log.ts)
- [components/ui/toast.tsx](file://src/components/ui/toast.tsx)
- [components/ui/alert-dialog.tsx](file://src/components/ui/alert-dialog.tsx)
- [workflow/lib/error-handler.ts](file://src/pages/workflow/lib/error-handler.ts)
- [workflow/lib/retry-strategy.ts](file://src/pages/workflow/lib/retry-strategy.ts)
- [workflow/lib/fallback-manager.ts](file://src/pages/workflow/lib/fallback-manager.ts)
- [workflow/nodes/custom-node.ts](file://src/pages/workflow/nodes/custom-node.ts)

## Conclusion
Robust workflow execution relies on clear error categorization, disciplined retry policies, deterministic fallbacks, and comprehensive logging. By enforcing timeouts, capturing structured diagnostics, and notifying users appropriately, the system maintains reliability and usability even under adverse conditions. Adopt the patterns outlined here to build resilient workflows that degrade gracefully and provide actionable insights when things go wrong.