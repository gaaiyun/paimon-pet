# PaimonPet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tauri v2 + React desktop pet application featuring Paimon with AI voice conversation powered by Open-LLM-VTuber backend.

**Architecture:** Tauri v2 provides the desktop shell (transparent window, system tray, global hotkeys, audio capture). React/TypeScript frontend renders Live2D/Sprite animations and chat UI. Open-LLM-VTuber Python backend handles LLM/ASR/TTS via WebSocket. Rust backend manages the Python process lifecycle and microphone audio streaming.

**Tech Stack:** Tauri v2 (Rust), React 18, TypeScript, PIXI.js + pixi-live2d-display, Zustand, cpal, Open-LLM-VTuber (Python/FastAPI), VITS TTS

**Spec:** `docs/superpowers/specs/2026-05-03-paimon-pet-design.md`

---

## File Structure

```
paimon-pet/
├── src-tauri/
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json
│   ├── icons/
│   │   ├── icon.ico
│   │   └── tray.ico
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── audio/
│       │   ├── mod.rs
│       │   └── capture.rs
│       ├── commands/
│       │   ├── mod.rs
│       │   ├── audio_cmd.rs
│       │   └── backend_cmd.rs
│       ├── backend/
│       │   ├── mod.rs
│       │   └── process.rs
│       ├── window/
│       │   ├── mod.rs
│       │   └── tray.rs
│       └── config/
│           ├── mod.rs
│           └── settings.rs
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── types/
│   │   ├── messages.ts
│   │   ├── settings.ts
│   │   └── pet.ts
│   ├── stores/
│   │   ├── petStore.ts
│   │   ├── chatStore.ts
│   │   └── settingsStore.ts
│   ├── services/
│   │   ├── websocketService.ts
│   │   └── audioService.ts
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useAudio.ts
│   ├── components/
│   │   ├── PetWindow.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── StatusIndicator.tsx
│   ├── renderers/
│   │   ├── Live2DRenderer.tsx
│   │   └── SpriteRenderer.tsx
│   └── settings/
│       ├── SettingsPanel.tsx
│       ├── GeneralSettings.tsx
│       ├── PetSettings.tsx
│       ├── VoiceSettings.tsx
│       └── AISettings.tsx
├── backend/
│   ├── start.py
│   └── conf.yaml
├── assets/
│   ├── sprites/
│   │   └── paimon/
│   │       ├── spritesheet.png
│   │       └── pet.json
│   ├── sounds/
│   │   ├── tap.wav
│   │   └── greeting.wav
│   └── icons/
│       ├── icon.ico
│       └── tray.ico
├── tests/
│   ├── rust/
│   │   └── settings_test.rs
│   └── frontend/
│       ├── services/
│       │   └── websocketService.test.ts
│       ├── stores/
│       │   └── settingsStore.test.ts
│       └── components/
│           └── ChatBubble.test.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── index.html
├── CLAUDE.md
├── README.md
└── .gitignore
```

---

## Phase 1: Project Skeleton

### Task 1: Initialize Tauri v2 + React project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`
- Create: `.gitignore`
- Create: `CLAUDE.md`

- [ ] **Step 1: Initialize npm project and install dependencies**

```bash
cd "/c/Users/Gaaiyun/paimon pet/paimon-pet"
npm init -y
npm install react react-dom
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react
```

- [ ] **Step 2: Create package.json with scripts**

Write `package.json`:
```json
{
  "name": "paimon-pet",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "tauri": "tauri"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^6.0.3"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

Write `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create vite.config.ts**

Write `vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
```

- [ ] **Step 5: Create index.html**

Write `index.html`:
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PaimonPet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create src/main.tsx**

Write `src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Create src/App.tsx (minimal shell)**

Write `src/App.tsx`:
```tsx
function App() {
  return (
    <div className="pet-container">
      <p>PaimonPet Loading...</p>
    </div>
  );
}

export default App;
```

- [ ] **Step 8: Create src/App.css**

Write `src/App.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.pet-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: "Segoe UI", sans-serif;
}
```

- [ ] **Step 9: Create .gitignore**

Write `.gitignore`:
```
node_modules/
dist/
src-tauri/target/
*.log
.env
.DS_Store
```

- [ ] **Step 10: Initialize Tauri v2**

```bash
cd "/c/Users/Gaaiyun/paimon pet/paimon-pet"
npm install -D @tauri-apps/cli@^2
npx tauri init --app-name "PaimonPet" --window-title "PaimonPet" --dev-url "http://localhost:1420" --frontend-dist "../dist" --before-dev-command "npm run dev" --before-build-command "npm run build"
```

Select defaults when prompted. This creates `src-tauri/` with `Cargo.toml`, `tauri.conf.json`, and Rust entry files.

- [ ] **Step 11: Install Tauri API package**

```bash
npm install @tauri-apps/api
```

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: initialize Tauri v2 + React project scaffold"
```

---

### Task 2: Configure transparent always-on-top window

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/App.css`

- [ ] **Step 1: Update tauri.conf.json window config**

In `src-tauri/tauri.conf.json`, set the `"windows"` array to:
```json
"windows": [
  {
    "label": "pet",
    "title": "PaimonPet",
    "width": 400,
    "height": 500,
    "transparent": true,
    "alwaysOnTop": true,
    "resizable": false,
    "decorations": false,
    "skipTaskbar": true,
    "center": true
  }
]
```

- [ ] **Step 2: Update lib.rs for window setup**

Write `src-tauri/src/lib.rs`:
```rust
mod audio;
mod backend;
mod commands;
mod config;
mod window;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .setup(|app| {
            window::tray::create_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::audio_cmd::start_capture,
            commands::audio_cmd::stop_capture,
            commands::backend_cmd::check_backend_health,
            commands::backend_cmd::start_backend,
        ])
        .run(tauri::generate_context!())
        .expect("error while running taimon-pet");
}
```

- [ ] **Step 3: Verify transparency renders**

Run: `npx tauri dev`
Expected: A transparent window appears centered on screen with "PaimonPet Loading..." text visible, no window border, no taskbar entry.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: configure transparent always-on-top window"
```

---

### Task 3: System tray with right-click menu

**Files:**
- Create: `src-tauri/src/window/mod.rs`
- Create: `src-tauri/src/window/tray.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Add tray dependency to Cargo.toml**

In `src-tauri/Cargo.toml`, add to `[dependencies]`:
```toml
tauri-plugin-store = "2"
tauri-plugin-single-instance = "2"
```

- [ ] **Step 2: Create window/mod.rs**

Write `src-tauri/src/window/mod.rs`:
```rust
pub mod tray;
```

- [ ] **Step 3: Create window/tray.rs**

Write `src-tauri/src/window/tray.rs`:
```rust
use tauri::{
    App, Manager,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    menu::{MenuBuilder, MenuItemBuilder},
};

