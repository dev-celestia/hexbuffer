use super::agents::{get_agent_spec, resolve_agent_by_mention_or_slug, AgentId, AgentSpec};
use super::types::AiConfig;
use rig::completion::{AssistantContent, CompletionModel as CompletionModelTrait};
use serde::Deserialize;
use std::time::Duration;

#[derive(Debug, Clone)]
pub enum RoutingDecision {
    /// An actionable task that matches a specialist agent and its available tools.
    ExecuteAction {
        agent: &'static AgentSpec,
        requires_proxy_context: bool,
    },
    /// An informational cybersecurity question or reasoning prompt handled by Celestia.
    InformationalQA {
        agent: &'static AgentSpec,
        requires_proxy_context: bool,
    },
    /// An actionable task requested by the user for which HexBuffer has no automated tool.
    /// The chat must end immediately without invoking the LLM.
    UnsupportedAction {
        action_name: String,
        explanation: String,
    },
}

#[derive(Debug, Deserialize)]
struct AiIntentClassification {
    agent: String,
    is_supported: bool,
    unsupported_reason: Option<String>,
    #[serde(default)]
    requires_proxy_context: bool,
}

const CLASSIFIER_PREAMBLE: &str = r#"You are the HexBuffer Security Assistant Intent Classifier and Tool Gate.
HexBuffer is a desktop web penetration testing tool with 7 specialist agents:
- repeater: Replay HTTP requests, edit headers/params, manage collections/folders/endpoints.
- http_traffic: Proxy traffic inspection, toggle live traffic intercept, crawl context.
- intruder: Parameter fuzzing, payload injection, automated brute force testing.
- jwt: JSON Web Token decoding, claim validation, signature tampering, CVE-2015-9235 checking.
- port_scanner: TCP port reconnaissance, open ports discovery, service banner checking.
- notes: Working scratchpad notes (create, view, search notes).
- orchestrator: General security advice, vulnerability explanations, multi-step planning, target memory notes.

CRITICAL RULES:
1. If the user prompt asks HexBuffer to EXECUTE an unsupported tool, exploit, or action (e.g. sqlmap, metasploit, hashcat, john the ripper, aircrack/wifi cracking, apk/binary decompilation, layer 2 packet sniffing, cloud takeover), set "is_supported": false and state the reason in "unsupported_reason".
2. Conceptual/educational/advisory questions about unsupported tools (e.g. "how does sqlmap work?", "explain wifi 4-way handshake") ARE supported by orchestrator (set "is_supported": true, "agent": "orchestrator").
3. "requires_proxy_context" is true ONLY if the user specifically asks to inspect, analyze, or replay captured proxy traffic / tree / history.
4. Respond with ONLY a raw JSON object (no markdown, no backticks, no other text):
{"agent": "repeater"|"http_traffic"|"intruder"|"jwt"|"port_scanner"|"notes"|"orchestrator", "is_supported": true|false, "unsupported_reason": "string"|null, "requires_proxy_context": true|false}"#;

/// Checks if text looks like a raw HTTP request line
fn contains_raw_http_request(text: &str) -> bool {
    let trimmed = text.trim();
    let prefixes = [
        "GET ", "POST ", "PUT ", "DELETE ", "PATCH ", "HEAD ", "OPTIONS ", "CONNECT ",
    ];
    prefixes.iter().any(|prefix| trimmed.starts_with(prefix))
        || text.lines().any(|line| {
            prefixes
                .iter()
                .any(|prefix| line.trim_start().starts_with(prefix))
                && (line.contains("HTTP/1.") || line.contains("HTTP/2"))
        })
}

/// Checks if a prompt asks about recent proxy traffic or logs
fn mentions_proxy_traffic(lower: &str) -> bool {
    lower.contains("traffic")
        || lower.contains("history")
        || lower.contains("captured")
        || lower.contains("proxy")
        || lower.contains("logs")
        || lower.contains("request tree")
        || lower.contains("tree")
        || lower.contains("recent request")
}

