//! Hashcat-backed password cracking engine.
//!
//! Wraps the external `hashcat` binary and streams its status JSON and output
//! file back to the frontend over the `hash-*` event contract. Also hosts the
//! shared type contract with the frontend and the native single-hash
//! computation used by the calculator (`compute_single_hash`).

pub mod args;
pub mod binary;
pub mod engine;
pub mod hash_cpu;
pub mod types;

pub use engine::HashcatEngine;
pub use hash_cpu::compute_hash_string;
pub use types::{
    AttackConfig, AttackMode, AttackStatus, CharsetConfig, CrackedMatchRecord, HashAlgorithm,
    TargetHashItem, TelemetryData,
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha256_computation() {
        let input = b"password123";
        let hash = compute_hash_string(input, HashAlgorithm::Sha256);
        assert_eq!(
            hash,
            "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
        );
    }

    #[test]
    fn test_md5_computation() {
        let input = b"hello";
        let hash = compute_hash_string(input, HashAlgorithm::Md5);
        assert_eq!(hash, "5d41402abc4b2a76b9719d911017c592");
    }

    #[test]
    fn test_ntlm_computation() {
        let input = b"Password";
        let hash = compute_hash_string(input, HashAlgorithm::Ntlm);
        assert_eq!(hash, "a4f49c406510bdcab6824ee7c30fd852");
    }

    #[test]
    fn test_blake3_computation() {
        let input = b"test";
        let hash = compute_hash_string(input, HashAlgorithm::Blake3);
        assert!(!hash.is_empty());
        assert_eq!(hash.len(), 64);
    }
}
