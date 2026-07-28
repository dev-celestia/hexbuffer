use super::dispatch_tool_call;
use super::repeater::AppToolError;
use rig::completion::ToolDefinition;
use rig::tool::Tool;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize, Serialize)]
pub struct RunTerminalCommandArgs {
    pub command: String,
}

pub struct RunTerminalCommandTool;

impl Tool for RunTerminalCommandTool {
    const NAME: &'static str = "run_terminal_command";
    type Error = AppToolError;
    type Args = RunTerminalCommandArgs;
    type Output = String;

    async fn definition(&self, _prompt: String) -> ToolDefinition {
        ToolDefinition {
            name: Self::NAME.to_string(),
            description: "Execute a shell command inside the Apprecon integrated terminal.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "command": { "type": "string", "description": "Command string to run in the terminal" }
                },
                "required": ["command"]
            }),
        }
    }

    async fn call(&self, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        Ok(format!("Successfully dispatched terminal command '{}'.", args.command))
    }
}