/// Extracts a JSON object from potential markdown code fences or raw string
fn extract_json_str(raw: &str) -> &str {
    let trimmed = raw.trim();
    if let Some(start) = trimmed.find('{') {
        if let Some(end) = trimmed.rfind('}') {
            if end > start {
                return &trimmed[start..=end];
            }
        }
    }
    trimmed
}

/// Fast heuristic router for instant matching without an LLM call.
/// Returns Some(decision) if unambiguous, or None to fall through to the AI classifier.
fn fast_path_route(prompt: &str, explicit_target: Option<&str>) -> Option<RoutingDecision> {
    // 1. Explicit agent targeting
    if let Some(target) = explicit_target {
        if let Some(agent_id) = AgentId::from_str_loose(target) {
            let spec = get_agent_spec(agent_id);
            let requires_proxy = match agent_id {
                AgentId::Repeater | AgentId::HttpTraffic => true,
                AgentId::Orchestrator => mentions_proxy_traffic(&prompt.to_lowercase()),
                _ => false,
            };
            return Some(RoutingDecision::ExecuteAction {
                agent: spec,
                requires_proxy_context: requires_proxy,
            });
        }
    }

    // 2. Prompt @mention targeting (e.g. @repeater, @jwt, @traffic)
    if let Some(spec) = resolve_agent_by_mention_or_slug(prompt) {
        let requires_proxy = match spec.id {
            AgentId::Repeater | AgentId::HttpTraffic => true,
            AgentId::Orchestrator => mentions_proxy_traffic(&prompt.to_lowercase()),
            _ => false,
        };
        return Some(RoutingDecision::ExecuteAction {
            agent: spec,
            requires_proxy_context: requires_proxy,
        });
    }

    // 3. Unambiguous JWT paste
    if super::agents::jwt_tools::text_contains_jwt(prompt) {
        return Some(RoutingDecision::ExecuteAction {
            agent: get_agent_spec(AgentId::Jwt),
            requires_proxy_context: false,
        });
    }

    // 4. Raw HTTP request paste
    if contains_raw_http_request(prompt) {
        return Some(RoutingDecision::ExecuteAction {
            agent: get_agent_spec(AgentId::Repeater),
            requires_proxy_context: true,
        });
    }

    None
}

/// Classifies intent using the lightweight AI classifier.
async fn classify_with_ai(prompt: &str, config: &AiConfig) -> Result<RoutingDecision, String> {
    let model = super::providers::create_completion_model(config).map_err(|e| e.to_string())?;

    let request = model
        .completion_request(prompt.to_string())
        .preamble(CLASSIFIER_PREAMBLE.to_string())
        .max_tokens(120)
        .temperature(0.0)
        .build();

    let response = tokio::time::timeout(Duration::from_secs(6), model.completion(request))
        .await
        .map_err(|_| "Intent classifier timed out".to_string())?
        .map_err(|e| e.to_string())?;

    let mut text = String::new();
    for item in response.choice {
        if let AssistantContent::Text(t) = item {
            text.push_str(&t.text);
        }
    }

    let json_str = extract_json_str(&text);
    let classification: AiIntentClassification = serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse intent classifier JSON: {e} ({text})"))?;

    if !classification.is_supported {
        return Ok(RoutingDecision::UnsupportedAction {
            action_name: prompt.chars().take(50).collect::<String>(),
            explanation: classification.unsupported_reason.unwrap_or_else(|| {
                "This operational action is not supported by HexBuffer.".to_string()
            }),
        });
    }

    let agent_id = AgentId::from_str_loose(&classification.agent).unwrap_or(AgentId::Orchestrator);
    let spec = get_agent_spec(agent_id);

    if agent_id == AgentId::Orchestrator {
        Ok(RoutingDecision::InformationalQA {
            agent: spec,
            requires_proxy_context: classification.requires_proxy_context,
        })
    } else {
        Ok(RoutingDecision::ExecuteAction {
            agent: spec,
            requires_proxy_context: classification.requires_proxy_context,
        })
    }
}

