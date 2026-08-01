# Context Menu & Actions

<cite>
**Referenced Files in This Document**
- [http-history.tsx](file://src/pages/live-traffic/http-history/index.tsx)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)
- [invoker.ts](file://src/stores/invoker.ts)
- [history-store-index.ts](file://src/stores/history/index.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [ui.ts](file://src/triggers/live-traffic/ui.ts)
- [index.ts](file://src/triggers/live-traffic/index.ts)
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
This document explains the context menu system and action handlers for HTTP history entries. It covers the right-click menu implementation, the useLogEntryActions hook that centralizes actions and state, the permission model for actions, keyboard shortcuts, bulk operations, and how to add custom actions or integrate with other features like the Invoker.

## Project Structure
The HTTP history feature is implemented under the live-traffic page. The key files include:
- A page component that renders the history list and integrates the context menu
- A hook that provides action functions and manages selection/state
- UI primitives for context menus
- Utilities for clipboard and HTTP message formatting
- Stores for invoker integration and history query/filtering
- Trigger hooks for global keyboard shortcuts and UI events

```mermaid
graph TB
subgraph "Live Traffic - HTTP History"
Page["HTTP History Page<br/>http-history.tsx"]
Hook["useLogEntryActions<br/>useLogEntryActions.ts"]
CtxMenu["Context Menu UI<br/>context-menu.tsx"]
end
subgraph "Libraries"
Clip["Clipboard Utils<br/>clipboard.ts"]
Msg["HTTP Message Utils<br/>http-message.ts"]
end
subgraph "Stores"
Inv["Invoker Store<br/>invoker.ts"]
HistQ["History Query Store<br/>http-query.ts"]
HistIdx["History Index Store<br/>history-store-index.ts"]
end
subgraph "Triggers"
LUI["Live Traffic UI Triggers<br/>live-traffic/ui.ts"]
LIdx["Live Traffic Index<br/>live-traffic/index.ts"]
end
Page --> CtxMenu
Page --> Hook
Hook --> Clip
Hook --> Msg
Hook --> Inv
Hook --> HistQ
Hook --> HistIdx
Page --> LUI
LUI --> LIdx
```

**Diagram sources**
- [http-history.tsx](file://src/pages/live-traffic/http-history/index.tsx)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)
- [invoker.ts](file://src/stores/invoker.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [history-store-index.ts](file://src/stores/history/index.ts)
- [ui.ts](file://src/triggers/live-traffic/ui.ts)
- [index.ts](file://src/triggers/live-traffic/index.ts)

**Section sources**
- [http-history.tsx](file://src/pages/live-traffic/http-history/index.tsx)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)
- [invoker.ts](file://src/stores/invoker.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [history-store-index.ts](file://src/stores/history/index.ts)
- [ui.ts](file://src/triggers/live-traffic/ui.ts)
- [index.ts](file://src/triggers/live-traffic/index.ts)

## Core Components
- Context menu UI: Provides a reusable right-click menu component used by the HTTP history list to show options such as Copy URL, Copy Headers, Send to Invoker, and more.
- useLogEntryActions hook: Centralizes all actions available on an HTTP log entry (single or multiple selections), including copy, send, open, delete, and bulk operations. It also manages selection state and permissions for each action.
- Clipboard and HTTP utilities: Helpers to format request/response data and write to the system clipboard.
- Stores: Integration points for sending entries to the Invoker and managing history queries/filters.
- Trigger hooks: Global keyboard shortcuts and UI event wiring for quick access to common actions.

**Section sources**
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)
- [invoker.ts](file://src/stores/invoker.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [history-store-index.ts](file://src/stores/history/index.ts)
- [ui.ts](file://src/triggers/live-traffic/ui.ts)
- [index.ts](file://src/triggers/live-traffic/index.ts)

## Architecture Overview
The context menu workflow connects the UI layer to business logic via the hook and stores:

```mermaid
sequenceDiagram
participant User as "User"
participant Page as "HTTP History Page"
participant Menu as "Context Menu UI"
participant Hook as "useLogEntryActions"
participant Clip as "Clipboard Utils"
participant Msg as "HTTP Message Utils"
participant Inv as "Invoker Store"
participant Q as "History Query Store"
User->>Page : Right-click on entry
Page->>Menu : Show context menu with actions
User->>Menu : Select "Copy URL"
Menu->>Hook : Call copyUrl(selectedEntries)
Hook->>Msg : Format URL from entries
Hook->>Clip : Write to clipboard
Clip-->>Hook : Success/Failure
Hook-->>Menu : Update status/error if needed
User->>Menu : Select "Send to Invoker"
Menu->>Hook : Call sendToInvoker(selectedEntries)
Hook->>Inv : Push payload(s) to Invoker
Inv-->>Hook : Acknowledge
Hook-->>Menu : Notify success
```

**Diagram sources**
- [http-history.tsx](file://src/pages/live-traffic/http-history/index.tsx)
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)
- [invoker.ts](file://src/stores/invoker.ts)

## Detailed Component Analysis

### Context Menu UI
- Purpose: Renders a right-click menu with items bound to actions provided by the hook. Items can be enabled/disabled based on selection and permissions.
- Behavior: Supports single and multi-selection contexts; shows/hides items conditionally; handles keyboard navigation and focus management.
- Integration: Consumed by the HTTP history list to present contextual operations.

```mermaid
flowchart TD
Start(["Right-click Event"]) --> BuildItems["Build Menu Items<br/>based on selection"]
BuildItems --> CheckPermissions{"Action Permitted?"}
CheckPermissions --> |No| DisableItem["Disable Item"]
CheckPermissions --> |Yes| EnableItem["Enable Item"]
EnableItem --> UserSelect{"User Selected Item?"}
DisableItem --> UserSelect
UserSelect --> |Yes| Execute["Execute Action via Hook"]
UserSelect --> |No| End(["Close Menu"])
Execute --> Feedback["Show Toast/Status"]
Feedback --> End
```

**Diagram sources**
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)

**Section sources**
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)

### useLogEntryActions Hook
- Responsibilities:
  - Provide action functions for single and multiple selected entries (e.g., copy URL, copy headers, send to Invoker, open in new tab, delete).
  - Manage selection state and derived permissions for each action.
  - Coordinate with clipboard and HTTP message utilities to format content.
  - Integrate with stores to perform side effects (e.g., sending to Invoker, updating filters).
- Key behaviors:
  - Permission checks: Determine if an action is allowed based on current selection and application state.
  - Bulk support: Accept arrays of entries to perform batch operations efficiently.
  - Keyboard shortcuts: Expose functions triggered by global hotkeys.
  - Error handling: Centralized error reporting and user feedback.

```mermaid
classDiagram
class UseLogEntryActions {
+copyUrl(entries) void
+copyHeaders(entries) void
+sendToInvoker(entries) void
+openInNewTab(entries) void
+deleteEntries(entries) void
+bulkExport(entries) void
+permissions(action, selection) bool
+selectionState() SelectionState
}
class ClipboardUtils {
+writeText(text) Promise~bool~
}
class HttpMessageUtils {
+formatUrl(entry) string
+formatHeaders(entry) string
}
class InvokerStore {
+pushPayload(payloads) void
}
class HistoryQueryStore {
+filterBy(entries) void
}
UseLogEntryActions --> ClipboardUtils : "uses"
UseLogEntryActions --> HttpMessageUtils : "uses"
UseLogEntryActions --> InvokerStore : "integrates"
UseLogEntryActions --> HistoryQueryStore : "updates filters"
```

**Diagram sources**
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)
- [invoker.ts](file://src/stores/invoker.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)

**Section sources**
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)
- [invoker.ts](file://src/stores/invoker.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)

### Permission System
- Rationale: Prevent invalid or unsafe actions when no entries are selected or when certain conditions are not met.
- Implementation: Each action exposes a permission check function that evaluates the current selection and app state. The context menu uses these checks to enable/disable items.
- Extensibility: New actions should define their permission logic to ensure correct UI behavior.

```mermaid
flowchart TD
Entry(["Action Request"]) --> CheckSel["Check Selection State"]
CheckSel --> SelValid{"Selection Valid?"}
SelValid --> |No| Deny["Deny Action"]
SelValid --> |Yes| CheckCtx["Check Contextual Constraints"]
CheckCtx --> CtxOk{"Constraints Met?"}
CtxOk --> |No| Deny
CtxOk --> |Yes| Allow["Allow Action"]
Allow --> Execute["Execute Action"]
Deny --> End(["End"])
Execute --> End
```

**Diagram sources**
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)

**Section sources**
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)

### Keyboard Shortcuts
- Global shortcuts are wired through trigger hooks to quickly execute common actions without using the mouse.
- Typical shortcuts include copying URLs, headers, and sending entries to the Invoker.
- The trigger index aggregates shortcuts across modules to avoid conflicts.

```mermaid
sequenceDiagram
participant OS as "OS/Keyboard"
participant LUI as "Live Traffic UI Triggers"
participant LIdx as "Live Traffic Index"
participant Hook as "useLogEntryActions"
OS->>LUI : Keydown event
LUI->>LIdx : Route to appropriate handler
LIdx->>Hook : Invoke action function
Hook-->>LIdx : Execute result
LIdx-->>LUI : Status/feedback
LUI-->>OS : Visual feedback
```

**Diagram sources**
- [ui.ts](file://src/triggers/live-traffic/ui.ts)
- [index.ts](file://src/triggers/live-traffic/index.ts)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)

**Section sources**
- [ui.ts](file://src/triggers/live-traffic/ui.ts)
- [index.ts](file://src/triggers/live-traffic/index.ts)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)

### Bulk Operations
- The hook supports passing arrays of entries to actions, enabling efficient batch processing.
- Examples include bulk copy, bulk export, and bulk deletion.
- Performance considerations: Avoid blocking the UI thread; process large batches asynchronously where possible.

```mermaid
flowchart TD
Start(["Bulk Action Initiated"]) --> Validate["Validate Entries Array"]
Validate --> Valid{"Entries Valid?"}
Valid --> |No| Error["Return Error"]
Valid --> |Yes| Iterate["Iterate Entries"]
Iterate --> Process["Process Each Entry"]
Process --> Accumulate["Accumulate Results"]
Accumulate --> Finalize["Finalize Batch"]
Finalize --> Done(["Done"])
Error --> Done
```

**Diagram sources**
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)

**Section sources**
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)

### Adding Custom Actions
- Steps to add a new action:
  - Implement the action function in the hook with proper permission checks.
  - Add a corresponding menu item in the context menu component.
  - Wire any necessary store integrations or utility calls.
  - Optionally expose a keyboard shortcut via trigger hooks.
- Best practices:
  - Keep permission logic explicit and testable.
  - Ensure consistent user feedback (toasts/errors).
  - Support both single and bulk entry usage.

**Section sources**
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)
- [ui.ts](file://src/triggers/live-traffic/ui.ts)

### Integrating with Other Features
- Invoker integration: Send one or multiple HTTP entries as payloads to the Invoker for further automation or testing.
- History filtering: Update query filters to isolate related entries after performing actions.
- Clipboard workflows: Export formatted data for external tools or documentation.

**Section sources**
- [invoker.ts](file://src/stores/invoker.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)

## Dependency Analysis
The context menu and actions depend on several modules:

```mermaid
graph TB
Ctx["Context Menu UI"] --> Hook["useLogEntryActions"]
Hook --> Clip["Clipboard Utils"]
Hook --> Msg["HTTP Message Utils"]
Hook --> Inv["Invoker Store"]
Hook --> Q["History Query Store"]
Page["HTTP History Page"] --> Ctx
Page --> Hook
Triggers["Live Traffic Triggers"] --> Hook
```

**Diagram sources**
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)
- [invoker.ts](file://src/stores/invoker.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [http-history.tsx](file://src/pages/live-traffic/http-history/index.tsx)
- [ui.ts](file://src/triggers/live-traffic/ui.ts)

**Section sources**
- [context-menu.tsx](file://src/components/ui/context-menu.tsx)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [clipboard.ts](file://src/lib/clipboard.ts)
- [http-message.ts](file://src/lib/http-message.ts)
- [invoker.ts](file://src/stores/invoker.ts)
- [http-query.ts](file://src/stores/history/http-query.ts)
- [http-history.tsx](file://src/pages/live-traffic/http-history/index.tsx)
- [ui.ts](file://src/triggers/live-traffic/ui.ts)

## Performance Considerations
- Batch operations: Prefer iterating over arrays once and accumulating results to minimize re-renders and redundant work.
- Asynchronous tasks: Offload heavy formatting or I/O operations to background processes where feasible.
- Debounce input: If actions involve search or filter updates, debounce to reduce frequent store writes.
- Memory usage: Avoid holding large strings in memory unnecessarily; stream or chunk data when exporting.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Clipboard failures:
  - Verify browser permissions and environment constraints.
  - Handle errors gracefully and inform users.
- Invalid selection:
  - Ensure permission checks prevent actions when no entries are selected.
  - Provide clear feedback when actions are disabled.
- Invoker integration issues:
  - Confirm payload structure matches Invoker expectations.
  - Log errors and surface them to the user.
- Keyboard shortcut conflicts:
  - Review trigger registrations to avoid overlapping keys.
  - Test across platforms due to differing key mappings.

**Section sources**
- [clipboard.ts](file://src/lib/clipboard.ts)
- [useLogEntryActions.ts](file://src/pages/live-traffic/http-history/hooks/useLogEntryActions.ts)
- [invoker.ts](file://src/stores/invoker.ts)
- [ui.ts](file://src/triggers/live-traffic/ui.ts)

## Conclusion
The HTTP history context menu and actions provide a robust, extensible system for interacting with captured requests. The useLogEntryActions hook centralizes logic, permissions, and state, while the context menu UI offers intuitive access to operations. With keyboard shortcuts, bulk support, and integrations like the Invoker, users can efficiently analyze and automate traffic inspection workflows.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices
- Example scenarios:
  - Copy URL: Select one or multiple entries and copy their URLs to the clipboard.
  - Copy Headers: Extract and copy header blocks for debugging or documentation.
  - Send to Invoker: Transform entries into Invoker payloads for automated testing.
  - Delete entries: Remove selected entries from history with confirmation if required.
  - Bulk export: Export selected entries in a structured format for external analysis.

[No sources needed since this section provides general guidance]