use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use rig::completion::{CompletionModel, CompletionRequest, Message, ModelChoice, ToolDefinition};
use rig::tool::Tool;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};

use super::types::AiChatAction;

const PREAMBLE: &str = "You are HexBuffer Agent, an advanced security research & web penetration \
testing reasoning engine embedded in the HexBuffer desktop app. You can discuss security topics \
conversationally and execute application capabilities through the provided tools (Repeater, \
Invoker, proxy interception, browser scans, documents, crawl context). Call a tool whenever the \
user asks for an action the tools cover; otherwise answer directly. After calling any tool, \
ALWAYS summarize the action taken clearly and concisely in natural language, including the real \
outcome from the tool result. Never reply with raw JSON objects or raw tool result strings.";

const MAX_TOOL_ROUNDS: usize = 8;
const TOOL_RESULT_TIMEOUT_SECS: u64 = 120;

/// Native read-only tool: returns crawl session data straight from the app database.
const CRAWL_CONTEXT_TOOL: &str = "get_crawl_context";

#[derive(Debug)]
pub struct ToolExecutionOutcome {
    pub success: bool,
    pub message: String,
}

type PendingResultSender = tokio::sync::oneshot::Sender<ToolExecutionOutcome>;
type PendingResultMap = HashMap<String, PendingResultSender>;

static PENDING_TOOL_RESULTS: OnceLock<Mutex<PendingResultMap>> = OnceLock::new();
static CALL_COUNTER: AtomicU64 = AtomicU64::new(0);

fn pending_map() -> &'static Mutex<PendingResultMap> {
    PENDING_TOOL_RESULTS.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Completes a pending frontend tool execution. Called from the `resolve_ai_tool_result`
/// Tauri command once the frontend executor finished (or failed) running the tool.
/// Returns true when a waiting tool call was matched.
pub fn resolve_tool_result(id: &str, success: bool, message: String) -> bool {
    let sender = pending_map()
        .lock()
        .ok()
        .and_then(|mut pending| pending.remove(id));
    match sender {
        Some(sender) => sender
            .send(ToolExecutionOutcome { success, message })
            .is_ok(),
        None => false,
    }
}

fn next_call_id() -> String {
    format!(
        "call-{}-{}",
        chrono::Utc::now().timestamp_millis(),
        CALL_COUNTER.fetch_add(1, Ordering::Relaxed)
    )
}

async fn frontend_tool_definitions() -> Vec<ToolDefinition> {
    vec![
        crate::tools::SendToRepeaterTool
            .definition(String::new())
            .await,
        crate::tools::CreateCollectionTool
            .definition(String::new())
            .await,
        crate::tools::CreateFolderTool
            .definition(String::new())
            .await,
        crate::tools::CreateEndpointTool
            .definition(String::new())
            .await,
        crate::tools::StartInvokerAttackTool
            .definition(String::new())
            .await,
        crate::tools::ToggleInterceptTool
            .definition(String::new())
            .await,
        crate::tools::TriggerScanTool.definition(String::new()).await,
        crate::tools::WriteDocumentTool
            .definition(String::new())
            .await,
    ]
}

fn crawl_context_definition() -> ToolDefinition {
    ToolDefinition {
        name: CRAWL_CONTEXT_TOOL.to_string(),
        description: "Fetch the latest AI browser crawl session context: crawled pages, security \
        insights, activity logs and recent proxy traffic. Use this after a crawl completes to \
        analyze the full results."
            .to_string(),
        parameters: json!({
            "type": "object",
            "properties": {},
            "required": []
        }),
    }
}

async fn tool_definitions() -> Vec<ToolDefinition> {
    let mut definitions = frontend_tool_definitions().await;
    definitions.push(crawl_context_definition());
    definitions
}

fn execute_crawl_context(app: &AppHandle) -> String {
    let state = app.state::<crate::HistoryBridge>();
    match super::chat::build_crawl_context_value(&state) {
        Ok(value) => serde_json::to_string(&value).unwrap_or_else(|error| {
            format!("Failed to serialize crawl context: {error}")
        }),
        Err(error) => format!("Failed to load crawl context: {error}"),
    }
}

