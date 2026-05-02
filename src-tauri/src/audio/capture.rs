#![allow(dead_code)]

use std::sync::atomic::{AtomicBool, Ordering};

/// Audio capture state manager.
///
/// Uses an `AtomicBool` to track whether audio capture is currently active,
/// enabling thread-safe start/stop control without requiring a mutex.
pub struct AudioCapture {
    running: AtomicBool,
}

impl AudioCapture {
    /// Create a new AudioCapture instance in the stopped state.
    pub fn new() -> Self {
        Self {
            running: AtomicBool::new(false),
        }
    }

    /// Start audio capture.
    ///
    /// Returns `true` if capture was successfully started (was not already running).
    /// Returns `false` if capture is already running.
    pub fn start(&self) -> bool {
        self.running
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
    }

    /// Stop audio capture.
    ///
    /// Returns `true` if capture was successfully stopped (was running).
    /// Returns `false` if capture was not running.
    pub fn stop(&self) -> bool {
        self.running
            .compare_exchange(true, false, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
    }

    /// Check whether audio capture is currently running.
    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::SeqCst)
    }
}

impl Default for AudioCapture {
    fn default() -> Self {
        Self::new()
    }
}
