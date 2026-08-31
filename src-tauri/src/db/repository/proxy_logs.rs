use crate::proxy::state::{ProxyFilter, ProxyRecord, ProxyRequest, ProxyResponse};
use rusqlite::{params, Result as SqlResult};
use uuid::Uuid;

use super::types::{PaginatedResponse, ProxySummaryRow, TreeNode, TreePath};
use super::Database;

fn build_scope_sql_clause(scope: &[String]) -> Option<String> {
    let scope_clauses: Vec<String> = scope
        .iter()
        .filter_map(|pattern| {
            let value = pattern.trim();
            if value.is_empty() {
                return None;
            }

            let clean = value
                .trim_start_matches("http://")
                .trim_start_matches("https://")
                .trim_start_matches("*.")
                .trim_end_matches('/');

            if clean.is_empty() {
                return None;
            }

            let domain_no_port = clean.split(':').next().unwrap_or(clean);

            Some(format!(
                "(url LIKE '%{clean}%' OR url LIKE '%{domain_no_port}%' OR server_addr LIKE '%{clean}%' OR server_addr LIKE '%{domain_no_port}%')",
                clean = clean,
                domain_no_port = domain_no_port
            ))
        })
        .collect();

    if scope_clauses.is_empty() {
        None
    } else {
        Some(format!(" AND ({})", scope_clauses.join(" OR ")))
    }
}

const SELECT_PROXY_RECORD_COLS: &str = "id, timestamp, method, url, request_headers, request_body, response_status, response_status_text, response_headers, response_body, client_addr, server_addr";

impl Database {
    pub fn insert_log(&self, record: &ProxyRecord, session_id: Option<&str>) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let target_session_id = match session_id {
            Some(s) if !s.trim().is_empty() => s.trim().to_string(),
            _ => Self::ensure_default_http_session(&conn)?,
        };

        let request_headers = serde_json::to_string(&record.request.headers).unwrap_or_default();
        let response_headers = record
            .response
            .as_ref()
            .map(|r| serde_json::to_string(&r.headers).unwrap_or_default())
            .unwrap_or_default();