async fn execute_tool_call(
    app: &AppHandle,
    policy: &hexbuffer_ai::SecurityApprovalPolicy,
    tool_name: &str,
    args: Value,
    actions: &mut Vec<AiChatAction>,
) -> String {
    let created_at = chrono::Utc::now().to_rfc3339();

    if let Err(denial) = policy.evaluate_tool_call(tool_name) {
        actions.push(AiChatAction {
            action: tool_name.to_string(),
            payload: args,
            result: Some(denial.clone()),
            created_at,
        });
        return denial;
    }

    if tool_name == CRAWL_CONTEXT_TOOL {
        let result = execute_crawl_context(app);
        actions.push(AiChatAction {
            action: tool_name.to_string(),
            payload: json!({}),
            result: Some(result.clone()),
            created_at,
        });
        return result;
    }

    // Frontend-executed tool: register a waiter, emit the call event, and block until the
    // frontend executor reports the real outcome (or the timeout elapses).
    let call_id = next_call_id();
    let (sender, receiver) = tokio::sync::oneshot::channel::<ToolExecutionOutcome>();
    pending_map()
        .lock()
        .expect("tool result map poisoned")
        .insert(call_id.clone(), sender);

    let emitted = app.emit(
        "ai:execute-tool",
        json!({
            "id": call_id,
            "tool_name": tool_name,
            "arguments": args.clone(),
        }),
    );

    let outcome = if emitted.is_err() {
        let _ = pending_map()
            .lock()
            .expect("tool result map poisoned")
            .remove(&call_id);
        ToolExecutionOutcome {
            success: false,
            message: "Failed to deliver the tool call to the app interface.".to_string(),
        }
    } else {
        match tokio::time::timeout(Duration::from_secs(TOOL_RESULT_TIMEOUT_SECS), receiver).await {
            Ok(Ok(outcome)) => outcome,
            Ok(Err(_)) => ToolExecutionOutcome {
                success: false,
                message: "Tool execution was cancelled before completing.".to_string(),
            },
            Err(_) => {
                let _ = pending_map()
                    .lock()
                    .expect("tool result map poisoned")
                    .remove(&call_id);
                ToolExecutionOutcome {
                    success: false,
                    message: format!(
                        "Tool execution timed out after {TOOL_RESULT_TIMEOUT_SECS} seconds."
                    ),
                }
            }
        }
    };

    let result_text = if outcome.success {
        outcome.message.clone()
    } else {
        format!("Tool execution failed: {}", outcome.message)
    };

    actions.push(AiChatAction {
        action: tool_name.to_string(),
        payload: args,
        result: Some(result_text.clone()),
        created_at,
    });
    result_text
}

pub struct ToolLoopOutput {
    pub content: String,
    pub actions: Vec<AiChatAction>,
}

/// Multi-turn tool loop built directly on rig-core 0.7. rig 0.7's built-in `Chat` handles only a
/// single tool round and returns the raw tool output, so this loop drives the completion model
/// manually: tool calls are executed (gated by the security policy), their real results are fed
/// back into the conversation, and the model continues until it produces a final answer.
pub async fn run_tool_loop(
    app: &AppHandle,
    config: &hexbuffer_ai::AiConfig,
    policy: &hexbuffer_ai::SecurityApprovalPolicy,
    history: Vec<Message>,
    prompt: String,
) -> Result<ToolLoopOutput, String> {
    let client = hexbuffer_ai::providers::create_openai_client(config).map_err(|e| e.to_string())?;
    let model = client.completion_model(&config.model);
    let tools = tool_definitions().await;

    let mut chat_history = history;
    let mut actions: Vec<AiChatAction> = Vec::new();

    for _round in 0..MAX_TOOL_ROUNDS {
        let request = CompletionRequest {
            prompt: prompt.clone(),
            preamble: Some(PREAMBLE.to_string()),
            chat_history: chat_history.clone(),
            documents: Vec::new(),
            tools: tools.clone(),
            temperature: config.temperature,
            max_tokens: config.max_tokens,
            additional_params: None,
        };

        let response = model
            .completion(request)
            .await
            .map_err(|e| e.to_string())?;

        match response.choice {
            ModelChoice::Message(text) => {
                return Ok(ToolLoopOutput {
                    content: text,
                    actions,
                });
            }
            ModelChoice::ToolCall(name, _id, args) => {
                let result = execute_tool_call(app, policy, &name, args, &mut actions).await;
                chat_history.push(Message {
                    role: "user".to_string(),
                    content: format!("[Tool result for '{}']\n{}", name, result),
                });
            }
        }
    }

    Err(format!(
        "The AI assistant reached the maximum number of tool rounds ({MAX_TOOL_ROUNDS}) without \
        producing a final answer. Try narrowing the request."
    ))
}
