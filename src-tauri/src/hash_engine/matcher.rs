//! Fast O(1) hash matcher with potfile caching

use ahash::{AHashMap, AHashSet};
use parking_lot::Mutex;
use std::sync::Arc;

use super::types::{CrackedMatchRecord, TargetHashItem};

#[derive(Clone)]
pub struct HashMatcher {
    /// Normalized lowercase hex targets: hex -> TargetHashItem
    hex_targets: Arc<AHashMap<String, TargetHashItem>>,
    /// Raw bytes targets: raw_bytes -> TargetHashItem
    byte_targets: Arc<AHashMap<Vec<u8>, TargetHashItem>>,
    /// Set of target ids
    target_ids: Arc<AHashSet<String>>,
    /// Cracked matches potfile
    matches: Arc<Mutex<Vec<CrackedMatchRecord>>>,
}

impl HashMatcher {
    pub fn new(targets: Vec<TargetHashItem>) -> Self {
        let mut hex_map = AHashMap::new();
        let mut byte_map = AHashMap::new();
        let mut id_set = AHashSet::new();

        for target in targets {
            let normalized_hex = target.hash.trim().to_lowercase();
            id_set.insert(target.id.clone());
            hex_map.insert(normalized_hex.clone(), target.clone());

            if let Ok(bytes) = hex::decode(&normalized_hex) {
                byte_map.insert(bytes, target);
            }
        }

        Self {
            hex_targets: Arc::new(hex_map),
            byte_targets: Arc::new(byte_map),
            target_ids: Arc::new(id_set),
            matches: Arc::new(Mutex::new(Vec::new())),
        }
    }

    #[inline(always)]
    pub fn match_bytes(&self, hash_bytes: &[u8], plaintext: &str, attempts: u64) -> Option<CrackedMatchRecord> {
        if let Some(target) = self.byte_targets.get(hash_bytes) {
            let record = CrackedMatchRecord {
                id: target.id.clone(),
                hash: target.hash.clone(),
                plaintext: plaintext.to_string(),
                algorithm: target.algorithm,
                cracked_at: chrono::Utc::now(),
                attempts,
            };
            self.matches.lock().push(record.clone());
            return Some(record);
        }
        None
    }

    #[inline(always)]
    pub fn match_hex(&self, hex_str: &str, plaintext: &str, attempts: u64) -> Option<CrackedMatchRecord> {
        let normalized = hex_str.to_lowercase();
        if let Some(target) = self.hex_targets.get(&normalized) {
            let record = CrackedMatchRecord {
                id: target.id.clone(),
                hash: target.hash.clone(),
                plaintext: plaintext.to_string(),
                algorithm: target.algorithm,
                cracked_at: chrono::Utc::now(),
                attempts,
            };
            self.matches.lock().push(record.clone());
            return Some(record);
        }
        None
    }

    pub fn total_targets(&self) -> usize {
        self.target_ids.len()
    }

    pub fn total_cracked(&self) -> usize {
        self.matches.lock().len()
    }

    pub fn get_matches(&self) -> Vec<CrackedMatchRecord> {
        self.matches.lock().clone()
    }
}
