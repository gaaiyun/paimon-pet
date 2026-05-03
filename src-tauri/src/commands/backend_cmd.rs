use crate::backend::process;

/// Check if the Python backend is healthy.
///
/// Sends a GET request to `http://127.0.0.1:{port}/health`.
/// Returns `true` if the backend responds with HTTP 200.
#[tauri::command]
pub fn check_backend_health(port: u16) -> Result<bool, String> {
    process::is_backend_running(port).map_err(|e| e.to_string())
}

/// Start the Python backend process.
///
/// Spawns the given Python script and returns the process ID.
#[tauri::command]
pub fn start_backend(python_path: String, script_path: String) -> Result<u32, String> {
    process::start_backend_process(&python_path, &script_path).map_err(|e| e.to_string())
}
