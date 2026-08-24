use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};

use super::Database;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpSessionRecord {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub is_active: bool,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpSessionSummary {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub is_active: bool,
    pub description: Option<String>,
    pub request_count: usize,
    pub total_size_bytes: usize,
}

impl Database {
    pub fn create_http_session(
        &self,
        name: &str,
        description: Option<&str>,
    ) -> SqlResult<HttpSessionRecord> {
        let conn = self.conn.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        // Mark existing sessions as inactive
        conn.execute("UPDATE http_sessions SET is_active = 0", [])?;

        conn.execute(
            "INSERT INTO http_sessions (id, name, created_at, updated_at, is_active, description) VALUES (?1, ?2, ?3, ?4, 1, ?5)",
            params![id, name.trim(), now, now, description.map(|d| d.trim())],
        )?;

        Ok(HttpSessionRecord {
            id,
            name: name.trim().to_string(),
            created_at: now.clone(),
            updated_at: now,
            is_active: true,
            description: description.map(|d| d.trim().to_string()),
        })
    }

    pub fn list_http_sessions(&self) -> SqlResult<Vec<HttpSessionSummary>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"SELECT 
                s.id, s.name, s.created_at, s.updated_at, s.is_active, s.description,
                COALESCE(COUNT(l.id), 0) as request_count,
                COALESCE(SUM(LENGTH(COALESCE(l.request_body, X'')) + LENGTH(COALESCE(l.response_body, X''))), 0) as total_size_bytes
               FROM http_sessions s
               LEFT JOIN http_logs l ON s.id = l.session_id
               GROUP BY s.id
               ORDER BY s.is_active DESC, s.created_at DESC"#,
        )?;

        let rows = stmt.query_map([], |row| {
            let is_active_int: i64 = row.get(4)?;
            let req_count: i64 = row.get(6)?;
            let total_size: i64 = row.get(7)?;

            Ok(HttpSessionSummary {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                is_active: is_active_int == 1,
                description: row.get(5)?,
                request_count: req_count as usize,
                total_size_bytes: total_size as usize,
            })
        })?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    pub fn get_active_http_session(&self) -> SqlResult<Option<HttpSessionRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, created_at, updated_at, is_active, description FROM http_sessions WHERE is_active = 1 LIMIT 1",
        )?;
        let mut rows = stmt.query([])?;

        if let Some(row) = rows.next()? {
            let is_active_int: i64 = row.get(4)?;
            Ok(Some(HttpSessionRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                is_active: is_active_int == 1,
                description: row.get(5)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub(crate) fn get_active_session_id(conn: &rusqlite::Connection) -> Option<String> {
        conn.query_row(
            "SELECT id FROM http_sessions WHERE is_active = 1 LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok()
    }

    pub fn set_active_http_session(&self, session_id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE http_sessions SET is_active = 0", [])?;
        let rows = conn.execute(
            "UPDATE http_sessions SET is_active = 1, updated_at = ?1 WHERE id = ?2",
            params![chrono::Utc::now().to_rfc3339(), session_id],
        )?;

        if rows == 0 {
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }
        Ok(())
    }

    pub fn rename_http_session(&self, session_id: &str, name: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE http_sessions SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![name.trim(), now, session_id],
        )?;
        Ok(())
    }

    pub fn clear_http_session_logs(&self, session_id: &str) -> SqlResult<usize> {
        let conn = self.conn.lock().unwrap();
        let rows = conn.execute("DELETE FROM http_logs WHERE session_id = ?1", params![session_id])?;
        let _ = conn.execute("DELETE FROM websocket_messages WHERE connection_id IN (SELECT id FROM websocket_connections WHERE session_id = ?1)", params![session_id]);
        let _ = conn.execute("DELETE FROM websocket_connections WHERE session_id = ?1", params![session_id]);
        drop(conn);

        // Run vacuum to reclaim deleted BLOBs space
        let _ = self.vacuum();
        Ok(rows)
    }

    pub fn delete_http_session(&self, session_id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        
        // Find if this was the active session
        let was_active: bool = conn
            .query_row(
                "SELECT is_active FROM http_sessions WHERE id = ?1",
                params![session_id],
                |row| {
                    let v: i64 = row.get(0)?;
                    Ok(v == 1)
                },
            )
            .unwrap_or(false);

        // Delete the session; cascade will delete http_logs & websockets
        conn.execute("DELETE FROM http_logs WHERE session_id = ?1", params![session_id])?;
        conn.execute("DELETE FROM websocket_connections WHERE session_id = ?1", params![session_id])?;
        conn.execute("DELETE FROM http_sessions WHERE id = ?1", params![session_id])?;

        // If the active session was deleted, make the latest remaining session active or create a new one
        if was_active {
            let next_id: Option<String> = conn
                .query_row(
                    "SELECT id FROM http_sessions ORDER BY created_at DESC LIMIT 1",
                    [],
                    |row| row.get(0),
                )
                .ok();

            if let Some(nid) = next_id {
                conn.execute(
                    "UPDATE http_sessions SET is_active = 1 WHERE id = ?1",
                    params![nid],
                )?;
            } else {
                let id = uuid::Uuid::new_v4().to_string();
                let now = chrono::Utc::now().to_rfc3339();
                let name = format!("Session - {}", chrono::Local::now().format("%d %b %H:%M"));
                conn.execute(
                    "INSERT INTO http_sessions (id, name, created_at, updated_at, is_active, description) VALUES (?1, ?2, ?3, ?4, 1, 'Default session')",
                    params![id, name, now, now],
                )?;
            }
        }

        drop(conn);

        // Reclaim disk space
        let _ = self.vacuum();
        Ok(())
    }

    pub fn vacuum(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("VACUUM", [])?;
        Ok(())
    }

    /// Ensures at least one active session exists on startup and backfills legacy data
    pub fn ensure_default_http_session(conn: &Connection) -> SqlResult<String> {
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM http_sessions", [], |r| r.get(0))?;

        let active_id: Option<String> = conn
            .query_row(
                "SELECT id FROM http_sessions WHERE is_active = 1 LIMIT 1",
                [],
                |r| r.get(0),
            )
            .ok();

        let session_id = match (count, active_id) {
            (0, _) => {
                let id = uuid::Uuid::new_v4().to_string();
                let now = chrono::Utc::now().to_rfc3339();
                let name = format!("Session - {}", chrono::Local::now().format("%d %b %H:%M"));
                conn.execute(
                    "INSERT INTO http_sessions (id, name, created_at, updated_at, is_active, description) VALUES (?1, ?2, ?3, ?4, 1, 'Default session')",
                    params![id, name, now, now],
                )?;
                id
            }
            (_, Some(id)) => id,
            (_, None) => {
                let latest_id: String = conn.query_row(
                    "SELECT id FROM http_sessions ORDER BY created_at DESC LIMIT 1",
                    [],
                    |r| r.get(0),
                )?;
                conn.execute("UPDATE http_sessions SET is_active = 1 WHERE id = ?1", params![latest_id])?;
                latest_id
            }
        };

        // Backfill legacy logs that have empty session_id
        conn.execute(
            "UPDATE http_logs SET session_id = ?1 WHERE session_id IS NULL OR session_id = ''",
            params![session_id],
        )?;
        conn.execute(
            "UPDATE websocket_connections SET session_id = ?1 WHERE session_id IS NULL OR session_id = ''",
            params![session_id],
        )?;

        Ok(session_id)
    }
}
