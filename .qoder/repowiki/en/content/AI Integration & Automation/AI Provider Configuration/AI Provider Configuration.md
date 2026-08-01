# AI Provider Configuration

<cite>
**Referenced Files in This Document**
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/types.rs](file://src-tauri/src/ai/types.rs)
- [src-tauri/src/ai/keyring.rs](file://src-tauri/src/ai/keyring.rs)
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)
- [src/components/ai-elements/model-selector.tsx](file://src/components/ai-elements/model-selector.tsx)
- [src/components/ui/select-env-input.tsx](file://src/components/ui/select-env-input.tsx)
- [src/stores/app-settings-store.ts](file://src/stores/app-settings-store.ts)
- [src/layout/assistant/index.tsx](file://src/layout/assistant/index.tsx)
- [src/layout/assistant/lib/assistant-config.ts](file://src/layout/assistant/lib/assistant-config.ts)
- [src/layout/footer/proxy-status.tsx](file://src/layout/footer/proxy-status.tsx)
- [src/hooks/use-proxy-start.ts](file://src/hooks/use-proxy-start.ts)
- [docs/website/proxy.ts](file://docs/website/proxy.ts)
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
This document explains how to configure and manage AI providers in Apprecon, including supported models (OpenAI, Claude, local models), API key setup, provider-specific configurations, secure credential storage via keyring, provider selection logic, fallback mechanisms, environment variables, proxy settings, troubleshooting connection issues, rate limiting considerations, and cost optimization strategies. It is intended for both technical and non-technical users who need to set up or troubleshoot AI features within the application.

## Project Structure
Apprecon’s AI configuration spans both the Rust backend (Tauri) and the frontend UI:
- Backend modules handle provider definitions, settings, types, keyring integration, and commands exposed to the UI.
- Frontend components provide model selection, environment variable inputs, and assistant orchestration.
- Proxy utilities help route requests through a configured proxy when required by your network policy.

```mermaid
graph TB
subgraph "Frontend"
FE_ModelSelector["Model Selector"]
FE_EnvInput["Environment Variable Input"]
FE_Assistant["Assistant Layout"]
FE_Settings["App Settings Store"]
end
subgraph "Backend (Tauri)"
BE_Mod["AI Module"]
BE_Providers["Providers Registry"]
BE_Settings["AI Settings"]
BE_Types["Types & Enums"]
BE_Keyring["Keyring Integration"]
BE_Commands["AI Commands"]
end
FE_ModelSelector --> FE_Assistant
FE_EnvInput --> FE_Settings
FE_Assistant --> BE_Commands
FE_Settings --> BE_Commands
BE_Commands --> BE_Mod
BE_Mod --> BE_Providers
BE_Mod --> BE_Settings
BE_Mod --> BE_Types
BE_Mod --> BE_Keyring
```

**Diagram sources**
- [src/components/ai-elements/model-selector.tsx](file://src/components/ai-elements/model-selector.tsx)
- [src/components/ui/select-env-input.tsx](file://src/components/ui/select-env-input.tsx)
- [src/layout/assistant/index.tsx](file://src/layout/assistant/index.tsx)
- [src/stores/app-settings-store.ts](file://src/stores/app-settings-store.ts)
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/types.rs](file://src-tauri/src/ai/types.rs)
- [src-tauri/src/ai/keyring.rs](file://src-tauri/src/ai/keyring.rs)
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)

**Section sources**
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/types.rs](file://src-tauri/src/ai/types.rs)
- [src-tauri/src/ai/keyring.rs](file://src-tauri/src/ai/keyring.rs)
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)
- [src/components/ai-elements/model-selector.tsx](file://src/components/ai-elements/model-selector.tsx)
- [src/components/ui/select-env-input.tsx](file://src/components/ui/select-env-input.tsx)
- [src/stores/app-settings-store.ts](file://src/stores/app-settings-store.ts)
- [src/layout/assistant/index.tsx](file://src/layout/assistant/index.tsx)

## Core Components
- Providers registry: Defines supported AI providers and their capabilities.
- Settings module: Loads and persists provider configurations, including endpoints and model names.
- Types: Enumerations and structures that standardize provider parameters and responses.
- Keyring integration: Securely stores and retrieves API keys using the system keychain.
- Commands: Tauri commands that expose provider operations to the frontend.
- Frontend model selector: Lets users choose a provider and model from available options.
- Environment variable input: Allows setting provider-specific environment variables securely.
- Assistant layout: Orchestrates AI interactions and applies selected provider settings.

**Section sources**
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/types.rs](file://src-tauri/src/ai/types.rs)
- [src-tauri/src/ai/keyring.rs](file://src-tauri/src/ai/keyring.rs)
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)
- [src/components/ai-elements/model-selector.tsx](file://src/components/ai-elements/model-selector.tsx)
- [src/components/ui/select-env-input.tsx](file://src/components/ui/select-env-input.tsx)
- [src/layout/assistant/index.tsx](file://src/layout/assistant/index.tsx)

## Architecture Overview
The AI subsystem follows a layered architecture:
- The frontend collects user selections and environment variables.
- Tauri commands validate and apply settings, then interact with the AI module.
- The AI module resolves the active provider based on configuration and availability.
- Credentials are retrieved from the keyring to ensure secure access.
- Requests are routed through optional proxies as configured.

```mermaid
sequenceDiagram
participant UI as "Frontend UI"
participant Cmd as "Tauri AI Commands"
participant Mod as "AI Module"
participant Prov as "Providers Registry"
participant Set as "Settings"
participant KR as "Keyring"
participant Net as "Network/Proxy"
UI->>Cmd : "Select provider/model + env vars"
Cmd->>Set : "Load/validate settings"
Cmd->>Mod : "Initialize provider context"
Mod->>Prov : "Resolve provider capabilities"
Mod->>KR : "Fetch API key securely"
Mod->>Net : "Send request (with proxy if configured)"
Net-->>Mod : "Response or error"
Mod-->>Cmd : "Result or failure"
Cmd-->>UI : "Update UI state"
```

**Diagram sources**
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/keyring.rs](file://src-tauri/src/ai/keyring.rs)

## Detailed Component Analysis

### Providers Registry and Selection Logic
- Supported providers include OpenAI, Claude, and local models.
- The registry enumerates available models per provider and exposes capability flags (e.g., streaming, tools).
- Provider selection prioritizes explicit user choice, then falls back to defaults based on environment variables and availability.

```mermaid
flowchart TD
Start(["Provider Selection"]) --> CheckUserChoice{"User selected provider?"}
CheckUserChoice --> |Yes| UseSelected["Use selected provider"]
CheckUserChoice --> |No| CheckEnvVars["Check environment variables"]
CheckEnvVars --> EnvValid{"Valid provider env found?"}
EnvValid --> |Yes| UseEnv["Use provider from env"]
EnvValid --> |No| Fallback["Fallback to default provider"]
UseSelected --> Validate["Validate credentials"]
UseEnv --> Validate
Fallback --> Validate
Validate --> Ready(["Provider ready"])
```

**Diagram sources**
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)

**Section sources**
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)

### Settings and Environment Variables
- Provider settings include endpoint URLs, model names, temperature, max tokens, and other parameters.
- Environment variables allow overriding settings at runtime without changing persisted configuration.
- The settings module merges defaults, persisted values, and environment overrides.

```mermaid
classDiagram
class AISettings {
+string provider
+string model
+string endpoint
+number temperature
+number maxTokens
+map~string,string~ extraParams
+load() AISettings
+save() void
+merge(envOverrides) AISettings
}
class EnvVars {
+string OPENAI_API_KEY
+string CLAUDE_API_KEY
+string LOCAL_MODEL_ENDPOINT
+get(key) string
}
AISettings --> EnvVars : "reads overrides"
```

**Diagram sources**
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)

**Section sources**
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src/components/ui/select-env-input.tsx](file://src/components/ui/select-env-input.tsx)

### Keyring Integration for Secure Credential Storage
- API keys are stored in the system keychain via the keyring module.
- The keyring provides methods to get/set/delete keys scoped by provider.
- The AI module retrieves keys at runtime to avoid exposing secrets in logs or memory unnecessarily.

```mermaid
sequenceDiagram
participant UI as "Frontend"
participant Cmd as "Tauri Commands"
participant KR as "Keyring"
participant Mod as "AI Module"
UI->>Cmd : "Save API key for provider"
Cmd->>KR : "store(provider, key)"
KR-->>Cmd : "success/failure"
Cmd-->>UI : "status"
UI->>Cmd : "Call AI function"
Cmd->>Mod : "init with provider"
Mod->>KR : "retrieve(provider)"
KR-->>Mod : "key"
Mod-->>Cmd : "proceed with request"
```

**Diagram sources**
- [src-tauri/src/ai/keyring.rs](file://src-tauri/src/ai/keyring.rs)
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)

**Section sources**
- [src-tauri/src/ai/keyring.rs](file://src-tauri/src/ai/keyring.rs)
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)

### Model Selector and Assistant Orchestration
- The model selector component lists available models per provider and updates the assistant context.
- The assistant layout coordinates prompts, tool usage, and response handling based on the selected provider.
- Changes propagate to the app settings store to persist the current selection.

```mermaid
sequenceDiagram
participant UI as "Model Selector"
participant Asst as "Assistant Layout"
participant Store as "App Settings Store"
participant Cmd as "Tauri Commands"
UI->>Asst : "Select provider/model"
Asst->>Store : "update current provider/model"
Asst->>Cmd : "apply settings and initialize"
Cmd-->>Asst : "ready state"
Asst-->>UI : "render model options"
```

**Diagram sources**
- [src/components/ai-elements/model-selector.tsx](file://src/components/ai-elements/model-selector.tsx)
- [src/layout/assistant/index.tsx](file://src/layout/assistant/index.tsx)
- [src/stores/app-settings-store.ts](file://src/stores/app-settings-store.ts)
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)

**Section sources**
- [src/components/ai-elements/model-selector.tsx](file://src/components/ai-elements/model-selector.tsx)
- [src/layout/assistant/index.tsx](file://src/layout/assistant/index.tsx)
- [src/stores/app-settings-store.ts](file://src/stores/app-settings-store.ts)

### Proxy Configuration and Network Routing
- Proxy settings can be applied globally or per-request depending on configuration.
- The proxy status indicator shows whether traffic is being routed through a proxy.
- The hook for starting the proxy ensures network requests use the correct endpoint.

```mermaid
flowchart TD
Start(["Request Initiated"]) --> CheckProxy{"Proxy enabled?"}
CheckProxy --> |Yes| RouteProxy["Route via proxy"]
CheckProxy --> |No| Direct["Direct connection"]
RouteProxy --> Send["Send request"]
Direct --> Send
Send --> Response["Receive response"]
```

**Diagram sources**
- [src/layout/footer/proxy-status.tsx](file://src/layout/footer/proxy-status.tsx)
- [src/hooks/use-proxy-start.ts](file://src/hooks/use-proxy-start.ts)
- [docs/website/proxy.ts](file://docs/website/proxy.ts)

**Section sources**
- [src/layout/footer/proxy-status.tsx](file://src/layout/footer/proxy-status.tsx)
- [src/hooks/use-proxy-start.ts](file://src/hooks/use-proxy-start.ts)
- [docs/website/proxy.ts](file://docs/website/proxy.ts)

## Dependency Analysis
- The AI module depends on providers, settings, types, and keyring.
- Commands act as an interface between the frontend and backend AI functionality.
- Frontend components rely on the assistant layout and settings store to reflect provider choices.

```mermaid
graph LR
FE_ModelSelector["Model Selector"] --> FE_Assistant["Assistant Layout"]
FE_EnvInput["Env Input"] --> FE_Settings["App Settings Store"]
FE_Assistant --> BE_Commands["AI Commands"]
BE_Commands --> BE_Mod["AI Module"]
BE_Mod --> BE_Providers["Providers"]
BE_Mod --> BE_Settings["Settings"]
BE_Mod --> BE_Types["Types"]
BE_Mod --> BE_Keyring["Keyring"]
```

**Diagram sources**
- [src/components/ai-elements/model-selector.tsx](file://src/components/ai-elements/model-selector.tsx)
- [src/components/ui/select-env-input.tsx](file://src/components/ui/select-env-input.tsx)
- [src/layout/assistant/index.tsx](file://src/layout/assistant/index.tsx)
- [src/stores/app-settings-store.ts](file://src/stores/app-settings-store.ts)
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/ai/providers.rs](file://src-tauri/src/ai/providers.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src-tauri/src/ai/types.rs](file://src-tauri/src/ai/types.rs)
- [src-tauri/src/ai/keyring.rs](file://src-tauri/src/ai/keyring.rs)

**Section sources**
- [src-tauri/src/ai/mod.rs](file://src-tauri/src/ai/mod.rs)
- [src-tauri/src/commands/ai.rs](file://src-tauri/src/commands/ai.rs)

## Performance Considerations
- Prefer smaller models for quick iterations; reserve larger models for complex tasks.
- Use streaming responses where supported to reduce perceived latency.
- Cache repeated prompts or results locally when appropriate to minimize API calls.
- Adjust temperature and max tokens to balance creativity and token consumption.
- Monitor rate limits and implement client-side backoff to avoid throttling.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing or invalid API key: Ensure the key is stored in the keyring and matches the selected provider.
- Endpoint misconfiguration: Verify provider endpoint URLs and any custom base paths.
- Proxy connectivity: Confirm proxy settings and network permissions; check proxy status indicator.
- Rate limiting: Implement retries with exponential backoff and monitor usage quotas.
- Local model failures: Validate local server health and accessibility from the application.

**Section sources**
- [src-tauri/src/ai/keyring.rs](file://src-tauri/src/ai/keyring.rs)
- [src-tauri/src/ai/settings.rs](file://src-tauri/src/ai/settings.rs)
- [src/layout/footer/proxy-status.tsx](file://src/layout/footer/proxy-status.tsx)

## Conclusion
Apprecon’s AI provider configuration combines secure credential management, flexible provider selection, and robust networking support. By following the guidance here, you can set up OpenAI, Claude, or local models efficiently, optimize costs, and troubleshoot common issues effectively.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Example Setup Scenarios
- OpenAI:
  - Set API key in keyring.
  - Choose model from the selector.
  - Optionally configure proxy if required.
- Claude:
  - Set API key in keyring.
  - Select model and adjust parameters.
  - Use proxy if necessary.
- Local Models:
  - Configure local endpoint URL.
  - Ensure local service is running and accessible.
  - Test connectivity via assistant.

[No sources needed since this section provides general guidance]

### Rate Limiting and Cost Optimization Strategies
- Use lower temperature and max tokens for routine tasks.
- Batch similar requests when possible.
- Monitor usage dashboards and set alerts for quota thresholds.
- Prefer cheaper models for exploratory work; switch to premium models for final outputs.

[No sources needed since this section provides general guidance]