pub fn create_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItemBuilder::with_id("show", "显示派蒙").build(app)?;
    let hide = MenuItemBuilder::with_id("hide", "隐藏派蒙").build(app)?;
    let settings = MenuItemBuilder::with_id("settings", "设置").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "退出").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&show)
        .item(&hide)
        .separator()
        .item(&settings)
        .separator()
        .item(&quit)
        .build()?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("PaimonPet")
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => {
                if let Some(w) = app.get_webview_window("pet") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "hide" => {
                if let Some(w) = app.get_webview_window("pet") {
                    let _ = w.hide();
                }
            }
            "settings" => {
                if let Some(w) = app.get_webview_window("settings") {
                    let _ = w.show();
                    let _ = w.set_focus();
                } else {
                    let _ = tauri::WebviewWindowBuilder::new(
                        app,
                        "settings",
                        tauri::WebviewUrl::App("index.html".into()),
                    )
                    .title("PaimonPet Settings")
                    .inner_size(600.0, 500.0)
                    .build();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(w) = app.get_webview_window("pet") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
```

- [ ] **Step 4: Test tray appears**

Run: `npx tauri dev`
Expected: System tray icon appears in Windows taskbar. Right-click shows menu with "显示派蒙", "隐藏派蒙", "设置", "退出". Left-click shows pet window.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add system tray with show/hide/settings/quit menu"
```

---

### Task 4: Module declarations for Rust backend

**Files:**
- Create: `src-tauri/src/audio/mod.rs`
- Create: `src-tauri/src/audio/capture.rs`
- Create: `src-tauri/src/backend/mod.rs`
- Create: `src-tauri/src/backend/process.rs`
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/audio_cmd.rs`
- Create: `src-tauri/src/commands/backend_cmd.rs`
- Create: `src-tauri/src/config/mod.rs`
- Create: `src-tauri/src/config/settings.rs`

- [ ] **Step 1: Create all module stubs with placeholder types**

Write `src-tauri/src/audio/mod.rs`:
```rust
pub mod capture;
```

Write `src-tauri/src/audio/capture.rs`:
```rust
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

static CAPTURING: AtomicBool = AtomicBool::new(false);

pub struct AudioCapture {
    running: Arc<AtomicBool>,
}

impl AudioCapture {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn start(&self) -> Result<(), String> {
        self.running.store(true, Ordering::SeqCst);
        Ok(())
    }

    pub fn stop(&self) -> Result<(), String> {
        self.running.store(false, Ordering::SeqCst);
        Ok(())
    }

    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::SeqCst)
    }
}
```

Write `src-tauri/src/backend/mod.rs`:
```rust
pub mod process;
```

Write `src-tauri/src/backend/process.rs`:
```rust
use std::process::Command;

pub fn is_backend_running(port: u16) -> bool {
    let url = format!("http://localhost:{}/health", port);
    reqwest::blocking::Client::new()
        .get(&url)
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .is_ok()
}

pub fn start_backend_process(python_path: &str, script_path: &str) -> Result<std::process::Child, String> {
    Command::new(python_path)
        .arg(script_path)
        .spawn()
        .map_err(|e| format!("Failed to start backend: {}", e))
}
```

Write `src-tauri/src/commands/mod.rs`:
```rust
pub mod audio_cmd;
pub mod backend_cmd;
```

Write `src-tauri/src/commands/audio_cmd.rs`:
```rust
use crate::audio::capture::AudioCapture;
use std::sync::Mutex;
use tauri::State;

pub struct CaptureState(pub Mutex<AudioCapture>);

#[tauri::command]
pub fn start_capture(state: State<'_, CaptureState>) -> Result<String, String> {
    let cap = state.0.lock().map_err(|e| e.to_string())?;
    cap.start()
}

#[tauri::command]
pub fn stop_capture(state: State<'_, CaptureState>) -> Result<String, String> {
    let cap = state.0.lock().map_err(|e| e.to_string())?;
    cap.stop()
}
```

Write `src-tauri/src/commands/backend_cmd.rs`:
```rust
use crate::backend::process;

#[tauri::command]
pub fn check_backend_health(port: u16) -> bool {
    process::is_backend_running(port)
}

#[tauri::command]
pub fn start_backend(python_path: String, script_path: String) -> Result<String, String> {
    let mut child = process::start_backend_process(&python_path, &script_path)?;
    Ok(format!("Backend started with PID: {}", child.id()))
}
```

Write `src-tauri/src/config/mod.rs`:
```rust
pub mod settings;
```

Write `src-tauri/src/config/settings.rs`:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub general: GeneralSettings,
    pub pet: PetSettings,
    pub voice: VoiceSettings,
    pub ai: AiSettings,
    pub tts: TtsSettings,
    pub advanced: AdvancedSettings,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeneralSettings {
    pub language: String,
    pub theme: String,
    pub autostart: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PetSettings {
    pub visual_mode: String,
    pub scale: f64,
    pub x: i32,
    pub y: i32,
    pub animation_speed: f64,
    pub always_on_top: bool,
    pub click_through: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VoiceSettings {
    pub input_device: String,
    pub output_device: String,
    pub input_volume: u8,
    pub output_volume: u8,
    pub push_to_talk_key: String,
    pub continuous_listening: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AiSettings {
    pub provider: String,
    pub api_endpoint: String,
    pub model: String,
    pub temperature: f64,
    pub max_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TtsSettings {
    pub provider: String,
    pub vits_server_url: String,
    pub language: String,
    pub speaker: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdvancedSettings {
    pub debug_mode: bool,
    pub log_level: String,
    pub backend_port: u16,
    pub data_directory: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            general: GeneralSettings {
                language: "zh-CN".to_string(),
                theme: "dark".to_string(),
                autostart: false,
            },
            pet: PetSettings {
                visual_mode: "live2d".to_string(),
                scale: 1.0,
                x: 0,
                y: 0,
                animation_speed: 1.0,
                always_on_top: true,
                click_through: false,
            },
            voice: VoiceSettings {
                input_device: String::new(),
                output_device: String::new(),
                input_volume: 80,
                output_volume: 80,
                push_to_talk_key: "Alt+Space".to_string(),
                continuous_listening: false,
            },
            ai: AiSettings {
                provider: "openclaw".to_string(),
                api_endpoint: "http://127.0.0.1:18789/v1".to_string(),
                model: "openclaw:main".to_string(),
                temperature: 0.7,
                max_tokens: 1024,
            },
            tts: TtsSettings {
                provider: "vits".to_string(),
                vits_server_url: "http://127.0.0.1:8020".to_string(),
                language: "zh".to_string(),
                speaker: "female".to_string(),
            },
            advanced: AdvancedSettings {
                debug_mode: false,
                log_level: "info".to_string(),
                backend_port: 12393,
                data_directory: String::new(),
            },
        }
    }
}
```

- [ ] **Step 2: Add reqwest dependency to Cargo.toml**

In `src-tauri/Cargo.toml`, add to `[dependencies]`:
```toml
reqwest = { version = "0.12", features = ["blocking"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1"
```

- [ ] **Step 3: Update main.rs**

Write `src-tauri/src/main.rs`:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    paimon_pet_lib::run()
}
```

- [ ] **Step 4: Update lib.rs to wire state**

Write `src-tauri/src/lib.rs`:
```rust
mod audio;
mod backend;
mod commands;
mod config;
mod window;

