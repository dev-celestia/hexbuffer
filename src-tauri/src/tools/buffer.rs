use std::sync::{Arc, Mutex};

/// Proxy network buffer state owned by main app runtime
#[derive(Debug, Clone)]
pub struct ProxyBufferState {
    pub max_buffer_size: usize,
    pub active_buffers: Arc<Mutex<Vec<String>>>,
}

impl ProxyBufferState {
    pub fn new(max_buffer_size: usize) -> Self {
        Self {
            max_buffer_size,
            active_buffers: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn send_hex(&self, hex_data: &str, target_addr: &str) -> Result<String, String> {
        let byte_count = hex_data.len() / 2;
        if byte_count > self.max_buffer_size {
            return Err(format!(
                "Buffer limit exceeded: {} bytes exceeds max limit {}",
                byte_count, self.max_buffer_size
            ));
        }

        if let Ok(mut lock) = self.active_buffers.lock() {
            lock.push(format!("{target_addr}:{hex_data}"));
        }

        Ok(format!("Dispatched {byte_count} bytes hex payload to {target_addr}"))
    }
}
