# Document Templates

<cite>
**Referenced Files in This Document**
- [documents.ts](file://src/stores/documents.ts)
- [index.tsx](file://src/pages/markdown/index.tsx)
- [api.ts](file://src/pages/markdown/api.ts)
- [constants.ts](file://src/pages/markdown/constants.ts)
- [types.ts](file://src/pages/markdown/types.ts)
- [lib.ts](file://src/pages/markdown/lib.ts)
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)
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
This document explains Apprecon’s document template system: how to create, manage, and apply templates for consistent formatting and structure; how the template dialog works; how template variables and dynamic content insertion are handled; what built-in templates exist (security reports, API documentation, project specifications); and how to author custom templates for specific testing methodologies and compliance frameworks. It also covers inheritance, versioning, and sharing across teams.

## Project Structure
The template system spans the frontend UI, state management, triggers, and Tauri backend storage. The key areas are:
- Markdown page entry point and UI orchestration
- Template store and persistence
- Trigger hooks for AI-assisted templating and section generation
- Backend tools and commands for storage operations

```mermaid
graph TB
subgraph "Frontend"
MD["Markdown Page<br/>index.tsx"]
Store["Documents Store<br/>documents.ts"]
Types["Types & Constants<br/>types.ts, constants.ts"]
Lib["Helpers<br/>lib.ts"]
Triggers["Document Triggers<br/>ai-tool.ts, sections.ts"]
end
subgraph "Backend"
Tools["Tauri Tools<br/>tools/documents.rs"]
Cmds["Storage Commands<br/>commands/storage.rs"]
end
MD --> Store
MD --> Types
MD --> Lib
MD --> Triggers
Store --> Tools
Tools --> Cmds
```

**Diagram sources**
- [index.tsx](file://src/pages/markdown/index.tsx)
- [documents.ts](file://src/stores/documents.ts)
- [types.ts](file://src/pages/markdown/types.ts)
- [constants.ts](file://src/pages/markdown/constants.ts)
- [lib.ts](file://src/pages/markdown/lib.ts)
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)

**Section sources**
- [index.tsx](file://src/pages/markdown/index.tsx)
- [documents.ts](file://src/stores/documents.ts)
- [types.ts](file://src/pages/markdown/types.ts)
- [constants.ts](file://src/pages/markdown/constants.ts)
- [lib.ts](file://src/pages/markdown/lib.ts)
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)

## Core Components
- Markdown page orchestrator: hosts the editor, toolbar, and template actions.
- Documents store: manages template definitions, current document state, and persistence.
- Types and constants: define schema for templates, variables, and metadata.
- Helpers: utilities for variable interpolation and rendering.
- Triggers: AI tool integration and section generators that can populate templates dynamically.
- Tauri tools and commands: backend storage APIs for reading/writing templates and documents.

Key responsibilities:
- Template catalog and selection via a dialog interface
- Variable resolution and dynamic content injection
- Versioned template storage and retrieval
- Sharing templates through persistent storage mechanisms

**Section sources**
- [index.tsx](file://src/pages/markdown/index.tsx)
- [documents.ts](file://src/stores/documents.ts)
- [types.ts](file://src/pages/markdown/types.ts)
- [constants.ts](file://src/pages/markdown/constants.ts)
- [lib.ts](file://src/pages/markdown/lib.ts)
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)

## Architecture Overview
The template workflow connects user interactions in the Markdown page with the store and backend storage.

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "Markdown Page<br/>index.tsx"
participant ST as "Documents Store<br/>documents.ts"
participant TR as "Triggers<br/>ai-tool.ts / sections.ts"
participant BT as "Tauri Tools<br/>tools/documents.rs"
participant CM as "Storage Commands<br/>commands/storage.rs"
U->>UI : Open template dialog
UI->>ST : Request available templates
ST->>BT : Read templates from storage
BT->>CM : Persist/read operation
CM-->>BT : Template list
BT-->>ST : Template catalog
ST-->>UI : Render dialog options
U->>UI : Select template + fill variables
UI->>TR : Generate initial content (optional)
TR-->>UI : Injected sections or AI suggestions
UI->>ST : Apply template and save draft
ST->>BT : Save document/template
BT->>CM : Persist operation
CM-->>BT : Success
BT-->>ST : Acknowledge
ST-->>UI : Updated document state
```

**Diagram sources**
- [index.tsx](file://src/pages/markdown/index.tsx)
- [documents.ts](file://src/stores/documents.ts)
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)

## Detailed Component Analysis

### Markdown Page and Template Dialog
- Entry point for the document editor and template actions.
- Presents a dialog to browse, select, and preview templates.
- Collects variable inputs and applies them to the selected template.
- Integrates with triggers to enrich content via AI or predefined sections.

```mermaid
flowchart TD
Start(["Open Markdown Page"]) --> ShowDialog["Show Template Dialog"]
ShowDialog --> PickTemplate["Pick Template"]
PickTemplate --> FillVars["Fill Variables"]
FillVars --> Preview{"Preview OK?"}
Preview --> |No| EditVars["Edit Variables"]
EditVars --> Preview
Preview --> |Yes| Apply["Apply Template"]
Apply --> Enrich["Optional: Run Triggers"]
Enrich --> Save["Save Draft/Version"]
Save --> End(["Done"])
```

**Diagram sources**
- [index.tsx](file://src/pages/markdown/index.tsx)
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)

**Section sources**
- [index.tsx](file://src/pages/markdown/index.tsx)

### Documents Store
- Manages the template catalog, current document state, and persistence.
- Provides methods to load, create, update, and delete templates and documents.
- Handles variable substitution and merges dynamic content into templates.

```mermaid
classDiagram
class DocumentsStore {
+templates
+currentDoc
+loadTemplates()
+getTemplate(id)
+createTemplate(data)
+updateTemplate(id, data)
+deleteTemplate(id)
+applyTemplate(templateId, variables)
+saveDraft(doc)
+publishVersion(doc, version)
}
```

**Diagram sources**
- [documents.ts](file://src/stores/documents.ts)

**Section sources**
- [documents.ts](file://src/stores/documents.ts)

### Types and Constants
- Define the shape of templates, variables, and metadata.
- Enumerate built-in template identifiers and default sections.
- Provide validation rules and defaults for variables.

```mermaid
classDiagram
class Template {
+id
+name
+description
+version
+variables[]
+contentSchema
+inheritFrom
+tags
}
class Variable {
+key
+label
+type
+default
+required
+options
}
class Builtins {
+securityReport
+apiDoc
+projectSpec
}
Template --> Variable : "has many"
Builtins --> Template : "provides defaults"
```

**Diagram sources**
- [types.ts](file://src/pages/markdown/types.ts)
- [constants.ts](file://src/pages/markdown/constants.ts)

**Section sources**
- [types.ts](file://src/pages/markdown/types.ts)
- [constants.ts](file://src/pages/markdown/constants.ts)

### Helpers for Variables and Rendering
- Resolve placeholders and inject dynamic values into template content.
- Sanitize and format inserted content based on type hints.
- Support nested variables and conditional blocks if defined by schema.

```mermaid
flowchart TD
VStart["Input: Template + Variables"] --> Parse["Parse Placeholders"]
Parse --> Resolve["Resolve Values"]
Resolve --> Validate{"Valid?"}
Validate --> |No| Error["Return Validation Errors"]
Validate --> |Yes| Render["Render Content"]
Render --> Output["Final Document Text"]
```

**Diagram sources**
- [lib.ts](file://src/pages/markdown/lib.ts)

**Section sources**
- [lib.ts](file://src/pages/markdown/lib.ts)

### Triggers: AI Tool and Sections
- AI tool trigger: generates content based on prompts and context.
- Sections trigger: inserts predefined sections tailored to workflows.
- Both integrate with the store to update the active document.

```mermaid
sequenceDiagram
participant UI as "Markdown Page"
participant TR as "Triggers"
participant ST as "Documents Store"
UI->>TR : Invoke AI tool or sections
TR->>ST : Fetch context and variables
ST-->>TR : Context snapshot
TR-->>UI : Suggested content or sections
UI->>ST : Merge into document
```

**Diagram sources**
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)
- [documents.ts](file://src/stores/documents.ts)

**Section sources**
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)

### Tauri Tools and Storage Commands
- Backend tools expose functions to read/write templates and documents.
- Storage commands handle persistence, versioning, and sharing metadata.
- Ensure consistency and durability of template assets.

```mermaid
classDiagram
class TauriTools {
+readTemplates()
+writeTemplate(data)
+readDocument(id)
+writeDocument(data)
}
class StorageCommands {
+persistTemplate(template)
+listTemplates()
+saveVersion(doc, version)
+shareTemplate(templateId, scope)
}
TauriTools --> StorageCommands : "calls"
```

**Diagram sources**
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)

**Section sources**
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)

## Dependency Analysis
The template system is composed of cohesive modules with clear boundaries:
- Frontend UI depends on the store and helpers.
- Store depends on types/constants and backend tools.
- Triggers depend on the store for context and updates.
- Backend tools depend on storage commands for persistence.

```mermaid
graph LR
UI["Markdown Page"] --> Store["Documents Store"]
UI --> Helpers["Lib Helpers"]
UI --> Triggers["AI Tool / Sections"]
Store --> Types["Types / Constants"]
Store --> Tools["Tauri Tools"]
Triggers --> Store
Tools --> Cmds["Storage Commands"]
```

**Diagram sources**
- [index.tsx](file://src/pages/markdown/index.tsx)
- [documents.ts](file://src/stores/documents.ts)
- [lib.ts](file://src/pages/markdown/lib.ts)
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)
- [types.ts](file://src/pages/markdown/types.ts)
- [constants.ts](file://src/pages/markdown/constants.ts)
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)

**Section sources**
- [index.tsx](file://src/pages/markdown/index.tsx)
- [documents.ts](file://src/stores/documents.ts)
- [lib.ts](file://src/pages/markdown/lib.ts)
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)
- [types.ts](file://src/pages/markdown/types.ts)
- [constants.ts](file://src/pages/markdown/constants.ts)
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)

## Performance Considerations
- Keep template catalogs small and indexed by id/name for fast lookup.
- Defer heavy AI or section generation until needed; cache results where possible.
- Use incremental saves for drafts to avoid blocking the UI.
- Validate variables early to reduce re-renders and error handling overhead.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Template not found: verify id and availability in the catalog.
- Variable mismatch: ensure keys and types match the template schema.
- Persistence failures: check backend storage commands and permissions.
- AI or section generation errors: review trigger logs and context snapshots.

**Section sources**
- [documents.ts](file://src/stores/documents.ts)
- [tools/documents.rs](file://src-tauri/src/tools/documents.rs)
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)

## Conclusion
Apprecon’s document template system provides a robust framework for creating, managing, and applying templates consistently across security reports, API documentation, and project specifications. With a clear separation between UI, store, triggers, and backend storage, it supports variable-driven content, dynamic enrichment, versioning, and team sharing. Teams can extend the system by adding custom templates and triggers aligned with their methodologies and compliance frameworks.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Built-in Templates
- Security Report: structured sections for findings, risk ratings, evidence, and remediation steps.
- API Documentation: endpoints, schemas, examples, and authentication details.
- Project Specification: scope, architecture overview, constraints, and deliverables.

These are surfaced via the template catalog and can be selected in the dialog.

**Section sources**
- [constants.ts](file://src/pages/markdown/constants.ts)
- [types.ts](file://src/pages/markdown/types.ts)

### Creating Custom Templates
Steps:
- Define a new template with id, name, description, and variables.
- Add content schema and optional inheritance from existing templates.
- Register tags for discoverability and filtering.
- Test via the dialog, filling variables and previewing output.

**Section sources**
- [types.ts](file://src/pages/markdown/types.ts)
- [constants.ts](file://src/pages/markdown/constants.ts)

### Template Inheritance
- Templates can inherit fields and sections from a base template.
- Overrides allow customization while preserving common structure.
- Inheritance chain should remain shallow to avoid complexity.

**Section sources**
- [types.ts](file://src/pages/markdown/types.ts)

### Versioning and Sharing
- Each saved document or template can have a version identifier.
- Versions enable rollback and audit trails.
- Sharing scopes control visibility within teams or projects.

**Section sources**
- [commands/storage.rs](file://src-tauri/src/commands/storage.rs)
- [documents.ts](file://src/stores/documents.ts)

### Dynamic Content Insertion
- Use triggers to insert AI-generated content or predefined sections.
- Variables can drive conditional blocks and loops if supported by schema.
- Always validate injected content before finalizing.

**Section sources**
- [ai-tool.ts](file://src/triggers/documents/ai-tool.ts)
- [sections.ts](file://src/triggers/documents/sections.ts)
- [lib.ts](file://src/pages/markdown/lib.ts)