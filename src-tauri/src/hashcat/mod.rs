//! Hashcat-backed password cracking engine wrapper.
//!
//! Spawns the external `hashcat` binary and streams its status JSON and
//! output file back to the frontend over the same `hash-*` event contract
//! the previous native engine used.

pub mod args;
pub mod binary;
pub mod engine;

pub use engine::HashcatEngine;