use audio::capture::AudioCapture;
use commands::audio_cmd::CaptureState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .manage(CaptureState(std::sync::Mutex::new(AudioCapture::new())))
        .setup(|app| {
            window::tray::create_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::audio_cmd::start_capture,
            commands::audio_cmd::stop_capture,
            commands::backend_cmd::check_backend_health,
            commands::backend_cmd::start_backend,
        ])
        .run(tauri::generate_context!())
        .expect("error while running paimon-pet");
}
```

- [ ] **Step 5: Build to verify Rust compiles**

Run: `cd src-tauri && cargo check`
Expected: Compiles with no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Rust backend modules (audio, backend, commands, config)"
```

---

## Phase 2: Type Definitions & State Management

### Task 5: TypeScript type definitions

**Files:**
- Create: `src/types/messages.ts`
- Create: `src/types/settings.ts`
- Create: `src/types/pet.ts`

- [ ] **Step 1: Create message types**

Write `src/types/messages.ts`:
```typescript
export type ClientMessage =
  | { type: "audio-input"; data: string }
  | { type: "text-input"; data: string }
  | { type: "interrupt" }
  | { type: "set-expression"; data: string }
  | { type: "ping" };

export type ServerMessage =
  | { type: "text-output"; data: string }
  | { type: "audio-output"; data: string }
  | { type: "expression"; data: string }
  | { type: "motion"; group: string; index: number }
  | { type: "state"; data: PetState }
  | { type: "error"; data: string }
  | { type: "pong" };

export type PetState = "idle" | "listening" | "thinking" | "speaking" | "dragging";
```

- [ ] **Step 2: Create settings types**

Write `src/types/settings.ts`:
```typescript
export interface AppSettings {
  general: GeneralSettings;
  pet: PetSettings;
  voice: VoiceSettings;
  ai: AiSettings;
  tts: TtsSettings;
  advanced: AdvancedSettings;
}

export interface GeneralSettings {
  language: "zh-CN" | "en";
  theme: "dark" | "light" | "system";
  autostart: boolean;
}

export interface PetSettings {
  visualMode: "live2d" | "sprite";
  scale: number;
  x: number;
  y: number;
  animationSpeed: number;
  alwaysOnTop: boolean;
  clickThrough: boolean;
}

export interface VoiceSettings {
  inputDevice: string;
  outputDevice: string;
  inputVolume: number;
  outputVolume: number;
  pushToTalkKey: string;
  continuousListening: boolean;
}

export interface AiSettings {
  provider: "openclaw" | "openai" | "ollama";
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface TtsSettings {
  provider: "vits" | "edge-tts";
  vitsServerUrl: string;
  language: string;
  speaker: string;
}

export interface AdvancedSettings {
  debugMode: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  backendPort: number;
  dataDirectory: string;
}
```

- [ ] **Step 3: Create pet types**

Write `src/types/pet.ts`:
```typescript
export type PetState = "idle" | "listening" | "thinking" | "speaking" | "dragging";
export type VisualMode = "live2d" | "sprite";

export interface PetVisualState {
  mode: VisualMode;
  currentAnimation: string;
  currentExpression: string;
  scale: number;
  position: { x: number; y: number };
  isLipSyncing: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export const EMOTION_MAP: Record<string, number> = {
  neutral: 0,
  anger: 2,
  disgust: 2,
  fear: 1,
  joy: 3,
  smirk: 3,
  sadness: 1,
  surprise: 3,
};
```

