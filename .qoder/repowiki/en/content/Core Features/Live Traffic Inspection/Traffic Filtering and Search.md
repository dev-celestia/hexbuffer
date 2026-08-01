# Traffic Filtering and Search

<cite>
**Referenced Files in This Document**
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)
- [filter.ts](file://src/stores/filter.ts)
- [http-history-search.tsx](file://src/layout/global-search/http-history-search.tsx)
- [websocket-history-search.tsx](file://src/layout/global-search/websocket-history-search.tsx)
- [index.tsx](file://src/layout/global-search/index.tsx)
- [use-debounced-search.ts](file://src/layout/global-search/use-debounced-search.ts)
- [live-traffic-captured.ts](file://src/triggers/live-traffic/captured.ts)
- [automation-live_traffic.rs](file://src-tauri/src/automation/live_traffic.rs)
- [proxy-websocket.rs](file://src-tauri/src/proxy/websocket.rs)
- [history-mod.rs](file://src-tauri/src/history/mod.rs)
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
This document explains Apprecon’s traffic filtering and search capabilities for both HTTP and WebSocket traffic. It covers the query system, filter syntax, supported operators, field-specific searches, the visual filter builder interface, saved presets, dynamic application of filters, advanced search features (regex, date ranges, size-based filtering, composite queries), practical debugging workflows, performance tips, best practices for organizing filters, persistence and sharing, and integration with analysis workflows.

## Project Structure
Apprecon implements filtering and search across frontend stores, UI components, and backend modules:
- Frontend stores manage query state and apply filters to HTTP and WebSocket history.
- Global search components provide a unified search experience across traffic types.
- Triggers and backend modules capture and route live traffic events that feed into the filtering pipeline.

```mermaid
graph TB
subgraph "Frontend"
A["Global Search Index<br/>index.tsx"]
B["HTTP History Search<br/>http-history-search.tsx"]
C["WebSocket History Search<br/>websocket-history-search.tsx"]
D["Debounced Search Hook<br/>use-debounced-search.ts"]
E["HTTP Query Store<br/>http-query.ts"]
F["WebSocket Query Store<br/>websocket-query.ts"]
G["Filter Store<br/>filter.ts"]
end
subgraph "Backend"
H["Live Traffic Trigger<br/>captured.ts"]
I["Automation Live Traffic<br/>automation-live_traffic.rs"]
J["Proxy WebSocket Handler<br/>proxy-websocket.rs"]
K["History Module<br/>history-mod.rs"]
end
A --> B
A --> C
B --> E
C --> F
E --> G
F --> G
H --> I
I --> K
J --> K
K --> E
K --> F
```

**Diagram sources**
- [index.tsx](file://src/layout/global-search/index.tsx)
- [http-history-search.tsx](file://src/layout/global-search/http-history-search.tsx)
- [websocket-history-search.tsx](file://src/layout/global-search/websocket-history-search.tsx)
- [use-debounced-search.ts](file://src/layout/global-search/use-debounced-search.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)
- [filter.ts](file://src/stores/filter.ts)
- [live-traffic-captured.ts](file://src/triggers/live-traffic/captured.ts)
- [automation-live_traffic.rs](file://src-tauri/src/automation/live_traffic.rs)
- [proxy-websocket.rs](file://src-tauri/src/proxy/websocket.rs)
- [history-mod.rs](file://src-tauri/src/history/mod.rs)

**Section sources**
- [index.tsx](file://src/layout/global-search/index.tsx)
- [http-history-search.tsx](file://src/layout/global-search/http-history-search.tsx)
- [websocket-history-search.tsx](file://src/layout/global-search/websocket-history-search.tsx)
- [use-debounced-search.ts](file://src/layout/global-search/use-debounced-search.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)
- [filter.ts](file://src/stores/filter.ts)
- [live-traffic-captured.ts](file://src/triggers/live-traffic/captured.ts)
- [automation-live_traffic.rs](file://src-tauri/src/automation/live_traffic.rs)
- [proxy-websocket.rs](file://src-tauri/src/proxy/websocket.rs)
- [history-mod.rs](file://src-tauri/src/history/mod.rs)

## Core Components
- HTTP Query Store: Manages HTTP traffic queries, applies filters, and exposes filtered results to UI components.
- WebSocket Query Store: Manages WebSocket traffic queries, applies filters, and exposes filtered results to UI components.
- Filter Store: Centralized filter state management, including saved presets and shared filters.
- Global Search Components: Provide a unified search input and result rendering for HTTP and WebSocket traffic.
- Debounced Search Hook: Reduces search frequency to improve performance during rapid typing.
- Live Traffic Trigger and Backend Modules: Capture incoming HTTP and WebSocket events and persist them for querying.

Key responsibilities:
- Parse and validate user queries.
- Apply field-specific filters and composite conditions.
- Persist and load saved filter presets.
- Integrate with live traffic ingestion for real-time filtering.

**Section sources**
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)
- [filter.ts](file://src/stores/filter.ts)
- [http-history-search.tsx](file://src/layout/global-search/http-history-search.tsx)
- [websocket-history-search.tsx](file://src/layout/global-search/websocket-history-search.tsx)
- [use-debounced-search.ts](file://src/layout/global-search/use-debounced-search.ts)
- [live-traffic-captured.ts](file://src/triggers/live-traffic/captured.ts)
- [automation-live_traffic.rs](file://src-tauri/src/automation/live_traffic.rs)
- [proxy-websocket.rs](file://src-tauri/src/proxy/websocket.rs)
- [history-mod.rs](file://src-tauri/src/history/mod.rs)

## Architecture Overview
The filtering architecture combines frontend query stores with backend traffic capture:
- User input is captured by global search components and debounced before applying filters.
- The HTTP and WebSocket query stores parse queries and apply filters against stored traffic data.
- Saved presets are managed centrally and can be applied dynamically.
- Live traffic triggers push new events into the backend, which persists and indexes them for querying.

```mermaid
sequenceDiagram
participant User as "User"
participant GlobalSearch as "Global Search Index"
participant Debounce as "Debounced Search Hook"
participant HTTPStore as "HTTP Query Store"
participant WSStore as "WebSocket Query Store"
participant FilterStore as "Filter Store"
participant Backend as "History Module"
User->>GlobalSearch : Type query
GlobalSearch->>Debounce : Trigger debounce
Debounce-->>GlobalSearch : Stable query
GlobalSearch->>HTTPStore : Apply HTTP filters
GlobalSearch->>WSStore : Apply WebSocket filters
HTTPStore->>FilterStore : Load/apply preset
WSStore->>FilterStore : Load/apply preset
Backend-->>HTTPStore : Persisted HTTP events
Backend-->>WSStore : Persisted WS events
HTTPStore-->>GlobalSearch : Filtered results
WSStore-->>GlobalSearch : Filtered results
```

**Diagram sources**
- [index.tsx](file://src/layout/global-search/index.tsx)
- [use-debounced-search.ts](file://src/layout/global-search/use-debounced-search.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)
- [filter.ts](file://src/stores/filter.ts)
- [history-mod.rs](file://src-tauri/src/history/mod.rs)

## Detailed Component Analysis

### HTTP Query Store
Responsibilities:
- Parse HTTP-specific fields (method, URL, status code, headers, body).
- Apply operators (equals, contains, regex, range).
- Support composite queries (AND/OR/NOT).
- Integrate with saved presets and dynamic application.

```mermaid
flowchart TD
Start(["HTTP Query Entry"]) --> Parse["Parse Query String"]
Parse --> Validate{"Valid Fields?"}
Validate --> |No| Error["Return Validation Error"]
Validate --> |Yes| BuildFilters["Build Filter Conditions"]
BuildFilters --> ApplyPreset["Apply Saved Preset if Present"]
ApplyPreset --> Execute["Execute Against Stored HTTP Events"]
Execute --> Results{"Results Found?"}
Results --> |No| Empty["Return Empty Set"]
Results --> |Yes| Return["Return Filtered Results"]
Error --> End(["Exit"])
Empty --> End
Return --> End
```

**Diagram sources**
- [http-query.ts](file://src/stores/history/http-query.ts)

**Section sources**
- [http-query.ts](file://src/stores/history/http-query.ts)

### WebSocket Query Store
Responsibilities:
- Parse WebSocket-specific fields (message type, payload patterns, connection metadata).
- Apply operators (equals, contains, regex, size thresholds).
- Support composite queries and preset application.

```mermaid
flowchart TD
StartWS(["WebSocket Query Entry"]) --> ParseWS["Parse Query String"]
ParseWS --> ValidateWS{"Valid Fields?"}
ValidateWS --> |No| ErrorWS["Return Validation Error"]
ValidateWS --> |Yes| BuildFiltersWS["Build Filter Conditions"]
BuildFiltersWS --> ApplyPresetWS["Apply Saved Preset if Present"]
ApplyPresetWS --> ExecuteWS["Execute Against Stored WS Events"]
ExecuteWS --> ResultsWS{"Results Found?"}
ResultsWS --> |No| EmptyWS["Return Empty Set"]
ResultsWS --> |Yes| ReturnWS["Return Filtered Results"]
ErrorWS --> EndWS(["Exit"])
EmptyWS --> EndWS
ReturnWS --> EndWS
```

**Diagram sources**
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)

**Section sources**
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)

### Filter Store
Responsibilities:
- Manage centralized filter state.
- Persist saved presets locally.
- Enable sharing via export/import mechanisms.
- Provide APIs for dynamic filter application.

```mermaid
classDiagram
class FilterStore {
+filters : Map<string, Filter>
+presets : Array<Preset>
+addFilter(name, expression) void
+removeFilter(name) void
+savePreset(name, expression) void
+loadPreset(name) Filter
+applyDynamic(expression) void
+exportFilters() string
+importFilters(json) void
}
class HTTPQueryStore {
+query : string
+applyFilters() void
}
class WebSocketQueryStore {
+query : string
+applyFilters() void
}
FilterStore <.. HTTPQueryStore : "used by"
FilterStore <.. WebSocketQueryStore : "used by"
```

**Diagram sources**
- [filter.ts](file://src/stores/filter.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)

**Section sources**
- [filter.ts](file://src/stores/filter.ts)

### Global Search Components
Responsibilities:
- Unified search input for HTTP and WebSocket traffic.
- Debounced query processing to reduce overhead.
- Result rendering with highlighting and context.

```mermaid
sequenceDiagram
participant User as "User"
participant GlobalSearch as "Global Search Index"
participant Debounce as "Debounced Search Hook"
participant HTTPSearch as "HTTP History Search"
participant WSSearch as "WebSocket History Search"
User->>GlobalSearch : Enter query
GlobalSearch->>Debounce : Debounce input
Debounce-->>GlobalSearch : Stable query
GlobalSearch->>HTTPSearch : Render HTTP results
GlobalSearch->>WSSearch : Render WS results
HTTPSearch-->>GlobalSearch : Filtered HTTP items
WSSearch-->>GlobalSearch : Filtered WS items
```

**Diagram sources**
- [index.tsx](file://src/layout/global-search/index.tsx)
- [use-debounced-search.ts](file://src/layout/global-search/use-debounced-search.ts)
- [http-history-search.tsx](file://src/layout/global-search/http-history-search.tsx)
- [websocket-history-search.tsx](file://src/layout/global-search/websocket-history-search.tsx)

**Section sources**
- [index.tsx](file://src/layout/global-search/index.tsx)
- [use-debounced-search.ts](file://src/layout/global-search/use-debounced-search.ts)
- [http-history-search.tsx](file://src/layout/global-search/http-history-search.tsx)
- [websocket-history-search.tsx](file://src/layout/global-search/websocket-history-search.tsx)

### Live Traffic Integration
Responsibilities:
- Capture incoming HTTP and WebSocket events.
- Persist events for querying and filtering.
- Emit events to frontend stores for real-time updates.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Proxy as "Proxy WebSocket Handler"
participant Automation as "Automation Live Traffic"
participant History as "History Module"
participant Frontend as "HTTP/WS Query Stores"
Client->>Proxy : Send HTTP/WS request
Proxy->>Automation : Route event
Automation->>History : Persist event
History-->>Frontend : Emit updated events
Frontend-->>Frontend : Apply active filters
```

**Diagram sources**
- [proxy-websocket.rs](file://src-tauri/src/proxy/websocket.rs)
- [automation-live_traffic.rs](file://src-tauri/src/automation/live_traffic.rs)
- [history-mod.rs](file://src-tauri/src/history/mod.rs)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)

**Section sources**
- [proxy-websocket.rs](file://src-tauri/src/proxy/websocket.rs)
- [automation-live_traffic.rs](file://src-tauri/src/automation/live_traffic.rs)
- [history-mod.rs](file://src-tauri/src/history/mod.rs)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)

## Dependency Analysis
The filtering system depends on cohesive frontend stores and robust backend capture:
- HTTP and WebSocket query stores depend on the filter store for preset management.
- Global search components depend on debounced search hooks for performance.
- Backend modules persist and index traffic events for efficient querying.

```mermaid
graph TB
HTTPStore["HTTP Query Store"] --> FilterStore["Filter Store"]
WSStore["WebSocket Query Store"] --> FilterStore
GlobalSearch["Global Search"] --> DebounceHook["Debounced Search Hook"]
GlobalSearch --> HTTPStore
GlobalSearch --> WSStore
Backend["History Module"] --> HTTPStore
Backend --> WSStore
```

**Diagram sources**
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)
- [filter.ts](file://src/stores/filter.ts)
- [index.tsx](file://src/layout/global-search/index.tsx)
- [use-debounced-search.ts](file://src/layout/global-search/use-debounced-search.ts)
- [history-mod.rs](file://src-tauri/src/history/mod.rs)

**Section sources**
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)
- [filter.ts](file://src/stores/filter.ts)
- [index.tsx](file://src/layout/global-search/index.tsx)
- [use-debounced-search.ts](file://src/layout/global-search/use-debounced-search.ts)
- [history-mod.rs](file://src-tauri/src/history/mod.rs)

## Performance Considerations
- Use debounced search to minimize re-renders and query executions during rapid typing.
- Prefer field-specific searches to reduce the search space.
- Leverage saved presets for complex queries to avoid repeated parsing.
- Limit regex usage to necessary cases due to computational overhead.
- Batch filter applications when multiple changes occur simultaneously.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Invalid query syntax: Ensure proper operator usage and field names.
- Slow performance: Simplify queries, use field-specific searches, and avoid excessive regex.
- Missing results: Verify that traffic has been captured and persisted.
- Preset not loading: Check local storage permissions and import/export formats.

**Section sources**
- [http-query.ts](file://src/stores/history/http-query.ts)
- [websocket-query.ts](file://src/stores/history/websocket-query.ts)
- [filter.ts](file://src/stores/filter.ts)

## Conclusion
Apprecon’s traffic filtering and search system provides a powerful, extensible framework for analyzing HTTP and WebSocket traffic. With support for advanced queries, saved presets, and real-time integration, it enables efficient debugging and analysis workflows. By following best practices and leveraging performance tips, users can optimize their filtering strategies for maximum effectiveness.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices
- Practical Examples:
  - Find all POST requests to a specific endpoint using method and URL filters.
  - Identify large responses exceeding a size threshold using size-based filtering.
  - Match WebSocket messages containing specific patterns using regex.
  - Combine multiple conditions with AND/OR/NOT for composite queries.
- Best Practices:
  - Organize frequently used filters into named presets.
  - Share presets with team members via export/import.
  - Regularly review and update filters to reflect evolving traffic patterns.

[No sources needed since this section provides general guidance]