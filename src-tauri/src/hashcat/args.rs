//! Translates `AttackConfig` into hashcat command-line arguments.
//!
//! Mask semantics follow the previous native engine: a bare `?` in the mask
//! pattern is a wildcard filled from the combined charset, so the charset is
//! passed as custom charset 1 (`--custom-charset1`) and each `?` becomes `?1`.

use std::path::Path;

use crate::hash_engine::types::{AttackConfig, AttackMode, HashAlgorithm};

/// Maps an application algorithm to its hashcat `-m` mode number.
/// Returns `None` for algorithms hashcat has no generic mode for.
pub fn hashcat_mode(algorithm: HashAlgorithm) -> Option<u32> {
    Some(match algorithm {
        HashAlgorithm::Md5 => 0,
        HashAlgorithm::Sha1 => 100,
        HashAlgorithm::Ntlm => 1000,
        HashAlgorithm::Ripemd160 => 6000,
        HashAlgorithm::Sha224 => 1300,
        HashAlgorithm::Sha256 => 1400,
        HashAlgorithm::Sha512 => 1700,
        HashAlgorithm::Sha3_224 => 17300,
        HashAlgorithm::Sha3_256 => 17400,
        HashAlgorithm::Sha3_384 => 17500,
        HashAlgorithm::Sha3_512 => 17600,
        HashAlgorithm::Bcrypt => 3200,
        HashAlgorithm::Argon2 => 34000,
        HashAlgorithm::Blake3 | HashAlgorithm::Scrypt => return None,
    })
}

/// File paths handed to the argument builder for one run session.
pub struct AttackPaths {
    pub hash_file: &'static Path,
    pub rules_file: Option<&'static Path>,
    pub outfile: &'static Path,
}

pub fn build_args(
    config: &AttackConfig,
    hash_file: &Path,
    outfile: &Path,
    rules_file: Option<&Path>,
) -> Result<Vec<String>, String> {
    let mode = hashcat_mode(config.algorithm).ok_or_else(|| {
        format!(
            "{} is not supported by hashcat for cracking (no generic hash mode available)",
            algorithm_label(config.algorithm)
        )
    })?;

    let mut args: Vec<String> = vec![
        "-m".to_string(),
        mode.to_string(),
        "--status".to_string(),
        "--status-timer=2".to_string(),
        "--status-json".to_string(),
        "--potfile-disable".to_string(),
        "-o".to_string(),
        outfile.to_string_lossy().into_owned(),
    ];

    if let Some(rules_path) = rules_file {
        args.push("-r".to_string());
        args.push(rules_path.to_string_lossy().into_owned());
    }

    match &config.mode {
        AttackMode::Straight { wordlist_path } => {
            args.push("-a".to_string());
            args.push("0".to_string());
            args.push(hash_file.to_string_lossy().into_owned());
            args.push(wordlist_path.clone());
        }
        AttackMode::Combinator {
            left_wordlist_path,
            right_wordlist_path,
        } => {
            args.push("-a".to_string());
            args.push("1".to_string());
            args.push(hash_file.to_string_lossy().into_owned());
            args.push(left_wordlist_path.clone());
            args.push(right_wordlist_path.clone());
        }
        AttackMode::Mask { pattern, charset } => {
            let charset_str = build_charset_string(charset);
            args.push("-a".to_string());
            args.push("3".to_string());
            args.push(format!("--custom-charset1={charset_str}"));
            args.push(hash_file.to_string_lossy().into_owned());
            args.push(expand_wildcards(pattern, "?1"));
        }
        AttackMode::Hybrid { wordlist_path, mask } => {
            // The previous engine appended digits only for hybrid attacks.
            args.push("-a".to_string());
            args.push("6".to_string());
            args.push(hash_file.to_string_lossy().into_owned());
            args.push(wordlist_path.clone());
            args.push(expand_wildcards(mask, "?d"));
        }
    }

    Ok(args)
}

