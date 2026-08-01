# Monitoring & Debugging

<cite>
**Referenced Files in This Document**
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/stores/debugger.ts](file://src/stores/debugger.ts)
- [src/pages/workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [src/pages/workflow/lib/execution-engine.mjs](file://src/pages/workflow/lib/execution-engine.mjs)
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/components/LogViewer.tsx](file://src/pages/workflow/components/LogViewer.tsx)
- [src/pages/workflow/components/PerformancePanel.tsx](file://src/pages/workflow/components/PerformancePanel.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src/pages/workflow/types.ts](file://src/pages/workflow/types.ts)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src-tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)
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
This document explains the monitoring and debugging capabilities for workflows, focusing on real-time execution tracking, log collection, performance metrics, and step-through debugging. It covers how to observe live runs, collect logs, profile performance, identify bottlenecks, and use breakpoints and step controls to diagnose issues. Practical examples are included to help you quickly get started with diagnosing workflow problems and optimizing performance.

## Project Structure
The monitoring and debugging features span both the frontend (React + Tauri) and backend (Rust). Key areas include:
- Workflow UI pages and components for execution panels, logs, and performance views
- Stores for logging and debugger state
- Hooks that orchestrate execution lifecycle and events
- Backend automation execution engine and commands exposed to the frontend

```mermaid
graph TB
subgraph "Frontend"
WF["workflow/index.tsx"]
ExecPanel["components/ExecutionPanel.tsx"]
LogViewer["components/LogViewer.tsx"]
PerfPanel["components/PerformancePanel.tsx"]
HookExec["hooks/useWorkflowExecution.ts"]
StoreLog["stores/log.ts"]
StoreDbg["stores/debugger.ts"]
TypesWF["types.ts"]
end
subgraph "Backend"
ExecRS["automation/execution.rs"]
CmdMod["commands/mod.rs"]
end
WF --> ExecPanel
WF --> LogViewer
WF --> PerfPanel
WF --> HookExec
HookExec --> ExecRS
ExecPanel --> StoreDbg
LogViewer --> StoreLog
PerfPanel --> StoreLog
TypesWF --> WF
```

**Diagram sources**
- [src/pages/workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/components/LogViewer.tsx](file://src/pages/workflow/components/LogViewer.tsx)
- [src/pages/workflow/components/PerformancePanel.tsx](file://src/pages/workflow/components/PerformancePanel.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/stores/debugger.ts](file://src/stores/debugger.ts)
- [src/pages/workflow/types.ts](file://src/pages/workflow/types.ts)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src-tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)

**Section sources**
- [src/pages/workflow/index.tsx](file://src/pages/workflow/index.tsx)
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/stores/debugger.ts](file://src/stores/debugger.ts)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src-tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)

## Core Components
- Execution Panel: Displays live run status, node progress, and provides controls to start, pause, resume, stop, and step through executions.
- Log Viewer: Streams and filters logs emitted by nodes and the runtime, supporting search and export.
- Performance Panel: Shows timing metrics per node, overall duration, throughput, and identifies hotspots.
- Logging Store: Centralized log buffer with append-only semantics, filtering, and persistence hooks.
- Debugger Store: Manages breakpoints, current step, and step controls (step over/into/out).
- Execution Hook: Orchestrates lifecycle events, connects to backend execution, and updates UI state.
- Backend Execution Engine: Executes workflow steps, emits telemetry, and handles breakpoints and stepping requests.

**Section sources**
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/components/LogViewer.tsx](file://src/pages/workflow/components/LogViewer.tsx)
- [src/pages/workflow/components/PerformancePanel.tsx](file://src/pages/workflow/components/PerformancePanel.tsx)
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/stores/debugger.ts](file://src/stores/debugger.ts)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

## Architecture Overview
The system uses a reactive frontend backed by a Rust execution engine. The frontend orchestrates user interactions and renders live data; the backend executes nodes, enforces breakpoints, and streams logs and metrics.

```mermaid
sequenceDiagram
participant UI as "ExecutionPanel"
participant Hook as "useWorkflowExecution"
participant Cmd as "Tauri Commands"
participant Eng as "Execution Engine"
participant LogS as "Logging Store"
participant DbgS as "Debugger Store"
UI->>Hook : Start Run
Hook->>Cmd : invoke execute()
Cmd->>Eng : start execution
Eng-->>Cmd : stream {status, nodeId, metrics}
Cmd-->>Hook : events
Hook->>LogS : append logs
Hook->>DbgS : update breakpoints/state
Hook-->>UI : render progress/logs/metrics
UI->>DbgS : set breakpoint / step
DbgS-->>Hook : notify step control
Hook->>Cmd : send step/breakpoint commands
Cmd->>Eng : apply step/breakpoint
Eng-->>Cmd : continue or pause
Cmd-->>Hook : updated state
Hook-->>UI : reflect paused/resumed state
```

**Diagram sources**
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src-tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/stores/debugger.ts](file://src/stores/debugger.ts)

## Detailed Component Analysis

### Real-Time Execution Tracking
- ExecutionPanel subscribes to lifecycle events and displays node-level progress, current step, and overall status.
- useWorkflowExecution centralizes event handling, maps backend events to UI state, and coordinates store updates.
- Backend execution engine emits structured events with timestamps, node identifiers, and optional payloads.

```mermaid
flowchart TD
Start(["Run Started"]) --> Init["Initialize context and nodes"]
Init --> Loop{"Next Node Ready?"}
Loop --> |Yes| ExecuteNode["Execute Node"]
ExecuteNode --> EmitEvent["Emit status/metrics"]
EmitEvent --> UpdateUI["Update UI stores"]
UpdateUI --> CheckBreakpoint{"Breakpoint hit?"}
CheckBreakpoint --> |Yes| Pause["Pause until step/resume"]
CheckBreakpoint --> |No| Loop
Loop --> |No| Complete["Mark run complete"]
Pause --> StepControl["Step Over/Into/Out"]
StepControl --> Resume["Resume Execution"]
Resume --> Loop
Complete --> End(["Run Ended"])
```

**Diagram sources**
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

**Section sources**
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

### Log Collection and Streaming
- Logs are appended to a centralized store with timestamps, severity, and contextual metadata.
- LogViewer supports filtering by level, keyword, and node, and allows exporting logs for analysis.
- The execution hook routes backend log events into the store and ensures thread-safe updates.

```mermaid
classDiagram
class LogStore {
+append(entry)
+filter(query)
+export(format)
-buffer : Array
}
class LogViewer {
+render(filteredLogs)
+search(keyword)
+export()
}
class ExecutionHook {
+onLog(event)
+dispatchToStore()
}
LogViewer --> LogStore : "reads"
ExecutionHook --> LogStore : "writes"
```

**Diagram sources**
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/pages/workflow/components/LogViewer.tsx](file://src/pages/workflow/components/LogViewer.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)

**Section sources**
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/pages/workflow/components/LogViewer.tsx](file://src/pages/workflow/components/LogViewer.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)

### Performance Metrics and Profiling
- PerformancePanel aggregates per-node durations, total run time, and throughput.
- Metrics are collected from execution events and stored alongside logs for correlation.
- Hotspot identification highlights nodes with high latency or error rates.

```mermaid
flowchart TD
MStart(["Metrics Capture"]) --> Collect["Collect per-node timings"]
Collect --> Aggregate["Aggregate totals and averages"]
Aggregate --> Visualize["Render charts and tables"]
Visualize --> IdentifyHotspots["Flag slow/error nodes"]
IdentifyHotspots --> Export["Export report"]
```

**Diagram sources**
- [src/pages/workflow/components/PerformancePanel.tsx](file://src/pages/workflow/components/PerformancePanel.tsx)
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)

**Section sources**
- [src/pages/workflow/components/PerformancePanel.tsx](file://src/pages/workflow/components/PerformancePanel.tsx)
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)

### Breakpoints and Step-Through Execution
- Debugger Store manages breakpoints and current execution state.
- ExecutionPanel exposes step controls (step over, step into, step out) and pause/resume actions.
- Backend respects breakpoints and pauses execution until resumed.

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "ExecutionPanel"
participant DBGS as "Debugger Store"
participant HOOK as "useWorkflowExecution"
participant CMD as "Commands"
participant ENG as "Execution Engine"
User->>UI : Set Breakpoint
UI->>DBGS : save breakpoint(nodeId)
User->>UI : Start Run
HOOK->>CMD : execute()
CMD->>ENG : run with breakpoints
ENG-->>HOOK : pause at breakpoint
HOOK-->>UI : show paused state
User->>UI : Step Over/Into/Out
UI->>DBGS : update step action
DBGS-->>HOOK : notify step
HOOK->>CMD : send step command
CMD->>ENG : continue one step
ENG-->>HOOK : next state
HOOK-->>UI : render updated state
```

**Diagram sources**
- [src/stores/debugger.ts](file://src/stores/debugger.ts)
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src-tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

**Section sources**
- [src/stores/debugger.ts](file://src/stores/debugger.ts)
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src-tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

### Execution History
- Past runs are recorded with timestamps, outcomes, and summary metrics.
- Users can replay or compare runs to analyze regressions and improvements.
- History integrates with logs and performance data for deep-dive analysis.

```mermaid
flowchart TD
HStart(["Run Completed"]) --> Record["Persist run metadata"]
Record --> Index["Index by date/status"]
Index --> Browse["Browse history list"]
Browse --> Select["Select run"]
Select --> LoadData["Load logs/metrics"]
LoadData --> Compare["Compare across runs"]
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Dependency Analysis
The monitoring and debugging stack has clear separation between UI, state, and backend execution.

```mermaid
graph LR
UI["ExecutionPanel.tsx"] --> Hook["useWorkflowExecution.ts"]
UI --> LogV["LogViewer.tsx"]
UI --> PerfP["PerformancePanel.tsx"]
Hook --> LogS["log.ts"]
Hook --> DbgS["debugger.ts"]
Hook --> Cmd["commands/mod.rs"]
Cmd --> Eng["automation/execution.rs"]
LogV --> LogS
PerfP --> LogS
```

**Diagram sources**
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src/pages/workflow/components/LogViewer.tsx](file://src/pages/workflow/components/LogViewer.tsx)
- [src/pages/workflow/components/PerformancePanel.tsx](file://src/pages/workflow/components/PerformancePanel.tsx)
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/stores/debugger.ts](file://src/stores/debugger.ts)
- [src-tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

**Section sources**
- [src/pages/workflow/components/ExecutionPanel.tsx](file://src/pages/workflow/components/ExecutionPanel.tsx)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/stores/debugger.ts](file://src/stores/debugger.ts)
- [src-tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

## Performance Considerations
- Prefer streaming updates with batching to avoid UI thrash during high-frequency logs.
- Use pagination or virtualization for large log sets to maintain responsiveness.
- Profile nodes with coarse-grained timers first; refine granularity only where needed.
- Avoid heavy computations in the main thread; offload filtering/exporting to workers if necessary.
- Cache frequently accessed metrics and summaries to reduce recomputation.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- No logs appearing: Ensure the execution hook is subscribed to backend log events and that the logging store is initialized before starting a run.
- Breakpoints not triggering: Verify breakpoints are set on valid node IDs and that the backend recognizes them; confirm the engine is running in debug mode.
- Paused state stuck: Send a resume command via step controls; check for unhandled exceptions in node execution.
- Slow performance: Inspect the Performance Panel for hotspots; add targeted logging around suspected sections; consider parallelizing independent nodes.
- History missing: Confirm run completion persists metadata and indexes entries by date and status.

**Section sources**
- [src/stores/log.ts](file://src/stores/log.ts)
- [src/stores/debugger.ts](file://src/stores/debugger.ts)
- [src/pages/workflow/hooks/useWorkflowExecution.ts](file://src/pages/workflow/hooks/useWorkflowExecution.ts)
- [src-tauri/src/automation/execution.rs](file://src-tauri/src/automation/execution.rs)

## Conclusion
The workflow monitoring and debugging system provides comprehensive visibility into execution, robust log collection, actionable performance metrics, and interactive debugging tools. By leveraging real-time tracking, breakpoints, and profiling, you can quickly diagnose issues and optimize workflows for reliability and speed.