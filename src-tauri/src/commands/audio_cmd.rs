use std::sync::Mutex;

use crate::audio::capture::AudioCapture;

/// Shared state wrapper for audio capture.
pub type CaptureState = Mutex<AudioCapture>;

/// Start audio capture.
///
/// Returns `true` if capture was successfully started,
/// `false` if it was already running.
#[tauri::command]
pub fn start_capture(state: tauri::State<'_, CaptureState>) -> Result<bool, String> {
    let capture = state.lock().map_err(|e| e.to_string())?;
    Ok(capture.start())
}

/// Stop audio capture.
///
/// Returns `true` if capture was successfully stopped,
/// `false` if it was not running.
#[tauri::command]
pub fn stop_capture(state: tauri::State<'_, CaptureState>) -> Result<bool, String> {
    let capture = state.lock().map_err(|e| e.to_string())?;
    Ok(capture.stop())
}
