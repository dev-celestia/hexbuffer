# Local File System Operations

<cite>
**Referenced Files in This Document**
- [file-explorer/index.tsx](file://src/pages/file-explorer/index.tsx)
- [file-explorer/types.ts](file://src/pages/file-explorer/types.ts)
- [file-explorer/constants.ts](file://src/pages/file-explorer/constants.ts)
- [file-explorer/components/FileExplorer.tsx](file://src/pages/file-explorer/components/FileExplorer.tsx)
- [file-explorer/components/DirectoryTree.tsx](file://src/pages/file-explorer/components/DirectoryTree.tsx)
- [file-explorer/components/FileList.tsx](file://src/pages/file-explorer/components/FileList.tsx)
- [file-explorer/components/FilePreview.tsx](file://src/pages/file-explorer/components/FilePreview.tsx)
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/fileUtils.ts](file://src/pages/file-explorer/lib/fileUtils.ts)
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/lib/iconRenderer.ts](file://src/pages/file-explorer/lib/iconRenderer.ts)
- [tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [tauri/src/commands/storage.rs](file://src-tauri/src/commands/storage.rs)
- [tauri/Cargo.toml](file://src-tauri/Cargo.toml)
- [tauri/tauri.conf.json](file://src-tauri/tauri.conf.json)
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
This document explains how Apprecon’s file explorer performs local file system operations, including navigation, directory traversal, metadata display, and CRUD actions (create, read, update, delete, rename, copy/move). It also covers file type detection, icon rendering, preview generation for various formats, and best practices for organizing security testing tools and configuration files. Guidance is provided for handling large directories efficiently, managing permissions, error scenarios, and performance optimization on large file systems.

## Project Structure
The file explorer spans the frontend React pages and Tauri backend commands:
- Frontend page and components implement UI, state, and orchestration for browsing and editing files.
- Utilities handle MIME type detection, icons, and preview logic.
- Hooks encapsulate file operation workflows.
- Tauri commands expose secure file system APIs to the frontend.

```mermaid
graph TB
subgraph "Frontend"
FE_Index["pages/file-explorer/index.tsx"]
FE_Components["components/*"]
FE_Hooks["hooks/useFileOperations.ts"]
FE_Utils["lib/fileUtils.ts<br/>lib/mimeTypeDetector.ts<br/>lib/iconRenderer.ts"]
end
subgraph "Tauri Backend"
TA_Commands["commands/mod.rs<br/>commands/storage.rs"]
TA_Config["tauri.conf.json"]
TA_Deps["Cargo.toml"]
end
FE_Index --> FE_Components
FE_Components --> FE_Hooks
FE_Hooks --> FE_Utils
FE_Hooks --> TA_Commands
TA_Commands --> TA_Config
TA_Commands --> TA_Deps
```

**Diagram sources**
- [file-explorer/index.tsx](file://src/pages/file-explorer/index.tsx)
- [file-explorer/components/FileExplorer.tsx](file://src/pages/file-explorer/components/FileExplorer.tsx)
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/fileUtils.ts](file://src/pages/file-explorer/lib/fileUtils.ts)
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/lib/iconRenderer.ts](file://src/pages/file-explorer/lib/iconRenderer.ts)
- [tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [tauri/src/commands/storage.rs](file://src-tauri/src/commands/storage.rs)
- [tauri/tauri.conf.json](file://src-tauri/tauri.conf.json)
- [tauri/Cargo.toml](file://src-tauri/Cargo.toml)

**Section sources**
- [file-explorer/index.tsx](file://src/pages/file-explorer/index.tsx)
- [file-explorer/types.ts](file://src/pages/file-explorer/types.ts)
- [file-explorer/constants.ts](file://src/pages/file-explorer/constants.ts)
- [file-explorer/components/FileExplorer.tsx](file://src/pages/file-explorer/components/FileExplorer.tsx)
- [file-explorer/components/DirectoryTree.tsx](file://src/pages/file-explorer/components/DirectoryTree.tsx)
- [file-explorer/components/FileList.tsx](file://src/pages/file-explorer/components/FileList.tsx)
- [file-explorer/components/FilePreview.tsx](file://src/pages/file-explorer/components/FilePreview.tsx)
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/fileUtils.ts](file://src/pages/file-explorer/lib/fileUtils.ts)
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/lib/iconRenderer.ts](file://src/pages/file-explorer/lib/iconRenderer.ts)
- [tauri/src/commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [tauri/src/commands/storage.rs](file://src-tauri/src/commands/storage.rs)
- [tauri/tauri.conf.json](file://src-tauri/tauri.conf.json)
- [tauri/Cargo.toml](file://src-tauri/Cargo.toml)

## Core Components
- Page entrypoint orchestrates layout, routing, and initial state for the file explorer.
- Directory tree component renders hierarchical navigation with lazy expansion.
- File list displays entries with metadata columns and supports selection and batch actions.
- Preview panel shows content previews based on detected MIME types.
- File operations hook centralizes create/read/update/delete/rename/copy/move flows and integrates with Tauri commands.
- Utilities provide MIME detection, icon mapping, and safe path helpers.

Key responsibilities:
- Navigation and traversal: lazy loading, pagination/virtualization for large directories.
- Metadata display: name, size, modified time, permissions, MIME type.
- Operations: create folder/file, read content, update content, delete, rename, copy/move.
- Type detection and preview: extension-based and magic-byte heuristics; text, image, PDF, code, JSON, YAML, CSV.
- Icons: consistent mapping from MIME/type to SVG/PNG assets.

**Section sources**
- [file-explorer/index.tsx](file://src/pages/file-explorer/index.tsx)
- [file-explorer/components/DirectoryTree.tsx](file://src/pages/file-explorer/components/DirectoryTree.tsx)
- [file-explorer/components/FileList.tsx](file://src/pages/file-explorer/components/FileList.tsx)
- [file-explorer/components/FilePreview.tsx](file://src/pages/file-explorer/components/FilePreview.tsx)
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/fileUtils.ts](file://src/pages/file-explorer/lib/fileUtils.ts)
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/lib/iconRenderer.ts](file://src/pages/file-explorer/lib/iconRenderer.ts)

## Architecture Overview
The file explorer uses a layered architecture:
- UI layer (React components) handles user interactions and rendering.
- State and workflow layer (hooks) coordinate operations and manage local state.
- Utility layer provides type detection, icons, and path utilities.
- Tauri command layer exposes secure file system methods to the frontend.

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "FileExplorer UI"
participant Hook as "useFileOperations"
participant Utils as "fileUtils/mimeTypeDetector"
participant Tauri as "Tauri Commands"
participant FS as "Local File System"
User->>UI : Navigate to folder / select file
UI->>Hook : requestList(path)
Hook->>Utils : detectType(name, header)
Hook->>Tauri : listDir(path)
Tauri->>FS : readdir + stat
FS-->>Tauri : entries[]
Tauri-->>Hook : entries[]
Hook-->>UI : entries[] with metadata
User->>UI : Open file preview
UI->>Hook : readFile(path, options)
Hook->>Tauri : readFile(path, sizeLimit)
Tauri->>FS : open + read
FS-->>Tauri : bytes
Tauri-->>Hook : content
Hook-->>UI : render preview by MIME
```

**Diagram sources**
- [file-explorer/components/FileExplorer.tsx](file://src/pages/file-explorer/components/FileExplorer.tsx)
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [tauri/src/commands/storage.rs](file://src-tauri/src/commands/storage.rs)

## Detailed Component Analysis

### File Explorer Page and Layout
- Initializes root state, selected paths, and view modes.
- Composes DirectoryTree, FileList, and FilePreview panels.
- Delegates heavy operations to hooks and Tauri commands.

```mermaid
classDiagram
class FileExplorerPage {
+selectedPath : string
+entries : FileEntry[]
+preview : PreviewData
+render()
}
class DirectoryTree {
+path : string
+onSelect(path) : void
+expandLazy() : void
}
class FileList {
+entries : FileEntry[]
+onSelect(entry) : void
+onBatch(actions) : void
}
class FilePreview {
+entry : FileEntry
+render() : JSX
}
FileExplorerPage --> DirectoryTree : "renders"
FileExplorerPage --> FileList : "renders"
FileExplorerPage --> FilePreview : "renders"
```

**Diagram sources**
- [file-explorer/index.tsx](file://src/pages/file-explorer/index.tsx)
- [file-explorer/components/DirectoryTree.tsx](file://src/pages/file-explorer/components/DirectoryTree.tsx)
- [file-explorer/components/FileList.tsx](file://src/pages/file-explorer/components/FileList.tsx)
- [file-explorer/components/FilePreview.tsx](file://src/pages/file-explorer/components/FilePreview.tsx)

**Section sources**
- [file-explorer/index.tsx](file://src/pages/file-explorer/index.tsx)
- [file-explorer/components/FileExplorer.tsx](file://src/pages/file-explorer/components/FileExplorer.tsx)

### Directory Traversal and Navigation
- Lazy expansion of nested folders to avoid loading entire trees.
- Pagination or virtualized lists for large directories.
- Path normalization and validation before issuing commands.

```mermaid
flowchart TD
Start(["Open Folder"]) --> Validate["Validate path"]
Validate --> Exists{"Exists?"}
Exists -- No --> Error["Show permission/error dialog"]
Exists -- Yes --> Load["Load entries (lazy/paginated)"]
Load --> Enrich["Enrich with metadata and MIME"]
Enrich --> Render["Render tree/list"]
Render --> End(["Ready"])
```

**Diagram sources**
- [file-explorer/components/DirectoryTree.tsx](file://src/pages/file-explorer/components/DirectoryTree.tsx)
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/fileUtils.ts](file://src/pages/file-explorer/lib/fileUtils.ts)

**Section sources**
- [file-explorer/components/DirectoryTree.tsx](file://src/pages/file-explorer/components/DirectoryTree.tsx)
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/fileUtils.ts](file://src/pages/file-explorer/lib/fileUtils.ts)

### File List and Metadata Display
- Displays name, size, modified time, permissions, and MIME type.
- Supports sorting, filtering, and selection for batch operations.
- Renders icons based on MIME/type mapping.

```mermaid
classDiagram
class FileEntry {
+string name
+number size
+datetime modified
+string mode
+string mime
+boolean isDir
}
class FileList {
+entries : FileEntry[]
+sort(field, order) : void
+filter(query) : void
+select(entry) : void
}
FileList --> FileEntry : "displays"
```

**Diagram sources**
- [file-explorer/components/FileList.tsx](file://src/pages/file-explorer/components/FileList.tsx)
- [file-explorer/types.ts](file://src/pages/file-explorer/types.ts)

**Section sources**
- [file-explorer/components/FileList.tsx](file://src/pages/file-explorer/components/FileList.tsx)
- [file-explorer/types.ts](file://src/pages/file-explorer/types.ts)

### File Preview Generation
- Detects MIME type using extension and optional header sniffing.
- Renders text/code editors for scripts and configs.
- Shows images, PDFs, and other supported formats safely.

```mermaid
flowchart TD
Start(["Select File"]) --> Detect["Detect MIME (extension + header)"]
Detect --> Text{"Text-like?"}
Text -- Yes --> ReadText["Read text with encoding"]
Text -- No --> Binary{"Image/PDF/Other?"}
Binary -- Yes --> ReadBinary["Read binary with size limit"]
Binary -- No --> Unsupported["Show unsupported message"]
ReadText --> RenderText["Render editor/viewer"]
ReadBinary --> RenderBinary["Render image/PDF viewer"]
Unsupported --> End(["Done"])
RenderText --> End
RenderBinary --> End
```

**Diagram sources**
- [file-explorer/components/FilePreview.tsx](file://src/pages/file-explorer/components/FilePreview.tsx)
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/lib/iconRenderer.ts](file://src/pages/file-explorer/lib/iconRenderer.ts)

**Section sources**
- [file-explorer/components/FilePreview.tsx](file://src/pages/file-explorer/components/FilePreview.tsx)
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/lib/iconRenderer.ts](file://src/pages/file-explorer/lib/iconRenderer.ts)

### File Operations: Create, Read, Update, Delete, Rename, Copy/Move
- Encapsulated in a dedicated hook that coordinates UI state and Tauri calls.
- Validates inputs, enforces size limits, and handles errors consistently.
- Provides feedback via toasts/dialogs and updates listings atomically.

```mermaid
sequenceDiagram
participant UI as "FileList/FileExplorer"
participant Hook as "useFileOperations"
participant Tauri as "Tauri Commands"
participant FS as "Local File System"
UI->>Hook : createFolder(path, name)
Hook->>Tauri : mkdir(fullPath)
Tauri->>FS : mkdir
FS-->>Tauri : ok/error
Tauri-->>Hook : result
Hook-->>UI : refresh list
UI->>Hook : writeFile(path, content)
Hook->>Tauri : write(fullPath, content)
Tauri->>FS : write
FS-->>Tauri : ok/error
Tauri-->>Hook : result
Hook-->>UI : show success/error
UI->>Hook : rename(oldPath, newName)
Hook->>Tauri : rename(oldPath, newPath)
Tauri->>FS : rename
FS-->>Tauri : ok/error
Tauri-->>Hook : result
Hook-->>UI : refresh
UI->>Hook : copy(src, dest)
Hook->>Tauri : copy(src, dest)
Tauri->>FS : copy
FS-->>Tauri : ok/error
Tauri-->>Hook : result
Hook-->>UI : refresh
UI->>Hook : move(src, dest)
Hook->>Tauri : move(src, dest)
Tauri->>FS : move
FS-->>Tauri : ok/error
Tauri-->>Hook : result
Hook-->>UI : refresh
```

**Diagram sources**
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [tauri/src/commands/storage.rs](file://src-tauri/src/commands/storage.rs)

**Section sources**
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [tauri/src/commands/storage.rs](file://src-tauri/src/commands/storage.rs)

### File Type Detection and Icon Rendering
- Extension-based mapping plus optional magic-byte checks for accuracy.
- Normalizes MIME types to internal categories for consistent icons and viewers.
- Caches results to reduce overhead on repeated operations.

```mermaid
classDiagram
class MimeTypeDetector {
+detect(filePath, buffer?) : string
+category(mime) : string
}
class IconRenderer {
+iconFor(mime) : string
+fallback() : string
}
MimeTypeDetector --> IconRenderer : "provides category"
```

**Diagram sources**
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/lib/iconRenderer.ts](file://src/pages/file-explorer/lib/iconRenderer.ts)

**Section sources**
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/lib/iconRenderer.ts](file://src/pages/file-explorer/lib/iconRenderer.ts)

## Dependency Analysis
The file explorer depends on:
- Tauri commands for secure file system access.
- Configuration for capabilities and permissions.
- Internal utilities for MIME detection and icons.

```mermaid
graph LR
FE_Hook["useFileOperations.ts"] --> TA_Storage["storage.rs"]
FE_Utils["mimeTypeDetector.ts"] --> FE_Preview["FilePreview.tsx"]
FE_Utils --> FE_List["FileList.tsx"]
FE_Utils --> FE_Tree["DirectoryTree.tsx"]
TA_Storage --> TA_Conf["tauri.conf.json"]
TA_Storage --> TA_Cargo["Cargo.toml"]
```

**Diagram sources**
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/components/FilePreview.tsx](file://src/pages/file-explorer/components/FilePreview.tsx)
- [file-explorer/components/FileList.tsx](file://src/pages/file-explorer/components/FileList.tsx)
- [file-explorer/components/DirectoryTree.tsx](file://src/pages/file-explorer/components/DirectoryTree.tsx)
- [tauri/src/commands/storage.rs](file://src-tauri/src/commands/storage.rs)
- [tauri/tauri.conf.json](file://src-tauri/tauri.conf.json)
- [tauri/Cargo.toml](file://src-tauri/Cargo.toml)

**Section sources**
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/mimeTypeDetector.ts](file://src/pages/file-explorer/lib/mimeTypeDetector.ts)
- [file-explorer/components/FilePreview.tsx](file://src/pages/file-explorer/components/FilePreview.tsx)
- [file-explorer/components/FileList.tsx](file://src/pages/file-explorer/components/FileList.tsx)
- [file-explorer/components/DirectoryTree.tsx](file://src/pages/file-explorer/components/DirectoryTree.tsx)
- [tauri/src/commands/storage.rs](file://src-tauri/src/commands/storage.rs)
- [tauri/tauri.conf.json](file://src-tauri/tauri.conf.json)
- [tauri/Cargo.toml](file://src-tauri/Cargo.toml)

## Performance Considerations
- Lazy directory loading: expand nodes on demand; avoid preloading deep trees.
- Virtualization/pagination: render only visible rows for large folders.
- Bounded reads: enforce maximum preview sizes to prevent memory spikes.
- Debounced search: throttle input events during filtering.
- Batch operations: group multiple writes/renames to minimize I/O.
- Caching: cache MIME types and icons to reduce recomputation.
- Background tasks: offload heavy operations to workers or Tauri async handlers.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Permission denied: verify OS-level permissions and Tauri capability settings; prompt users to adjust ACLs if necessary.
- Path resolution errors: normalize paths and validate existence before operations.
- Large file preview failures: enforce size limits and fallback to basic metadata when content cannot be read.
- Encoding problems: detect and handle text encodings gracefully; allow manual override.
- Network or disk latency: add timeouts and retry logic for transient failures.
- Inconsistent MIME types: combine extension and header sniffing; fall back to safe defaults.

Operational tips:
- Provide clear error messages and actionable steps.
- Log operation details for diagnostics without exposing sensitive data.
- Use atomic operations where possible to maintain consistency.

**Section sources**
- [file-explorer/hooks/useFileOperations.ts](file://src/pages/file-explorer/hooks/useFileOperations.ts)
- [file-explorer/lib/fileUtils.ts](file://src/pages/file-explorer/lib/fileUtils.ts)
- [tauri/src/commands/storage.rs](file://src-tauri/src/commands/storage.rs)

## Conclusion
Apprecon’s file explorer combines a responsive UI with robust Tauri-backed file system operations. By leveraging lazy loading, virtualization, bounded reads, and careful MIME detection, it delivers efficient navigation and preview across diverse file types. Following the patterns outlined here ensures scalability, reliability, and a smooth user experience even on large file systems.

[No sources needed since this section summarizes without analyzing specific files]