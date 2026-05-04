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

/// Auto-detected project paths.
#[derive(Debug, Clone, Serialize)]
pub struct DetectedPaths {
    pub ai_paimon_dir: String,
    pub open_llm_vtuber_dir: String,
    pub vits_model_path: String,
}

/// Type alias for the managed `ServiceManager` state.
pub type ServiceManagerState = Mutex<process::ServiceManager>;

/// Check if a Python backend is healthy.
#[tauri::command]
pub fn check_backend_health(port: u16) -> Result<bool, String> {
    process::is_backend_running(port).map_err(|e| e.to_string())
}

/// Start the Python backend process.
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

/// Stop all managed backend services.
#[tauri::command]
pub fn stop_all_services(state: State<ServiceManagerState>) -> Result<(), String> {
    let mut mgr = state.lock().map_err(|e| e.to_string())?;
    mgr.stop_all();
    Ok(())
}

/// Get the cursor position relative to the window.
/// Returns (x, y) in logical pixels relative to window top-left.
#[tauri::command]
pub fn get_cursor_pos(window: tauri::WebviewWindow) -> Result<(f64, f64), String> {
    let cursor = window
        .cursor_position()
        .map_err(|e| format!("cursor_position: {}", e))?;
    let win_pos = window
        .outer_position()
        .map_err(|e| format!("outer_position: {}", e))?;
    let scale = window
        .scale_factor()
        .map_err(|e| format!("scale_factor: {}", e))?;
    let rel_x = (cursor.x - win_pos.x as f64) / scale;
    let rel_y = (cursor.y - win_pos.y as f64) / scale;
    Ok((rel_x, rel_y))
}

/// Auto-detect project paths by looking for sibling directories.
/// Searches upward from the executable's directory for a parent containing
/// both `ai-paimon` and `Open-LLM-VTuber`.
#[tauri::command]
pub fn detect_project_paths() -> Option<DetectedPaths> {
    let exe_dir = std::env::current_exe().ok()?;
    let mut dir = exe_dir.parent()?;

    // Walk up looking for ai-paimon and Open-LLM-VTuber siblings
    for _ in 0..5 {
        let ai_paimon = dir.join("ai-paimon");
        let vtuber = dir.join("Open-LLM-VTuber");
        if ai_paimon.is_dir() && vtuber.is_dir() {
            let vits_model = ai_paimon.join("models").join("vits").join("paimon");
            let vits_path = if vits_model.join("paimon6k_390000.pth").exists() {
                vits_model
                    .join("paimon6k_390000.pth")
                    .to_string_lossy()
                    .to_string()
            } else {
                String::new()
            };
            return Some(DetectedPaths {
                ai_paimon_dir: ai_paimon.to_string_lossy().to_string(),
                open_llm_vtuber_dir: vtuber.to_string_lossy().to_string(),
                vits_model_path: vits_path,
            });
        }
        dir = dir.parent()?;
    }
    None
}
