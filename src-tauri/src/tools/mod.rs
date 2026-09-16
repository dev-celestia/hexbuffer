use parking_lot::RwLock;
use std::sync::OnceLock;

pub mod browser;
pub mod buffer;
pub mod intercept;
pub mod invoker;
pub mod proxy_tool;
pub mod repeater;

pub use browser::{TriggerScanArgs, TriggerScanTool};
pub use buffer::ProxyBufferState;
pub use intercept::{ToggleInterceptArgs, ToggleInterceptTool};
pub use invoker::{StartInvokerAttackArgs, StartInvokerAttackTool};
pub use proxy_tool::{SendHexArgs, SendHexTool};
pub use repeater::{
    AppToolError, CreateCollectionArgs, CreateCollectionTool, CreateEndpointArgs,
    CreateEndpointTool, CreateFolderArgs, CreateFolderTool, SendToRepeaterArgs, SendToRepeaterTool,
};

pub type ToolCallHandler = Box<dyn Fn(&str, serde_json::Value) + Send + Sync>;

static TOOL_CALL_HANDLER: OnceLock<RwLock<Option<ToolCallHandler>>> = OnceLock::new();

fn get_handler_lock() -> &'static RwLock<Option<ToolCallHandler>> {
    TOOL_CALL_HANDLER.get_or_init(|| RwLock::new(None))
}

pub fn set_tool_call_handler<F>(handler: F)
where
    F: Fn(&str, serde_json::Value) + Send + Sync + 'static,
{
    *get_handler_lock().write() = Some(Box::new(handler));
}

pub fn dispatch_tool_call(name: &str, args: serde_json::Value) {
    match *get_handler_lock().read() {
        Some(ref handler) => handler(name, args),
        None => eprintln!(
            "[tools] No tool call handler is registered; dropping '{name}' instead of \
             reporting a false success."
        ),
    }
}
