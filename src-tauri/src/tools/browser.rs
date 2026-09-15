use super::dispatch_tool_call;
use super::repeater::AppToolError;
use rig::completion::ToolDefinition;
use rig::tool::{Tool, ToolContext};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize, Serialize)]
pub struct TriggerScanArgs {
    pub url: String,
}

pub struct TriggerScanTool;

impl TriggerScanTool {
    pub fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: <Self as Tool>::NAME.to_string(),
            description: self.description(),
            parameters: self.parameters(),
        }
    }
}

impl Tool for TriggerScanTool {
    const NAME: &'static str = "trigger_scan";
    type Error = AppToolError;
    type Args = TriggerScanArgs;
    type Output = String;

    fn description(&self) -> String {
        "Trigger a browser crawler or vulnerability scan against a target URL.".to_string()
    }

    fn parameters(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "url": { "type": "string", "description": "Target web application URL to crawl/scan" }
            },
            "required": ["url"]
        })
    }

    async fn call(&self, _context: &mut ToolContext, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        Ok(format!(
            "Successfully launched browser scan for target '{}'.",
            args.url
        ))
    }
}
