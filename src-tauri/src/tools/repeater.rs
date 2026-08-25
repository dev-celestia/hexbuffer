use crate::tools::dispatch_tool_call;
use rig::completion::ToolDefinition;
use rig::tool::Tool;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
#[error("Hexbuffer tool execution error: {0}")]
pub struct AppToolError(pub String);

// 1. SendToRepeaterTool
#[derive(Deserialize, Serialize)]
pub struct SendToRepeaterArgs {
    pub raw_request: String,
    pub target_url: Option<String>,
}

pub struct SendToRepeaterTool;

impl Tool for SendToRepeaterTool {
    const NAME: &'static str = "send_to_repeater";
    type Error = AppToolError;
    type Args = SendToRepeaterArgs;
    type Output = String;

    async fn definition(&self, _prompt: String) -> ToolDefinition {
        ToolDefinition {
            name: Self::NAME.to_string(),
            description: "Send an HTTP request to the Repeater tab for manual inspection and modification.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "raw_request": { "type": "string", "description": "Raw HTTP request string including headers and body" },
                    "target_url": { "type": "string", "description": "Optional target URL or host" }
                },
                "required": ["raw_request"]
            }),
        }
    }

    async fn call(&self, args: Self::Args) -> Result<Self::Output, Self::Error> {
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

impl Tool for CreateCollectionTool {
    const NAME: &'static str = "create_collection";
    type Error = AppToolError;
    type Args = CreateCollectionArgs;
    type Output = String;

    async fn definition(&self, _prompt: String) -> ToolDefinition {
        ToolDefinition {
            name: Self::NAME.to_string(),
            description: "Create a new collection inside a Repeater workspace.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "workspace_id": { "type": "string", "description": "Target workspace ID" },
                    "name": { "type": "string", "description": "Collection name" }
                },
                "required": ["workspace_id", "name"]
            }),
        }
    }

    async fn call(&self, args: Self::Args) -> Result<Self::Output, Self::Error> {
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

impl Tool for CreateFolderTool {
    const NAME: &'static str = "create_folder";
    type Error = AppToolError;
    type Args = CreateFolderArgs;
    type Output = String;

    async fn definition(&self, _prompt: String) -> ToolDefinition {
        ToolDefinition {
            name: Self::NAME.to_string(),
            description: "Create a subfolder inside a Repeater collection or folder.".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "parent_id": { "type": "string", "description": "Parent collection or folder ID" },
                    "name": { "type": "string", "description": "Folder name" }
                },
                "required": ["parent_id", "name"]
            }),
        }
    }

    async fn call(&self, args: Self::Args) -> Result<Self::Output, Self::Error> {
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

impl Tool for CreateEndpointTool {
    const NAME: &'static str = "create_endpoint";
    type Error = AppToolError;
    type Args = CreateEndpointArgs;
    type Output = String;

    async fn definition(&self, _prompt: String) -> ToolDefinition {
        ToolDefinition {
            name: Self::NAME.to_string(),
            description: "Add an API endpoint/request to a Repeater collection or folder.".to_string(),
            parameters: json!({
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
            }),
        }
    }

    async fn call(&self, args: Self::Args) -> Result<Self::Output, Self::Error> {
        dispatch_tool_call(Self::NAME, json!(args));
        Ok(format!(
            "Successfully created endpoint '{}' in collection '{}'.",
            args.name, args.collection_id
        ))
    }
}
