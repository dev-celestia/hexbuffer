
# Browser Automation & Inspection

<cite>
**Referenced Files in This Document**
- [browser.mdx](file://docs/website/content/docs/ai-and-automation/browser.mdx)
- [index.tsx](file://src/pages/browser/index.tsx)
- [types.ts](file://src/pages/browser/types.ts)
- [constants.ts](file://src/pages/browser/constants.ts)
- [browser-panel-api.ts](file://src/lib/browser-panel-api.ts)
- [use-browser-session-events.ts](file://src/layout/hooks/use-browser-session-events.ts)
- [open-browser.tsx](file://src/layout/open-browser.tsx)
- [browser-automation.ts](file://src/stores/browser-automation.ts)
- [browser-session-store.ts](file://src/stores/browser-session-store.ts)
- [mod.rs](file://src-tauri/src/browser/mod.rs)
- [crawl_runner.rs](file://src-tauri/src/browser/crawl_runner.rs)
- [crawl_helpers.rs](file://src-tauri/src/browser/crawl_helpers.rs)
- [crawl_types.rs](file://src-tauri/src/browser/crawl_types.rs)
- [browser.rs](file://src-tauri/src/commands/browser.rs)
- [automation/mod.rs](file://src-tauri/src/automation/mod.rs)
- [automation/actions.rs](file://src-tauri/src/automation/actions.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)
- [automation/page_crawled.rs](file://src-tauri/src/automation/page_crawled.rs)
- [automation/websocket.rs](file://src-tauri/src/automation/websocket.rs)
- [tools/browser.rs](file://src-tauri/src/tools/browser.rs)
- [triggers/index.ts](file://src/triggers/index.ts)
- [triggers/browser/index.ts](file://src/triggers/browser/index.ts)
- [triggers/browser/crawl.ts](file://src/triggers/browser/crawl.ts)
- [triggers/browser/ui.ts](file://src/triggers/browser/ui.ts)
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
This document explains Apprecon’s Browser Automation and Inspection feature, focusing on how the integrated browser enables automated web interactions, page crawling, and detailed inspection of client-side behavior. It covers the browser automation APIs, element selection strategies, event simulation capabilities, and inspection tools such as DOM analysis, network monitoring, console output, and accessibility tree examination. Practical examples demonstrate automated testing scenarios, data extraction tasks, and user journey simulation. The guide also outlines integration with other Apprecon features for end-to-end testing and security assessment workflows.

## Project Structure
The Browser Automation and Inspection feature spans both the frontend (React UI and hooks), state management, and the Tauri backend (Rust modules for browser control, crawling, and automation). Key areas include:
- Frontend pages and components for the browser panel and inspector
- Stores for automation state and session management
- Tauri commands and modules that orchestrate browser instances, crawling, and automation execution
- Triggers and events to connect automation actions with UI and other features

```mermaid
graph TB
subgraph "Frontend"
BPage["Browser Page<br/>pages/browser/index.tsx"]
Types["Types & Constants<br/>pages/browser/types.ts, constants.ts"]
API["Panel API Bridge<br/>lib/browser-panel-api.ts"]
Hooks["Session Events Hook<br/>layout/hooks/use-browser-session-events.ts"]
Store["Automation Store<br/>stores/browser-automation.ts"]
SessionStore["Session Store<br/>stores/browser-session-store.ts"]
end
subgraph "Tauri Backend"
Cmd["Commands<br/>src-tauri/src/commands/browser.rs"]
Mod["Browser Module<br/>src-tauri/src/browser/mod.rs"]
CrawlRunner["Crawl Runner<br/>src-tauri/src/browser/crawl_runner.rs"]
CrawlHelpers["Crawl Helpers<br/>src-tauri/src/browser/crawl_helpers.rs"]
CrawlTypes["Crawl Types<br/>src-tauri/src/browser/crawl_types.rs"]
Tools["Tools<br/>src-tauri/src/tools/browser.rs"]
AutoMod["Automation Core<br/>src-tauri/src/automation/mod.rs"]
AutoActions["Actions<br/>src-tauri/src/automation/actions.rs"]
AutoEvents["Events<br/>src-tauri/src/automation/events.rs"]
AutoState["State<br/>src-tauri/src/automation/state.rs"]
AutoPageCrawled["Page Crawled Event<br/>src-tauri/src/automation/page_crawled.rs"]
AutoWS["WebSocket Bridge<br/>src-tauri/src/automation/websocket.rs"]
end
BPage --> API
BPage --> Hooks
BPage --> Store
BPage --> SessionStore
API --> Cmd
Cmd --> Mod
Mod --> CrawlRunner
Mod --> Tools
Mod --> AutoMod
AutoMod --> AutoActions
AutoMod --> AutoEvents
AutoMod --> AutoState
AutoMod --> AutoPageCrawled
AutoMod --> AutoWS
```

**Diagram sources**
- [index.tsx](file://src/pages/browser/index.tsx)
- [types.ts](file://src/pages/browser/types.ts)
- [constants.ts](file://src/pages/browser/constants.ts)
- [browser-panel-api.ts](file://src/lib/browser-panel-api.ts)
- [use-browser-session-events.ts](file://src/layout/hooks/use-browser-session-events.ts)
- [browser-automation.ts](file://src/stores/browser-automation.ts)
- [browser-session-store.ts](file://src/stores/browser-session-store.ts)
- [mod.rs](file://src-tauri/src/browser/mod.rs)
- [crawl_runner.rs](file://src-tauri/src/browser/crawl_runner.rs)
- [crawl_helpers.rs](file://src-tauri/src/browser/crawl_helpers.rs)
- [crawl_types.rs](file://src-tauri/src/browser/crawl_types.rs)
- [browser.rs](file://src-tauri/src/commands/browser.rs)
- [automation/mod.rs](file://src-tauri/src/automation/mod.rs)
- [automation/actions.rs](file://src-tauri/src/automation/actions.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)
- [automation/page_crawled.rs](file://src-tauri/src/automation/page_crawled.rs)
- [automation/websocket.rs](file://src-tauri/src/automation/websocket.rs)

**Section sources**
- [browser.mdx](file://docs/website/content/docs/ai-and-automation/browser.mdx)
- [index.tsx](file://src/pages/browser/index.tsx)
- [types.ts](file://src/pages/browser/types.ts)
- [constants.ts](file://src/pages/browser/constants.ts)
- [browser-panel-api.ts](file://src/lib/browser-panel-api.ts)
- [use-browser-session-events.ts](file://src/layout/hooks/use-browser-session-events.ts)
- [browser-automation.ts](file://src/stores/browser-automation.ts)
- [browser-session-store.ts](file://src/stores/browser-session-store.ts)
- [mod.rs](file://src-tauri/src/browser/mod.rs)
- [crawl_runner.rs](file://src-tauri/src/browser/crawl_runner.rs)
- [crawl_helpers.rs](file://src-tauri/src/browser/crawl_helpers.rs)
- [crawl_types.rs](file://src-tauri/src/browser/crawl_types.rs)
- [browser.rs](file://src-tauri/src/commands/browser.rs)
- [automation/mod.rs](file://src-tauri/src/automation/mod.rs)
- [automation/actions.rs](file://src-tauri/src/automation/actions.rs)
- [automation/events.rs](file://src-tauri/src/automation/events.rs)
- [automation/state.rs](file://src-tauri/src/automation/state.rs)
- [automation/page_crawled.rs](file://src-tauri/src/automation/page_crawled.rs)
- [automation/websocket.rs](file://src-tauri/src/automation/websocket.rs)

## Core Components
- Browser Panel UI: Provides controls to open a new browser instance, navigate, interact with elements, and capture results.
- Automation Store: Manages automation sessions, queued actions, and outcomes.
- Session Store: Tracks active browser sessions, lifecycle events, and runtime state.
- Tauri Commands: Expose browser operations to the frontend via secure IPC.
- Crawler Engine: Orchestrates page discovery, navigation, and data extraction during crawls.
- Automation Core: Executes action sequences, handles conditions, and emits events.
- WebSocket Bridge: Streams automation events and crawl progress back to the UI.

Key responsibilities:
- Element selection strategies: CSS selectors, XPath, role-based queries, and text matching.
- Event simulation: Clicks, key presses, form submissions, and custom events.
- Inspection tools: DOM snapshotting, network request logging, console log aggregation, and accessibility tree traversal.
- Integration points: Connects with HTTP history, intercept, invoker, and regression modules for end-to-end testing and security assessments.

**Section sources**
- [index.tsx](file://src/pages/browser/index.tsx)
- [browser-automation.ts](file://src/stores/browser-automation.ts)
- [browser-session-store.ts](file://src/stores/browser-session-store.ts)
- [browser.rs](file://src-tauri/src/commands/browser.rs)
- [crawl_runner.rs](file://src-tauri/src/browser/crawl_runner.rs)
- [automation/mod.rs](file://src-tauri/src/automation/mod.rs)
- [automation/websocket.rs](file://src-tauri/src/automation/websocket.rs)

## Architecture Overview
The system follows a layered architecture:
- Frontend layer: React UI and stores communicate through a panel API bridge.
- IPC layer: Tauri commands expose backend functionality securely.
- Backend layer: Browser module orchestrates crawling and automation; automation core executes actions and emits events; crawler helpers assist with DOM and network introspection.

```mermaid
sequenceDiagram
participant UI as "Browser UI"
participant API as "Panel API"
participant CMD as "Tauri Commands"
participant BR as "Browser Module"
participant CR as "Crawl Runner"
participant AC as "Automation Core"
participant WS as "WebSocket Bridge"
UI->>API : "Open browser / Navigate URL"
API->>CMD : "Invoke command"
CMD->>BR : "Start or attach to browser"
BR-->>UI : "Session created"
UI->>API : "Execute automation actions"
API->>CMD : "Dispatch actions"
CMD->>AC : "Run action sequence"
AC->>CR : "Trigger crawl steps"
CR-->>AC : "Page crawled events"
AC-->>WS : "Emit progress/results"
WS-->>UI : "Stream updates"
```

**Diagram sources**
- [browser-panel-api.ts](file://src/lib/browser-panel-api.ts)
- [browser.rs](file://src-tauri/src/commands/browser.rs)
- [mod.rs](file://src-tauri/src/browser/mod.rs)
- [crawl_runner.rs](file://src-tauri/src/browser/crawl_runner.rs)
- [automation/mod.rs](file://src-tauri/src/automation/mod.rs)
- [automation/websocket.rs](file://src-tauri/src/automation/websocket.rs)

## Detailed Component Analysis

### Browser Panel and Session Management
The browser panel coordinates user actions and displays live feedback. It uses hooks to subscribe to session events and stores to manage automation state.

```mermaid
classDiagram
class BrowserPanel {
+openNewBrowser()
+navigate(url)
+captureDOM()
+captureNetwork()
+captureConsole()
+captureAccessibilityTree()
}
class AutomationStore {
+queueAction(action)
+executeActions()
+onResult(callback)
}
class SessionStore {
+createSession()
+attachToSession(id)
+onEvent(event)
}
BrowserPanel --> AutomationStore : "uses"
BrowserPanel --> SessionStore : "uses"
```

**Diagram sources**
- [index.tsx](file://src/pages/browser/index.tsx)
- [browser-automation.ts](file://src/stores/browser-automation.ts)
- [browser-session-store.ts](file://src/stores/browser-session-store.ts)

**Section sources**
- [index.tsx](file://src/pages/browser/index.tsx)
- [types.ts](file://src/pages/browser/types.ts)
- [constants.ts](file://src/pages/browser/constants.ts)
- [browser-automation.ts](file://src/stores/browser-automation.ts)
- [browser-session-store.ts](file://src/stores/browser-session-store.ts)
- [use-browser-session-events.ts](file://src/layout/hooks/use-browser-session-events.ts)

### Tauri Commands and Browser Module
Commands provide the IPC boundary between the UI and backend. The browser module encapsulates browser lifecycle, crawling, and tool integrations.

```mermaid
flowchart TD
Start(["Command Received"]) --> Validate["Validate Input"]
Validate --> Action{"Action Type?"}
Action --> |Navigate| Navigate["Navigate to URL"]
Action --> |Crawl| Crawl["Start Crawl"]
Action --> |Inspect| Inspect["Capture DOM/Network/Console/A11y"]
Navigate --> Result["Return Status"]
Crawl --> Progress["Emit Progress via WS"]
Inspect --> Snapshot["Return Snapshot Data"]
Progress --> End(["Done"])
Result --> End
Snapshot --> End
```

**Diagram sources**
- [browser.rs](file://src-tauri/src/commands/browser.rs)
- [mod.rs](file://src-tauri/src/browser/mod.rs)
- [crawl_runner.rs](file://src-tauri/src/browser/crawl_runner.rs)
- [tools/browser.rs](file://src-tauri/src/tools/browser.rs)

**Section sources**
- [browser.rs](file://src-tauri/src/commands/browser.rs)
- [mod.rs](file://src-tauri/src/browser/mod.rs)
- [tools/browser.rs](file://src-tauri/src/tools/browser.rs)

### Crawler Engine
The crawler engine drives page discovery and extraction. It uses helpers for DOM parsing, link resolution, and filtering.

```mermaid
flowchart TD
Entry(["Entry Point"]) --> Seed["Seed URLs"]
Seed --> Fetch["Fetch Page"]
Fetch --> Parse["Parse DOM"]
Parse --> Extract["Extract Links & Metadata"]
Extract --> Filter{"Filter Rules Match?"}
Filter --> |Yes| Queue["Queue Next Pages"]
Filter --> |No| Skip["Skip Page"]
Queue --> Process["Process Content"]
Process --> Emit["Emit Page Crawled Event"]
Emit --> Done(["Complete"])
Skip --> Done
```

**Diagram sources**
- [crawl_runner.rs](file://src-tauri/src/browser/crawl_runner.rs)
- [crawl_helpers.rs](file://src-tauri/src/browser/crawl_helpers.rs)
- [crawl_types.rs](file://src-tauri/src/browser/crawl_types.rs)
- [automation/page_crawled.rs](file://src-tauri/src/automation/page_crawled.rs)

**Section sources**
- [crawl_runner.rs](file://src-tauri/src/browser/crawl_runner.rs)
- [crawl_helpers.rs](file://src-tauri/src/browser/crawl_helpers.rs)
- [crawl_types.rs](file://src/t