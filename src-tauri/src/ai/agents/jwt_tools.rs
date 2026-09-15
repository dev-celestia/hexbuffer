use base64::{engine::general_purpose, Engine};
use rig::completion::ToolDefinition;
use serde_json::{json, Value};

// ponytail: Lean native JWT tools without external JWT crates. Base64url + serde_json does it all.

pub const DECODE_JWT_TOOL: &str = "decode_jwt";
pub const CHECK_JWT_VULNS_TOOL: &str = "check_jwt_vulnerabilities";
pub const TAMPER_JWT_TOOL: &str = "generate_tampered_jwt";

pub fn jwt_tool_definitions() -> Vec<ToolDefinition> {
    vec![
        ToolDefinition {
            name: DECODE_JWT_TOOL.to_string(),
            description: "Decode a JWT token into its header and payload JSON structures and display signature status.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "token": {
                        "type": "string",
                        "description": "The raw JWT token string (header.payload.signature)"
                    }
                },
                "required": ["token"]
            }),
        },
        ToolDefinition {
            name: CHECK_JWT_VULNS_TOOL.to_string(),
            description: "Analyze a JWT token for common security vulnerabilities (e.g. 'none' algorithm, expiration flaws, sensitive exposed claims, algorithm confusion).".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "token": {
                        "type": "string",
                        "description": "The raw JWT token string to audit"
                    }
                },
                "required": ["token"]
            }),
        },
        ToolDefinition {
            name: TAMPER_JWT_TOOL.to_string(),
            description: "Forge or tamper with a JWT token by modifying claims or switching the algorithm (e.g. set alg to 'none' or 'HS256' with custom payload) for security testing.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "token": {
                        "type": "string",
                        "description": "Base JWT token to tamper"
                    },
                    "modify_payload": {
                        "type": "object",
                        "description": "JSON key-value pairs to override or inject into the payload (e.g. {\"admin\": true, \"role\": \"superadmin\"})"
                    },
                    "set_alg_none": {
                        "type": "boolean",
                        "description": "If true, set algorithm header to 'none' and strip signature (CVE-2015-9235 test)"
                    }
                },
                "required": ["token"]
            }),
        },
    ]
}

fn decode_b64url(s: &str) -> Result<Vec<u8>, String> {
    // ponytail: normalize padding manually if needed
    let mut normalized = s.replace('-', "+").replace('_', "/");
    while normalized.len() % 4 != 0 {
        normalized.push('=');
    }
    general_purpose::STANDARD
        .decode(&normalized)
        .map_err(|e| format!("Base64url decode error: {e}"))
}

fn encode_b64url(bytes: &[u8]) -> String {
    general_purpose::URL_SAFE_NO_PAD.encode(bytes)
}

pub fn execute_decode_jwt(args: &Value) -> String {
    let token = args.get("token").and_then(|v| v.as_str()).unwrap_or("").trim();
    if token.is_empty() {
        return "Error: Empty JWT token provided.".to_string();
    }

    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() < 2 {
        return "Error: Invalid JWT format. Expected at least header.payload[.signature]".to_string();
    }

    let header_raw = match decode_b64url(parts[0]) {
        Ok(bytes) => String::from_utf8_lossy(&bytes).to_string(),
        Err(e) => return format!("Failed to decode JWT header: {e}"),
    };

    let payload_raw = match decode_b64url(parts[1]) {
        Ok(bytes) => String::from_utf8_lossy(&bytes).to_string(),
        Err(e) => return format!("Failed to decode JWT payload: {e}"),
    };

    let header_json: Value = serde_json::from_str(&header_raw).unwrap_or(Value::String(header_raw));
    let payload_json: Value = serde_json::from_str(&payload_raw).unwrap_or(Value::String(payload_raw));

    let signature = parts.get(2).copied().unwrap_or("");

    json!({
        "status": "success",
        "header": header_json,
        "payload": payload_json,
        "has_signature": !signature.is_empty(),
        "signature_length": signature.len()
    }).to_string()
}