        conn.execute(
            r#"INSERT INTO http_logs (
                id, session_id, timestamp, method, url,
                request_headers, request_body,
                response_status, response_status_text,
                response_headers, response_body,
                client_addr, server_addr, duration_ms
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"#,
            params![
                record.id.to_string(),
                target_session_id,
                record.timestamp.to_rfc3339(),
                record.request.method,
                record.request.uri,
                request_headers,
                record.request.body,
                record.response.as_ref().map(|r| r.status_code as i64),
                record.response.as_ref().map(|r| r.status_text.clone()),
                response_headers,
                record.response.as_ref().map(|r| r.body.clone()),
                record.client_addr,
                record.server_addr,
                0i64, // duration_ms placeholder
            ],
        )?;
        Ok(())
    }

    pub fn insert_logs_batch(&self, records: &[(ProxyRecord, Option<String>)]) -> SqlResult<()> {
        if records.is_empty() {
            return Ok(());
        }
        let mut conn = self.conn.lock().unwrap();
        let default_session = Self::ensure_default_http_session(&conn)?;
        let tx = conn.transaction()?;
        {
            let mut stmt = tx.prepare_cached(
                r#"INSERT INTO http_logs (
                    id, session_id, timestamp, method, url,
                    request_headers, request_body,
                    response_status, response_status_text,
                    response_headers, response_body,
                    client_addr, server_addr, duration_ms
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)"#,
            )?;
            for (record, session_id) in records {
                let target_session_id = match session_id.as_deref() {
                    Some(s) if !s.trim().is_empty() => s.trim(),
                    _ => &default_session,
                };
                let request_headers = serde_json::to_string(&record.request.headers).unwrap_or_default();
                let response_headers = record
                    .response
                    .as_ref()
                    .map(|r| serde_json::to_string(&r.headers).unwrap_or_default())
                    .unwrap_or_default();

                stmt.execute(params![
                    record.id.to_string(),
                    target_session_id,
                    record.timestamp.to_rfc3339(),
                    record.request.method,
                    record.request.uri,
                    request_headers,
                    record.request.body,
                    record.response.as_ref().map(|r| r.status_code as i64),
                    record.response.as_ref().map(|r| r.status_text.clone()),
                    response_headers,
                    record.response.as_ref().map(|r| r.body.clone()),
                    record.client_addr,
                    record.server_addr,
                    0i64,
                ])?;
            }
        }
        tx.commit()?;
        Ok(())
    }

    pub fn get_all(&self) -> SqlResult<Vec<ProxyRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(&format!("SELECT {} FROM http_logs ORDER BY timestamp DESC", SELECT_PROXY_RECORD_COLS))?;
        let rows = stmt.query_map([], row_to_proxy_record)?;

        Ok(collect_records(rows))
    }

    pub fn get_filtered(&self, filter: &ProxyFilter) -> SqlResult<Vec<ProxyRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut sql = format!("SELECT {} FROM http_logs WHERE 1=1", SELECT_PROXY_RECORD_COLS);
        let mut conditions = Vec::new();

        if let Some(ref session_id) = filter.session_id {
            if !session_id.is_empty() {
                conditions.push(format!("session_id = '{}'", session_id.replace('\'', "''")));
            }
        }

        if let Some(ref search) = filter.search {
            if !search.is_empty() {
                conditions.push(format!(
                    "(url LIKE '%{}%' OR method LIKE '%{}%' OR server_addr LIKE '%{}%' OR request_headers LIKE '%{}%')",
                    search, search, search, search
                ));
            }
        }

        if let Some(ref path) = filter.path {
            if !path.is_empty() {
                conditions.push(format!("url LIKE '%{}%'", path));
            }
        }

        if let Some(ref methods) = filter.methods {
            if !methods.is_empty() {
                let method_list: Vec<String> = methods.iter().map(|m| format!("'{}'", m)).collect();
                conditions.push(format!("method IN ({})", method_list.join(",")));
            }
        }

        if let Some(ref status_codes) = filter.status_codes {
            if !status_codes.is_empty() {
                let status_list: Vec<String> = status_codes.iter().map(|s| s.to_string()).collect();
                conditions.push(format!("response_status IN ({})", status_list.join(",")));
            }
        }

        if !conditions.is_empty() {
            sql.push_str(" AND ");
            sql.push_str(&conditions.join(" AND "));
        }

        sql.push_str(" ORDER BY timestamp DESC");

        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map([], row_to_proxy_record)?;

        Ok(collect_records(rows))
    }

    pub fn delete_log(&self, id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM http_logs WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_by_id(&self, id: &str) -> SqlResult<Option<ProxyRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(&format!("SELECT {} FROM http_logs WHERE id = ?1 LIMIT 1", SELECT_PROXY_RECORD_COLS))?;
        let mut rows = stmt.query(params![id])?;

        match rows.next()? {
            Some(row) => row_to_proxy_record(row).map(Some),
            None => Ok(None),
        }
    }

    pub fn clear_logs(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM http_logs", [])?;
        drop(conn);
        let _ = self.vacuum();
        Ok(())
    }

    pub fn clear_logs_before(&self, cutoff_rfc3339: &str) -> SqlResult<usize> {
        let conn = self.conn.lock().unwrap();
        let rows = conn.execute(
            "DELETE FROM http_logs WHERE timestamp < ?1",
            params![cutoff_rfc3339],
        )?;
        let _ = conn.execute(
            "DELETE FROM websocket_messages WHERE timestamp < ?1",
            params![cutoff_rfc3339],
        );
        let _ = conn.execute(
            "DELETE FROM websocket_connections WHERE timestamp < ?1",
            params![cutoff_rfc3339],
        );
        drop(conn);
        let _ = self.vacuum();
        Ok(rows)
    }

    pub fn get_paginated(
        &self,
        session_id: Option<&str>,
        page: u32,
        per_page: u32,
        sort_order: &str,
    ) -> Result<PaginatedResponse<ProxyRecord>, String> {
        let conn = self.conn.lock().unwrap();
        let offset = (page - 1) * per_page;

        let (where_clause, params_vec): (String, Vec<Box<dyn rusqlite::ToSql>>) = match session_id {
            Some(sid) if !sid.is_empty() => (" WHERE session_id = ?".to_string(), vec![Box::new(sid.to_string())]),
            _ => (String::new(), Vec::new()),
        };

        let mut stmt = conn
            .prepare(&format!(
                "SELECT {} FROM http_logs{} ORDER BY timestamp {} LIMIT ? OFFSET ?",
                SELECT_PROXY_RECORD_COLS, where_clause, sort_order
            ))
            .map_err(|e| e.to_string())?;

        let per_page_i64 = per_page as i64;
        let offset_i64 = offset as i64;
        let mut all_params: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
        all_params.push(&per_page_i64 as &dyn rusqlite::ToSql);
        all_params.push(&offset_i64 as &dyn rusqlite::ToSql);

        let rows = stmt
            .query_map(all_params.as_slice(), row_to_proxy_record)
            .map_err(|e| e.to_string())?;

        let records = collect_records(rows);

        let count_sql = format!("SELECT COUNT(*) FROM http_logs{}", where_clause);
        let count_params: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
        let total: i64 = conn
            .query_row(&count_sql, count_params.as_slice(), |row| row.get(0))
            .map_err(|e| e.to_string())?;

        let has_more = (offset as usize + records.len()) < total as usize;

        Ok(PaginatedResponse {
            data: records,
            total: total as usize,
            page,
            per_page,
            has_more,
        })
    }

    /// Optimized paginated query that skips request/response BLOBs and headers.
    pub fn get_summary_paginated(
        &self,
        session_id: Option<&str>,
        page: u32,
        per_page: u32,
        sort_order: &str,
    ) -> Result<PaginatedResponse<ProxySummaryRow>, String> {
        let conn = self.conn.lock().unwrap();
        let offset = (page - 1) * per_page;
        let limit = per_page + 1;

        let (where_clause, params_vec): (String, Vec<Box<dyn rusqlite::ToSql>>) = match session_id {
            Some(sid) if !sid.is_empty() => (" WHERE session_id = ?".to_string(), vec![Box::new(sid.to_string())]),
            _ => (String::new(), Vec::new()),
        };

        let sql = format!(
            "SELECT id, session_id, timestamp, method, url, response_status, response_status_text,
                    COALESCE(LENGTH(request_body), 0),
                    COALESCE(LENGTH(response_body), 0),
                    COALESCE(server_addr, ''),
                    request_headers,
                    response_headers
             FROM http_logs{}
             ORDER BY timestamp {} LIMIT ? OFFSET ?",
            where_clause, sort_order
        );

        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let limit_i64 = limit as i64;
        let offset_i64 = offset as i64;
        let mut all_params: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
        all_params.push(&limit_i64 as &dyn rusqlite::ToSql);
        all_params.push(&offset_i64 as &dyn rusqlite::ToSql);

        let mut rows = stmt
            .query(all_params.as_slice())
            .map_err(|e| e.to_string())?;
        let mut records: Vec<ProxySummaryRow> = Vec::new();
        while let Some(row) = rows.next().map_err(|e| e.to_string())? {
            records.push(row_to_proxy_summary(row).map_err(|e| e.to_string())?);
        }

        let has_more = records.len() > per_page as usize;
        if has_more {
            records.pop();
        }

        let total = if has_more {
            offset as usize + records.len() + 1
        } else {
            offset as usize + records.len()
        };

        Ok(PaginatedResponse {
            data: records,
            total,
            page,
            per_page,
            has_more,
        })
    }

    /// Optimized filtered paginated query that skips request/response BLOBs.
    pub fn get_filtered_summary_paginated(
        &self,
        filter: &ProxyFilter,
        page: u32,
        per_page: u32,
        sort_order: &str,
    ) -> Result<PaginatedResponse<ProxySummaryRow>, String> {
        let conn = self.conn.lock().unwrap();
        let offset = (page - 1) * per_page;

        let mut where_sql = String::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(ref sid) = filter.session_id {
            if !sid.is_empty() {
                where_sql.push_str(" AND session_id = ?");
                params_vec.push(Box::new(sid.clone()));
            }
        }

        if let Some(ref search) = filter.search {
            if !search.is_empty() {
                let search_pattern = format!("%{}%", search);
                where_sql.push_str(" AND (url LIKE ? OR method LIKE ? OR server_addr LIKE ? OR request_headers LIKE ?)");
                params_vec.push(Box::new(search_pattern.clone()));
                params_vec.push(Box::new(search_pattern.clone()));
                params_vec.push(Box::new(search_pattern.clone()));
                params_vec.push(Box::new(search_pattern));
            }
        }

        if let Some(ref path) = filter.path {
            if !path.is_empty() {
                where_sql.push_str(" AND url LIKE ?");
                params_vec.push(Box::new(format!("%{}%", path)));
            }
        }

        if let Some(ref methods) = filter.methods {
            if !methods.is_empty() {
                where_sql.push_str(" AND method IN (");
                for (i, m) in methods.iter().enumerate() {
                    if i > 0 {
                        where_sql.push_str(", ");
                    }
                    where_sql.push('?');
                    params_vec.push(Box::new(m.clone()));
                }
                where_sql.push(')');
            }
        }

        if let Some(ref status_codes) = filter.status_codes {
            if !status_codes.is_empty() {
                where_sql.push_str(" AND response_status IN (");
                for (i, s) in status_codes.iter().enumerate() {
                    if i > 0 {
                        where_sql.push_str(", ");
                    }
                    where_sql.push('?');
                    params_vec.push(Box::new(*s as i64));
                }
                where_sql.push(')');
            }
        }

        if let Some(ref scope) = filter.scope {
            if let Some(clause) = build_scope_sql_clause(scope) {
                where_sql.push_str(&clause);
            }
        }

        let limit = per_page + 1;
        let limit_i64 = limit as i64;
        let offset_i64 = offset as i64;

        let data_sql = format!(
            "SELECT id, session_id, timestamp, method, url, response_status, response_status_text,
                    COALESCE(LENGTH(request_body), 0),
                    COALESCE(LENGTH(response_body), 0),
                    COALESCE(server_addr, ''),
                    request_headers,
                    response_headers
             FROM http_logs WHERE 1=1{}
             ORDER BY timestamp {} LIMIT ? OFFSET ?",
            where_sql, sort_order
        );

        let mut stmt = conn.prepare(&data_sql).map_err(|e| e.to_string())?;
        let mut all_params: Vec<&dyn rusqlite::ToSql> =
            params_vec.iter().map(|b| b.as_ref()).collect();
        all_params.push(&limit_i64 as &dyn rusqlite::ToSql);
        all_params.push(&offset_i64 as &dyn rusqlite::ToSql);

        let mut rows = stmt
            .query(all_params.as_slice())
            .map_err(|e| e.to_string())?;
        let mut records: Vec<ProxySummaryRow> = Vec::new();
        while let Some(row) = rows.next().map_err(|e| e.to_string())? {
            records.push(row_to_proxy_summary(row).map_err(|e| e.to_string())?);
        }

        let has_more = records.len() > per_page as usize;
        if has_more {
            records.pop();
        }

        let total = if has_more {
            offset as usize + records.len() + 1
        } else {
            offset as usize + records.len()
        };

        Ok(PaginatedResponse {
            data: records,
            total,
            page,
            per_page,
            has_more,
        })
    }

    pub fn count(&self, session_id: Option<&str>) -> Result<usize, String> {
        let conn = self.conn.lock().unwrap();
        let (sql, params_vec): (String, Vec<Box<dyn rusqlite::ToSql>>) = match session_id {
            Some(sid) if !sid.is_empty() => ("SELECT COUNT(*) FROM http_logs WHERE session_id = ?".to_string(), vec![Box::new(sid.to_string())]),
            _ => ("SELECT COUNT(*) FROM http_logs".to_string(), Vec::new()),
        };
        let params_ref: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
        let total: i64 = conn
            .query_row(&sql, params_ref.as_slice(), |row| row.get(0))
            .map_err(|e| e.to_string())?;
        Ok(total as usize)
    }

    pub fn get_tree(&self, filter: &ProxyFilter) -> Result<Vec<TreeNode>, String> {
        let conn = self.conn.lock().unwrap();

        let mut sql = String::from("SELECT url, method FROM http_logs WHERE 1=1");
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(ref sid) = filter.session_id {
            if !sid.is_empty() {
                sql.push_str(" AND session_id = ?");
                params_vec.push(Box::new(sid.clone()));
            }
        }

        if let Some(ref search) = filter.search {
            if !search.is_empty() {
                let search_pattern = format!("%{}%", search);
                sql.push_str(" AND (url LIKE ? OR method LIKE ? OR server_addr LIKE ? OR request_headers LIKE ?)");
                params_vec.push(Box::new(search_pattern.clone()));
                params_vec.push(Box::new(search_pattern.clone()));
                params_vec.push(Box::new(search_pattern.clone()));
                params_vec.push(Box::new(search_pattern));
            }
        }

        if let Some(ref path) = filter.path {
            if !path.is_empty() {
                sql.push_str(" AND url LIKE ?");
                params_vec.push(Box::new(format!("%{}%", path)));
            }
        }

        if let Some(ref methods) = filter.methods {
            if !methods.is_empty() {
                sql.push_str(" AND method IN (");
                for (i, m) in methods.iter().enumerate() {
                    if i > 0 {
                        sql.push_str(", ");
                    }
                    sql.push('?');
                    params_vec.push(Box::new(m.clone()));
                }
                sql.push(')');
            }
        }

        if let Some(ref status_codes) = filter.status_codes {
            if !status_codes.is_empty() {
                sql.push_str(" AND response_status IN (");
                for (i, s) in status_codes.iter().enumerate() {
                    if i > 0 {
                        sql.push_str(", ");
                    }
                    sql.push('?');
                    params_vec.push(Box::new(*s as i64));
                }
                sql.push(')');
            }
        }

        if let Some(ref scope) = filter.scope {
            if let Some(clause) = build_scope_sql_clause(scope) {
                sql.push_str(&clause);
            }
        }

        let all_params: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(all_params.as_slice(), |row| {
                let url: String = row.get(0)?;
                let method: String = row.get(1)?;
                Ok((url, method))
            })
            .map_err(|e| e.to_string())?;

        #[derive(Default)]
        struct PathInfo {
            url: String,
            count: u32,
            methods: std::collections::HashSet<String>,
        }

        let mut host_paths: std::collections::HashMap<
            String,
            std::collections::HashMap<String, PathInfo>,
        > = Default::default();

        for row in rows {
            let (url, method) = row.map_err(|e| e.to_string())?;
            let uri = if url.contains("://") {
                match url.split("://").nth(1) {
                    Some(u) => u,
                    _ => &url,
                }
            } else {
                &url
            };
            let host = uri.split('/').next().unwrap_or("");

            let host_entry = host_paths.entry(host.to_string()).or_default();
            let path_entry = host_entry
                .entry(url.to_string())
                .or_insert_with(|| PathInfo {
                    url,
                    ..Default::default()
                });
            path_entry.count += 1;
            path_entry.methods.insert(method);
        }

        let mut tree: Vec<TreeNode> = Vec::new();
        let mut hosts: Vec<_> = host_paths.into_iter().collect();
        hosts.sort_by(|a, b| a.0.cmp(&b.0));

        for (host, paths_map) in hosts {
            let mut paths_vec: Vec<TreePath> = Vec::new();
            let mut paths: Vec<_> = paths_map.into_iter().collect();
            paths.sort_by(|a, b| b.1.count.cmp(&a.1.count));

            for (_url, info) in paths {
                let mut methods: Vec<String> = info.methods.into_iter().collect();
                methods.sort();
                let uri = if info.url.contains("://") {
                    match info.url.split("://").nth(1) {
                        Some(u) => u,
                        _ => &info.url,
                    }
                } else {
                    &info.url
                };
                let path = uri.strip_prefix(&host).unwrap_or("/");
                let path = if path.is_empty() { "/" } else { path };
                paths_vec.push(TreePath {
                    path: path.to_string(),
                    url: info.url,
                    count: info.count,
                    methods,
                });
            }

            tree.push(TreeNode {
                host,
                paths: paths_vec,
            });
        }

        Ok(tree)
    }
}

