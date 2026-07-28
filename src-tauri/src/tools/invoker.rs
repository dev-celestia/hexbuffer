use super::dispatch_tool_call;
use super::repeater::AppToolError;
use rig::completion::ToolDefinition;
use rig::tool::Tool;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize, Serialize)]
pub struct StartInvokerAttackArgs {
    pub attack_type: Option<String>,
}

pub struct StartInvokerAttackTool;

impl Tool for StartInvokerAttackTool {
    const NAME: &'static str = "start_invoker_attack";
    type Error = AppToolError;
    type Args = StartInvokerAttackArgs;
    type Output = String;

    async fn definition(&self, _prompt: String) -> ToolDefinition {
        ToolDefinition {
            name: Self::NAME.to_string(),
            description: "Launch a brute-force or payload injection attack using the Invoker engine.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "attack_type": { "type": "string", "description": "Attack strategy (sniper, battering_ram, pitchfork, cluster_bomb)" }
                }
            }),
        }
    }

    async fn call(&self, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        let attack_type = args.attack_type.unwrap_or_else(|| "sniper".to_string());
        Ok(format!("Successfully launched Invoker attack (Type: {}).", attack_type))
    }
}