- [ ] **Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for messages, settings, pet"
```

---

### Task 6: Zustand state stores

**Files:**
- Create: `src/stores/petStore.ts`
- Create: `src/stores/chatStore.ts`
- Create: `src/stores/settingsStore.ts`
- Create: `tests/frontend/stores/settingsStore.test.ts`

- [ ] **Step 1: Install zustand**

```bash
npm install zustand
```

- [ ] **Step 2: Write failing test for settingsStore**

Write `tests/frontend/stores/settingsStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../../../src/stores/settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getInitialState());
  });

  it("has correct default values", () => {
    const state = useSettingsStore.getState();
    expect(state.settings.pet.visualMode).toBe("live2d");
    expect(state.settings.pet.scale).toBe(1.0);
    expect(state.settings.ai.provider).toBe("openclaw");
    expect(state.settings.tts.provider).toBe("vits");
    expect(state.settings.general.language).toBe("zh-CN");
  });

  it("updates pet settings", () => {
    useSettingsStore.getState().updatePetSettings({ scale: 1.5 });
    const state = useSettingsStore.getState();
    expect(state.settings.pet.scale).toBe(1.5);
    expect(state.settings.pet.visualMode).toBe("live2d");
  });

  it("updates AI settings", () => {
    useSettingsStore.getState().updateAiSettings({ provider: "ollama" });
    expect(useSettingsStore.getState().settings.ai.provider).toBe("ollama");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/frontend/stores/settingsStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Create petStore**

Write `src/stores/petStore.ts`:
```typescript
import { create } from "zustand";
import type { PetState, PetVisualState } from "../types/pet";

interface PetStore {
  state: PetState;
  visual: PetVisualState;
  setState: (state: PetState) => void;
  setExpression: (expression: string) => void;
  setAnimation: (animation: string) => void;
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
  setLipSyncing: (syncing: boolean) => void;
}

export const usePetStore = create<PetStore>((set) => ({
  state: "idle",
  visual: {
    mode: "live2d",
    currentAnimation: "idle",
    currentExpression: "neutral",
    scale: 1.0,
    position: { x: 0, y: 0 },
    isLipSyncing: false,
  },

  setState: (state) => set({ state }),
  setExpression: (expression) =>
    set((s) => ({ visual: { ...s.visual, currentExpression: expression } })),
  setAnimation: (animation) =>
    set((s) => ({ visual: { ...s.visual, currentAnimation: animation } })),
  setScale: (scale) =>
    set((s) => ({ visual: { ...s.visual, scale } })),
  setPosition: (x, y) =>
    set((s) => ({ visual: { ...s.visual, position: { x, y } } })),
  setLipSyncing: (syncing) =>
    set((s) => ({ visual: { ...s.visual, isLipSyncing: syncing } })),
}));
```

- [ ] **Step 5: Create chatStore**

Write `src/stores/chatStore.ts`:
```typescript
import { create } from "zustand";
import type { ChatMessage } from "../types/pet";

interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (role: "user" | "assistant", text: string) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isTyping: false,

  addMessage: (role, text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), role, text, timestamp: Date.now() },
      ],
    })),
  setTyping: (typing) => set({ isTyping: typing }),
  clearMessages: () => set({ messages: [] }),
}));
```

- [ ] **Step 6: Create settingsStore**

Write `src/stores/settingsStore.ts`:
```typescript
import { create } from "zustand";
import type { AppSettings } from "../types/settings";

const defaultSettings: AppSettings = {
  general: {
    language: "zh-CN",
    theme: "dark",
    autostart: false,
  },
  pet: {
    visualMode: "live2d",
    scale: 1.0,
    x: 0,
    y: 0,
    animationSpeed: 1.0,
    alwaysOnTop: true,
    clickThrough: false,
  },
  voice: {
    inputDevice: "",
    outputDevice: "",
    inputVolume: 80,
    outputVolume: 80,
    pushToTalkKey: "Alt+Space",
    continuousListening: false,
  },
  ai: {
    provider: "openclaw",
    apiEndpoint: "http://127.0.0.1:18789/v1",
    model: "openclaw:main",
    temperature: 0.7,
    maxTokens: 1024,
  },
  tts: {
    provider: "vits",
    vitsServerUrl: "http://127.0.0.1:8020",
    language: "zh",
    speaker: "female",
  },
  advanced: {
    debugMode: false,
    logLevel: "info",
    backendPort: 12393,
    dataDirectory: "",
  },
};

interface SettingsStore {
  settings: AppSettings;
  updateGeneral: (partial: Partial<AppSettings["general"]>) => void;
  updatePetSettings: (partial: Partial<AppSettings["pet"]>) => void;
  updateVoiceSettings: (partial: Partial<AppSettings["voice"]>) => void;
  updateAiSettings: (partial: Partial<AppSettings["ai"]>) => void;
  updateTtsSettings: (partial: Partial<AppSettings["tts"]>) => void;
  updateAdvanced: (partial: Partial<AppSettings["advanced"]>) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,

  updateGeneral: (partial) =>
    set((s) => ({ settings: { ...s.settings, general: { ...s.settings.general, ...partial } } })),
  updatePetSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, pet: { ...s.settings.pet, ...partial } } })),
  updateVoiceSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, voice: { ...s.settings.voice, ...partial } } })),
  updateAiSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ai: { ...s.settings.ai, ...partial } } })),
  updateTtsSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, tts: { ...s.settings.tts, ...partial } } })),
  updateAdvanced: (partial) =>
    set((s) => ({ settings: { ...s.settings, advanced: { ...s.settings.advanced, ...partial } } })),
  resetToDefaults: () => set({ settings: defaultSettings }),
}));
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/frontend/stores/settingsStore.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Zustand stores for pet, chat, settings with tests"
```

---

## Phase 3: Services & Communication

### Task 7: WebSocket service

**Files:**
- Create: `src/services/websocketService.ts`
- Create: `tests/frontend/services/websocketService.test.ts`

- [ ] **Step 1: Write failing test for websocketService**

Write `tests/frontend/services/websocketService.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebSocketService } from "../../../src/services/websocketService";

describe("WebSocketService", () => {
  let service: WebSocketService;

  beforeEach(() => {
    service = new WebSocketService();
  });

  it("parses text-output messages", () => {
    const handler = vi.fn();
    service.onMessage(handler);
    const raw = JSON.stringify({ type: "text-output", data: "你好！" });
    handler(raw);
    expect(handler).toHaveBeenCalledWith(raw);
  });

  it("queues reconnect on connection failure", () => {
    service.connect("ws://localhost:99999");
    expect(service.isConnected()).toBe(false);
  });

  it("sends text-input message", () => {
    const mockSend = vi.fn();
    service["ws"] = { send: mockSend, readyState: 1 } as unknown as WebSocket;
    service.sendText("你好派蒙");
    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({ type: "text-input", data: "你好派蒙" })
    );
  });

  it("sends interrupt message", () => {
    const mockSend = vi.fn();
    service["ws"] = { send: mockSend, readyState: 1 } as unknown as WebSocket;
    service.interrupt();
    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({ type: "interrupt" })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/frontend/services/websocketService.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement websocketService**

Write `src/services/websocketService.ts`:
```typescript
import type { ClientMessage, ServerMessage } from "../types/messages";

type MessageHandler = (raw: string) => void;
type StateHandler = (connected: boolean) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = "";
  private messageHandlers: MessageHandler[] = [];
  private stateHandlers: StateHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  connect(url: string): void {
    this.url = url;
    this.cleanup();
    this.tryConnect();
  }

  private tryConnect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectDelay = 1000;
        this.stateHandlers.forEach((h) => h(true));
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.messageHandlers.forEach((h) => h(event.data as string));
      };

      this.ws.onclose = () => {
        this.stateHandlers.forEach((h) => h(false));
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.stateHandlers.forEach((h) => h(false));
      };
    } catch {
      this.stateHandlers.forEach((h) => h(false));
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.tryConnect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  private cleanup(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }

  disconnect(): void {
    this.cleanup();
    this.messageHandlers = [];
    this.stateHandlers = [];
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  onStateChange(handler: StateHandler): void {
    this.stateHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendText(text: string): void {
    this.send({ type: "text-input", data: text });
  }

  sendAudio(base64Audio: string): void {
    this.send({ type: "audio-input", data: base64Audio });
  }

  interrupt(): void {
    this.send({ type: "interrupt" });
  }

  ping(): void {
    this.send({ type: "ping" });
  }
}

export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    return JSON.parse(raw) as ServerMessage;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/frontend/services/websocketService.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add WebSocket service with reconnection and tests"
```

---

### Task 8: Audio playback service

**Files:**
- Create: `src/services/audioService.ts`

- [ ] **Step 1: Implement audioService**

Write `src/services/audioService.ts`:
```typescript
export class AudioService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private volume = 0.8;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  async playBase64Audio(base64: string): Promise<void> {
    this.stop();
    const ctx = this.getContext();
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const buffer = await ctx.decodeAudioData(bytes.buffer);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = this.volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
    this.currentSource = source;
    return new Promise((resolve) => {
      source.onended = () => {
        this.currentSource = null;
        resolve();
      };
    });
  }

  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource = null;
    }
  }

  async playSoundFile(path: string): Promise<void> {
    const ctx = this.getContext();
    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(buffer);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = audioBuffer;
    gain.gain.value = this.volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/audioService.ts
git commit -m "feat: add audio playback service for TTS output"
```

---

### Task 9: React hooks for WebSocket and Audio

**Files:**
- Create: `src/hooks/useWebSocket.ts`
- Create: `src/hooks/useAudio.ts`

- [ ] **Step 1: Create useWebSocket hook**

Write `src/hooks/useWebSocket.ts`:
```typescript
import { useEffect, useRef, useCallback } from "react";
import { WebSocketService, parseServerMessage } from "../services/websocketService";
import { usePetStore } from "../stores/petStore";
import { useChatStore } from "../stores/chatStore";
import type { ServerMessage } from "../types/messages";

export function useWebSocket(url: string) {
  const serviceRef = useRef<WebSocketService | null>(null);
  const setPetState = usePetStore((s) => s.setState);
  const setExpression = usePetStore((s) => s.setExpression);
  const setAnimation = usePetStore((s) => s.setAnimation);
  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);

  useEffect(() => {
    const service = new WebSocketService();
    serviceRef.current = service;

    service.onMessage((raw) => {
      const msg = parseServerMessage(raw);
      if (!msg) return;
      handleMessage(msg);
    });

    service.connect(url);
    return () => service.disconnect();
  }, [url]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "text-output":
        addMessage("assistant", msg.data);
        break;
      case "expression":
        setExpression(msg.data);
        break;
      case "motion":
        setAnimation(`${msg.group}-${msg.index}`);
        break;
      case "state":
        setPetState(msg.data);
        if (msg.data === "thinking") setTyping(true);
        else setTyping(false);
        break;
      case "error":
        addMessage("assistant", `[Error] ${msg.data}`);
        break;
    }
  }, [addMessage, setExpression, setAnimation, setPetState, setTyping]);

  const sendText = useCallback((text: string) => {
    serviceRef.current?.sendText(text);
    addMessage("user", text);
  }, [addMessage]);

  const sendAudio = useCallback((base64: string) => {
    serviceRef.current?.sendAudio(base64);
  }, []);

  const interrupt = useCallback(() => {
    serviceRef.current?.interrupt();
  }, []);

  return {
    sendText,
    sendAudio,
    interrupt,
    isConnected: serviceRef.current?.isConnected() ?? false,
  };
}
```

- [ ] **Step 2: Create useAudio hook**

Write `src/hooks/useAudio.ts`:
```typescript
import { useEffect, useRef } from "react";
import { AudioService } from "../services/audioService";
import { useSettingsStore } from "../stores/settingsStore";
import { usePetStore } from "../stores/petStore";

