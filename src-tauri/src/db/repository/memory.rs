use rusqlite::{params, OptionalExtension, Result as SqlResult};

use super::types::MemoryEntry;
use super::Database;

fn vector_to_blob(vector: &[f64]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(vector.len() * 8);
    for value in vector {
        bytes.extend_from_slice(&value.to_le_bytes());
    }
    bytes
}

fn blob_to_vector(blob: &[u8]) -> Option<Vec<f64>> {
    if blob.len() % 8 != 0 {
        return None;
    }
    Some(
        blob.chunks_exact(8)
            .map(|chunk| f64::from_le_bytes(chunk.try_into().expect("8-byte chunk")))
            .collect(),
    )
}

const ENTRY_COLUMNS: &str = "id, title, content, tags, source_type, source_ref, url, pinned, \
     embedding, embedding_model, created_at, updated_at";

fn row_to_entry(row: &rusqlite::Row<'_>) -> SqlResult<MemoryEntry> {
    Ok(MemoryEntry {
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        tags: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or_default(),
        source_type: row.get(4)?,
        source_ref: row.get(5)?,
        url: row.get(6)?,
        pinned: row.get::<_, i64>(7)? != 0,
        embedding: row
            .get::<_, Option<Vec<u8>>>(8)?
            .and_then(|blob| blob_to_vector(&blob)),
        embedding_model: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

impl Database {
    pub fn upsert_memory_entry(&self, entry: &MemoryEntry) -> SqlResult<()> {
        let conn = self.conn.lock();
        let tags_json = serde_json::to_string(&entry.tags)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

        conn.execute(
            r#"INSERT INTO context_bank_entries (
                id, title, content, tags, source_type, source_ref, url, pinned,
                embedding, embedding_model, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                content = excluded.content,
                tags = excluded.tags,
                source_type = excluded.source_type,
                source_ref = excluded.source_ref,
                url = excluded.url,
                pinned = excluded.pinned,
                embedding = excluded.embedding,
                embedding_model = excluded.embedding_model,
                updated_at = excluded.updated_at"#,
            params![
                entry.id,
                entry.title,
                entry.content,
                tags_json,
                entry.source_type,
                entry.source_ref,
                entry.url,
                entry.pinned as i64,
                entry.embedding.as_ref().map(|v| vector_to_blob(v)),
                entry.embedding_model,
                entry.created_at,
                entry.updated_at,
            ],
        )?;

        Ok(())
    }

    pub fn update_memory_embedding(
        &self,
        entry_id: &str,
        embedding: &[f64],
        embedding_model: &str,
    ) -> SqlResult<()> {
        let conn = self.conn.lock();
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            r#"UPDATE context_bank_entries
               SET embedding = ?1, embedding_model = ?2, updated_at = ?3
               WHERE id = ?4"#,
            params![
                vector_to_blob(embedding),
                embedding_model,
                now,
                entry_id,
            ],
        )?;
        Ok(())
    }

    pub fn get_memory_entry(&self, entry_id: &str) -> SqlResult<Option<MemoryEntry>> {
        let conn = self.conn.lock();
        conn.query_row(
            &format!(
                r#"SELECT {ENTRY_COLUMNS} FROM context_bank_entries WHERE id = ?1"#
            ),
            params![entry_id],
            row_to_entry,
        )
        .optional()
    }

    pub fn delete_memory_entry(&self, entry_id: &str) -> SqlResult<usize> {
        let conn = self.conn.lock();
        conn.execute(
            "DELETE FROM context_bank_entries WHERE id = ?1",
            params![entry_id],
        )
    }

    pub fn set_memory_entry_pinned(
        &self,
        entry_id: &str,
        pinned: bool,
    ) -> SqlResult<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE context_bank_entries SET pinned = ?2, updated_at = ?3 WHERE id = ?1",
            params![
                entry_id,
                pinned as i64,
                chrono::Utc::now().to_rfc3339()
            ],
        )?;
        Ok(())
    }

    /// Lists entries for the management UI, optionally filtered by a LIKE query over
    /// title/content/tags. Pinned entries float to the top.
    pub fn list_memory_entries(
        &self,
        query: Option<String>,
    ) -> SqlResult<Vec<MemoryEntry>> {
        let conn = self.conn.lock();

        match query.as_deref().map(str::trim).filter(|q| !q.is_empty()) {
            Some(filter) => {
                let pattern = format!("%{}%", filter.replace('%', ""));
                let mut stmt = conn.prepare(&format!(
                    r#"SELECT {ENTRY_COLUMNS} FROM context_bank_entries
                       WHERE title LIKE ?1 OR content LIKE ?1 OR tags LIKE ?1
                       ORDER BY pinned DESC, updated_at DESC"#
                ))?;
                let rows = stmt
                    .query_map(params![pattern], row_to_entry)?
                    .collect::<SqlResult<Vec<_>>>()?;
                Ok(rows)
            }
            None => {
                let mut stmt = conn.prepare(&format!(
                    r#"SELECT {ENTRY_COLUMNS} FROM context_bank_entries
                       ORDER BY pinned DESC, updated_at DESC"#
                ))?;
                let rows = stmt
                    .query_map([], row_to_entry)?
                    .collect::<SqlResult<Vec<_>>>()?;
                Ok(rows)
            }
        }
    }

    /// Full-text keyword search (FTS5, BM25-ranked). `query` is a free-form user/model
    /// string; it is converted into a tolerant OR-of-quoted-terms MATCH expression.
    pub fn search_memory_keyword(
        &self,
        query: &str,
        limit: i64,
    ) -> SqlResult<Vec<MemoryEntry>> {
        let fts_query = build_fts_query(query);
        if fts_query.is_empty() {
            return Ok(Vec::new());
        }

        let conn = self.conn.lock();
        let mut stmt = conn.prepare(&format!(
            r#"SELECT {ENTRY_COLUMNS}
               FROM context_bank_entries e
               JOIN context_bank_fts f ON f.rowid = e.rowid
               WHERE context_bank_fts MATCH ?1
               ORDER BY bm25(context_bank_fts), e.pinned DESC
               LIMIT ?2"#
        ))?;
        let rows = stmt
            .query_map(params![fts_query, limit], row_to_entry)?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(rows)
    }

    /// All entries carrying a vector produced by `embedding_model`, for the
    /// in-memory vector store used at retrieval time.
    pub fn memory_entries_with_embeddings(
        &self,
        embedding_model: &str,
    ) -> SqlResult<Vec<MemoryEntry>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(&format!(
            r#"SELECT {ENTRY_COLUMNS} FROM context_bank_entries
               WHERE embedding IS NOT NULL AND embedding_model = ?1"#
        ))?;
        let rows = stmt
            .query_map(params![embedding_model], row_to_entry)?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(rows)
    }

    /// Entries without a vector for the current model (used by reindexing).
    pub fn memory_entries_missing_embeddings(
        &self,
        embedding_model: &str,
    ) -> SqlResult<Vec<MemoryEntry>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(&format!(
            r#"SELECT {ENTRY_COLUMNS} FROM context_bank_entries
               WHERE embedding IS NULL OR embedding_model IS NULL OR embedding_model != ?1"#
        ))?;
        let rows = stmt
            .query_map(params![embedding_model], row_to_entry)?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(rows)
    }

    pub fn count_memory_entries(&self) -> SqlResult<i64> {
        let conn = self.conn.lock();
        conn.query_row(
            "SELECT COUNT(*) FROM context_bank_entries",
            [],
            |row| row.get(0),
        )
    }
}

/// Builds a tolerant FTS5 MATCH expression: each alphanumeric term becomes a quoted
/// token, joined with OR. Returns an empty string when there is nothing to search.
fn build_fts_query(query: &str) -> String {
    let terms: Vec<String> = query
        .split(|c: char| !c.is_alphanumeric())
        .filter(|term| term.chars().count() >= 2)
        .map(|term| format!("\"{}\"", term.replace('"', "")))
        .collect();
    terms.join(" OR ")
}
