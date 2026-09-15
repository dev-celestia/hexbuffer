use crate::tools::dispatch_tool_call;
use rig::completion::ToolDefinition;
use rig::tool::{Tool, ToolContext};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
#[error("Hexbuffer tool execution error: {0}")]
pub struct AppToolError(pub String);

// 1. SendToRepeaterTool
#[derive(Deserialize, Serialize)]
pub struct SendToRepeaterArgs {
    #[serde(default)]
    pub raw_request: Option<String>,
    #[serde(default)]
    pub target_url: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub host: Option<String>,
    #[serde(default)]
    pub method: Option<String>,
    #[serde(default)]
    pub headers: Option<std::collections::HashMap<String, String>>,
    #[serde(default)]
    pub body: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
}

pub struct SendToRepeaterTool;

impl SendToRepeaterTool {
    pub fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: <Self as Tool>::NAME.to_string(),
            description: self.description(),
            parameters: self.parameters(),
        }
    }
}

impl Tool for SendToRepeaterTool {
    const NAME: &'static str = "send_to_repeater";
    type Error = AppToolError;
    type Args = SendToRepeaterArgs;
    type Output = String;

    fn description(&self) -> String {
        "Send an HTTP request to the Repeater tab for manual inspection and modification. \
        Accepts either a complete raw HTTP request, or a partial/unfinished request such \
        as a bare URL path (e.g. \"api/users?page=1\"). Normalize the request yourself \
        before calling: infer the method (default GET), path, query, headers and body. \
        Required: `url` (absolute or relative path) plus `host` for relative paths — if \
        the host cannot be determined from the app context or the user's message, ask \
        the user for it instead of calling this tool."
            .to_string()
    }

    fn parameters(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "raw_request": { "type": "string", "description": "Complete raw HTTP request (request line, headers, body). Omit when the user only provided a URL path or fragment; then use `url` instead." },
                "url": { "type": "string", "description": "Absolute URL or relative path taken from the user, e.g. \"api/Lms/Synchronous/leaderboard?businessEventId=96218820\" or \"https://host/api/x\"." },
                "host": { "type": "string", "description": "Origin for relative paths, e.g. \"https://example.com\". Prefer a host seen in the recent proxy traffic from the app context; if none fits, ask the user for the host instead of calling this tool." },
                "method": { "type": "string", "description": "HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS). Defaults to GET when omitted or unknown." },
                "headers": { "type": "object", "description": "Optional request headers key-value map" },
                "body": { "type": "string", "description": "Optional request body (POST/PUT/PATCH)" },
                "name": { "type": "string", "description": "Optional endpoint name shown in Repeater" }
            }
        })
    }

    async fn call(&self, _context: &mut ToolContext, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        Ok(format!(
            "Successfully sent request to Repeater tab (Target: {}).",
            args.target_url.as_deref().unwrap_or("unspecified")
        ))
    }
}

// 2. CreateCollectionTool
#[derive(Deserialize, Serialize)]
pub struct CreateCollectionArgs {
    pub workspace_id: String,
    pub name: String,
}

pub struct CreateCollectionTool;

impl CreateCollectionTool {
    pub fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: <Self as Tool>::NAME.to_string(),
            description: self.description(),
            parameters: self.parameters(),
        }
    }
}

impl Tool for CreateCollectionTool {
    const NAME: &'static str = "create_collection";
    type Error = AppToolError;
    type Args = CreateCollectionArgs;
    type Output = String;

    fn description(&self) -> String {
        "Create a new collection inside a Repeater workspace.".to_string()
    }

    fn parameters(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "workspace_id": { "type": "string", "description": "Target workspace ID" },
                "name": { "type": "string", "description": "Collection name" }
            },
            "required": ["workspace_id", "name"]
        })
    }

    async fn call(&self, _context: &mut ToolContext, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        Ok(format!(
            "Successfully created collection '{}' in workspace '{}'.",
            args.name, args.workspace_id
        ))
    }
}

// 3. CreateFolderTool
#[derive(Deserialize, Serialize)]
pub struct CreateFolderArgs {
    pub parent_id: String,
    pub name: String,
}

pub struct CreateFolderTool;

impl CreateFolderTool {
    pub fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: <Self as Tool>::NAME.to_string(),
            description: self.description(),
            parameters: self.parameters(),
        }
    }
}

impl Tool for CreateFolderTool {
    const NAME: &'static str = "create_folder";
    type Error = AppToolError;
    type Args = CreateFolderArgs;
    type Output = String;

    fn description(&self) -> String {
        "Create a subfolder inside a Repeater collection or folder.".to_string()
    }

    fn parameters(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "parent_id": { "type": "string", "description": "Parent collection or folder ID" },
                "name": { "type": "string", "description": "Folder name" }
            },
            "required": ["parent_id", "name"]
        })
    }

    async fn call(&self, _context: &mut ToolContext, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        Ok(format!(
            "Successfully created folder '{}' under parent '{}'.",
            args.name, args.parent_id
        ))
    }
}

// 4. CreateEndpointTool
#[derive(Deserialize, Serialize)]
pub struct CreateEndpointArgs {
    pub collection_id: String,
    pub name: String,
    pub method: Option<String>,
    pub url: Option<String>,
    pub headers: Option<serde_json::Value>,
    pub body: Option<String>,
}

pub struct CreateEndpointTool;

impl CreateEndpointTool {
    pub fn definition(&self) -> ToolDefinition {
        ToolDefinition {
            name: <Self as Tool>::NAME.to_string(),
            description: self.description(),
            parameters: self.parameters(),
        }
    }
}

impl Tool for CreateEndpointTool {
    const NAME: &'static str = "create_endpoint";
    type Error = AppToolError;
    type Args = CreateEndpointArgs;
    type Output = String;

    fn description(&self) -> String {
        "Add an API endpoint/request to a Repeater collection or folder.".to_string()
    }

    fn parameters(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "collection_id": { "type": "string", "description": "Target collection or folder ID" },
                "name": { "type": "string", "description": "API Endpoint/Request name" },
                "method": { "type": "string", "description": "HTTP Method (GET, POST, etc.)" },
                "url": { "type": "string", "description": "Endpoint URL" },
                "headers": { "type": "object", "description": "HTTP Request headers key-value map" },
                "body": { "type": "string", "description": "HTTP Request payload body" }
            },
            "required": ["collection_id", "name"]
        })
    }

    async fn call(&self, _context: &mut ToolContext, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        Ok(format!(
            "Successfully created endpoint '{}' in collection '{}'.",
            args.name, args.collection_id
        ))
    }
}