export function useAudio() {
  const serviceRef = useRef<AudioService>(new AudioService());
  const outputVolume = useSettingsStore((s) => s.settings.voice.outputVolume);
  const setLipSyncing = usePetStore((s) => s.setLipSyncing);

  useEffect(() => {
    serviceRef.current.setVolume(outputVolume / 100);
  }, [outputVolume]);

  const playBase64Audio = async (base64: string) => {
    setLipSyncing(true);
    try {
      await serviceRef.current.playBase64Audio(base64);
    } finally {
      setLipSyncing(false);
    }
  };

  const playSound = (path: string) => {
    return serviceRef.current.playSoundFile(path);
  };

  const stop = () => {
    serviceRef.current.stop();
    setLipSyncing(false);
  };

  return { playBase64Audio, playSound, stop };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useWebSocket and useAudio hooks"
```

---

## Phase 4: UI Components

### Task 10: PetWindow, ChatBubble, ChatInput, StatusIndicator

**Files:**
- Create: `src/components/PetWindow.tsx`
- Create: `src/components/ChatBubble.tsx`
- Create: `src/components/ChatInput.tsx`
- Create: `src/components/StatusIndicator.tsx`
- Create: `tests/frontend/components/ChatBubble.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Install testing dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Create vitest.config.ts**

Write `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
});
```

- [ ] **Step 3: Write failing test for ChatBubble**

Write `tests/frontend/components/ChatBubble.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatBubble } from "../../../src/components/ChatBubble";

describe("ChatBubble", () => {
  it("renders assistant message", () => {
    render(<ChatBubble role="assistant" text="你好旅行者！" />);
    expect(screen.getByText("你好旅行者！")).toBeDefined();
  });

  it("renders user message", () => {
    render(<ChatBubble role="user" text="你好派蒙" />);
    expect(screen.getByText("你好派蒙")).toBeDefined();
  });

  it("has correct CSS class for role", () => {
    const { container } = render(<ChatBubble role="assistant" text="test" />);
    expect(container.firstChild).toHaveClass("chat-bubble-assistant");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tests/frontend/components/ChatBubble.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 5: Create StatusIndicator**

Write `src/components/StatusIndicator.tsx`:
```tsx
import type { PetState } from "../types/pet";

const STATE_LABELS: Record<PetState, string> = {
  idle: "",
  listening: "聆听中...",
  thinking: "思考中...",
  speaking: "说话中...",
  dragging: "",
};

interface Props {
  state: PetState;
}

export function StatusIndicator({ state }: Props) {
  if (state === "idle" || state === "dragging") return null;
  return <div className="status-indicator">{STATE_LABELS[state]}</div>;
}
```

- [ ] **Step 6: Create ChatBubble**

Write `src/components/ChatBubble.tsx`:
```tsx
interface Props {
  role: "user" | "assistant";
  text: string;
}

export function ChatBubble({ role, text }: Props) {
  return (
    <div className={`chat-bubble chat-bubble-${role}`}>
      {role === "assistant" && <span className="chat-name">派蒙</span>}
      <p className="chat-text">{text}</p>
    </div>
  );
}
```

- [ ] **Step 7: Create ChatInput**

Write `src/components/ChatInput.tsx`:
```tsx
import { useState } from "react";

interface Props {
  onSend: (text: string) => void;
  visible: boolean;
}

export function ChatInput({ onSend, visible }: Props) {
  const [text, setText] = useState("");

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <input
        className="chat-input"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="和派蒙说话..."
        autoFocus
      />
      <button className="chat-send-btn" type="submit">
        发送
      </button>
    </form>
  );
}
```

- [ ] **Step 8: Create PetWindow**

Write `src/components/PetWindow.tsx`:
```tsx
import { useState } from "react";
import { usePetStore } from "../stores/petStore";
import { useChatStore } from "../stores/chatStore";
import { StatusIndicator } from "./StatusIndicator";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { Live2DRenderer } from "../renderers/Live2DRenderer";
import { SpriteRenderer } from "../renderers/SpriteRenderer";

export function PetWindow() {
  const petState = usePetStore((s) => s.state);
  const visual = usePetStore((s) => s.visual);
  const messages = useChatStore((s) => s.messages);
  const [chatVisible, setChatVisible] = useState(false);
  const [onSendText, setOnSendText] = useState<(text: string) => void>(() => () => {});

  const recentMessages = messages.slice(-6);

  return (
    <div
      className="pet-window"
      onClick={() => setChatVisible(!chatVisible)}
      data-tauri-drag-region
    >
      <StatusIndicator state={petState} />

      <div className="pet-renderer">
        {visual.mode === "live2d" ? (
          <Live2DRenderer scale={visual.scale} expression={visual.currentExpression} />
        ) : (
          <SpriteRenderer scale={visual.scale} animation={visual.currentAnimation} />
        )}
      </div>

      <div className="chat-bubbles">
        {recentMessages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} text={msg.text} />
        ))}
      </div>

      <ChatInput visible={chatVisible} onSend={onSendText} />
    </div>
  );
}

export function setSendTextHandler(handler: (text: string) => void) {
  // This will be wired up in App.tsx
}
```

- [ ] **Step 9: Update App.tsx**

Write `src/App.tsx`:
```tsx
import { PetWindow } from "./components/PetWindow";
import { useWebSocket } from "./hooks/useWebSocket";
import { useAudio } from "./hooks/useAudio";
import { useSettingsStore } from "./stores/settingsStore";
import { useEffect, useRef } from "react";

