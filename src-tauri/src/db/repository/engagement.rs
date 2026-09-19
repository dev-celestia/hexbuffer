use crate::ai::types::{EngagementLedgerEntry, EngagementPlan};
use rusqlite::{params, Result as SqlResult};

use super::Database;

impl Database {
    /// Reads the engagement state for a session, or `None` when the session has
    /// never initialized one.
    pub fn get_engagement_state(&self, session_id: &str) -> SqlResult<Option<(EngagementPlan, Vec<EngagementLedgerEntry>)>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT plan_json, ledger_json FROM ai_engagement_state WHERE session_id = ?1",
        )?;
        let row = stmt.query_row(params![session_id], |row| {
            let plan_json: String = row.get(0)?;
            let ledger_json: String = row.get(1)?;
            Ok((plan_json, ledger_json))
        });

        match row {
            Ok((plan_json, ledger_json)) => {
                let plan: EngagementPlan = serde_json::from_str(&plan_json)
                    .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;
                let ledger: Vec<EngagementLedgerEntry> = serde_json::from_str(&ledger_json)
                    .map_err(|e| rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e)))?;
                Ok(Some((plan, ledger)))
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Inserts or replaces the engagement state for a session. The plan is the
    /// authoritative checklist; the ledger is the append-only record of
    /// confirmed/dismissed transitions.
    pub fn upsert_engagement_state(
        &self,
        session_id: &str,
        plan: &EngagementPlan,
        ledger: &[EngagementLedgerEntry],
    ) -> SqlResult<()> {
        let conn = self.conn.lock();
        let plan_json = serde_json::to_string(plan)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;
        let ledger_json = serde_json::to_string(ledger)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e)))?;
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO ai_engagement_state (session_id, plan_json, ledger_json, updated_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(session_id) DO UPDATE SET
               plan_json = excluded.plan_json,
               ledger_json = excluded.ledger_json,
               updated_at = excluded.updated_at",
            params![session_id, plan_json, ledger_json, now],
        )?;
        Ok(())
    }

    /// Updates a single plan item's status and evidence, and appends a ledger
    /// entry. Returns an error if the item id is not found.
    pub fn update_plan_item(
        &self,
        session_id: &str,
        item_id: &str,
        status: &str,
        evidence: Option<&str>,
        reason: Option<&str>,
    ) -> SqlResult<EngagementPlan> {
        let conn = self.conn.lock();

        conn.execute("BEGIN IMMEDIATE", [])?;
        let result = (|| -> SqlResult<EngagementPlan> {
            let (plan_json, ledger_json): (String, String) = conn.query_row(
                "SELECT plan_json, ledger_json FROM ai_engagement_state WHERE session_id = ?1",
                params![session_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )?;

            let mut plan: EngagementPlan = serde_json::from_str(&plan_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;
            let mut ledger: Vec<EngagementLedgerEntry> = serde_json::from_str(&ledger_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e)))?;

            let item = plan
                .items
                .iter_mut()
                .find(|i| i.id == item_id)
                .ok_or_else(|| rusqlite::Error::QueryReturnedNoRows)?;

            item.status = status.to_string();
            item.evidence = evidence.map(str::to_string);
            item.reason = reason.map(str::to_string);

            ledger.push(EngagementLedgerEntry {
                item_id: item_id.to_string(),
                item_title: item.title.clone(),
                status: status.to_string(),
                evidence: evidence.map(str::to_string),
                reason: reason.map(str::to_string),
                timestamp: chrono::Utc::now().to_rfc3339(),
            });

            // Rolling window: the orientation block only ever shows the last few
            // entries, and an unbounded JSON blob would bloat every read.
            const MAX_LEDGER_ENTRIES: usize = 200;
            while ledger.len() > MAX_LEDGER_ENTRIES {
                ledger.remove(0);
            }

            let new_plan_json = serde_json::to_string(&plan)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;
            let new_ledger_json = serde_json::to_string(&ledger)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e)))?;

            conn.execute(
                "UPDATE ai_engagement_state SET plan_json = ?1, ledger_json = ?2, updated_at = ?3 WHERE session_id = ?4",
                params![new_plan_json, new_ledger_json, chrono::Utc::now().to_rfc3339(), session_id],
            )?;

            Ok(plan)
        })();

        match result {
            Ok(plan) => {
                conn.execute("COMMIT", [])?;
                Ok(plan)
            }
            Err(e) => {
                let _ = conn.execute("ROLLBACK", []);
                Err(e)
            }
        }
    }
}