fn row_to_proxy_record(row: &rusqlite::Row) -> SqlResult<ProxyRecord> {
    let id: String = row.get(0)?;
    let timestamp: String = row.get(1)?;
    let method: String = row.get(2)?;
    let url: String = row.get(3)?;
    let request_headers: Option<String> = row.get(4)?;
    let request_body: Option<Vec<u8>> = row.get(5)?;
    let response_status: Option<i64> = row.get(6)?;
    let response_status_text: Option<String> = row.get(7)?;
    let response_headers: Option<String> = row.get(8)?;
    let response_body: Option<Vec<u8>> = row.get(9)?;
    let client_addr: Option<String> = row.get(10)?;
    let server_addr: Option<String> = row.get(11)?;

    let mut request = ProxyRequest {
        method,
        uri: url,
        http_version: String::from("HTTP/1.1"),
        headers: request_headers
            .as_deref()
            .map(serde_json::from_str)
            .transpose()
            .unwrap_or_default()
            .unwrap_or_default(),
        body: request_body.unwrap_or_default(),
        content_decoded: false,
    };

    if !request.content_decoded
        && !request.body.is_empty()
        && request
            .headers
            .keys()
            .any(|k| k.eq_ignore_ascii_case("content-encoding"))
    {
        request.content_decoded = true;
    }

    let mut response = response_status.map(|status| ProxyResponse {
        status_code: status as u16,
        status_text: response_status_text.unwrap_or_default(),
        http_version: String::from("HTTP/1.1"),
        headers: response_headers
            .as_deref()
            .map(serde_json::from_str)
            .transpose()
            .unwrap_or_default()
            .unwrap_or_default(),
        body: response_body.unwrap_or_default(),
        content_decoded: false,
    });

    if let Some(ref mut resp) = response {
        if !resp.content_decoded
            && !resp.body.is_empty()
            && resp
                .headers
                .keys()
                .any(|k| k.eq_ignore_ascii_case("content-encoding"))
        {
            resp.content_decoded = true;
        }
    }

    Ok(ProxyRecord {
        id: Uuid::parse_str(&id).map_err(|_| rusqlite::Error::InvalidQuery)?,
        timestamp: chrono::DateTime::parse_from_rfc3339(&timestamp)
            .map_err(|_| rusqlite::Error::InvalidQuery)?
            .with_timezone(&chrono::Utc),
        request,
        response,
        client_addr: client_addr.unwrap_or_default(),
        server_addr: server_addr.unwrap_or_default(),
    })
}

