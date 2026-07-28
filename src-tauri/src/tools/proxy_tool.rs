use super::buffer::ProxyBufferState;
use rig::tool::Tool;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize, Serialize, Debug)]
pub struct SendHexArgs {
    pub hex_data: String,
    pub target_addr: String,
}

pub struct SendHexTool {
    pub state: ProxyBufferState,
}

#[derive(Debug, thiserror::Error)]
#[error("Proxy execution error: {0}")]
pub struct ToolError(pub String);

impl Tool for SendHexTool {
    const NAME: &'static str = "send_hex_payload";
    type Error = ToolError;
    type Args = SendHexArgs;
    type Output = String;

    async fn definition(&self, _prompt: String) -> rig::completion::ToolDefinition {
        rig::completion::ToolDefinition {
            name: Self::NAME.to_string(),
            description: "Sends parsed hex buffer data to a target network address.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "hex_data": { "type": "string", "description": "Hex string e.g. 48656c6c6f" },
                    "target_addr": { "type": "string", "description": "Host:Port target e.g. 127.0.0.1:8080" }
                },
                "required": ["hex_data", "target_addr"]
            }),
        }
    }

    async fn call(&self, args: Self::Args) -> Result<Self::Output, Self::Error> {
        self.state
            .send_hex(&args.hex_data, &args.target_addr)
            .map_err(ToolError)
    }
}