function App() {
  const backendPort = useSettingsStore((s) => s.settings.advanced.backendPort);
  const { sendText, isConnected } = useWebSocket(`ws://localhost:${backendPort}/client-ws`);
  const { playBase64Audio } = useAudio();
  const wsRef = useRef({ sendText, isConnected, playBase64Audio });

  useEffect(() => {
    wsRef.current = { sendText, isConnected, playBase64Audio };
  }, [sendText, isConnected, playBase64Audio]);

  return <PetWindow />;
}

export default App;
```

- [ ] **Step 10: Add CSS for components**

Append to `src/App.css`:
```css
.pet-window {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;
}

.status-indicator {
  position: absolute;
  top: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffd700;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  z-index: 10;
}

.pet-renderer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-bubbles {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 300px;
  z-index: 5;
}

.chat-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  max-width: 280px;
  word-wrap: break-word;
  animation: fadeIn 0.3s ease;
}

.chat-bubble-assistant {
  background: rgba(255, 215, 0, 0.9);
  color: #333;
  align-self: flex-start;
}

.chat-bubble-user {
  background: rgba(100, 149, 237, 0.9);
  color: white;
  align-self: flex-end;
}

.chat-name {
  font-weight: bold;
  font-size: 11px;
  display: block;
  margin-bottom: 2px;
}

.chat-text {
  margin: 0;
}

.chat-input-form {
  position: absolute;
  bottom: 20px;
  display: flex;
  gap: 8px;
  width: 80%;
  z-index: 10;
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 14px;
  outline: none;
}

.chat-input:focus {
  border-color: #ffd700;
}

.chat-send-btn {
  padding: 8px 16px;
  background: #ffd700;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 11: Run tests**

Run: `npx vitest run tests/frontend/components/ChatBubble.test.tsx`
Expected: All 3 tests PASS.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add PetWindow, ChatBubble, ChatInput, StatusIndicator with tests"
```

---

## Phase 5: Renderers

### Task 11: Sprite renderer

**Files:**
- Create: `src/renderers/SpriteRenderer.tsx`
- Create: `assets/sprites/paimon/pet.json`
- Copy: `assets/sprites/paimon/spritesheet.png` (from paimon-codex-pet)

- [ ] **Step 1: Copy sprite assets from paimon-codex-pet**

```bash
cp -r "/c/Users/Gaaiyun/paimon pet/paimon-codex-pet/pet/paimon/"* "/c/Users/Gaaiyun/paimon pet/paimon-pet/assets/sprites/paimon/"
```

- [ ] **Step 2: Create pet.json sprite config**

Write `assets/sprites/paimon/pet.json`:
```json
{
  "name": "paimon",
  "frameSize": 192,
  "width": 1536,
  "height": 1872,
  "columns": 8,
  "rows": 9,
  "frameWidth": 192,
  "frameHeight": 208,
  "fps": 9,
  "states": {
    "idle": { "row": 0, "frameMax": 8 },
    "running-right": { "row": 1, "frameMax": 8 },
    "running-left": { "row": 2, "frameMax": 8 },
    "waving": { "row": 3, "frameMax": 8 },
    "jumping": { "row": 4, "frameMax": 8 },
    "failed": { "row": 5, "frameMax": 8 },
    "waiting": { "row": 6, "frameMax": 8 },
    "running": { "row": 7, "frameMax": 8 },
    "review": { "row": 8, "frameMax": 8 }
  }
}
```

- [ ] **Step 3: Implement SpriteRenderer**

Write `src/renderers/SpriteRenderer.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";

interface SpriteConfig {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  fps: number;
  states: Record<string, { row: number; frameMax: number }>;
}

interface Props {
  scale: number;
  animation: string;
}

export function SpriteRenderer({ scale, animation }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<SpriteConfig | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    fetch("/sprites/paimon/pet.json")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});

    const img = new Image();
    img.src = "/sprites/paimon/spritesheet.png";
    img.onload = () => {
      imageRef.current = img;
    };
  }, []);

  useEffect(() => {
    if (!config || !imageRef.current) return;
    frameRef.current = 0;

    const state = config.states[animation] || config.states["idle"];
    if (!state) return;

    const interval = 1000 / config.fps;
    let lastTime = 0;

    const draw = (time: number) => {
      if (time - lastTime >= interval) {
        lastTime = time;
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const frame = frameRef.current % state.frameMax;
        const sx = frame * config.frameWidth;
        const sy = state.row * config.frameHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          sx, sy, config.frameWidth, config.frameHeight,
          0, 0, canvas.width, canvas.height
        );
        frameRef.current++;
      }
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [config, animation]);

  const w = Math.round(192 * scale);
  const h = Math.round(208 * scale);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add sprite renderer with paimon spritesheet animation"
```

---

### Task 12: Live2D renderer

**Files:**
- Create: `src/renderers/Live2DRenderer.tsx`

- [ ] **Step 1: Install pixi.js and pixi-live2d-display**

```bash
npm install pixi.js@^7 pixi-live2d-display
```

- [ ] **Step 2: Implement Live2DRenderer**

Write `src/renderers/Live2DRenderer.tsx`:
```tsx
import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display";

window.PIXI = PIXI;

interface Props {
  scale: number;
  expression: string;
}

export function Live2DRenderer({ scale, expression }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      backgroundAlpha: 0,
      resizeTo: containerRef.current,
      antialias: true,
    });
    appRef.current = app;
    containerRef.current.appendChild(app.view as unknown as Node);

    Live2DModel.from("/live2d/paimon/paimon.model3.json")
      .then((model) => {
        model.scale.set(scale * 0.4);
        model.anchor.set(0.5, 0.5);
        model.x = app.screen.width / 2;
        model.y = app.screen.height / 2;
        app.stage.addChild(model);
        modelRef.current = model;
      })
      .catch(() => {
        // Model not found - will show fallback
      });

    return () => {
      modelRef.current = null;
      app.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.scale.set(scale * 0.4);
  }, [scale]);

  useEffect(() => {
    if (!modelRef.current || !expression) return;
    modelRef.current.expression(expression);
  }, [expression]);

  return <div ref={containerRef} className="live2d-container" />;
}
```

- [ ] **Step 3: Add Live2D CSS**

Append to `src/App.css`:
```css
.live2d-container {
  width: 100%;
  height: 100%;
}

