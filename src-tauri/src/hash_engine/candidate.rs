//! Candidate password generation with memory-mapped wordlist streaming, mask, combinator, and hybrid modes

use std::fs::File;
use std::path::Path;

use memmap2::Mmap;

use super::rules::RuleSet;
use super::types::CharsetConfig;

pub enum CandidateSource {
    Wordlist { path: String },
    Combinator { left: String, right: String },
    Mask { pattern: String, charset: CharsetConfig },
    Hybrid { wordlist: String, mask: String },
}

pub struct CandidateBatchReader {
    source: CandidateSource,
    rules: Vec<RuleSet>,
}

impl CandidateBatchReader {
    pub fn new(source: CandidateSource, rules: Vec<RuleSet>) -> Self {
        Self { source, rules }
    }

    /// Process candidates in chunks and feed to a callback
    pub fn for_each_batch<F>(&self, batch_size: usize, callback: F) -> Result<(), String>
    where
        F: FnMut(&[Vec<u8>]) -> bool,
    {
        match &self.source {
            CandidateSource::Wordlist { path } => {
                self.stream_wordlist(path, batch_size, callback)
            }
            CandidateSource::Combinator { left, right } => {
                self.stream_combinator(left, right, batch_size, callback)
            }
            CandidateSource::Mask { pattern, charset } => {
                self.stream_mask(pattern, charset, batch_size, callback)
            }
            CandidateSource::Hybrid { wordlist, mask } => {
                self.stream_hybrid(wordlist, mask, batch_size, callback)
            }
        }
    }

    fn stream_wordlist<F>(&self, path: &str, batch_size: usize, mut callback: F) -> Result<(), String>
    where
        F: FnMut(&[Vec<u8>]) -> bool,
    {
        let file = File::open(Path::new(path)).map_err(|e| format!("Failed to open wordlist: {e}"))?;
        let mmap = unsafe { Mmap::map(&file).map_err(|e| format!("Failed to mmap wordlist: {e}"))? };
        let bytes = mmap.as_ref();

        let mut batch = Vec::with_capacity(batch_size);
        let mut start = 0;

        for (i, &b) in bytes.iter().enumerate() {
            if b == b'\n' || b == b'\r' {
                if i > start {
                    let line = &bytes[start..i];
                    if !line.is_empty() {
                        self.push_with_rules(line, &mut batch);
                        if batch.len() >= batch_size {
                            if !callback(&batch) {
                                return Ok(());
                            }
                            batch.clear();
                        }
                    }
                }
                start = i + 1;
            }
        }

        if start < bytes.len() {
            let line = &bytes[start..];
            if !line.is_empty() {
                self.push_with_rules(line, &mut batch);
            }
        }

        if !batch.is_empty() {
            let _ = callback(&batch);
        }

        Ok(())
    }

    fn stream_combinator<F>(&self, left_path: &str, right_path: &str, batch_size: usize, mut callback: F) -> Result<(), String>
    where
        F: FnMut(&[Vec<u8>]) -> bool,
    {
        let left_content = std::fs::read_to_string(left_path)
            .map_err(|e| format!("Failed to read left wordlist: {e}"))?;
        let right_content = std::fs::read_to_string(right_path)
            .map_err(|e| format!("Failed to read right wordlist: {e}"))?;

        let left_words: Vec<&str> = left_content.lines().filter(|l| !l.is_empty()).collect();
        let right_words: Vec<&str> = right_content.lines().filter(|l| !l.is_empty()).collect();

        let mut batch = Vec::with_capacity(batch_size);

        for l in &left_words {
            for r in &right_words {
                let mut combined = Vec::with_capacity(l.len() + r.len());
                combined.extend_from_slice(l.as_bytes());
                combined.extend_from_slice(r.as_bytes());

                self.push_with_rules(&combined, &mut batch);

                if batch.len() >= batch_size {
                    if !callback(&batch) {
                        return Ok(());
                    }
                    batch.clear();
                }
            }
        }

        if !batch.is_empty() {
            let _ = callback(&batch);
        }

        Ok(())
    }

