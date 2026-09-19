use rusqlite::{params, Result as SqlResult};

use super::Database;

/// Rolling cap on spooled tool outputs; older handles are evicted past this so the
/// table cannot grow without bound across long sessions.
const MAX_SPOOLED_OUTPUTS: usize = 200;

#[derive(Debug, Clone)]
pub struct SpooledToolOutput {
    pub handle: String,
    pub tool_name: String,
    pub content: String,
    pub created_at: String,
}

impl Database {
    pub fn insert_tool_output(
        &self,
        handle: &str,
        tool_name: &str,
        session_id: &str,
        content: &str,
    ) -> SqlResult<()> {
        let conn = self.conn.lock();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "INSERT OR REPLACE INTO ai_tool_outputs (handle, tool_name, session_id, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![handle, tool_name, session_id, content, now],
        )?;
        conn.execute(
            "DELETE FROM ai_tool_outputs WHERE rowid NOT IN (
                SELECT rowid FROM ai_tool_outputs ORDER BY created_at DESC, rowid DESC LIMIT ?1
             )",
            params![MAX_SPOOLED_OUTPUTS as i64],
        )?;
        Ok(())
    }

    pub fn get_tool_output(&self, handle: &str) -> SqlResult<Option<SpooledToolOutput>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT handle, tool_name, content, created_at FROM ai_tool_outputs WHERE handle = ?1",
        )?;
        let row = stmt.query_row(params![handle], |row| {
            Ok(SpooledToolOutput {
                handle: row.get(0)?,
                tool_name: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
            })
        });
        match row {
            Ok(output) => Ok(Some(output)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_db() -> Database {
        let db = Database::new(std::path::PathBuf::from(":memory:")).expect("in-memory database");
        db.init().expect("schema init");
        db
    }

    #[test]
    fn insert_and_get_roundtrip() {
        let db = test_db();
        db.insert_tool_output("out-1", "get_crawl_context", "sess-1", "hello world")
            .unwrap();
        let found = db.get_tool_output("out-1").unwrap().unwrap();
        assert_eq!(found.tool_name, "get_crawl_context");
        assert_eq!(found.content, "hello world");
        assert!(db.get_tool_output("out-missing").unwrap().is_none());
    }

    #[test]
    fn eviction_keeps_only_the_newest_outputs() {
        let db = test_db();
        for index in 0..(MAX_SPOOLED_OUTPUTS + 5) {
            db.insert_tool_output(
                &format!("out-{index}"),
                "tool",
                "",
                &format!("content {index}"),
            )
            .unwrap();
        }
        assert!(db.get_tool_output("out-0").unwrap().is_none());
        assert!(db.get_tool_output("out-4").unwrap().is_none());
        assert!(db.get_tool_output("out-5").unwrap().is_some());
        assert!(db
            .get_tool_output(&format!("out-{}", MAX_SPOOLED_OUTPUTS + 4))
            .unwrap()
            .is_some());
    }
}