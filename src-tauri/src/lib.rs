mod audio;
mod backend;
mod commands;
mod config;
mod window;

use audio::capture::AudioCapture;
use commands::audio_cmd::CaptureState;
use commands::backend_cmd::ServiceManagerState;

use backend::process::ServiceManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {
            // Single instance callback - focus existing window
        }))
        .manage(CaptureState::new(AudioCapture::new()))
        .manage(ServiceManagerState::new(ServiceManager::new()))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Create system tray
            window::tray::create_tray(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::audio_cmd::start_capture,
            commands::audio_cmd::stop_capture,
            commands::backend_cmd::check_backend_health,
            commands::backend_cmd::start_backend,
            commands::backend_cmd::check_all_services,
            commands::backend_cmd::start_all_services,
            commands::backend_cmd::stop_all_services,
            commands::backend_cmd::get_cursor_pos,
            commands::backend_cmd::detect_project_paths,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
