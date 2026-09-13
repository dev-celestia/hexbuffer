use std::collections::HashSet;

/// Fail-closed security approval policy for AI tool calls
#[derive(Debug, Clone)]
pub struct SecurityApprovalPolicy {
    pub auto_approve: HashSet<String>,
}

impl SecurityApprovalPolicy {
    pub fn default_policy() -> Self {
        let mut auto_approve = HashSet::new();
        auto_approve.insert("send_to_repeater".to_string());
        auto_approve.insert("create_collection".to_string());
        auto_approve.insert("create_folder".to_string());
        auto_approve.insert("create_endpoint".to_string());
        auto_approve.insert("write_document".to_string());
        auto_approve.insert("trigger_scan".to_string());
        auto_approve.insert("toggle_intercept".to_string());
        Self { auto_approve }
    }

    pub fn is_approved(&self, tool_name: &str) -> bool {
        self.auto_approve.contains(tool_name)
    }

    pub fn evaluate_tool_call(&self, tool_name: &str) -> Result<(), String> {
        if self.is_approved(tool_name) {
            Ok(())
        } else {
            Err(format!(
                "Denied by security policy: `{tool_name}` is a high-risk capability requiring user confirmation."
            ))
        }
    }
}

impl Default for SecurityApprovalPolicy {
    fn default() -> Self {
        Self::default_policy()
    }
}
