//! CPU-based hashing with Rayon parallelization and algorithm implementations

use argon2::{password_hash::SaltString, Argon2, PasswordHasher};
use blake3::Hasher as Blake3;
use md5::Md5;
use ripemd::{Digest, Ripemd160};
use sha1::Sha1;
use sha2::{Sha224, Sha256, Sha384, Sha512};
use sha3::{Sha3_224, Sha3_256, Sha3_384, Sha3_512};

use super::types::HashAlgorithm;

/// Compute hex string hash for any supported algorithm
pub fn compute_hash_string(input: &[u8], algorithm: HashAlgorithm) -> String {
    match algorithm {
        HashAlgorithm::Sha256 => hex::encode(compute_sha256(input)),
        HashAlgorithm::Md5 => hex::encode(compute_md5(input)),
        HashAlgorithm::Sha1 => hex::encode(compute_sha1(input)),
        HashAlgorithm::Sha512 => hex::encode(compute_sha512(input)),
        HashAlgorithm::Sha224 => hex::encode(compute_sha224(input)),
        HashAlgorithm::Sha384 => hex::encode(compute_sha384(input)),
        HashAlgorithm::Blake3 => hex::encode(compute_blake3(input)),
        HashAlgorithm::Ntlm => hex::encode(compute_ntlm(input)),
        HashAlgorithm::Sha3_224 => hex::encode(compute_sha3_224(input)),
        HashAlgorithm::Sha3_256 => hex::encode(compute_sha3_256(input)),
        HashAlgorithm::Sha3_384 => hex::encode(compute_sha3_384(input)),
        HashAlgorithm::Sha3_512 => hex::encode(compute_sha3_512(input)),
        HashAlgorithm::Ripemd160 => hex::encode(compute_ripemd160(input)),
        HashAlgorithm::Argon2 => {
            let salt = SaltString::from_b64("somesalt12345678").unwrap_or_else(|_| SaltString::generate(&mut rand::thread_rng()));
            let argon2 = Argon2::default();
            argon2
                .hash_password(input, &salt)
                .map(|h| h.to_string())
                .unwrap_or_default()
        }
        HashAlgorithm::Bcrypt => {
            if let Ok(pw) = std::str::from_utf8(input) {
                bcrypt::hash(pw, 4).unwrap_or_default()
            } else {
                String::new()
            }
        }
        HashAlgorithm::Scrypt => hex::encode(compute_scrypt(input)),
    }
}

/// Compute raw bytes hash for any algorithm where applicable
pub fn compute_hash_bytes(input: &[u8], algorithm: HashAlgorithm) -> Vec<u8> {
    match algorithm {
        HashAlgorithm::Sha256 => compute_sha256(input).to_vec(),
        HashAlgorithm::Md5 => compute_md5(input).to_vec(),
        HashAlgorithm::Sha1 => compute_sha1(input).to_vec(),
        HashAlgorithm::Sha512 => compute_sha512(input).to_vec(),
        HashAlgorithm::Sha224 => compute_sha224(input).to_vec(),
        HashAlgorithm::Sha384 => compute_sha384(input).to_vec(),
        HashAlgorithm::Blake3 => compute_blake3(input).to_vec(),
        HashAlgorithm::Ntlm => compute_ntlm(input).to_vec(),
        HashAlgorithm::Sha3_224 => compute_sha3_224(input).to_vec(),
        HashAlgorithm::Sha3_256 => compute_sha3_256(input).to_vec(),
        HashAlgorithm::Sha3_384 => compute_sha3_384(input).to_vec(),
        HashAlgorithm::Sha3_512 => compute_sha3_512(input).to_vec(),
        HashAlgorithm::Ripemd160 => compute_ripemd160(input).to_vec(),
        HashAlgorithm::Scrypt => compute_scrypt(input),
        HashAlgorithm::Argon2 | HashAlgorithm::Bcrypt => {
            compute_hash_string(input, algorithm).into_bytes()
        }
    }
}

