pub mod jwt_tools;
pub mod port_scanner_tools;

use rig::completion::ToolDefinition;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentId {
    Orchestrator,
    HttpTraffic,
    Repeater,
    Intruder,
    Notes,
    PortScanner,
    Jwt,
}

impl AgentId {
    pub fn as_str(&self) -> &'static str {
        match self {
            AgentId::Orchestrator => "orchestrator",
            AgentId::HttpTraffic => "http_traffic",
            AgentId::Repeater => "repeater",
            AgentId::Intruder => "intruder",
            AgentId::Notes => "notes",
            AgentId::PortScanner => "port_scanner",
            AgentId::Jwt => "jwt",
        }
    }

    pub fn from_str_loose(s: &str) -> Option<Self> {
        let clean = s.trim().to_lowercase();
        match clean.as_str() {
            "orchestrator" | "main" | "coordinator" | "celestia" | "auto" => {
                Some(AgentId::Orchestrator)
            }
            "http_traffic" | "traffic" | "http" | "proxy" | "intercept" => Some(AgentId::HttpTraffic),
            "repeater" => Some(AgentId::Repeater),
            "intruder" | "fuzzer" | "brute_force" | "invoker" => Some(AgentId::Intruder),
            "notes" => Some(AgentId::Notes),
            "memory" | "context" => Some(AgentId::Orchestrator),
            "port_scanner" | "scanner" | "ports" | "port" => Some(AgentId::PortScanner),
            "jwt" | "token" => Some(AgentId::Jwt),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct AgentSpec {
    pub id: AgentId,
    pub slug: &'static str,
    pub name: &'static str,
    pub role: &'static str,
    pub description: &'static str,
    pub preamble: &'static str,
    pub allowed_tools: &'static [&'static str],
    /// Cap on tool-loop rounds this persona may drive before the run concludes gracefully.
    /// Zero falls back to the loop default.
    pub max_tool_rounds: usize,
    /// Tokens that resolve this agent after an `@`, lowercase and without the `@`.
    pub mentions: &'static [&'static str],
    pub color: &'static str,
    pub icon: &'static str,
}