/// Fallback heuristic router if AI classifier fails or times out
fn fallback_heuristic_route(prompt: &str) -> RoutingDecision {
    let lower = prompt.to_lowercase();
    let trimmed = lower.trim();

    // Both halves must hold: the prompt names an external attack tool *and* asks to run it.
    // Naming one ("what does hashcat do?") is a question, not a request to invoke it.
    let names_external_tool = lower.contains("sqlmap")
        || lower.contains("hashcat")
        || lower.contains("john the ripper")
        || lower.contains("metasploit")
        || lower.contains("aircrack")
        || lower.contains("wireshark");
    let is_imperative = trimmed.starts_with("run ")
        || trimmed.starts_with("execute ")
        || trimmed.starts_with("crack ")
        || trimmed.starts_with("exploit ");

    if names_external_tool && is_imperative {
        return RoutingDecision::UnsupportedAction {
            action_name: "External Attack Tool".to_string(),
            explanation: "HexBuffer does not embed external CLI tools (SQLMap, Metasploit, Hashcat, Aircrack). Use HexBuffer's built-in web auditing capabilities.".to_string(),
        };
    }

    if lower.contains("jwt") || lower.contains("token") {
        return RoutingDecision::ExecuteAction {
            agent: get_agent_spec(AgentId::Jwt),
            requires_proxy_context: false,
        };
    }
    if lower.contains("repeater")
        || lower.contains("replay")
        || lower.contains("collection")
        || lower.contains("endpoint")
        || lower.contains("craft")
        || lower.contains("resend")
    {
        return RoutingDecision::ExecuteAction {
            agent: get_agent_spec(AgentId::Repeater),
            requires_proxy_context: true,
        };
    }
    if lower.contains("intercept")
        || lower.contains("traffic")
        || lower.contains("forward")
        || lower.contains("drop")
        || lower.contains("scope")
        || lower.contains("target")
        || lower.contains("crawl")
    {
        return RoutingDecision::ExecuteAction {
            agent: get_agent_spec(AgentId::HttpTraffic),
            requires_proxy_context: true,
        };
    }
    if lower.contains("port") || lower.contains("scanner") || lower.contains("open ports") {
        return RoutingDecision::ExecuteAction {
            agent: get_agent_spec(AgentId::PortScanner),
            requires_proxy_context: false,
        };
    }
    if lower.contains("fuzz")
        || lower.contains("intruder")
        || lower.contains("invoker")
        || lower.contains("brute force")
        || lower.contains("attack")
    {
        return RoutingDecision::ExecuteAction {
            agent: get_agent_spec(AgentId::Intruder),
            requires_proxy_context: false,
        };
    }
    if lower.contains("note") || lower.contains("scratchpad") {
        return RoutingDecision::ExecuteAction {
            agent: get_agent_spec(AgentId::Notes),
            requires_proxy_context: false,
        };
    }
    if lower.contains("navigate")
        || lower.contains("open window")
        || lower.contains("switch to")
        || lower.contains("go to")
    {
        return RoutingDecision::ExecuteAction {
            agent: get_agent_spec(AgentId::Orchestrator),
            requires_proxy_context: false,
        };
    }

    RoutingDecision::InformationalQA {
        agent: get_agent_spec(AgentId::Orchestrator),
        requires_proxy_context: mentions_proxy_traffic(&lower),
    }
}

/// Routes a user's prompt to the appropriate agent using a hybrid two-tier approach:
/// Tier 1: Fast deterministic bypass for explicit @mentions, raw JWTs, and raw HTTP lines (0ms, 0 tokens).
/// Tier 2: Micro-LLM intent classifier for nuanced natural language (zero context overhead, bounded JSON).
/// Fallback: Heuristic safety net if the classifier provider fails.
pub async fn route_prompt(
    prompt: &str,
    explicit_target: Option<&str>,
    config: &AiConfig,
) -> RoutingDecision {
    // 1. Check instant fast path (0ms, 0 tokens)
    if let Some(decision) = fast_path_route(prompt, explicit_target) {
        return decision;
    }

    // 2. Classify with fast AI micro-prompt
    match classify_with_ai(prompt, config).await {
        Ok(decision) => decision,
        Err(error) => {
            eprintln!("[router] AI classifier failed ({error}); falling back to heuristic route");
            fallback_heuristic_route(prompt)
        }
    }
}
