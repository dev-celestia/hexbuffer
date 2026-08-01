# SQL Injection Testing

<cite>
**Referenced Files in This Document**
- [src/pages/sql-injection/index.tsx](file://src/pages/sql-injection/index.tsx)
- [src/pages/sql-injection/types.ts](file://src/pages/sql-injection/types.ts)
- [src/pages/sql-injection/constants.ts](file://src/pages/sql-injection/constants.ts)
- [src/pages/sql-injection/hooks/use-sql-injection.ts](file://src/pages/sql-injection/hooks/use-sql-injection.ts)
- [src/pages/sql-injection/components/SqlInjectionPanel.tsx](file://src/pages/sql-injection/components/SqlInjectionPanel.tsx)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)
- [src-tauri/src/sqli/mod.rs](file://src-tauri/src/sqli/mod.rs)
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src-tauri/src/sqli/payloads.rs](file://src-tauri/src/sqli/payloads.rs)
- [src-tauri/src/sqli/types.rs](file://src-tauri/src/sqli/types.rs)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/lib/http-message.ts](file://src/lib/http-message.ts)
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
This document explains Apprecon’s SQL injection testing capabilities, including the automated vulnerability detection engine, parameter analysis tools, and payload generation system. It covers how to identify vulnerable endpoints, test different SQL injection techniques (boolean-based, time-based, union-based), extract database information, create custom payloads, interpret results, and generate security reports. Advanced features such as blind SQL injection detection, error-based extraction, and integration with database schemas are also addressed. Best practices for safe testing, avoiding data corruption, and handling false positives are included.

## Project Structure
Apprecon implements SQL injection testing across both the frontend UI and a Rust backend:
- Frontend page and hooks manage user interactions, parameter selection, and result visualization.
- A lightweight engine orchestrates payload execution and response analysis.
- The Rust backend provides robust detection logic, payload sets, and type definitions.
- Integration with the Invoker module enables sending crafted requests through Apprecon’s HTTP pipeline.

```mermaid
graph TB
subgraph "Frontend"
UI["SQL Injection Page<br/>index.tsx"]
Panel["SqlInjectionPanel.tsx"]
Hook["use-sql-injection.ts"]
Engine["sqli-engine.mjs"]
end
subgraph "Backend (Rust)"
Mod["sqli/mod.rs"]
Detector["sqli/detector.rs"]
Payloads["sqli/payloads.rs"]
Types["sqli/types.rs"]
end
subgraph "Integration"
InvokerCmd["commands/invoker.rs"]
InvokerStore["stores/invoker.ts"]
HttpMsg["lib/http-message.ts"]
end
UI --> Panel
Panel --> Hook
Hook --> Engine
Engine --> InvokerCmd
InvokerCmd --> Mod
Mod --> Detector
Mod --> Payloads
Mod --> Types
Hook --> InvokerStore
InvokerStore --> HttpMsg
```

**Diagram sources**
- [src/pages/sql-injection/index.tsx](file://src/pages/sql-injection/index.tsx)
- [src/pages/sql-injection/components/SqlInjectionPanel.tsx](file://src/pages/sql-injection/components/SqlInjectionPanel.tsx)
- [src/pages/sql-injection/hooks/use-sql-injection.ts](file://src/pages/sql-injection/hooks/use-sql-injection.ts)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)
- [src-tauri/src/sqli/mod.rs](file://src-tauri/src/sqli/mod.rs)
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src-tauri/src/sqli/payloads.rs](file://src-tauri/src/sqli/payloads.rs)
- [src-tauri/src/sqli/types.rs](file://src-tauri/src/sqli/types.rs)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/lib/http-message.ts](file://src/lib/http-message.ts)

**Section sources**
- [src/pages/sql-injection/index.tsx](file://src/pages/sql-injection/index.tsx)
- [src/pages/sql-injection/types.ts](file://src/pages/sql-injection/types.ts)
- [src/pages/sql-injection/constants.ts](file://src/pages/sql-injection/constants.ts)
- [src/pages/sql-injection/hooks/use-sql-injection.ts](file://src/pages/sql-injection/hooks/use-sql-injection.ts)
- [src/pages/sql-injection/components/SqlInjectionPanel.tsx](file://src/pages/sql-injection/components/SqlInjectionPanel.tsx)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)
- [src-tauri/src/sqli/mod.rs](file://src-tauri/src/sqli/mod.rs)
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src-tauri/src/sqli/payloads.rs](file://src-tauri/src/sqli/payloads.rs)
- [src-tauri/src/sqli/types.rs](file://src-tauri/src/sqli/types.rs)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/lib/http-message.ts](file://src/lib/http-message.ts)

## Core Components
- SQL Injection Page and Panel: Provide the UI for selecting parameters, choosing techniques, launching scans, and viewing results.
- Hook and Engine: Orchestrate scanning workflows, manage state, and coordinate request/response processing.
- Rust Backend Modules: Implement detection logic, payload generation, and type contracts for consistent communication between frontend and backend.
- Invoker Integration: Sends crafted requests via Apprecon’s HTTP pipeline and captures responses for analysis.

Key responsibilities:
- Parameter discovery and selection from captured traffic or manual input.
- Automated payload generation and execution for multiple SQL injection techniques.
- Response analysis to detect vulnerabilities and classify findings.
- Reporting and export of results for further review.

**Section sources**
- [src/pages/sql-injection/index.tsx](file://src/pages/sql-injection/index.tsx)
- [src/pages/sql-injection/components/SqlInjectionPanel.tsx](file://src/pages/sql-injection/components/SqlInjectionPanel.tsx)
- [src/pages/sql-injection/hooks/use-sql-injection.ts](file://src/pages/sql-injection/hooks/use-sql-injection.ts)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)
- [src-tauri/src/sqli/mod.rs](file://src-tauri/src/sqli/mod.rs)
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src-tauri/src/sqli/payloads.rs](file://src-tauri/src/sqli/payloads.rs)
- [src-tauri/src/sqli/types.rs](file://src-tauri/src/sqli/types.rs)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/lib/http-message.ts](file://src/lib/http-message.ts)

## Architecture Overview
The SQL injection testing flow integrates frontend orchestration with backend detection:
- The UI selects target parameters and techniques.
- The hook/engine prepares payloads and dispatches requests through the Invoker.
- The Rust backend applies detection rules against responses and returns structured findings.
- Results are visualized and can be exported as reports.

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "SqlInjectionPanel.tsx"
participant Hook as "use-sql-injection.ts"
participant Engine as "sqli-engine.mjs"
participant Invoker as "commands/invoker.rs"
participant Backend as "sqli/mod.rs + detector.rs"
participant Store as "stores/invoker.ts"
participant HTTP as "http-message.ts"
User->>UI : Select endpoint and parameters
UI-->>Hook : Trigger scan with options
Hook->>Engine : Build payloads and schedule tests
Engine->>Invoker : Send crafted request
Invoker->>Store : Update invoker state
Store->>HTTP : Encode/decode messages
Invoker->>Backend : Execute detection logic
Backend-->>Invoker : Return findings
Invoker-->>Engine : Responses and metadata
Engine-->>Hook : Aggregate results
Hook-->>UI : Display findings and report options
```

**Diagram sources**
- [src/pages/sql-injection/components/SqlInjectionPanel.tsx](file://src/pages/sql-injection/components/SqlInjectionPanel.tsx)
- [src/pages/sql-injection/hooks/use-sql-injection.ts](file://src/pages/sql-injection/hooks/use-sql-injection.ts)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/sqli/mod.rs](file://src-tauri/src/sqli/mod.rs)
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/lib/http-message.ts](file://src/lib/http-message.ts)

## Detailed Component Analysis

### SQL Injection Page and Panel
- Purpose: Present controls for selecting endpoints, parameters, and techniques; display results and allow exporting reports.
- Behavior: Validates inputs, triggers scanning workflows, and updates UI state based on findings.

```mermaid
flowchart TD
Start(["Open SQL Injection Page"]) --> SelectTarget["Select Endpoint and Parameters"]
SelectTarget --> ChooseTechniques["Choose Techniques<br/>Boolean / Time / Union / Error"]
ChooseTechniques --> LaunchScan["Launch Scan"]
LaunchScan --> ShowResults["Display Findings"]
ShowResults --> ExportReport{"Export Report?"}
ExportReport --> |Yes| GenerateReport["Generate Security Report"]
ExportReport --> |No| End(["Done"])
GenerateReport --> End
```

**Diagram sources**
- [src/pages/sql-injection/index.tsx](file://src/pages/sql-injection/index.tsx)
- [src/pages/sql-injection/components/SqlInjectionPanel.tsx](file://src/pages/sql-injection/components/SqlInjectionPanel.tsx)

**Section sources**
- [src/pages/sql-injection/index.tsx](file://src/pages/sql-injection/index.tsx)
- [src/pages/sql-injection/components/SqlInjectionPanel.tsx](file://src/pages/sql-injection/components/SqlInjectionPanel.tsx)

### Hook and Engine Orchestration
- Purpose: Manage scanning lifecycle, payload generation, and result aggregation.
- Behavior: Coordinates with the Invoker store and HTTP message utilities to send requests and parse responses.

```mermaid
classDiagram
class UseSqlInjection {
+selectParameters(params)
+configureTechniques(techniques)
+executeScan()
+handleFindings(findings)
}
class SqliEngine {
+buildPayloads(parameters, techniques)
+scheduleTests(payloads)
+analyzeResponses(responses)
}
UseSqlInjection --> SqliEngine : "uses"
```

**Diagram sources**
- [src/pages/sql-injection/hooks/use-sql-injection.ts](file://src/pages/sql-injection/hooks/use-sql-injection.ts)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)

**Section sources**
- [src/pages/sql-injection/hooks/use-sql-injection.ts](file://src/pages/sql-injection/hooks/use-sql-injection.ts)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)

### Rust Backend: Detection, Payloads, and Types
- sqli/mod.rs: Entry point coordinating detection and payload modules.
- sqli/detector.rs: Implements detection logic for boolean-based, time-based, union-based, and error-based techniques.
- sqli/payloads.rs: Generates payloads tailored to different databases and contexts.
- sqli/types.rs: Defines shared types for requests, responses, and findings.

```mermaid
classDiagram
class SqlInjectionMod {
+runDetection(request)
+aggregateFindings(results)
}
class Detector {
+detectBoolean(response)
+detectTimeBased(response)
+detectUnion(response)
+detectErrorBased(response)
}
class Payloads {
+generateBooleanPayload(param)
+generateTimePayload(param)
+generateUnionPayload(param)
+generateErrorPayload(param)
}
class Types {
+Request
+Response
+Finding
}
SqlInjectionMod --> Detector : "uses"
SqlInjectionMod --> Payloads : "uses"
SqlInjectionMod --> Types : "uses"
```

**Diagram sources**
- [src-tauri/src/sqli/mod.rs](file://src-tauri/src/sqli/mod.rs)
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src-tauri/src/sqli/payloads.rs](file://src-tauri/src/sqli/payloads.rs)
- [src-tauri/src/sqli/types.rs](file://src-tauri/src/sqli/types.rs)

**Section sources**
- [src-tauri/src/sqli/mod.rs](file://src-tauri/src/sqli/mod.rs)
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src-tauri/src/sqli/payloads.rs](file://src-tauri/src/sqli/payloads.rs)
- [src-tauri/src/sqli/types.rs](file://src-tauri/src/sqli/types.rs)

### Invoker Integration and HTTP Message Handling
- Purpose: Send crafted requests through Apprecon’s HTTP pipeline and capture responses for analysis.
- Behavior: Updates invoker state, encodes/decodes HTTP messages, and ensures consistent request formatting.

```mermaid
sequenceDiagram
participant Engine as "sqli-engine.mjs"
participant Invoker as "commands/invoker.rs"
participant Store as "stores/invoker.ts"
participant HTTP as "http-message.ts"
Engine->>Invoker : Send crafted request
Invoker->>Store : Update invoker state
Store->>HTTP : Encode/decode messages
HTTP-->>Store : Processed message
Store-->>Invoker : State updated
Invoker-->>Engine : Response and metadata
```

**Diagram sources**
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/lib/http-message.ts](file://src/lib/http-message.ts)

**Section sources**
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/lib/http-message.ts](file://src/lib/http-message.ts)

## Dependency Analysis
The SQL injection testing feature depends on several modules:
- Frontend components rely on hooks and engines for orchestration.
- Engines integrate with the Invoker store and HTTP message utilities.
- Rust backend modules provide core detection and payload generation.
- Shared types ensure consistent communication between frontend and backend.

```mermaid
graph LR
UI["SqlInjectionPanel.tsx"] --> Hook["use-sql-injection.ts"]
Hook --> Engine["sqli-engine.mjs"]
Engine --> InvokerCmd["commands/invoker.rs"]
InvokerCmd --> BackendMod["sqli/mod.rs"]
BackendMod --> Detector["sqli/detector.rs"]
BackendMod --> Payloads["sqli/payloads.rs"]
BackendMod --> Types["sqli/types.rs"]
Hook --> InvokerStore["stores/invoker.ts"]
InvokerStore --> HttpMsg["http-message.ts"]
```

**Diagram sources**
- [src/pages/sql-injection/components/SqlInjectionPanel.tsx](file://src/pages/sql-injection/components/SqlInjectionPanel.tsx)
- [src/pages/sql-injection/hooks/use-sql-injection.ts](file://src/pages/sql-injection/hooks/use-sql-injection.ts)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/sqli/mod.rs](file://src-tauri/src/sqli/mod.rs)
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src-tauri/src/sqli/payloads.rs](file://src-tauri/src/sqli/payloads.rs)
- [src-tauri/src/sqli/types.rs](file://src-tauri/src/sqli/types.rs)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/lib/http-message.ts](file://src/lib/http-message.ts)

**Section sources**
- [src/pages/sql-injection/components/SqlInjectionPanel.tsx](file://src/pages/sql-injection/components/SqlInjectionPanel.tsx)
- [src/pages/sql-injection/hooks/use-sql-injection.ts](file://src/pages/sql-injection/hooks/use-sql-injection.ts)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)
- [src-tauri/src/commands/invoker.rs](file://src-tauri/src/commands/invoker.rs)
- [src-tauri/src/sqli/mod.rs](file://src-tauri/src/sqli/mod.rs)
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src-tauri/src/sqli/payloads.rs](file://src-tauri/src/sqli/payloads.rs)
- [src-tauri/src/sqli/types.rs](file://src-tauri/src/sqli/types.rs)
- [src/stores/invoker.ts](file://src/stores/invoker.ts)
- [src/lib/http-message.ts](file://src/lib/http-message.ts)

## Performance Considerations
- Limit concurrent scans to avoid overwhelming targets.
- Use targeted payloads per technique to reduce noise.
- Cache repeated responses where appropriate to speed up iterative testing.
- Prioritize low-impact techniques first (e.g., boolean-based) before time-based probes.
- Monitor response times and adjust timeouts dynamically.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- False positives: Adjust detection thresholds and refine payload sets.
- No results: Verify parameter selection and ensure correct encoding.
- Slow scans: Reduce concurrency and limit payload sets.
- Data corruption risks: Use read-only payloads and avoid destructive operations.

Best practices:
- Test in isolated environments when possible.
- Validate payloads against known-safe endpoints first.
- Review findings manually to confirm vulnerabilities.
- Export detailed logs and reports for audit trails.

**Section sources**
- [src-tauri/src/sqli/detector.rs](file://src-tauri/src/sqli/detector.rs)
- [src-tauri/src/sqli/payloads.rs](file://src-tauri/src/sqli/payloads.rs)
- [src/pages/sql-injection/lib/sqli-engine.mjs](file://src/pages/sql-injection/lib/sqli-engine.mjs)

## Conclusion
Apprecon’s SQL injection testing combines a user-friendly interface with robust backend detection and payload generation. By leveraging boolean-based, time-based, union-based, and error-based techniques, users can efficiently identify vulnerabilities, extract database information, and generate comprehensive security reports. Following best practices ensures safe and effective testing while minimizing risks and false positives.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Techniques Overview
- Boolean-based: Exploits differences in application behavior based on true/false conditions.
- Time-based: Uses delays to infer truthfulness of conditions.
- Union-based: Injects UNION SELECT statements to retrieve data.
- Error-based: Triggers database errors to extract information.

[No sources needed since this section provides general guidance]

### Custom Payload Creation
- Define context-aware payloads for specific parameters.
- Use encoding and obfuscation techniques to bypass filters.
- Validate payloads against safe targets before full scans.

[No sources needed since this section provides general guidance]

### Database Schema Integration
- Leverage schema introspection queries to map tables and columns.
- Correlate findings with schema metadata for precise exploitation paths.

[No sources needed since this section provides general guidance]