pub static ALL_AGENTS: &[AgentSpec] = &[
    AgentSpec {
        id: AgentId::Orchestrator,
        slug: "orchestrator",
        name: "Celestia",
        role: "Master Coordinator",
        description: "Coordinates specialized security agents (HTTP Traffic, Repeater, Intruder, Notes, Port Scanner, JWT), owns the persistent memory knowledge base, and plans complex workflows.",
        preamble: "You are Celestia, the Orchestrator Agent in HexBuffer and the lead coordinator of a multi-agent cyber suite. \
Handle general security questions and cross-domain reasoning yourself, and coordinate the specialized capabilities available to you. \
You also own the persistent memory knowledge base: target intelligence, research findings, credential formats, and endpoint quirks saved across testing sessions. Search previous discoveries and save new findings with descriptive titles and tags so they can be retrieved as context in future sessions. Memory is distinct from the user's Notes scratchpad — memory is curated AI-retrieved knowledge, while notes belong to the Notes Agent. \
After any tool call, summarize the action taken and its real outcome in natural language; never reply with raw JSON objects or raw tool result strings. \
For any multi-part objective, call initialize_engagement first to decompose it into a checklist, work exactly one item at a time stating which one, and close \
each item with update_plan_item; never summarize an engagement as complete while items remain open.",
        allowed_tools: &[
            "get_crawl_context",
            "search_memory",
            "save_memory_note",
            "navigate_to_app",
            "list_jobs",
            "get_job_status",
            "cancel_job",
        ],
        max_tool_rounds: 40,
        mentions: &["celestia", "orchestrator", "auto", "memory"],
        color: "#8B5CF6",
        icon: "Crown",
    },
    AgentSpec {
        id: AgentId::HttpTraffic,
        slug: "http_traffic",
        name: "HTTP Traffic Agent",
        role: "Traffic & Intercept",
        description: "Monitors proxy traffic, analyzes HTTP request/response flows, inspects security headers, and controls live interception.",
        preamble: "You are the HTTP Traffic Agent in HexBuffer. You specialize in live proxy traffic monitoring, HTTP request/response inspection, traffic filtering, and intercept control. You help the user audit captured HTTP flows, inspect security headers, find sensitive parameters in proxy history, and toggle proxy interception. Always provide concise, technical security observations on HTTP flows.",
        allowed_tools: &[
            "toggle_intercept",
            "forward_paused_request",
            "drop_paused_request",
            "add_scope_target",
            "remove_scope_target",
            "get_crawl_context",
            "trigger_scan",
            "toggle_browser_crawl",
            "stop_browser_crawl",
            "list_jobs",
            "get_job_status",
            "cancel_job",
        ],
        max_tool_rounds: 24,
        mentions: &["traffic", "http", "http_traffic", "proxy"],
        color: "#3B82F6",
        icon: "Globe",
    },
    AgentSpec {
        id: AgentId::Repeater,
        slug: "repeater",
        name: "Repeater Agent",
        role: "Request Crafting & Replay",
        description: "Normalizes unfinished API endpoints, crafts HTTP requests, sends requests to Repeater, and organizes collections/folders.",
        preamble: "You are the Repeater Agent in HexBuffer. You specialize in manual HTTP request replay, crafting custom HTTP requests, managing collections/folders/endpoints, and normalizing incomplete URLs/paths. \
NORMALIZING UNFINISHED API REQUESTS: When the user pastes a URL, a bare path, or an unfinished API request (e.g. \"api/Lms/Synchronous/leaderboard?businessEventId=96218820\"), YOU normalize it into a complete request yourself: infer the HTTP method from context (default GET when nothing indicates otherwise), split the path and query string, and include any headers/body the user provided or that are clearly implied. To build the send_to_repeater tool call you need: `url` (absolute URL or relative path) and, for a relative path, a `host`. Try to resolve the host from the recent proxy traffic in the [APP CONTEXT]; if a clear match exists, proceed and state the host you chose and why in your summary. If you cannot determine the host (or another required piece such as the method or body is genuinely ambiguous and matters), DO NOT call the tool and do not guess: ask the user ONE short follow-up question listing exactly what is missing, and call the tool only after they answer. \
Always summarize the exact method, URL, and collection updated, including the real outcome from the tool result. Never reply with raw JSON objects or raw tool result strings.",
        allowed_tools: &[
            "send_to_repeater",
            "send_repeater_request",
            "create_collection",
            "create_folder",
            "create_endpoint",
        ],
        max_tool_rounds: 24,
        mentions: &["repeater", "replay"],
        color: "#10B981",
        icon: "ArrowClockwise",
    },
    AgentSpec {
        id: AgentId::Intruder,
        slug: "intruder",
        name: "Intruder Agent",
        role: "Fuzzing & Injection",
        description: "Analyzes injection points in HTTP requests and initiates automated Intruder fuzzing attacks.",
        preamble: "You are the Intruder Agent in HexBuffer. You specialize in web application parameter fuzzing, automated payload injection, brute force testing, and insertion point detection. You configure Intruder attacks (Sniper, Battering Ram, Pitchfork). Never execute high-risk attacks without clear confirmation.",
        allowed_tools: &[
            "start_invoker_attack",
            "stop_invoker_attack",
            "send_to_intruder",
            "list_jobs",
            "get_job_status",
            "cancel_job",
        ],
        max_tool_rounds: 24,
        mentions: &["intruder", "fuzzer", "invoker"],
        color: "#F59E0B",
        icon: "Crosshair",
    },
    AgentSpec {
        id: AgentId::Notes,
        slug: "notes",
        name: "Notes Agent",
        role: "Notes & Scratchpad",
        description: "Creates, reads, searches, and updates the user's notes in the Notes page — the working scratchpad surface for drafts and observations.",
        preamble: "You are the Notes Agent in HexBuffer. You specialize in the user's notes (scratchpads) on the Notes page: drafting new notes, reading and searching existing ones, and updating note content. Notes are the user's own working surface and are separate from the persistent memory knowledge base — never treat a note as curated memory, and use the memory tools only if the user explicitly asks to remember something across sessions.",
        allowed_tools: &["write_note", "get_notes"],
        max_tool_rounds: 24,
        mentions: &["notes"],
        color: "#A855F7",
        icon: "Notebook",
    },
    AgentSpec {
        id: AgentId::PortScanner,
        slug: "port_scanner",
        name: "Port Scanner Agent",
        role: "Port & Network Recon",
        description: "Discovers open TCP ports, identifies running network services and banners, and maps target attack surfaces.",
        preamble: "You are the Port Scanner Agent in HexBuffer. You specialize in network reconnaissance, TCP port discovery, service fingerprinting, and attack surface mapping. You analyze open ports, service banners, and recommend high-priority ports (e.g. web, database, management consoles) for web application penetration testing.",
        allowed_tools: &[port_scanner_tools::TRIGGER_PORT_SCAN_TOOL],
        max_tool_rounds: 24,
        mentions: &["scanner", "port_scanner", "port", "ports"],
        color: "#06B6D4",
        icon: "Radar",
    },
    AgentSpec {
        id: AgentId::Jwt,
        slug: "jwt",
        name: "JWT Agent",
        role: "JWT Security Analysis",
        description: "Decodes JWT tokens, audits expiration and security claims, tests for algorithm 'none' and forgery vulnerabilities.",
        preamble: "You are the JWT Agent in HexBuffer. You specialize in JSON Web Token analysis, decoding, cryptographic validation, and vulnerability auditing. You inspect tokens for critical weaknesses like the 'none' algorithm flaw (CVE-2015-9235), expired expiration timestamps, sensitive data exposure, and generate tampered tokens for authorized testing.",
        allowed_tools: &[
            jwt_tools::DECODE_JWT_TOOL,
            jwt_tools::CHECK_JWT_VULNS_TOOL,
            jwt_tools::TAMPER_JWT_TOOL,
        ],
        max_tool_rounds: 24,
        mentions: &["jwt", "token"],
        color: "#F43F5E",
        icon: "Key",
    },
];

