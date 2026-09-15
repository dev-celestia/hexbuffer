use serde::{Deserialize, Serialize};

/// Token usage for a single LLM round-trip. Mirrors rig's `completion::Usage`
/// so callers can convert and accumulate without leaking rig types into the
/// persistence layer. All-zero values are the documented sentinel for "the
/// provider did not report usage".
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsage {
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub total_tokens: u64,
    pub cached_input_tokens: u64,
    pub cache_creation_input_tokens: u64,
    pub tool_use_prompt_tokens: u64,
    pub reasoning_tokens: u64,
}

impl TokenUsage {
    pub const fn new() -> Self {
        Self {
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cached_input_tokens: 0,
            cache_creation_input_tokens: 0,
            tool_use_prompt_tokens: 0,
            reasoning_tokens: 0,
        }
    }

    /// True when any usage value is non-zero (the provider reported metrics).
    pub fn has_values(&self) -> bool {
        self.total_tokens != 0
            || self.input_tokens != 0
            || self.output_tokens != 0
            || self.cached_input_tokens != 0
            || self.cache_creation_input_tokens != 0
            || self.tool_use_prompt_tokens != 0
            || self.reasoning_tokens != 0
    }

    /// Converts a rig `completion::Usage` into the app-neutral form.
    pub fn from_rig(usage: rig::completion::Usage) -> Self {
        Self {
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens,
            total_tokens: usage.total_tokens,
            cached_input_tokens: usage.cached_input_tokens,
            cache_creation_input_tokens: usage.cache_creation_input_tokens,
            tool_use_prompt_tokens: usage.tool_use_prompt_tokens,
            reasoning_tokens: usage.reasoning_tokens,
        }
    }
}

impl std::ops::AddAssign for TokenUsage {
    fn add_assign(&mut self, other: Self) {
        self.input_tokens += other.input_tokens;
        self.output_tokens += other.output_tokens;
        self.total_tokens += other.total_tokens;
        self.cached_input_tokens += other.cached_input_tokens;
        self.cache_creation_input_tokens += other.cache_creation_input_tokens;
        self.tool_use_prompt_tokens += other.tool_use_prompt_tokens;
        self.reasoning_tokens += other.reasoning_tokens;
    }
}

impl std::ops::Add for TokenUsage {
    type Output = Self;
    fn add(mut self, other: Self) -> Self {
        self += other;
        self
    }
}

/// A persisted usage record for one completed chat request.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsageRecord {
    pub request_id: String,
    pub session_id: String,
    pub message_id: String,
    pub model: String,
    pub provider: String,
    pub usage: TokenUsage,
    pub created_at: String,
}

/// Aggregated usage totals for a scope (a session or the whole app).
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsageTotals {
    pub total_requests: u64,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub total_tokens: u64,
    pub cached_input_tokens: u64,
    pub reasoning_tokens: u64,
}

impl TokenUsageTotals {
    pub fn from_records(records: &[TokenUsageRecord]) -> Self {
        let mut totals = Self::default();
        for record in records {
            totals.total_requests += 1;
            totals.input_tokens += record.usage.input_tokens;
            totals.output_tokens += record.usage.output_tokens;
            totals.total_tokens += record.usage.total_tokens;
            totals.cached_input_tokens += record.usage.cached_input_tokens;
            totals.reasoning_tokens += record.usage.reasoning_tokens;
        }
        totals
    }
}

/// Per-model breakdown returned by the global summary command.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsageByModel {
    pub model: String,
    pub provider: String,
    pub totals: TokenUsageTotals,
}

/// Full response for the global token-usage command.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalTokenUsage {
    pub totals: TokenUsageTotals,
    pub by_model: Vec<TokenUsageByModel>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn usage(input: u64, output: u64, total: u64, reasoning: u64) -> TokenUsage {
        TokenUsage {
            input_tokens: input,
            output_tokens: output,
            total_tokens: total,
            reasoning_tokens: reasoning,
            ..TokenUsage::new()
        }
    }

    #[test]
    fn test_has_values_ignores_all_zero() {
        assert!(!TokenUsage::new().has_values());
        assert!(usage(10, 0, 10, 0).has_values());
        assert!(usage(0, 0, 0, 5).has_values());
    }

    #[test]
    fn test_add_accumulates_across_rounds() {
        let mut acc = TokenUsage::new();
        acc += usage(100, 50, 150, 20);
        acc += usage(40, 30, 70, 0);
        assert_eq!(acc.input_tokens, 140);
        assert_eq!(acc.output_tokens, 80);
        assert_eq!(acc.total_tokens, 220);
        assert_eq!(acc.reasoning_tokens, 20);
    }

    #[test]
    fn test_from_rig_maps_fields() {
        let rig_usage = rig::completion::Usage {
            input_tokens: 10,
            output_tokens: 20,
            total_tokens: 30,
            cached_input_tokens: 5,
            cache_creation_input_tokens: 3,
            tool_use_prompt_tokens: 2,
            reasoning_tokens: 7,
        };
        let mapped = TokenUsage::from_rig(rig_usage);
        assert_eq!(mapped.input_tokens, 10);
        assert_eq!(mapped.reasoning_tokens, 7);
        assert_eq!(mapped.cached_input_tokens, 5);
    }

    #[test]
    fn test_totals_from_records() {
        let records = vec![
            TokenUsageRecord {
                request_id: "r1".into(),
                session_id: "s1".into(),
                message_id: "m1".into(),
                model: "m".into(),
                provider: "p".into(),
                usage: usage(100, 50, 150, 0),
                created_at: String::new(),
            },
            TokenUsageRecord {
                request_id: "r2".into(),
                session_id: "s1".into(),
                message_id: "m2".into(),
                model: "m".into(),
                provider: "p".into(),
                usage: usage(10, 5, 15, 2),
                created_at: String::new(),
            },
        ];
        let totals = TokenUsageTotals::from_records(&records);
        assert_eq!(totals.total_requests, 2);
        assert_eq!(totals.total_tokens, 165);
        assert_eq!(totals.reasoning_tokens, 2);
    }
}
