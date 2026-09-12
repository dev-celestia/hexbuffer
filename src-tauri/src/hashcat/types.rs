//! Type definitions for the password hash auditing engine

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HashAlgorithm {
    Sha256,
    Md5,
    Sha1,
    Sha512,
    Sha224,
    Sha384,
    Blake3,
    Argon2,
    Bcrypt,
    Scrypt,
    Ntlm,
    #[serde(rename = "sha3-224")]
    Sha3_224,
    #[serde(rename = "sha3-256")]
    Sha3_256,
    #[serde(rename = "sha3-384")]
    Sha3_384,
    #[serde(rename = "sha3-512")]
    Sha3_512,
    Ripemd160,
}

impl std::str::FromStr for HashAlgorithm {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.trim().to_lowercase().replace('_', "-").as_str() {
            "sha256" | "sha-256" => Ok(HashAlgorithm::Sha256),
            "md5" => Ok(HashAlgorithm::Md5),
            "sha1" | "sha-1" => Ok(HashAlgorithm::Sha1),
            "sha512" | "sha-512" => Ok(HashAlgorithm::Sha512),
            "sha224" | "sha-224" => Ok(HashAlgorithm::Sha224),
            "sha384" | "sha-384" => Ok(HashAlgorithm::Sha384),
            "blake3" => Ok(HashAlgorithm::Blake3),
            "argon2" | "argon2id" | "argon2i" | "argon2d" => Ok(HashAlgorithm::Argon2),
            "bcrypt" => Ok(HashAlgorithm::Bcrypt),
            "scrypt" => Ok(HashAlgorithm::Scrypt),
            "ntlm" => Ok(HashAlgorithm::Ntlm),
            "sha3-224" => Ok(HashAlgorithm::Sha3_224),
            "sha3-256" => Ok(HashAlgorithm::Sha3_256),
            "sha3-384" => Ok(HashAlgorithm::Sha3_384),
            "sha3-512" => Ok(HashAlgorithm::Sha3_512),
            "ripemd160" | "ripemd-160" => Ok(HashAlgorithm::Ripemd160),
            _ => Err(format!("Unknown hash algorithm: {s}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharsetConfig {
    pub lower: bool,
    pub upper: bool,
    pub digits: bool,
    pub special: bool,
    #[serde(default)]
    pub custom: Option<String>,
}

impl Default for CharsetConfig {
    fn default() -> Self {
        Self {
            lower: true,
            upper: false,
            digits: true,
            special: false,
            custom: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "mode", rename_all = "lowercase")]
pub enum AttackMode {
    Straight {
        #[serde(rename = "wordlistPath")]
        wordlist_path: String,
    },
    Combinator {
        #[serde(rename = "leftWordlistPath")]
        left_wordlist_path: String,
        #[serde(rename = "rightWordlistPath")]
        right_wordlist_path: String,
    },
    Mask {
        pattern: String,
        charset: CharsetConfig,
    },
    Hybrid {
        #[serde(rename = "wordlistPath")]
        wordlist_path: String,
        mask: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetHashItem {
    pub id: String,
    pub hash: String,
    pub algorithm: HashAlgorithm,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttackConfig {
    pub mode: AttackMode,
    pub algorithm: HashAlgorithm,
    pub targets: Vec<TargetHashItem>,
    #[serde(default)]
    pub rules: Vec<String>,
    #[serde(default)]
    pub threads: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum AttackStatus {
    Idle,
    Running {
        #[serde(rename = "startedAt")]
        started_at: DateTime<Utc>,
    },
    Paused,
    Stopped,
    Completed {
        #[serde(rename = "finishedAt")]
        finished_at: DateTime<Utc>,
    },
    Error {
        error: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryData {
    pub hash_rate: f64,
    pub total_tested: u64,
    pub matches_found: u64,
    pub progress_percent: f64,
    pub elapsed_seconds: f64,
    pub eta_seconds: Option<f64>,
    pub cpu_utilization: f32,
    pub memory_usage: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrackedMatchRecord {
    pub id: String,
    pub hash: String,
    pub plaintext: String,
    pub algorithm: HashAlgorithm,
    pub cracked_at: DateTime<Utc>,
    pub attempts: u64,
}
