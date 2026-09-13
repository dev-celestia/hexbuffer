use chrono::Utc;
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

use crate::port_scanner::PortScanResult;

use super::execution::run_workflow_task;
use super::host_filter::matches_host_filter;
use super::state::AutomationRuntimeState;
use super::types::{
    config_string, node_effective_type, AutomationNode, AutomationWorkflow, WorkflowContext,
    PORT_SCAN_RESULT_TRIGGER_TYPE,
};

pub fn ingest_port_scan_result(app: &AppHandle, scan_id: &str, result: &PortScanResult) {
    if result.state != "open" {
        return;
    }

    let Some(state) = app.try_state::<AutomationRuntimeState>() else {
        return;
    };

    let matches = {
        let inner = state.0.lock();
        inner
            .workflows
            .iter()
            .filter(|workflow| {
                workflow.enabled
                    && !inner.paused_workflow_ids.contains(&workflow.id)
                    && !inner.running_workflow_ids.contains(&workflow.id)
            })
            .filter_map(|workflow| {
                let trigger = port_scan_result_trigger_node(workflow)?;
                if matches_port_scan_trigger(result, &trigger.data.config) {
                    Some((workflow.clone(), trigger))
                } else {
                    None
                }
            })
            .collect::<Vec<_>>()
    };

    for (workflow, trigger_node) in matches {
        let run_token = Uuid::new_v4().to_string();
        {
            let mut inner = state.0.lock();
            inner
                .active_run_token_by_workflow_id
                .insert(workflow.id.clone(), run_token.clone());
        }

        let context = WorkflowContext {
            trigger_type: Some(PORT_SCAN_RESULT_TRIGGER_TYPE.to_string()),
            trigger_node_id: Some(trigger_node.id.clone()),
            data: json!({
                "triggerType": PORT_SCAN_RESULT_TRIGGER_TYPE,
                "triggerNodeId": trigger_node.id,
                "scanId": scan_id,
                "host": result.host,
                "port": result.port,
                "state": result.state,
                "service": result.service,
                "banner": result.banner,
                "responseTimeMs": result.response_time_ms,
                "timestamp": Utc::now().to_rfc3339(),
            }),
        };
        let app_for_task = app.clone();
        tauri::async_runtime::spawn(async move {
            run_workflow_task(app_for_task, workflow, context, false, run_token).await;
        });
    }
}

fn port_scan_result_trigger_node(workflow: &AutomationWorkflow) -> Option<AutomationNode> {
    workflow
        .nodes
        .iter()
        .find(|node| {
            node_effective_type(node) == PORT_SCAN_RESULT_TRIGGER_TYPE
                && config_string(&node.data.config, "triggerType") == PORT_SCAN_RESULT_TRIGGER_TYPE
        })
        .cloned()
}

fn matches_port_scan_trigger(result: &PortScanResult, config: &Value) -> bool {
    if !matches_host_filter(&result.host, &config_string(config, "host")) {
        return false;
    }

    let port_filter = config_string(config, "port");
    if port_filter.trim().is_empty() {
        return true;
    }

    parse_port_filter(&port_filter)
        .map(|ports| ports.contains(&result.port))
        .unwrap_or(false)
}

fn parse_port_filter(value: &str) -> Result<Vec<u16>, String> {
    let mut ports = Vec::new();
    for token in value
        .split([',', ';', ' ', '\n', '\t'])
        .map(str::trim)
        .filter(|token| !token.is_empty())
    {
        if let Some((start, end)) = token.split_once('-') {
            let start = start
                .trim()
                .parse::<u16>()
                .map_err(|_| format!("Invalid port range: {}", token))?;
            let end = end
                .trim()
                .parse::<u16>()
                .map_err(|_| format!("Invalid port range: {}", token))?;
            if start > end {
                return Err(format!("Invalid port range: {}", token));
            }
            ports.extend(start..=end);
        } else {
            ports.push(
                token
                    .parse::<u16>()
                    .map_err(|_| format!("Invalid port: {}", token))?,
            );
        }
    }
    ports.sort_unstable();
    ports.dedup();
    Ok(ports)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn result(host: &str, port: u16, state: &str) -> PortScanResult {
        PortScanResult {
            host: host.to_string(),
            port,
            state: state.to_string(),
            service: "http".to_string(),
            banner: None,
            response_time_ms: Some(10),
            error: None,
        }
    }

    #[test]
    fn matches_host_and_port_filters() {
        let config = json!({
            "triggerType": PORT_SCAN_RESULT_TRIGGER_TYPE,
            "host": "example.com",
            "port": "80, 443, 8000-8002",
        });

        assert!(matches_port_scan_trigger(
            &result("api.example.com", 8001, "open"),
            &config
        ));
        assert!(!matches_port_scan_trigger(
            &result("other.test", 8001, "open"),
            &config
        ));
        assert!(!matches_port_scan_trigger(
            &result("api.example.com", 9000, "open"),
            &config
        ));
    }

    #[test]
    fn parses_port_ranges() {
        assert_eq!(
            parse_port_filter("80,443,8000-8002").unwrap(),
            vec![80, 443, 8000, 8001, 8002]
        );
    }
}