/// Mirrors the native engine's mask alphabet (hash_engine/candidate.rs).
pub fn build_charset_string(config: &crate::hash_engine::types::CharsetConfig) -> String {
    let mut chars = String::new();
    if config.lower {
        chars.push_str("abcdefghijklmnopqrstuvwxyz");
    }
    if config.upper {
        chars.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }
    if config.digits {
        chars.push_str("0123456789");
    }
    if config.special {
        chars.push_str("!@#$%^&*()-_=+[]{}|;:',.<>?/");
    }
    if let Some(custom) = &config.custom {
        chars.push_str(custom);
    }
    if chars.is_empty() {
        chars.push_str("abcdefghijklmnopqrstuvwxyz0123456789");
    }
    chars
}

/// Replaces every bare `?` wildcard in a mask pattern with the given
/// hashcat placeholder (e.g. `pin???` -> `pin?1?1?1`), mirroring the
/// previous engine where every `?` was a charset position.
fn expand_wildcards(pattern: &str, placeholder: &str) -> String {
    let mut expanded = String::with_capacity(pattern.len() + 8);
    for c in pattern.chars() {
        if c == '?' {
            expanded.push_str(placeholder);
        } else {
            expanded.push(c);
        }
    }
    expanded
}

fn algorithm_label(algorithm: HashAlgorithm) -> &'static str {
    match algorithm {
        HashAlgorithm::Sha256 => "SHA-256",
        HashAlgorithm::Md5 => "MD5",
        HashAlgorithm::Sha1 => "SHA-1",
        HashAlgorithm::Sha512 => "SHA-512",
        HashAlgorithm::Sha224 => "SHA-224",
        HashAlgorithm::Sha384 => "SHA-384",
        HashAlgorithm::Blake3 => "BLAKE3",
        HashAlgorithm::Argon2 => "Argon2",
        HashAlgorithm::Bcrypt => "bcrypt",
        HashAlgorithm::Scrypt => "scrypt",
        HashAlgorithm::Ntlm => "NTLM",
        HashAlgorithm::Sha3_224 => "SHA3-224",
        HashAlgorithm::Sha3_256 => "SHA3-256",
        HashAlgorithm::Sha3_384 => "SHA3-384",
        HashAlgorithm::Sha3_512 => "SHA3-512",
        HashAlgorithm::Ripemd160 => "RIPEMD-160",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hash_engine::types::{CharsetConfig, TargetHashItem};
    use std::path::PathBuf;

    fn sample_config(algorithm: HashAlgorithm, mode: AttackMode) -> AttackConfig {
        AttackConfig {
            mode,
            algorithm,
            targets: vec![TargetHashItem {
                id: "t1".to_string(),
                hash: "abc".to_string(),
                algorithm,
            }],
            rules: vec![],
            threads: None,
        }
    }

    #[test]
    fn test_hashcat_mode_numbers() {
        assert_eq!(hashcat_mode(HashAlgorithm::Md5), Some(0));
        assert_eq!(hashcat_mode(HashAlgorithm::Sha1), Some(100));
        assert_eq!(hashcat_mode(HashAlgorithm::Sha224), Some(1300));
        assert_eq!(hashcat_mode(HashAlgorithm::Sha256), Some(1400));
        assert_eq!(hashcat_mode(HashAlgorithm::Sha384), Some(10800));
        assert_eq!(hashcat_mode(HashAlgorithm::Sha512), Some(1700));
        assert_eq!(hashcat_mode(HashAlgorithm::Sha3_224), Some(17300));
        assert_eq!(hashcat_mode(HashAlgorithm::Sha3_256), Some(17400));
        assert_eq!(hashcat_mode(HashAlgorithm::Sha3_384), Some(17500));
        assert_eq!(hashcat_mode(HashAlgorithm::Sha3_512), Some(17600));
        assert_eq!(hashcat_mode(HashAlgorithm::Ripemd160), Some(6000));
        assert_eq!(hashcat_mode(HashAlgorithm::Ntlm), Some(1000));
        assert_eq!(hashcat_mode(HashAlgorithm::Bcrypt), Some(3200));
        assert_eq!(hashcat_mode(HashAlgorithm::Argon2), Some(34000));
        assert_eq!(hashcat_mode(HashAlgorithm::Blake3), None);
        assert_eq!(hashcat_mode(HashAlgorithm::Scrypt), None);
    }

    #[test]
    fn test_build_args_straight_with_rules() {
        let hash_file = PathBuf::from("/run/hashes.txt");
        let outfile = PathBuf::from("/run/out.txt");
        let rules_file = PathBuf::from("/run/custom.rule");
        let config = sample_config(
            HashAlgorithm::Md5,
            AttackMode::Straight {
                wordlist_path: "/wordlists/rockyou.txt".to_string(),
            },
        );

        let args =
            build_args(&config, &hash_file, &outfile, Some(&rules_file)).expect("valid args");

        assert!(args.contains(&"-m".to_string()) && args.contains(&"0".to_string()));
        assert!(args.contains(&"-a".to_string()) && args.contains(&"0".to_string()));
        assert!(args.contains(&"--status-json".to_string()));
        assert!(args.contains(&"--potfile-disable".to_string()));
        assert!(args.contains(&"-r".to_string()));
        assert!(args.contains(&"/run/custom.rule".to_string()));
        assert!(args.contains(&"/run/hashes.txt".to_string()));
        assert!(args.contains(&"/wordlists/rockyou.txt".to_string()));
        // Hash file must come immediately before the wordlist
        let hash_idx = args.iter().position(|a| a == "/run/hashes.txt").unwrap();
        let wl_idx = args
            .iter()
            .position(|a| a == "/wordlists/rockyou.txt")
            .unwrap();
        assert_eq!(hash_idx + 1, wl_idx);
    }

    #[test]
    fn test_build_args_mask_charset() {
        let hash_file = PathBuf::from("/run/hashes.txt");
        let outfile = PathBuf::from("/run/out.txt");
        let config = sample_config(
            HashAlgorithm::Ntlm,
            AttackMode::Mask {
                pattern: "pin???".to_string(),
                charset: CharsetConfig {
                    lower: false,
                    upper: false,
                    digits: true,
                    special: false,
                    custom: None,
                },
            },
        );

        let args = build_args(&config, &hash_file, &outfile, None).expect("valid args");
        assert!(args
            .iter()
            .any(|a| a == "--custom-charset1=0123456789"));
        assert!(args.contains(&"pin?1?1?1".to_string()));
    }

    #[test]
    fn test_build_args_hybrid_digits() {
        let hash_file = PathBuf::from("/run/hashes.txt");
        let outfile = PathBuf::from("/run/out.txt");
        let config = sample_config(
            HashAlgorithm::Sha256,
            AttackMode::Hybrid {
                wordlist_path: "/wordlists/base.txt".to_string(),
                mask: "??".to_string(),
            },
        );

        let args = build_args(&config, &hash_file, &outfile, None).expect("valid args");
        assert!(args.contains(&"6".to_string()));
        assert!(args.contains(&"?d?d".to_string()));
    }

    #[test]
    fn test_build_args_unsupported_algorithm() {
        let hash_file = PathBuf::from("/run/hashes.txt");
        let outfile = PathBuf::from("/run/out.txt");
        let config = sample_config(
            HashAlgorithm::Blake3,
            AttackMode::Straight {
                wordlist_path: "/wordlists/w.txt".to_string(),
            },
        );

        let result = build_args(&config, &hash_file, &outfile, None);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("BLAKE3"));
    }

    #[test]
    fn test_expand_wildcards_and_charset_default() {
        assert_eq!(expand_wildcards("pin???", "?1"), "pin?1?1?1");
        assert_eq!(expand_wildcards("no-mask", "?d"), "no-mask");
        let default_charset = build_charset_string(&CharsetConfig::default());
        assert!(default_charset.contains("abc"));
        assert!(default_charset.contains("0123456789"));
    }
}