pub fn get_agent_spec(id: AgentId) -> &'static AgentSpec {
    ALL_AGENTS
        .iter()
        .find(|a| a.id == id)
        .unwrap_or(&ALL_AGENTS[0])
}

/// Resolves an `@mention` in the prompt to an agent. Matches whole `@token`s against
/// each agent's `mentions` list, so `@celestia` and `@traffic` resolve even though
/// neither is the agent's slug. Trailing punctuation is tolerated.
pub fn resolve_agent_by_mention_or_slug(text: &str) -> Option<&'static AgentSpec> {
    let lower = text.to_lowercase();
    for raw in lower.split_whitespace() {
        let Some(token) = raw.strip_prefix('@') else {
            continue;
        };
        let token = token.trim_end_matches(|c: char| !c.is_alphanumeric() && c != '_');
        if token.is_empty() {
            continue;
        }
        if let Some(agent) = ALL_AGENTS.iter().find(|a| a.mentions.contains(&token)) {
            return Some(agent);
        }
    }
    None
}

/// Session-wide tools every persona shares, regardless of specialty. The engagement
/// plan is per-session state, not a per-agent capability: the conclusion guard assumes
/// any routed agent can read the plan and advance an item. The job and spool readers
/// are read-only polls every agent needs after launching a job or receiving a large
/// result; their mutating counterpart (cancel_job) stays with its owning persona.
const SHARED_SESSION_TOOLS: &[&str] = &[
    super::engagement::INITIALIZE_ENGAGEMENT_TOOL,
    super::engagement::GET_ENGAGEMENT_PLAN_TOOL,
    super::engagement::UPDATE_PLAN_ITEM_TOOL,
    "list_jobs",
    "get_job_status",
    "read_tool_output",
];

pub fn filter_tools_for_agent(
    agent_spec: &AgentSpec,
    all_tools: &[ToolDefinition],
) -> Vec<ToolDefinition> {
    all_tools
        .iter()
        .filter(|tool| {
            agent_spec.allowed_tools.contains(&tool.name.as_str())
                || SHARED_SESSION_TOOLS.contains(&tool.name.as_str())
        })
        .cloned()
        .collect()
}