pub fn execute_check_jwt_vulns(args: &Value) -> String {
    let token = args.get("token").and_then(|v| v.as_str()).unwrap_or("").trim();
    if token.is_empty() {
        return "Error: Empty JWT token provided.".to_string();
    }

    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() < 2 {
        return "Error: Invalid JWT format.".to_string();
    }

    let header_bytes = match decode_b64url(parts[0]) {
        Ok(b) => b,
        Err(e) => return format!("Failed to decode header: {e}"),
    };
    let payload_bytes = match decode_b64url(parts[1]) {
        Ok(b) => b,
        Err(e) => return format!("Failed to decode payload: {e}"),
    };

    let header: Value = match serde_json::from_slice(&header_bytes) {
        Ok(v) => v,
        Err(_) => return "Failed to parse JWT header as JSON".to_string(),
    };
    let payload: Value = match serde_json::from_slice(&payload_bytes) {
        Ok(v) => v,
        Err(_) => return "Failed to parse JWT payload as JSON".to_string(),
    };

    let mut findings: Vec<Value> = Vec::new();

    // 1. None algorithm check
    if let Some(alg) = header.get("alg").and_then(|v| v.as_str()) {
        if alg.eq_ignore_ascii_case("none") {
            findings.push(json!({
                "severity": "CRITICAL",
                "title": "Algorithm 'none' accepted",
                "description": "The token explicitly declares algorithm 'none', indicating signature verification is bypassed."
            }));
        }
    } else {
        findings.push(json!({
            "severity": "HIGH",
            "title": "Missing 'alg' parameter in header",
            "description": "JWT header lacks an algorithm field."
        }));
    }

    // 2. Expiration check
    if let Some(exp) = payload.get("exp").and_then(|v| v.as_i64()) {
        let now = chrono::Utc::now().timestamp();
        if exp < now {
            findings.push(json!({
                "severity": "MEDIUM",
                "title": "Token expired",
                "description": format!("Token expired at timestamp {} (current time: {})", exp, now)
            }));
        }
    } else {
        findings.push(json!({
            "severity": "LOW",
            "title": "Missing expiration ('exp') claim",
            "description": "The token does not define an expiration timestamp, making it valid indefinitely if not revoked."
        }));
    }

    // 3. Sensitive data exposure in unencrypted payload
    let sensitive_keys = ["password", "secret", "private_key", "ssn", "credit_card", "pin"];
    if let Some(obj) = payload.as_object() {
        for key in obj.keys() {
            let lower = key.to_lowercase();
            if sensitive_keys.iter().any(|&s| lower.contains(s)) {
                findings.push(json!({
                    "severity": "HIGH",
                    "title": format!("Sensitive claim '{}' in plaintext payload", key),
                    "description": "JWT payloads are base64-encoded and not encrypted. Sensitive secrets should not be stored in tokens."
                }));
            }
        }
    }

    // 4. Missing signature
    if parts.len() < 3 || parts[2].is_empty() {
        findings.push(json!({
            "severity": "CRITICAL",
            "title": "Unsigned token",
            "description": "The token contains no signature block."
        }));
    }

    json!({
        "status": "success",
        "findings_count": findings.len(),
        "findings": findings,
        "algorithm": header.get("alg"),
        "subject": payload.get("sub"),
    }).to_string()
}

pub fn execute_tamper_jwt(args: &Value) -> String {
    let token = args.get("token").and_then(|v| v.as_str()).unwrap_or("").trim();
    if token.is_empty() {
        return "Error: Empty JWT token provided.".to_string();
    }

    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() < 2 {
        return "Error: Invalid JWT format.".to_string();
    }

    let header_bytes = match decode_b64url(parts[0]) {
        Ok(b) => b,
        Err(e) => return format!("Failed to decode header: {e}"),
    };
    let payload_bytes = match decode_b64url(parts[1]) {
        Ok(b) => b,
        Err(e) => return format!("Failed to decode payload: {e}"),
    };

    let mut header: Value = match serde_json::from_slice(&header_bytes) {
        Ok(v) => v,
        Err(_) => return "Failed to parse JWT header JSON".to_string(),
    };
    let mut payload: Value = match serde_json::from_slice(&payload_bytes) {
        Ok(v) => v,
        Err(_) => return "Failed to parse JWT payload JSON".to_string(),
    };

    // Apply algorithm 'none'
    let set_none = args.get("set_alg_none").and_then(|v| v.as_bool()).unwrap_or(false);
    if set_none {
        if let Some(obj) = header.as_object_mut() {
            obj.insert("alg".to_string(), json!("none"));
        }
    }

    // Apply payload overrides
    if let Some(modify_obj) = args.get("modify_payload").and_then(|v| v.as_object()) {
        if let Some(payload_obj) = payload.as_object_mut() {
            for (k, v) in modify_obj {
                payload_obj.insert(k.clone(), v.clone());
            }
        }
    }

    let new_header_b64 = encode_b64url(&serde_json::to_vec(&header).unwrap_or_default());
    let new_payload_b64 = encode_b64url(&serde_json::to_vec(&payload).unwrap_or_default());

    let tampered_token = if set_none {
        format!("{new_header_b64}.{new_payload_b64}.")
    } else {
        let original_sig = parts.get(2).copied().unwrap_or("");
        format!("{new_header_b64}.{new_payload_b64}.{original_sig}")
    };

    json!({
        "status": "success",
        "tampered_token": tampered_token,
        "modified_header": header,
        "modified_payload": payload,
        "signature_stripped": set_none
    }).to_string()
}
