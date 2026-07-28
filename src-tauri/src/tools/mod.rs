use std::sync::{OnceLock, RwLock};

pub mod browser;
pub mod buffer;
pub mod documents;
pub mod intercept;
pub mod invoker;
pub mod proxy_tool;
pub mod repeater;
pub mod terminal;

pub use browser::{TriggerScanArgs, TriggerScanTool};
pub use buffer::ProxyBufferState;
pub use documents::{WriteDocumentArgs, WriteDocumentTool};
pub use intercept::{ToggleInterceptArgs, ToggleInterceptTool};
pub use invoker::{StartInvokerAttackArgs, StartInvokerAttackTool};
pub use proxy_tool::{SendHexArgs, SendHexTool};
pub use repeater::{
    AppToolError, CreateCollectionArgs, CreateCollectionTool, CreateEndpointArgs,
    CreateEndpointTool, CreateFolderArgs, CreateFolderTool, SendToRepeaterArgs,
    SendToRepeaterTool,
};
pub use terminal::{RunTerminalCommandArgs, RunTerminalCommandTool};

pub type ToolCallHandler = Box<dyn Fn(&str, serde_json::Value) + Send + Sync>;

static TOOL_CALL_HANDLER: OnceLock<RwLock<Option<ToolCallHandler>>> = OnceLock::new();

fn get_handler_lock() -> &'static RwLock<Option<ToolCallHandler>> {
    TOOL_CALL_HANDLER.get_or_init(|| RwLock::new(None))
}

pub fn set_tool_call_handler<F>(handler: F)
where
    F: Fn(&str, serde_json::Value) + Send + Sync + 'static,
{
    if let Ok(mut lock) = get_handler_lock().write() {
        *lock = Some(Box::new(handler));
    }
}

pub fn dispatch_tool_call(name: &str, args: serde_json::Value) {
    if let Ok(lock) = get_handler_lock().read() {
        if let Some(ref handler) = *lock {
            handler(name, args);
        }
    }
}