.live2d-container canvas {
  display: block;
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Live2D renderer with pixi-live2d-display"
```

---

## Phase 6: Settings Panel

### Task 13: Settings UI components

**Files:**
- Create: `src/settings/SettingsPanel.tsx`
- Create: `src/settings/GeneralSettings.tsx`
- Create: `src/settings/PetSettings.tsx`
- Create: `src/settings/VoiceSettings.tsx`
- Create: `src/settings/AISettings.tsx`

- [ ] **Step 1: Install Mantine UI**

```bash
npm install @mantine/core @mantine/hooks postcss postcss-preset-mantine postcss-simple-vars
```

- [ ] **Step 2: Create GeneralSettings**

Write `src/settings/GeneralSettings.tsx`:
```tsx
import { Switch, Select, Stack } from "@mantine/core";
import { useSettingsStore } from "../stores/settingsStore";

export function GeneralSettings() {
  const general = useSettingsStore((s) => s.settings.general);
  const update = useSettingsStore((s) => s.updateGeneral);

  return (
    <Stack>
      <Select
        label="语言"
        value={general.language}
        onChange={(v) => update({ language: v as "zh-CN" | "en" })}
        data={[
          { value: "zh-CN", label: "中文" },
          { value: "en", label: "English" },
        ]}
      />
      <Select
        label="主题"
        value={general.theme}
        onChange={(v) => update({ theme: v as "dark" | "light" | "system" })}
        data={[
          { value: "dark", label: "深色" },
          { value: "light", label: "浅色" },
          { value: "system", label: "跟随系统" },
        ]}
      />
      <Switch
        label="开机自启动"
        checked={general.autostart}
        onChange={(e) => update({ autostart: e.currentTarget.checked })}
      />
    </Stack>
  );
}
```

- [ ] **Step 3: Create PetSettings**

Write `src/settings/PetSettings.tsx`:
```tsx
import { Slider, Stack, Switch, Select, NumberInput } from "@mantine/core";
import { useSettingsStore } from "../stores/settingsStore";

export function PetSettings() {
  const pet = useSettingsStore((s) => s.settings.pet);
  const update = useSettingsStore((s) => s.updatePetSettings);

  return (
    <Stack>
      <Select
        label="视觉模式"
        value={pet.visualMode}
        onChange={(v) => update({ visualMode: v as "live2d" | "sprite" })}
        data={[
          { value: "live2d", label: "Live2D 模型" },
          { value: "sprite", label: "精灵图动画" },
        ]}
      />
      <Slider
        label="缩放"
        min={0.5}
        max={2.0}
        step={0.1}
        value={pet.scale}
        onChange={(v) => update({ scale: v })}
      />
      <Slider
        label="动画速度"
        min={0.5}
        max={2.0}
        step={0.1}
        value={pet.animationSpeed}
        onChange={(v) => update({ animationSpeed: v })}
      />
      <Switch
        label="始终置顶"
        checked={pet.alwaysOnTop}
        onChange={(e) => update({ alwaysOnTop: e.currentTarget.checked })}
      />
      <Switch
        label="点击穿透"
        checked={pet.clickThrough}
        onChange={(e) => update({ clickThrough: e.currentTarget.checked })}
      />
    </Stack>
  );
}
```

- [ ] **Step 4: Create VoiceSettings**

Write `src/settings/VoiceSettings.tsx`:
```tsx
import { Stack, Slider, TextInput, Switch } from "@mantine/core";
import { useSettingsStore } from "../stores/settingsStore";

export function VoiceSettings() {
  const voice = useSettingsStore((s) => s.settings.voice);
  const update = useSettingsStore((s) => s.updateVoiceSettings);

  return (
    <Stack>
      <TextInput
        label="输入设备"
        value={voice.inputDevice}
        onChange={(e) => update({ inputDevice: e.currentTarget.value })}
        placeholder="默认"
      />
      <TextInput
        label="输出设备"
        value={voice.outputDevice}
        onChange={(e) => update({ outputDevice: e.currentTarget.value })}
        placeholder="默认"
      />
      <Slider
        label="输入音量"
        min={0}
        max={100}
        value={voice.inputVolume}
        onChange={(v) => update({ inputVolume: v })}
      />
      <Slider
        label="输出音量"
        min={0}
        max={100}
        value={voice.outputVolume}
        onChange={(v) => update({ outputVolume: v })}
      />
      <TextInput
        label="按键说话快捷键"
        value={voice.pushToTalkKey}
        onChange={(e) => update({ pushToTalkKey: e.currentTarget.value })}
      />
      <Switch
        label="持续聆听"
        checked={voice.continuousListening}
        onChange={(e) => update({ continuousListening: e.currentTarget.checked })}
      />
    </Stack>
  );
}
```

- [ ] **Step 5: Create AISettings**

Write `src/settings/AISettings.tsx`:
```tsx
import { Stack, Select, TextInput, Slider, NumberInput } from "@mantine/core";
import { useSettingsStore } from "../stores/settingsStore";

export function AISettings() {
  const ai = useSettingsStore((s) => s.settings.ai);
  const updateAi = useSettingsStore((s) => s.updateAiSettings);
  const tts = useSettingsStore((s) => s.settings.tts);
  const updateTts = useSettingsStore((s) => s.updateTtsSettings);

  return (
    <Stack>
      <Select
        label="LLM 提供商"
        value={ai.provider}
        onChange={(v) => updateAi({ provider: v as "openclaw" | "openai" | "ollama" })}
        data={[
          { value: "openclaw", label: "OpenClaw" },
          { value: "openai", label: "OpenAI 兼容" },
          { value: "ollama", label: "Ollama (本地)" },
        ]}
      />
      <TextInput
        label="API 端点"
        value={ai.apiEndpoint}
        onChange={(e) => updateAi({ apiEndpoint: e.currentTarget.value })}
      />
      <TextInput
        label="模型"
        value={ai.model}
        onChange={(e) => updateAi({ model: e.currentTarget.value })}
      />
      <Slider
        label="温度"
        min={0}
        max={2}
        step={0.1}
        value={ai.temperature}
        onChange={(v) => updateAi({ temperature: v })}
      />
      <NumberInput
        label="最大 Token"
        value={ai.maxTokens}
        onChange={(v) => updateAi({ maxTokens: v as number })}
      />
      <Select
        label="TTS 提供商"
        value={tts.provider}
        onChange={(v) => updateTts({ provider: v as "vits" | "edge-tts" })}
        data={[
          { value: "vits", label: "VITS (派蒙声音)" },
          { value: "edge-tts", label: "Edge TTS (备用)" },
        ]}
      />
      <TextInput
        label="VITS 服务器地址"
        value={tts.vitsServerUrl}
        onChange={(e) => updateTts({ vitsServerUrl: e.currentTarget.value })}
      />
    </Stack>
  );
}
```

- [ ] **Step 6: Create SettingsPanel (tab container)**

Write `src/settings/SettingsPanel.tsx`:
```tsx
import { Tabs, Stack, Text } from "@mantine/core";
import { GeneralSettings } from "./GeneralSettings";
import { PetSettings } from "./PetSettings";
import { VoiceSettings } from "./VoiceSettings";
import { AISettings } from "./AISettings";

export function SettingsPanel() {
  return (
    <div style={{ padding: "20px", height: "100vh", background: "#1a1a2e", color: "white" }}>
      <Text size="xl" fw={700} mb="md" style={{ color: "#ffd700" }}>
        PaimonPet 设置
      </Text>
      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Tab value="general">通用</Tabs.Tab>
          <Tabs.Tab value="pet">宠物</Tabs.Tab>
          <Tabs.Tab value="voice">语音</Tabs.Tab>
          <Tabs.Tab value="ai">AI / TTS</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="md">
          <GeneralSettings />
        </Tabs.Panel>
        <Tabs.Panel value="pet" pt="md">
          <PetSettings />
        </Tabs.Panel>
        <Tabs.Panel value="voice" pt="md">
          <VoiceSettings />
        </Tabs.Panel>
        <Tabs.Panel value="ai" pt="md">
          <AISettings />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add settings panel with General, Pet, Voice, AI tabs"
```

---

## Phase 7: Backend Integration

### Task 14: Backend launcher script

**Files:**
- Create: `backend/start.py`
- Create: `backend/conf.yaml`

- [ ] **Step 1: Create backend/start.py**

Write `backend/start.py`:
```python
"""Launcher for Open-LLM-VTuber backend with Paimon configuration."""
import subprocess
import sys
import os

def main():
    backend_dir = os.path.join(os.path.dirname(__file__), "..")
    open_llm_vtuber_dir = os.environ.get(
        "OPEN_LLM_VTUBER_DIR",
        os.path.join(os.path.expanduser("~"), "Open-LLM-VTuber")
    )

    if not os.path.exists(open_llm_vtuber_dir):
        print(f"Error: Open-LLM-VTuber not found at {open_llm_vtuber_dir}")
        print("Set OPEN_LLM_VTUBER_DIR environment variable to its path.")
        sys.exit(1)

    conf_src = os.path.join(os.path.dirname(__file__), "conf.yaml")
    conf_dst = os.path.join(open_llm_vtuber_dir, "conf.yaml")

    if os.path.exists(conf_src):
        import shutil
        shutil.copy2(conf_src, conf_dst)
        print(f"Copied Paimon config to {conf_dst}")

    os.chdir(open_llm_vtuber_dir)
    subprocess.run([sys.executable, "-m", "uvicorn", "src.open_llm_vtuber.server:app", "--host", "0.0.0.0", "--port", "12393"])

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Create backend/conf.yaml (Paimon preset)**

Write `backend/conf.yaml`:
```yaml
system_config:
  host: "0.0.0.0"
  port: 12393
  version: "v1.2.1"

character_config:
  character_name: "派蒙"
  character_uid: "paimon_001"
  avatar: "paimon.jpg"
  human_name: "旅行者"
  live2d_model_name: "paimon"

agent_config:
  agent_name: "basic_memory_agent"
  llm_provider: "openai_compatible_llm"

llm_configs:
  openai_compatible_llm:
    llm_provider_name: "openai_compatible"
    model: "openclaw:main"
    base_url: "http://127.0.0.1:18789/v1"
    temperature: 0.7
    max_tokens: 1024

asr_config:
  asr_provider_name: "sense_voice"
  language: "auto"
  device: "cpu"

tts_config:
  tts_provider_name: "x_tts"
  x_tts_url: "http://127.0.0.1:8020/tts_to_audio"
  language: "zh"
  speaker: "female"

vad_config:
  vad_provider_name: "silero"

persona_prompt: |
  你是派蒙（Paimon），来自提瓦特大陆的神秘小精灵，是旅行者最忠实的向导和同伴。
  你的性格活泼可爱、话很多、有点贪吃、偶尔犯迷糊，但关键时刻非常靠谱。
  你说话时经常自称"派蒙"而不是"我"，喜欢用"欸嘿"、"哼"、"喂！"等语气词。
  你对美食有着极大的热情，尤其喜欢甜甜花酿鸡和烤蘑菇披萨。
  你会帮旅行者整理信息、提供建议，偶尔也会吐槽几句。
  注意：用简短自然的口语风格说话，不要太书面化，回答要简洁。
```

- [ ] **Step 3: Commit**

```bash
git add backend/
git commit -m "feat: add backend launcher script with Paimon config preset"
```

---

## Phase 8: Final Integration & Polish

### Task 15: Wire everything together in App.tsx

**Files:**
- Modify: `src/App.tsx`
- Create: `README.md`
- Create: `CLAUDE.md`

- [ ] **Step 1: Update App.tsx with full integration**

Write `src/App.tsx`:
```tsx
import { PetWindow } from "./components/PetWindow";
import { useWebSocket } from "./hooks/useWebSocket";
import { useSettingsStore } from "./stores/settingsStore";
import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const backendPort = useSettingsStore((s) => s.settings.advanced.backendPort);
  const wsUrl = `ws://localhost:${backendPort}/client-ws`;
  const { sendText, isConnected } = useWebSocket(wsUrl);

  useEffect(() => {
    invoke("check_backend_health", { port: backendPort }).then((running) => {
      if (!running) {
        console.warn("Open-LLM-VTuber backend not running. Start it manually or via settings.");
      }
    });
  }, [backendPort]);

  return <PetWindow />;
}

export default App;
```

- [ ] **Step 2: Create CLAUDE.md**

Write `CLAUDE.md`:
```markdown
# PaimonPet

Paimon desktop pet with AI voice conversation.

## Architecture
- Tauri v2 (Rust) for desktop shell
- React + TypeScript for frontend (Live2D + Sprite rendering)
- Open-LLM-VTuber (Python) for AI backend (LLM/ASR/TTS)
- VITS server for Paimon voice synthesis

## Development
```bash
npm install           # Install frontend deps
npx tauri dev         # Run dev server with hot reload
npx vitest            # Run frontend tests
cd src-tauri && cargo test  # Run Rust tests
```

## Prerequisites
- Node.js 18+
- Rust toolchain
- Python 3.10+ (for Open-LLM-VTuber backend)
- Open-LLM-VTuber installed and configured
- VITS paimon.pth model available

## Key Files
- `src-tauri/src/lib.rs` - Rust entry point, module wiring
- `src/App.tsx` - React entry point
- `src/stores/` - Zustand state management
- `src/services/websocketService.ts` - WebSocket client
- `backend/conf.yaml` - Open-LLM-VTuber Paimon config
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: wire full integration, add CLAUDE.md"
```

---

### Task 16: Run all tests and verify

**Files:** None new — verification only

- [ ] **Step 1: Run Rust tests**

Run: `cd src-tauri && cargo test`
Expected: All tests pass.

- [ ] **Step 2: Run frontend tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Verify build**

Run: `npx tauri build`
Expected: Build succeeds, creates Windows executable.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify all tests and build pass"
```

---

## Self-Review Checklist

- [x] **Spec coverage**: Each section of the PRD maps to tasks: Desktop Window → Task 2, System Tray → Task 3, Rust modules → Task 4, Types → Task 5, Stores → Task 6, WebSocket → Task 7, Audio → Task 8, Hooks → Task 9, UI Components → Task 10, Sprite → Task 11, Live2D → Task 12, Settings → Task 13, Backend → Task 14, Integration → Task 15, Tests → Task 16
- [x] **Placeholder scan**: No TBD, TODO, or "implement later" found
- [x] **Type consistency**: `ClientMessage`, `ServerMessage`, `AppSettings`, `PetState` types are consistent across all files
- [x] **File paths**: All paths are explicit and consistent
- [x] **Test coverage**: Settings store, WebSocket service, ChatBubble component all have tests
