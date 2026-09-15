use crate::ai::token_usage::{GlobalTokenUsage, TokenUsageRecord, TokenUsageTotals, TokenUsageByModel};
use rusqlite::{params, Result as SqlResult};

use super::Database;

impl Database {
    /// Inserts one usage record. `INSERT OR IGNORE` keeps a retried/cancelled request
    /// from double-counting; the first persisted measurement wins.
    pub fn insert_token_usage(&self, record: &TokenUsageRecord) -> SqlResult<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR IGNORE INTO ai_token_usage (
                request_id, session_id, message_id, model, provider,
                input_tokens, output_tokens, total_tokens, cached_input_tokens,
                cache_creation_input_tokens, tool_use_prompt_tokens, reasoning_tokens, created_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                record.request_id,
                record.session_id,
                record.message_id,
                record.model,
                record.provider,
                record.usage.input_tokens as i64,
                record.usage.output_tokens as i64,
                record.usage.total_tokens as i64,
                record.usage.cached_input_tokens as i64,
                record.usage.cache_creation_input_tokens as i64,
                record.usage.tool_use_prompt_tokens as i64,
                record.usage.reasoning_tokens as i64,
                record.created_at,
            ],
        )?;
        Ok(())
    }

    /// Returns all usage records for a session, oldest first.
    pub fn list_token_usage_by_session(&self, session_id: &str) -> SqlResult<Vec<TokenUsageRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT request_id, session_id, message_id, model, provider,
                    input_tokens, output_tokens, total_tokens, cached_input_tokens,
                    cache_creation_input_tokens, tool_use_prompt_tokens, reasoning_tokens, created_at
             FROM ai_token_usage
             WHERE session_id = ?1
             ORDER BY created_at ASC",
        )?;
        let rows = stmt.query_map(params![session_id], map_usage_row)?;
        rows.collect()
    }

    /// Aggregated totals for one session.
    pub fn sum_token_usage_by_session(&self, session_id: &str) -> SqlResult<TokenUsageTotals> {
        let records = self.list_token_usage_by_session(session_id)?;
        Ok(TokenUsageTotals::from_records(&records))
    }

    /// Global totals across all sessions, plus a per-model breakdown.
    pub fn global_token_usage(&self) -> SqlResult<GlobalTokenUsage> {
        let conn = self.conn.lock();
        let all = Self::query_all_usage(&conn)?;
        let totals = TokenUsageTotals::from_records(&all);

        let mut stmt = conn.prepare(
            "SELECT model, provider, COUNT(*) as requests,
                    SUM(input_tokens), SUM(output_tokens), SUM(total_tokens),
                    SUM(cached_input_tokens), SUM(reasoning_tokens)
             FROM ai_token_usage
             GROUP BY model, provider
             ORDER BY SUM(total_tokens) DESC",
        )?;
        let by_model = stmt
            .query_map([], |row| {
                let mut totals = TokenUsageTotals {
                    total_requests: row.get::<_, i64>(2)? as u64,
                    ..TokenUsageTotals::default()
                };
                totals.input_tokens = row.get::<_, i64>(3)?.max(0) as u64;
                totals.output_tokens = row.get::<_, i64>(4)?.max(0) as u64;
                totals.total_tokens = row.get::<_, i64>(5)?.max(0) as u64;
                totals.cached_input_tokens = row.get::<_, i64>(6)?.max(0) as u64;
                totals.reasoning_tokens = row.get::<_, i64>(7)?.max(0) as u64;
                Ok(TokenUsageByModel {
                    model: row.get(0)?,
                    provider: row.get(1)?,
                    totals,
                })
            })?
            .collect::<SqlResult<Vec<_>>>()?;

        Ok(GlobalTokenUsage { totals, by_model })
    }

    /// Deletes usage rows for a session (used when a session is deleted).
    pub fn delete_token_usage_for_session(&self, session_id: &str) -> SqlResult<usize> {
        let conn = self.conn.lock();
        conn.execute(
            "DELETE FROM ai_token_usage WHERE session_id = ?1",
            params![session_id],
        )
    }

    fn query_all_usage(conn: &rusqlite::Connection) -> SqlResult<Vec<TokenUsageRecord>> {
        let mut stmt = conn.prepare(
            "SELECT request_id, session_id, message_id, model, provider,
                    input_tokens, output_tokens, total_tokens, cached_input_tokens,
                    cache_creation_input_tokens, tool_use_prompt_tokens, reasoning_tokens, created_at
             FROM ai_token_usage",
        )?;
        let rows = stmt.query_map([], map_usage_row)?;
        rows.collect()
    }
}

fn map_usage_row(row: &rusqlite::Row<'_>) -> SqlResult<TokenUsageRecord> {
    Ok(TokenUsageRecord {
        request_id: row.get(0)?,
        session_id: row.get(1)?,
        message_id: row.get(2)?,
        model: row.get(3)?,
        provider: row.get(4)?,
        usage: crate::ai::token_usage::TokenUsage {
            input_tokens: row.get::<_, i64>(5)?.max(0) as u64,
            output_tokens: row.get::<_, i64>(6)?.max(0) as u64,
            total_tokens: row.get::<_, i64>(7)?.max(0) as u64,
            cached_input_tokens: row.get::<_, i64>(8)?.max(0) as u64,
            cache_creation_input_tokens: row.get::<_, i64>(9)?.max(0) as u64,
            tool_use_prompt_tokens: row.get::<_, i64>(10)?.max(0) as u64,
            reasoning_tokens: row.get::<_, i64>(11)?.max(0) as u64,
        },
        created_at: row.get(12)?,
    })
}
