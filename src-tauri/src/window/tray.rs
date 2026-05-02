use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItem},
    tray::TrayIconBuilder,
    App, Emitter, Manager, WebviewWindowBuilder,
};

/// Create the system tray icon with right-click context menu.
pub fn create_tray(app: &mut App) {
    // Menu items
    let show_i = MenuItem::with_id(app, "show", "显示派蒙", true, None::<&str>)
        .expect("Failed to create show menu item");
    let hide_i = MenuItem::with_id(app, "hide", "隐藏派蒙", true, None::<&str>)
        .expect("Failed to create hide menu item");
    let settings_i = MenuItem::with_id(app, "settings", "设置", true, None::<&str>)
        .expect("Failed to create settings menu item");
    let mute_i = MenuItem::with_id(app, "mute", "静音", true, None::<&str>)
        .expect("Failed to create mute menu item");
    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)
        .expect("Failed to create quit menu item");

    // Build context menu
    let menu = MenuBuilder::new(app)
        .item(&show_i)
        .item(&hide_i)
        .separator()
        .item(&settings_i)
        .item(&mute_i)
        .separator()
        .item(&quit_i)
        .build()
        .expect("Failed to build tray menu");

    // Build tray icon
    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(
            Image::from_bytes(include_bytes!("../../icons/icon.png"))
                .expect("Failed to load tray icon"),
        )
        .menu(&menu)
        .tooltip("PaimonPet")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_pet_window(app),
            "hide" => hide_pet_window(app),
            "settings" => open_settings_window(app),
            "mute" => {
                // Toggle mute state via frontend event
                let _ = app.emit("toggle-mute", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            use tauri::tray::TrayIconEvent;
            if let TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                show_pet_window(app);
            }
        })
        .build(app)
        .expect("Failed to build tray icon");
}

/// Show and focus the pet window.
fn show_pet_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("pet") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Hide the pet window.
fn hide_pet_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("pet") {
        let _ = window.hide();
    }
}

/// Open the settings window (or focus if already open).
fn open_settings_window(app: &tauri::AppHandle) {
    // If settings window already exists, just focus it
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    // Create a new settings window
    let _ = WebviewWindowBuilder::new(app, "settings", tauri::WebviewUrl::App("index.html".into()))
        .title("PaimonPet Settings")
        .inner_size(600.0, 500.0)
        .resizable(true)
        .center()
        .build();
}