fn row_to_proxy_summary(row: &rusqlite::Row) -> SqlResult<ProxySummaryRow> {
    let session_id: String = row.get(1).unwrap_or_default();
    let req_headers_raw: Option<String> = row.get(10).ok();
    let res_headers_str: Option<String> = row.get(11).ok();

    let mut user_agent = None;
    let mut referrer = None;
    let mut host = None;

    if let Some(ref h_str) = req_headers_raw {
        if let Ok(map) = serde_json::from_str::<std::collections::HashMap<String, String>>(h_str) {
            for (k, v) in map {
                let lower = k.to_lowercase();
                if host.is_none() && (lower == "host" || lower == ":authority" || lower == "x-forwarded-host") {
                    let trimmed = v.trim();
                    if !trimmed.is_empty() {
                        host = Some(trimmed.to_string());
                    }
                }
                if user_agent.is_none() && lower == "user-agent" {
                    let trimmed = v.trim();
                    if !trimmed.is_empty() {
                        user_agent = Some(trimmed.to_string());
                    }
                }
                if referrer.is_none() && (lower == "referer" || lower == "referrer") {
                    let trimmed = v.trim();
                    if !trimmed.is_empty() {
                        referrer = Some(trimmed.to_string());
                    }
                }
            }
        }
    }

    let response_content_type = res_headers_str.as_ref().and_then(|h_str| {
        if let Ok(map) = serde_json::from_str::<std::collections::HashMap<String, String>>(h_str) {
            map.into_iter()
                .find(|(k, _)| k.eq_ignore_ascii_case("content-type"))
                .map(|(_, v)| v)
        } else {
            None
        }
    });

    Ok(ProxySummaryRow {
        id: row.get(0)?,
        session_id,
        timestamp: row.get(2)?,
        method: row.get(3)?,
        url: row.get(4)?,
        response_status: row.get::<_, Option<i64>>(5)?.map(|v| v as u16),
        response_status_text: row.get(6)?,
        request_body_size: row.get::<_, i64>(7)? as usize,
        response_body_size: row.get::<_, i64>(8)? as usize,
        server_addr: row.get(9)?,
        user_agent,
        host,
        response_content_type,
    })
}

fn collect_records<T, I>(rows: I) -> Vec<T>
where
    I: IntoIterator<Item = SqlResult<T>>,
{
    let mut records = Vec::new();

    for row in rows {
        match row {
            Ok(record) => records.push(record),
            Err(err) => eprintln!("[db] skipping malformed http_logs row: {}", err),
        }
    }

    records
}
