use super::dispatch_tool_call;
use super::repeater::AppToolError;
use rig::completion::ToolDefinition;
use rig::tool::Tool;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize, Serialize)]
pub struct TriggerScanArgs {
    pub url: String,
}

pub struct TriggerScanTool;

impl Tool for TriggerScanTool {
    const NAME: &'static str = "trigger_scan";
    type Error = AppToolError;
    type Args = TriggerScanArgs;
    type Output = String;

    async fn definition(&self, _prompt: String) -> ToolDefinition {
        ToolDefinition {
            name: Self::NAME.to_string(),
            description: "Trigger a browser crawler or vulnerability scan against a target URL.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "url": { "type": "string", "description": "Target web application URL to crawl/scan" }
                },
                "required": ["url"]
            }),
        }
    }

    async fn call(&self, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        Ok(format!("Successfully launched browser scan for target '{}'.", args.url))
    }
}
