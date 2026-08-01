# Port Scanner & Network Reconnaissance

<cite>
**Referenced Files in This Document**
- [port-scanner/mod.rs](file://src-tauri/src/port-scanner/mod.rs)
- [port-scanner/scanner.rs](file://src-tauri/src/port-scanner/scanner.rs)
- [port-scanner/banner.rs](file://src-tauri/src/port-scanner/banner.rs)
- [port-scanner/services.rs](file://src-tauri/src/port-scanner/services.rs)
- [port-scanner/targets.rs](file://src-tauri/src/port-scanner/targets.rs)
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)
- [port-scanner/types.rs](file://src-tauri/src/port-scanner/types.rs)
- [automation/port_scan.rs](file://src-tauri/src/automation/port_scan.rs)
- [automation/scan_completed.rs](file://src-tauri/src/automation/scan_completed.rs)
- [commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [pages/port-scanner/index.tsx](file://src/pages/port-scanner/index.tsx)
- [pages/port-scanner/constants.ts](file://src/pages/port-scanner/constants.ts)
- [pages/port-scanner/types.ts](file://src/pages/port-scanner/types.ts)
- [stores/port-scanner.ts](file://src/stores/port-scanner.ts)
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
This document explains Apprecon’s port scanning and network reconnaissance capabilities, focusing on the scanning engine, target discovery, service identification, scan types, configuration, performance tuning, and security considerations. It also covers advanced features such as banner grabbing, OS detection, and integration with external threat intelligence where applicable. The goal is to help both technical and non-technical users understand how to use the tool effectively and responsibly.

## Project Structure
Apprecon implements its port scanner primarily in Rust (Tauri backend) with a React frontend for user interaction. Key areas include:
- Backend scanning engine and state management
- Target parsing and validation
- Service fingerprinting and banner extraction
- Automation hooks and event emission
- Frontend UI and store synchronization

```mermaid
graph TB
subgraph "Frontend"
UI["Port Scanner UI<br/>index.tsx"]
Types["Types & Constants<br/>types.ts, constants.ts"]
Store["State Store<br/>stores/port-scanner.ts"]
end
subgraph "Backend (Rust/Tauri)"
Mod["Module Entry<br/>mod.rs"]
Scanner["Scanner Engine<br/>scanner.rs"]
Banner["Banner Grabber<br/>banner.rs"]
Services["Service Fingerprinter<br/>services.rs"]
Targets["Target Parser<br/>targets.rs"]
State["Scan State<br/>state.rs"]
TypesR["Shared Types<br/>types.rs"]
AutoPS["Automation Hook<br/>automation/port_scan.rs"]
AutoSC["Scan Completed Event<br/>automation/scan_completed.rs"]
end
UI --> Store
Store --> Mod
Mod --> Targets
Mod --> Scanner
Scanner --> Banner
Scanner --> Services
Scanner --> State
Scanner --> TypesR
Mod --> AutoPS
AutoPS --> AutoSC
```

**Diagram sources**
- [port-scanner/mod.rs](file://src-tauri/src/port-scanner/mod.rs)
- [port-scanner/scanner.rs](file://src-tauri/src/port-scanner/scanner.rs)
- [port-scanner/banner.rs](file://src-tauri/src/port-scanner/banner.rs)
- [port-scanner/services.rs](file://src-tauri/src/port-scanner/services.rs)
- [port-scanner/targets.rs](file://src-tauri/src/port-scanner/targets.rs)
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)
- [port-scanner/types.rs](file://src-tauri/src/port-scanner/types.rs)
- [automation/port_scan.rs](file://src-tauri/src/automation/port_scan.rs)
- [automation/scan_completed.rs](file://src-tauri/src/automation/scan_completed.rs)
- [pages/port-scanner/index.tsx](file://src/pages/port-scanner/index.tsx)
- [pages/port-scanner/types.ts](file://src/pages/port-scanner/types.ts)
- [pages/port-scanner/constants.ts](file://src/pages/port-scanner/constants.ts)
- [stores/port-scanner.ts](file://src/stores/port-scanner.ts)

**Section sources**
- [port-scanner/mod.rs](file://src-tauri/src/port-scanner/mod.rs)
- [pages/port-scanner/index.tsx](file://src/pages/port-scanner/index.tsx)
- [stores/port-scanner.ts](file://src/stores/port-scanner.ts)

## Core Components
- Scanner Engine: Orchestrates connection attempts, manages concurrency, and aggregates results.
- Target Discovery: Parses hostnames, IPs, CIDR ranges, and port specifications; validates inputs.
- Service Identification: Matches known service signatures and fingerprints based on responses.
- Banner Grabbing: Retrieves application banners from open ports to enrich findings.
- Scan State: Tracks progress, status, and outcomes across scans.
- Shared Types: Defines data structures used by both frontend and backend.
- Automation Hooks: Integrates scanning into workflows and emits completion events.

**Section sources**
- [port-scanner/scanner.rs](file://src-tauri/src/port-scanner/scanner.rs)
- [port-scanner/targets.rs](file://src-tauri/src/port-scanner/targets.rs)
- [port-scanner/services.rs](file://src-tauri/src/port-scanner/services.rs)
- [port-scanner/banner.rs](file://src-tauri/src/port-scanner/banner.rs)
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)
- [port-scanner/types.rs](file://src-tauri/src/port-scanner/types.rs)
- [automation/port_scan.rs](file://src-tauri/src/automation/port_scan.rs)
- [automation/scan_completed.rs](file://src-tauri/src/automation/scan_completed.rs)

## Architecture Overview
The port scanner follows a layered architecture:
- Frontend UI collects targets and options, then invokes backend commands via Tauri.
- Backend module coordinates target parsing, scanning, banner grabbing, and service identification.
- Results are streamed or aggregated and exposed back to the frontend through stores and events.
- Automation subsystem integrates scanning into broader workflows and emits lifecycle events.

```mermaid
sequenceDiagram
participant UI as "Frontend UI"
participant Store as "Port Scanner Store"
participant Cmd as "Tauri Command"
participant Mod as "Scanner Module"
participant Tgt as "Targets"
participant Eng as "Scanner Engine"
participant Ban as "Banner Grabber"
participant Svc as "Service Fingerprinter"
participant St as "Scan State"
participant Auto as "Automation Hook"
participant Ev as "Scan Completed Event"
UI->>Store : Configure targets and options
Store->>Cmd : Invoke scan command
Cmd->>Mod : Start scan
Mod->>Tgt : Parse and validate targets
Mod->>Eng : Launch scanning jobs
Eng->>Ban : Attempt banner grab on open ports
Eng->>Svc : Identify services from responses
Eng->>St : Update progress and results
Eng-->>Auto : Emit automation hook
Auto-->>Ev : Emit scan completed
Ev-->>Store : Notify UI
Store-->>UI : Render results
```

**Diagram sources**
- [pages/port-scanner/index.tsx](file://src/pages/port-scanner/index.tsx)
- [stores/port-scanner.ts](file://src/stores/port-scanner.ts)
- [commands/mod.rs](file://src-tauri/src/commands/mod.rs)
- [port-scanner/mod.rs](file://src-tauri/src/port-scanner/mod.rs)
- [port-scanner/targets.rs](file://src-tauri/src/port-scanner/targets.rs)
- [port-scanner/scanner.rs](file://src-tauri/src/port-scanner/scanner.rs)
- [port-scanner/banner.rs](file://src-tauri/src/port-scanner/banner.rs)
- [port-scanner/services.rs](file://src-tauri/src/port-scanner/services.rs)
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)
- [automation/port_scan.rs](file://src-tauri/src/automation/port_scan.rs)
- [automation/scan_completed.rs](file://src-tauri/src/automation/scan_completed.rs)

## Detailed Component Analysis

### Scanner Engine
Responsibilities:
- Execute different scan types (TCP connect, SYN stealth, UDP).
- Manage concurrency and rate limiting.
- Aggregate open/closed/filtered states per port.
- Integrate banner grabbing and service fingerprinting.

Key behaviors:
- TCP Connect: Establishes full TCP handshake to determine port state.
- SYN Stealth: Sends SYN packets and interprets responses for faster, less intrusive scans.
- UDP Scanning: Probes common UDP services using protocol-specific probes.

```mermaid
flowchart TD
Start(["Start Scan"]) --> ParseTargets["Parse and Validate Targets"]
ParseTargets --> ChooseType{"Scan Type?"}
ChooseType --> |TCP Connect| TCPConnect["Initiate TCP Handshake"]
ChooseType --> |SYN Stealth| SynStealth["Send SYN and Analyze Responses"]
ChooseType --> |UDP| UDPProbe["Send UDP Probes"]
TCPConnect --> OpenCheck{"Port Open?"}
SynStealth --> OpenCheck
UDPProbe --> OpenCheck
OpenCheck --> |Yes| BannerGrab["Attempt Banner Grab"]
OpenCheck --> |No| NextPort["Next Port"]
BannerGrab --> Fingerprint["Fingerprint Service"]
Fingerprint --> UpdateState["Update Scan State"]
UpdateState --> NextPort
NextPort --> Done{"All Ports Scanned?"}
Done --> |No| ChooseType
Done --> |Yes| EmitEvent["Emit Automation Events"]
EmitEvent --> End(["End"])
```

**Diagram sources**
- [port-scanner/scanner.rs](file://src-tauri/src/port-scanner/scanner.rs)
- [port-scanner/banner.rs](file://src-tauri/src/port-scanner/banner.rs)
- [port-scanner/services.rs](file://src-tauri/src/port-scanner/services.rs)
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)

**Section sources**
- [port-scanner/scanner.rs](file://src-tauri/src/port-scanner/scanner.rs)
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)

### Target Discovery
Responsibilities:
- Accept hostnames, IPv4/IPv6 addresses, CIDR ranges, and port lists/ranges.
- Resolve DNS names and expand CIDR ranges into individual hosts.
- Validate inputs and return structured target sets.

```mermaid
classDiagram
class Targets {
+parseHost(input) Host
+expandCIDR(cidr) Vec~Host~
+validatePorts(ports) Vec~u16~
+resolveDNS(hostname) Vec~IP~
}
```

**Diagram sources**
- [port-scanner/targets.rs](file://src-tauri/src/port-scanner/targets.rs)

**Section sources**
- [port-scanner/targets.rs](file://src-tauri/src/port-scanner/targets.rs)

### Service Identification and Banner Grabbing
Responsibilities:
- Extract banners from open ports to identify applications and versions.
- Match response patterns to known service signatures.
- Provide enriched metadata for vulnerability correlation.

```mermaid
classDiagram
class Banner {
+grab(port, timeout) Option~string~
+normalize(raw) string
}
class Services {
+match(response) ServiceInfo
+fingerprint(protocol, payload) ServiceInfo
}
Banner <.. Services : "uses normalized banner"
```

**Diagram sources**
- [port-scanner/banner.rs](file://src-tauri/src/port-scanner/banner.rs)
- [port-scanner/services.rs](file://src-tauri/src/port-scanner/services.rs)

**Section sources**
- [port-scanner/banner.rs](file://src-tauri/src/port-scanner/banner.rs)
- [port-scanner/services.rs](file://src-tauri/src/port-scanner/services.rs)

### Scan State Management
Responsibilities:
- Track current scan status, progress, and results.
- Persist intermediate findings and final outputs.
- Expose state updates to the frontend and automation subsystem.

```mermaid
stateDiagram-v2
[*] --> Idle
Idle --> Running : "start scan"
Running --> Progressing : "scanning ports"
Progressing --> Running : "more ports"
Running --> Completed : "all ports done"
Completed --> Idle : "reset"
Running --> Failed : "error"
Failed --> Idle : "retry"
```

**Diagram sources**
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)

**Section sources**
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)

### Automation Integration
Responsibilities:
- Trigger scans programmatically within workflows.
- Emit lifecycle events upon completion.
- Allow chaining with other tools and analysis steps.

```mermaid
sequenceDiagram
participant Workflow as "Workflow Engine"
participant Auto as "Automation Hook"
participant Scanner as "Scanner Engine"
participant Event as "Scan Completed Event"
Workflow->>Auto : Invoke port scan task
Auto->>Scanner : Start scan with parameters
Scanner-->>Auto : Emit progress updates
Scanner-->>Auto : Emit completion
Auto-->>Event : Publish scan result
Event-->>Workflow : Continue next step
```

**Diagram sources**
- [automation/port_scan.rs](file://src-tauri/src/automation/port_scan.rs)
- [automation/scan_completed.rs](file://src-tauri/src/automation/scan_completed.rs)

**Section sources**
- [automation/port_scan.rs](file://src-tauri/src/automation/port_scan.rs)
- [automation/scan_completed.rs](file://src-tauri/src/automation/scan_completed.rs)

### Frontend Interface and Store
Responsibilities:
- Present target input forms, scan options, and results.
- Manage local state and synchronize with backend via Tauri commands.
- Display real-time progress and detailed findings.

```mermaid
graph TB
UI["Port Scanner UI<br/>index.tsx"]
Types["Types & Constants<br/>types.ts, constants.ts"]
Store["State Store<br/>stores/port-scanner.ts"]
Cmd["Tauri Commands<br/>commands/mod.rs"]
UI --> Store
Store --> Cmd
Types --> UI
Types --> Store
```

**Diagram sources**
- [pages/port-scanner/index.tsx](file://src/pages/port-scanner/index.tsx)
- [pages/port-scanner/types.ts](file://src/pages/port-scanner/types.ts)
- [pages/port-scanner/constants.ts](file://src/pages/port-scanner/constants.ts)
- [stores/port-scanner.ts](file://src/stores/port-scanner.ts)
- [commands/mod.rs](file://src-tauri/src/commands/mod.rs)

**Section sources**
- [pages/port-scanner/index.tsx](file://src/pages/port-scanner/index.tsx)
- [pages/port-scanner/types.ts](file://src/pages/port-scanner/types.ts)
- [pages/port-scanner/constants.ts](file://src/pages/port-scanner/constants.ts)
- [stores/port-scanner.ts](file://src/stores/port-scanner.ts)
- [commands/mod.rs](file://src-tauri/src/commands/mod.rs)

## Dependency Analysis
The port scanner module depends on several internal components and exposes interfaces to the frontend and automation subsystem.

```mermaid
graph LR
Mod["Scanner Module<br/>mod.rs"] --> Targets["Targets<br/>targets.rs"]
Mod --> Scanner["Scanner Engine<br/>scanner.rs"]
Scanner --> Banner["Banner Grabber<br/>banner.rs"]
Scanner --> Services["Service Fingerprinter<br/>services.rs"]
Scanner --> State["Scan State<br/>state.rs"]
Mod --> TypesR["Shared Types<br/>types.rs"]
Mod --> AutoPS["Automation Hook<br/>automation/port_scan.rs"]
AutoPS --> AutoSC["Scan Completed Event<br/>automation/scan_completed.rs"]
```

**Diagram sources**
- [port-scanner/mod.rs](file://src-tauri/src/port-scanner/mod.rs)
- [port-scanner/targets.rs](file://src-tauri/src/port-scanner/targets.rs)
- [port-scanner/scanner.rs](file://src-tauri/src/port-scanner/scanner.rs)
- [port-scanner/banner.rs](file://src-tauri/src/port-scanner/banner.rs)
- [port-scanner/services.rs](file://src-tauri/src/port-scanner/services.rs)
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)
- [port-scanner/types.rs](file://src-tauri/src/port-scanner/types.rs)
- [automation/port_scan.rs](file://src-tauri/src/automation/port_scan.rs)
- [automation/scan_completed.rs](file://src-tauri/src/automation/scan_completed.rs)

**Section sources**
- [port-scanner/mod.rs](file://src-tauri/src/port-scanner/mod.rs)

## Performance Considerations
- Concurrency Control: Adjust worker pool size to balance throughput and resource usage.
- Rate Limiting: Implement request pacing to avoid overwhelming targets or triggering defenses.
- Timeout Tuning: Optimize timeouts per protocol to reduce latency while maintaining accuracy.
- Selective Scanning: Focus on high-value ports or specific services to minimize noise.
- Result Caching: Cache repeated lookups for DNS resolution and service signatures.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Permission Errors: Ensure sufficient privileges for raw socket operations (e.g., SYN stealth).
- Firewall Interference: Verify firewall rules allow outbound connections and ICMP if required.
- Slow Scans: Reduce concurrency or limit port ranges; check network latency.
- Inaccurate Fingerprints: Update signature databases and refine matching logic.
- Event Not Emitted: Confirm automation hooks are registered and events are published.

**Section sources**
- [port-scanner/state.rs](file://src-tauri/src/port-scanner/state.rs)
- [automation/scan_completed.rs](file://src-tauri/src/automation/scan_completed.rs)

## Conclusion
Apprecon’s port scanner combines a robust Rust-based engine with an intuitive frontend to deliver comprehensive network reconnaissance. By supporting multiple scan types, banner grabbing, service fingerprinting, and automation integration, it enables effective mapping and analysis of network assets. Proper configuration, ethical practices, and attention to performance and security considerations ensure reliable and responsible scanning.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Scan Types Reference
- TCP Connect: Full handshake; reliable but more detectable.
- SYN Stealth: Half-open scan; faster and stealthier.
- UDP Scanning: Protocol-specific probes; useful for identifying UDP services.

**Section sources**
- [port-scanner/scanner.rs](file://src-tauri/src/port-scanner/scanner.rs)

### Configuration Options
- Port Range: Specify single ports, ranges, or well-known sets.
- Concurrency: Tune parallelism for speed vs. stability.
- Timeouts: Set per-operation timeouts for responsiveness.
- Output Format: Choose structured formats for downstream processing.

**Section sources**
- [pages/port-scanner/constants.ts](file://src/pages/port-scanner/constants.ts)
- [stores/port-scanner.ts](file://src/stores/port-scanner.ts)

### Ethical Scanning Practices
- Obtain explicit authorization before scanning.
- Respect rate limits and organizational policies.
- Avoid disruptive actions during production environments.
- Document scope and retain audit trails.

[No sources needed since this section provides general guidance]