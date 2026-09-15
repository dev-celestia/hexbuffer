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
            "orchestrator" | "main" | "coordinator" => Some(AgentId::Orchestrator),
            "http_traffic" | "traffic" | "http" | "proxy" | "intercept" => Some(AgentId::HttpTraffic),
            "repeater" => Some(AgentId::Repeater),
            "intruder" | "fuzzer" | "brute_force" | "invoker" => Some(AgentId::Intruder),
            "notes" | "memory" | "context" => Some(AgentId::Notes),
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
    pub color: &'static str,
    pub icon: &'static str,
}

pub static ALL_AGENTS: &[AgentSpec] = &[
    AgentSpec {
        id: AgentId::Orchestrator,
        slug: "orchestrator",
        name: "Orchestrator Agent",
        role: "Master Coordinator",
        description: "Coordinates specialized security agents (HTTP Traffic, Repeater, Intruder, Notes, Port Scanner, JWT) and plans complex workflows.",
        preamble: "You are the Orchestrator Agent in HexBuffer, the lead security coordinator of a multi-agent cyber suite. \
You work alongside specialized agents: \
1. HTTP Traffic Agent: Proxy logs, traffic inspection, and interception. \
2. Repeater Agent: Request crafting, replay, and collection management. \
3. Intruder Agent: Injection point detection, payload marking ($target$), and fuzzing. \
4. Notes Agent: Target intelligence, persistent memory notes, and documentation. \
5. Port Scanner Agent: Port discovery, network reconnaissance, and service detection. \
6. JWT Agent: JSON Web Token decoding, signature analysis, and vulnerability checking. \
\
When a user asks a domain-specific question or requests action, state which specialist handles it and coordinate the response. For general security inquiries, provide authoritative guidance directly.",
        allowed_tools: &[
            "send_to_repeater",
            "create_collection",
            "create_folder",
            "create_endpoint",
            "suggest_invoker_markers",
            "start_invoker_attack",
            "toggle_intercept",
            "get_crawl_context",
            "search_memory",
            "save_memory_note",
            port_scanner_tools::TRIGGER_PORT_SCAN_TOOL,
            jwt_tools::DECODE_JWT_TOOL,
            jwt_tools::CHECK_JWT_VULNS_TOOL,
            jwt_tools::TAMPER_JWT_TOOL,
        ],
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
        allowed_tools: &["toggle_intercept", "get_crawl_context"],
        color: "#3B82F6",
        icon: "Globe",
    },
    AgentSpec {
        id: AgentId::Repeater,
        slug: "repeater",
        name: "Repeater Agent",
        role: "Request Crafting & Replay",
        description: "Normalizes unfinished API endpoints, crafts HTTP requests, sends requests to Repeater, and organizes collections/folders.",
        preamble: "You are the Repeater Agent in HexBuffer. You specialize in manual HTTP request replay, crafting custom HTTP requests, managing collections/folders/endpoints, and normalizing incomplete URLs/paths. When the user pastes an API endpoint or request snippet, normalize it (infer method, host, headers) and send it to Repeater. Always summarize the exact method, URL, and collection updated.",
        allowed_tools: &[
            "send_to_repeater",
            "create_collection",
            "create_folder",
            "create_endpoint",
        ],
        color: "#10B981",
        icon: "ArrowClockwise",
    },
    AgentSpec {
        id: AgentId::Intruder,
        slug: "intruder",
        name: "Intruder Agent",
        role: "Fuzzing & Injection",
        description: "Analyzes injection points in HTTP requests, suggests $target$ payload markers, and initiates automated Intruder fuzzing attacks.",
        preamble: "You are the Intruder Agent in HexBuffer. You specialize in web application parameter fuzzing, automated payload injection, brute force testing, and insertion point detection. You analyze raw requests to suggest injection markers ($target$) and configure Intruder attacks (Sniper, Battering Ram, Pitchfork). Never execute high-risk attacks without clear confirmation.",
        allowed_tools: &["suggest_invoker_markers", "start_invoker_attack"],
        color: "#F59E0B",
        icon: "Crosshair",
    },
    AgentSpec {
        id: AgentId::Notes,
        slug: "notes",
        name: "Notes Agent",
        role: "Knowledge Base & Notes",
        description: "Stores and retrieves target findings, credentials, endpoint behaviors, and notes across security testing sessions.",
        preamble: "You are the Notes Agent in HexBuffer. You specialize in target intelligence documentation, research notes, and persistent memory. You help security researchers search previous discoveries, credential formats, endpoint quirks, and save new findings with descriptive titles and tags for future testing sessions.",
        allowed_tools: &["search_memory", "save_memory_note"],
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

pub fn resolve_agent_by_mention_or_slug(text: &str) -> Option<&'static AgentSpec> {
    let lower = text.to_lowercase();
    for agent in ALL_AGENTS {
        let mention = format!("@{}", agent.slug);
        if lower.contains(&mention) {
            return Some(agent);
        }
    }
    None
}

pub fn filter_tools_for_agent(agent_spec: &AgentSpec, all_tools: &[ToolDefinition]) -> Vec<ToolDefinition> {
    all_tools
        .iter()
        .filter(|tool| agent_spec.allowed_tools.contains(&tool.name.as_str()))
        .cloned()
        .collect()
}
