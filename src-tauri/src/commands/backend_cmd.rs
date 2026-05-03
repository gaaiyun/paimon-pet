use crate::backend::process;
use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

/// Aggregated status of all three backend services.
#[derive(Debug, Clone, Serialize)]
pub struct ServicesStatus {
    pub openclaw: bool,
    pub vits: bool,
    pub vtuber: bool,
}

/// Type alias for the managed `ServiceManager` state.
pub type ServiceManagerState = Mutex<process::ServiceManager>;

/// Check if a Python backend is healthy.
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

/// Check the running status of all three backend services.
#[tauri::command]
pub fn check_all_services(state: State<ServiceManagerState>) -> Result<ServicesStatus, String> {
    let mgr = state.lock().map_err(|e| e.to_string())?;
    Ok(ServicesStatus {
        openclaw: mgr.check_openclaw(),
        vits: mgr.check_vits(),
        vtuber: mgr.check_vtuber(),
    })
}

/// Start all backend services.
///
/// Reads paths from the provided configuration strings and delegates
/// to `ServiceManager::start_all`.
#[tauri::command]
pub fn start_all_services(
    state: State<ServiceManagerState>,
    python_path: String,
    ai_paimon_dir: String,
    vits_model_path: String,
    vtuber_dir: String,
) -> Result<String, String> {
    let mut mgr = state.lock().map_err(|e| e.to_string())?;
    mgr.start_all(&python_path, &ai_paimon_dir, &vits_model_path, &vtuber_dir)
}

/// Stop all managed backend services (VITS and VTuber).
#[tauri::command]
pub fn stop_all_services(state: State<ServiceManagerState>) -> Result<(), String> {
    let mut mgr = state.lock().map_err(|e| e.to_string())?;
    mgr.stop_all();
    Ok(())
}
