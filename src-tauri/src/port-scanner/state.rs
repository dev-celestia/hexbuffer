use parking_lot::Mutex;
use std::collections::HashMap;
use std::sync::{atomic::AtomicBool, Arc};

#[derive(Default)]
pub struct PortScanState {
    pub cancellations: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
}