    fn stream_mask<F>(&self, pattern: &str, charset: &CharsetConfig, batch_size: usize, mut callback: F) -> Result<(), String>
    where
        F: FnMut(&[Vec<u8>]) -> bool,
    {
        let charset_bytes = build_charset(charset);
        if charset_bytes.is_empty() {
            return Ok(());
        }

        let placeholders: Vec<usize> = pattern
            .char_indices()
            .filter_map(|(i, c)| if c == '?' { Some(i) } else { None })
            .collect();

        if placeholders.is_empty() {
            let mut batch = Vec::with_capacity(1);
            self.push_with_rules(pattern.as_bytes(), &mut batch);
            let _ = callback(&batch);
            return Ok(());
        }

        let total_chars = charset_bytes.len();
        let total_combinations = (total_chars as u64).pow(placeholders.len() as u32);
        let mut batch = Vec::with_capacity(batch_size);

        for n in 0..total_combinations {
            let mut current = pattern.as_bytes().to_vec();
            let mut val = n;

            for &pos in &placeholders {
                let idx = (val % total_chars as u64) as usize;
                val /= total_chars as u64;
                current[pos] = charset_bytes[idx];
            }

            self.push_with_rules(&current, &mut batch);

            if batch.len() >= batch_size {
                if !callback(&batch) {
                    return Ok(());
                }
                batch.clear();
            }
        }

        if !batch.is_empty() {
            let _ = callback(&batch);
        }

        Ok(())
    }

    fn stream_hybrid<F>(&self, wordlist_path: &str, mask: &str, batch_size: usize, mut callback: F) -> Result<(), String>
    where
        F: FnMut(&[Vec<u8>]) -> bool,
    {
        let file = File::open(Path::new(wordlist_path))
            .map_err(|e| format!("Failed to open hybrid wordlist: {e}"))?;
        let mmap = unsafe { Mmap::map(&file).map_err(|e| format!("Failed to mmap hybrid wordlist: {e}"))? };
        let bytes = mmap.as_ref();

        let mut batch = Vec::with_capacity(batch_size);
        let mut start = 0;

        let num_digits = mask.chars().filter(|&c| c == '?' || c == 'd').count().max(1);
        let total_permutations = 10u32.pow(num_digits.min(6) as u32);

        for (i, &b) in bytes.iter().enumerate() {
            if b == b'\n' || b == b'\r' {
                if i > start {
                    let line = &bytes[start..i];
                    if !line.is_empty() {
                        for p in 0..total_permutations {
                            let mut cand = line.to_vec();
                            let suffix = format!("{:0width$}", p, width = num_digits);
                            cand.extend_from_slice(suffix.as_bytes());

                            self.push_with_rules(&cand, &mut batch);

                            if batch.len() >= batch_size {
                                if !callback(&batch) {
                                    return Ok(());
                                }
                                batch.clear();
                            }
                        }
                    }
                }
                start = i + 1;
            }
        }

        if !batch.is_empty() {
            let _ = callback(&batch);
        }

        Ok(())
    }

    #[inline(always)]
    fn push_with_rules(&self, original: &[u8], batch: &mut Vec<Vec<u8>>) {
        if self.rules.is_empty() {
            batch.push(original.to_vec());
        } else {
            batch.push(original.to_vec());
            for rule in &self.rules {
                let mutated = rule.apply_to_vec(original);
                if mutated != original {
                    batch.push(mutated);
                }
            }
        }
    }
}

pub fn build_charset(config: &CharsetConfig) -> Vec<u8> {
    let mut chars = Vec::new();
    if config.lower {
        chars.extend(b"abcdefghijklmnopqrstuvwxyz");
    }
    if config.upper {
        chars.extend(b"ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }
    if config.digits {
        chars.extend(b"0123456789");
    }
    if config.special {
        chars.extend(b"!@#$%^&*()-_=+[]{}|;:',.<>?/");
    }
    if let Some(custom) = &config.custom {
        chars.extend(custom.as_bytes());
    }
    if chars.is_empty() {
        chars.extend(b"abcdefghijklmnopqrstuvwxyz0123456789");
    }
    chars
}
