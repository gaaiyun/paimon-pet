use tauri::{
    image::Image,
    menu::{CheckMenuItem, MenuBuilder, MenuItem},
    tray::TrayIconBuilder,
    App, Emitter, Manager,
};

pub fn create_tray(app: &mut App) {
    let show_i = MenuItem::with_id(app, "show", "显示宠物", true, None::<&str>)
        .expect("Failed to create show menu item");
    let hide_i = MenuItem::with_id(app, "hide", "隐藏宠物", true, None::<&str>)
        .expect("Failed to create hide menu item");
    let chat_i = MenuItem::with_id(app, "chat", "显示聊天", true, None::<&str>)
        .expect("Failed to create chat menu item");
    let clickthrough_i = CheckMenuItem::with_id(app, "clickthrough", "点击穿透", true, false, None::<&str>)
        .expect("Failed to create clickthrough menu item");
    let mute_i = MenuItem::with_id(app, "mute", "静音", true, None::<&str>)
        .expect("Failed to create mute menu item");
    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)
        .expect("Failed to create quit menu item");

    let menu = MenuBuilder::new(app)
        .item(&show_i)
        .item(&hide_i)
        .separator()
        .item(&chat_i)
        .item(&clickthrough_i)
        .item(&mute_i)
        .separator()
        .item(&quit_i)
        .build()
        .expect("Failed to build tray menu");

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(
            Image::from_bytes(include_bytes!("../../icons/icon.png"))
                .expect("Failed to load tray icon"),
        )
        .menu(&menu)
        .tooltip("PaimonPet")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("pet") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("pet") {
                    let _ = window.hide();
                }
            }
            "chat" => {
                let _ = app.emit("show-chat-controls", ());
            }
            "clickthrough" => {
                let _ = app.emit("toggle-clickthrough", ());
            }
            "mute" => {
                let _ = app.emit("toggle-mute", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            use tauri::tray::TrayIconEvent;
            if let TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("pet") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)
        .expect("Failed to build tray icon");
}
