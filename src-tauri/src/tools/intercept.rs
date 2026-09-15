use super::dispatch_tool_call;
use super::repeater::AppToolError;
use rig::completion::ToolDefinition;
use rig::tool::{Tool, ToolContext};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize, Serialize)]
pub struct ToggleInterceptArgs {
    pub enabled: bool,
}

pub struct ToggleInterceptTool;

impl ToggleInterceptTool {
    pub fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: <Self as Tool>::NAME.to_string(),
            description: self.description(),
            parameters: self.parameters(),
        }
    }
}

impl Tool for ToggleInterceptTool {
    const NAME: &'static str = "toggle_intercept";
    type Error = AppToolError;
    type Args = ToggleInterceptArgs;
    type Output = String;

    fn description(&self) -> String {
        "Enable or disable proxy HTTP traffic interception.".to_string()
    }

    fn parameters(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "enabled": { "type": "boolean", "description": "True to enable intercept, False to disable" }
            },
            "required": ["enabled"]
        })
    }

    async fn call(&self, _context: &mut ToolContext, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        let state = if args.enabled { "ENABLED" } else { "DISABLED" };
        Ok(format!(
            "Successfully set proxy traffic interception to {}.",
            state
        ))
    }
}