#[inline(always)]
pub fn compute_sha256(input: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_md5(input: &[u8]) -> [u8; 16] {
    let mut hasher = Md5::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_sha1(input: &[u8]) -> [u8; 20] {
    let mut hasher = Sha1::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_sha512(input: &[u8]) -> [u8; 64] {
    let mut hasher = Sha512::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_sha224(input: &[u8]) -> [u8; 28] {
    let mut hasher = Sha224::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_sha384(input: &[u8]) -> [u8; 48] {
    let mut hasher = Sha384::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_blake3(input: &[u8]) -> [u8; 32] {
    let mut hasher = Blake3::new();
    hasher.update(input);
    *hasher.finalize().as_bytes()
}

#[inline(always)]
pub fn compute_sha3_224(input: &[u8]) -> [u8; 28] {
    let mut hasher = Sha3_224::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_sha3_256(input: &[u8]) -> [u8; 32] {
    let mut hasher = Sha3_256::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_sha3_384(input: &[u8]) -> [u8; 48] {
    let mut hasher = Sha3_384::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_sha3_512(input: &[u8]) -> [u8; 64] {
    let mut hasher = Sha3_512::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_ripemd160(input: &[u8]) -> [u8; 20] {
    let mut hasher = Ripemd160::new();
    hasher.update(input);
    hasher.finalize().into()
}

#[inline(always)]
pub fn compute_scrypt(input: &[u8]) -> Vec<u8> {
    let salt = b"hexbuffer_salt16";
    let params = scrypt::Params::new(14, 8, 1, 32).unwrap_or_else(|_| scrypt::Params::new(10, 8, 1, 32).unwrap());
    let mut output = [0u8; 32];
    let _ = scrypt::scrypt(input, salt, &params, &mut output);
    output.to_vec()
}

/// NTLM Hash: MD4 of UTF-16LE encoded plaintext
pub fn compute_ntlm(input: &[u8]) -> [u8; 16] {
    let utf16: Vec<u8> = String::from_utf8_lossy(input)
        .encode_utf16()
        .flat_map(|c| c.to_le_bytes())
        .collect();
    md4_hash(&utf16)
}

/// Lightweight fast MD4 implementation for NTLM
fn md4_hash(input: &[u8]) -> [u8; 16] {
    let mut a = 0x67452301u32;
    let mut b = 0xefcdab89u32;
    let mut c = 0x98badcfeu32;
    let mut d = 0x10325476u32;

    let bit_len = (input.len() as u64) * 8;
    let mut msg = input.to_vec();
    msg.push(0x80);
    while (msg.len() % 64) != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_le_bytes());

    for chunk in msg.chunks_exact(64) {
        let mut x = [0u32; 16];
        for i in 0..16 {
            x[i] = u32::from_le_bytes([
                chunk[i * 4],
                chunk[i * 4 + 1],
                chunk[i * 4 + 2],
                chunk[i * 4 + 3],
            ]);
        }

        let aa = a;
        let bb = b;
        let cc = c;
        let dd = d;

        // Round 1
        macro_rules! ff {
            ($a:ident, $b:ident, $c:ident, $d:ident, $k:expr, $s:expr) => {
                $a = $a
                    .wrapping_add(($b & $c) | (!$b & $d))
                    .wrapping_add(x[$k])
                    .rotate_left($s);
            };
        }

        ff!(a, b, c, d, 0, 3);
        ff!(d, a, b, c, 1, 7);
        ff!(c, d, a, b, 2, 11);
        ff!(b, c, d, a, 3, 19);
        ff!(a, b, c, d, 4, 3);
        ff!(d, a, b, c, 5, 7);
        ff!(c, d, a, b, 6, 11);
        ff!(b, c, d, a, 7, 19);
        ff!(a, b, c, d, 8, 3);
        ff!(d, a, b, c, 9, 7);
        ff!(c, d, a, b, 10, 11);
        ff!(b, c, d, a, 11, 19);
        ff!(a, b, c, d, 12, 3);
        ff!(d, a, b, c, 13, 7);
        ff!(c, d, a, b, 14, 11);
        ff!(b, c, d, a, 15, 19);

        // Round 2
        macro_rules! gg {
            ($a:ident, $b:ident, $c:ident, $d:ident, $k:expr, $s:expr) => {
                $a = $a
                    .wrapping_add(($b & $c) | ($b & $d) | ($c & $d))
                    .wrapping_add(x[$k])
                    .wrapping_add(0x5a827999)
                    .rotate_left($s);
            };
        }

        gg!(a, b, c, d, 0, 3);
        gg!(d, a, b, c, 4, 5);
        gg!(c, d, a, b, 8, 9);
        gg!(b, c, d, a, 12, 13);
        gg!(a, b, c, d, 1, 3);
        gg!(d, a, b, c, 5, 5);
        gg!(c, d, a, b, 9, 9);
        gg!(b, c, d, a, 13, 13);
        gg!(a, b, c, d, 2, 3);
        gg!(d, a, b, c, 6, 5);
        gg!(c, d, a, b, 10, 9);
        gg!(b, c, d, a, 14, 13);
        gg!(a, b, c, d, 3, 3);
        gg!(d, a, b, c, 7, 5);
        gg!(c, d, a, b, 11, 9);
        gg!(b, c, d, a, 15, 13);

        // Round 3
        macro_rules! hh {
            ($a:ident, $b:ident, $c:ident, $d:ident, $k:expr, $s:expr) => {
                $a = $a
                    .wrapping_add($b ^ $c ^ $d)
                    .wrapping_add(x[$k])
                    .wrapping_add(0x6ed9eba1)
                    .rotate_left($s);
            };
        }

        hh!(a, b, c, d, 0, 3);
        hh!(d, a, b, c, 8, 9);
        hh!(c, d, a, b, 4, 11);
        hh!(b, c, d, a, 12, 15);
        hh!(a, b, c, d, 2, 3);
        hh!(d, a, b, c, 10, 9);
        hh!(c, d, a, b, 6, 11);
        hh!(b, c, d, a, 14, 15);
        hh!(a, b, c, d, 1, 3);
        hh!(d, a, b, c, 9, 9);
        hh!(c, d, a, b, 5, 11);
        hh!(b, c, d, a, 13, 15);
        hh!(a, b, c, d, 3, 3);
        hh!(d, a, b, c, 11, 9);
        hh!(c, d, a, b, 7, 11);
        hh!(b, c, d, a, 15, 15);

        a = a.wrapping_add(aa);
        b = b.wrapping_add(bb);
        c = c.wrapping_add(cc);
        d = d.wrapping_add(dd);
    }

    let mut out = [0u8; 16];
    out[0..4].copy_from_slice(&a.to_le_bytes());
    out[4..8].copy_from_slice(&b.to_le_bytes());
    out[8..12].copy_from_slice(&c.to_le_bytes());
    out[12..16].copy_from_slice(&d.to_le_bytes());
    out
}
