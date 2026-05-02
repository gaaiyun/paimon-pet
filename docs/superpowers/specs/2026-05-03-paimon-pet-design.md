# PaimonPet - PRD & Technical Design Document

> Date: 2026-05-03
> Status: Draft
> Author: gaaiyun + Claude

---

## 1. Product Overview

### 1.1 Vision

PaimonPet is a desktop pet application featuring Paimon from Genshin Impact. It combines an animated desktop companion with real-time AI voice conversation powered by OpenClaw/MiniMax LLM and Paimon's synthesized voice (VITS). The pet lives on the user's desktop as a transparent, always-on-top overlay, responding to voice and text input with speech, expressions, and animations.

### 1.2 Problem Statement

Current ai-paimon project requires a browser and has no desktop integration. Current paimon-codex-pet is a static asset pack with no interactivity. There is no unified desktop application that provides an animated Paimon pet with AI voice conversation capabilities.

### 1.3 Goals

- Create a standalone Windows desktop application (Tauri v2)
- Animated Paimon companion on desktop (Live2D + Sprite dual mode)
- Real-time voice conversation with Paimon's voice (VITS TTS)
- Text-based chat as fallback
- Integration with Open-LLM-VTuber backend for maximum LLM/ASR/TTS flexibility
- Interactive pet behaviors (idle animations, click reactions, drag, sound effects)

### 1.4 Non-Goals

- Cross-platform support (Windows only for v1)
- Multi-character support (Paimon only for v1)
- Mobile app
- Online multiplayer
- Custom character creation tools

---

## 2. Target Users

- Genshin Impact fans who want a desktop companion
- Users who already have ai-paimon and Open-LLM-VTuber set up
- Desktop customization enthusiasts
- Chinese-speaking users (primary language)

---

## 3. Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────┐
│                 PaimonPet (Tauri v2)             │
│  ┌───────────────────────────────────────────┐  │
│  │           React Frontend (WebView)        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐ │  │
│  │  │ Live2D  │  │ Sprite  │  │  Chat UI  │ │  │
│  │  │ Renderer│  │Renderer │  │  (Bubble) │ │  │
│  │  └────┬────┘  └────┬────┘  └─────┬─────┘ │  │
│  │       └──────┬─────┘             │        │  │
│  │              │  WebSocket Client │        │  │
│  └──────────────┼───────────────────┼────────┘  │
│                 │                   │           │
│  ┌──────────────┼───────────────────┼────────┐  │
│  │        Rust Backend (Tauri)      │        │  │
│  │  ┌────────┐  ┌────────┐  ┌──────┴─────┐ │  │
│  │  │ Window │  │ Audio  │  │  Process   │ │  │
│  │  │ Manager│  │Capture │  │  Manager   │ │  │
│  │  │(transp │  │(cpal)  │  │(python svr)│ │  │
│  │  │ top,pt│  │        │  │            │ │  │
│  │  │ rough) │  │        │  │            │ │  │
│  │  └────────┘  └────────┘  └────────────┘ │  │
│  │  ┌────────┐  ┌────────┐  ┌────────────┐ │  │
│  │  │ System │  │Global  │  │  Config    │ │  │
│  │  │  Tray  │  │Hotkeys │  │  Manager   │ │  │
│  │  └────────┘  └────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
          │                    │
          │ HTTP/WS            │ HTTP
          ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│ Open-LLM-VTuber  │  │   VITS Server    │
│   Python Backend │  │   (Port 8020)    │
│  (Port 12393)    │  │  Paimon Voice    │
│                  │  │   Synthesis      │
│ - LLM Agent      │  │                  │
│ - ASR (sherpa)   │  └──────────────────┘
│ - TTS routing    │
│ - Live2D ctrl    │
│ - Vision         │
│ - WebSocket API  │
└──────────────────┘
```

### 3.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| Tauri Shell | Desktop window management, transparency, always-on-top, click-through, system tray | Rust, Tauri v2 |
| React Frontend | Live2D rendering, sprite animation, chat UI, settings UI | React, TypeScript, PIXI.js |
| Rust Audio Module | Microphone capture, audio streaming to WebSocket | cpal, tokio-tungstenite |
| Open-LLM-VTuber Backend | LLM conversation, ASR, TTS routing, Live2D expression control, vision | Python, FastAPI |
| VITS Server | Paimon voice synthesis | Python, PyTorch, FastAPI |

### 3.3 Communication Protocol

**Frontend ↔ Open-LLM-VTuber**: WebSocket (`ws://localhost:12393/client-ws`)

Message format (JSON):
```json
// User sends audio
{
  "type": "audio-input",
  "data": "<base64-encoded-audio>"
}

// User sends text
{
  "type": "text-input",
  "data": "你好派蒙"
}

// Backend sends expression
{
  "type": "expression",
  "data": "joy"
}

// Backend sends audio response
{
  "type": "audio-output",
  "data": "<base64-encoded-audio>"
}

// Backend sends text (for chat bubble)
{
  "type": "text-output",
  "data": "旅行者！今天想吃什么呀？"
}

// Backend sends Live2D motion
{
  "type": "motion",
  "group": "Tap",
  "index": 1
}
```

**Rust Audio → Open-LLM-VTuber**: WebSocket binary frames (raw PCM audio chunks)

---

## 4. Feature Specifications

### 4.1 Desktop Window

| Feature | Specification |
|---------|--------------|
| Transparency | Fully transparent background, no window chrome |
| Always-on-top | Window stays above all other applications |
| Click-through | Configurable; pet area is interactive, rest is transparent to clicks |
| Draggable | Click and drag pet to reposition |
| Resizable | Pet scale adjustable via settings (0.5x - 2.0x) |
| System tray | Tray icon with right-click menu: Show/Hide, Settings, Mute, Quit |
| Global hotkeys | Push-to-talk (default: `Alt+Space`), Toggle visibility (`Ctrl+Shift+P`) |
| Multi-monitor | Remember position per monitor |
| Skip taskbar | Does not appear in Windows taskbar |

### 4.2 Pet Visual System

#### 4.2.1 Live2D Mode (Primary)

- Uses pixi-live2d-display for rendering Paimon Live2D model in PIXI.js canvas
- Supports Cubism 2.x and 3.x model formats
- Expression mapping from LLM emotion tags: `[happy]` → joy expression, `[sad]` → sadness expression
- Idle animations (breathing, blinking, subtle movements)
- Lip sync with TTS audio (mouth parameter sync)
- Motion triggers on user interaction (tap head, tap body, drag)
- Scale: configurable (default 0.4x)
- Model loaded from `live2d-models/paimon/` directory

Emotion mapping:
```json
{
  "neutral": 0,
  "anger": 2,
  "disgust": 2,
  "fear": 1,
  "joy": 3,
  "smirk": 3,
  "sadness": 1,
  "surprise": 3
}
```

#### 4.2.2 Sprite Mode (Fallback)

- Uses Phaser.js or CSS sprite animation
- Loads spritesheet from paimon-codex-pet project
- Animation states: idle, running-right, running-left, waving, jumping, failed, waiting, review
- Frame rate: 9 FPS
- Sprite dimensions: 192x208 per frame
- Spritesheet: 1536x1872 (8 columns x 9 rows)

#### 4.2.3 Mode Switching

- User can switch between Live2D and Sprite mode in settings
- Hot reload without restart
- Default: Live2D mode

### 4.3 Voice Interaction Pipeline

#### 4.3.1 Voice Input (Microphone)

- Rust captures audio via cpal library (16kHz, mono, 16-bit PCM)
- Audio streamed to Open-LLM-VTuber via WebSocket binary frames
- Voice Activity Detection (VAD) via Silero (in Open-LLM-VTuber backend)
- ASR via sherpa-onnx SenseVoice (Chinese, English, Japanese, Korean, Cantonese)
- Push-to-talk mode (default): Hold hotkey to record
- Optional continuous listening mode with wake word (future)

#### 4.3.2 Voice Output (TTS)

- Primary: VITS server with paimon.pth model (Paimon's voice)
- Fallback: Edge TTS (if VITS server unavailable)
- Audio played through default system speaker
- Lip sync with Live2D mouth parameter during playback
- Volume control in settings

#### 4.3.3 Text Chat

- Click pet to open chat bubble input
- Type message, press Enter to send
- Chat bubble displays near pet with fade-in/fade-out animation
- Conversation history accessible via expandable panel

### 4.4 AI Conversation

- LLM Provider: MiniMax M2.5 via OpenClaw Gateway (primary)
- Compatible with any OpenAI-compatible API (Ollama, DeepSeek, etc.)
- Character persona: Paimon personality (defined in system prompt)
- Expression tags in LLM output: `[happy]`, `[sad]`, `[angry]`, `[surprise]`, `[thinking]`
- Streaming responses for real-time display
- Conversation memory (per session)
- Interrupt: User can interrupt Paimon mid-speech

Paimon persona prompt:
```
你是派蒙（Paimon），来自提瓦特大陆的神秘小精灵，是旅行者最忠实的向导和同伴。
你的性格活泼可爱、话很多、有点贪吃、偶尔犯迷糊，但关键时刻非常靠谱。
你说话时经常自称"派蒙"而不是"我"，喜欢用"欸嘿"、"哼"、"喂！"等语气词。
你对美食有着极大的热情，尤其喜欢甜甜花酿鸡和烤蘑菇披萨。
你会帮旅行者整理信息、提供建议，偶尔也会吐槽几句。
注意：用简短自然的口语风格说话，不要太书面化，回答要简洁。
```

### 4.5 Pet Behaviors

| Behavior | Trigger | Response |
|----------|---------|----------|
| Idle | No interaction for 5s | Random idle animation cycle |
| Breathing | Continuous | Subtle body scale oscillation |
| Blinking | Random interval (2-5s) | Eye blink animation |
| Tap head | Click on head area | Head tap motion + surprise expression |
| Tap body | Click on body area | Body tap motion + reaction sound |
| Drag | Click + drag | Drag motion + position update |
| Speaking | TTS audio playing | Lip sync + expression animation |
| Listening | Microphone active | Listening expression + state indicator |
| Thinking | Waiting for LLM | Thinking expression + "..." bubble |
| Greeting | App launch | Waving animation + greeting sound |

### 4.6 Settings Panel

- **General**: Language (zh-CN/en), theme (dark/light), autostart on boot
- **Pet**: Visual mode (Live2D/Sprite), scale, position, animation speed
- **Voice**: Input device, output device, volume, push-to-talk hotkey
- **AI**: LLM provider, API endpoint, model, temperature, persona customization
- **TTS**: TTS provider (VITS/Edge TTS), VITS server URL, voice parameters
- **Advanced**: Debug mode, log level, backend port, data directory
- **About**: Version, credits, license

### 4.7 Process Management

- Tauri app manages Open-LLM-VTuber Python backend as child process
- On launch: Check if backend is running → start if not → wait for health check
- On quit: Gracefully shut down backend process
- Health check: HTTP GET `/health` every 10 seconds
- Backend status indicator in system tray

---

## 5. Project Structure

```
PaimonPet/
├── src-tauri/                      # Tauri Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json            # Tauri permissions
│   ├── src/
│   │   ├── main.rs                 # Entry point
│   │   ├── lib.rs                  # Module declarations
│   │   ├── audio/
│   │   │   ├── mod.rs
│   │   │   ├── capture.rs          # Microphone capture (cpal)
│   │   │   └── stream.rs           # Audio stream management
│   │   ├── window/
│   │   │   ├── mod.rs
│   │   │   ├── transparent.rs      # Transparent/always-on-top config
│   │   │   └── tray.rs             # System tray
│   │   ├── backend/
│   │   │   ├── mod.rs
│   │   │   ├── process.rs          # Python process management
│   │   │   └── health.rs           # Health check
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── audio.rs            # Tauri commands for audio
│   │   │   ├── window.rs           # Tauri commands for window
│   │   │   └── backend.rs          # Tauri commands for backend
│   │   └── config/
│   │       ├── mod.rs
│   │       └── settings.rs         # App settings management
│   └── icons/                      # App icons
│
├── src/                            # React frontend
│   ├── App.tsx                     # Main app with routes
│   ├── main.tsx                    # Entry point
│   ├── components/
│   │   ├── PetWindow.tsx           # Main pet overlay window
│   │   ├── ChatBubble.tsx          # Chat bubble UI
│   │   ├── ChatInput.tsx           # Text input for chat
│   │   ├── StatusIndicator.tsx     # Listening/Thinking/Speaking state
│   │   └── Settings/
│   │       ├── SettingsPanel.tsx   # Settings main panel
│   │       ├── GeneralSettings.tsx
│   │       ├── PetSettings.tsx
│   │       ├── VoiceSettings.tsx
│   │       └── AISettings.tsx
│   ├── renderers/
│   │   ├── Live2DRenderer.tsx      # Live2D rendering component
│   │   └── SpriteRenderer.tsx      # Sprite animation component
│   ├── hooks/
│   │   ├── useWebSocket.ts         # WebSocket connection to backend
│   │   ├── useAudio.ts            # Audio playback management
│   │   ├── useVoiceInput.ts       # Voice input state management
│   │   └── useSettings.ts         # Settings state (Zustand)
│   ├── stores/
│   │   ├── chatStore.ts           # Chat messages state
│   │   ├── petStore.ts            # Pet visual state
│   │   └── settingsStore.ts       # Settings state
│   ├── services/
│   │   ├── websocketService.ts    # WebSocket client
│   │   ├── audioService.ts        # Audio decode/play
│   │   └── tauriService.ts        # Tauri invoke wrappers
│   ├── types/
│   │   ├── messages.ts            # WebSocket message types
│   │   ├── settings.ts            # Settings type definitions
│   │   └── pet.ts                 # Pet state types
│   └── styles/
│       ├── global.css
│       ├── pet.css
│       └── chat.css
│
├── backend/                        # Open-LLM-VTuber integration
│   ├── start.py                    # Backend launcher script
│   ├── config/
│   │   └── conf.yaml              # Open-LLM-VTuber config (Paimon preset)
│   └── characters/
│       └── paimon/
│           ├── character.yaml      # Paimon character definition
│           └── prompts/
│               └── system.txt      # Paimon persona prompt
│
├── assets/
│   ├── live2d/
│   │   └── paimon/                 # Paimon Live2D model files
│   │       ├── paimon.model3.json
│   │       ├── paimon.moc3
│   │       ├── textures/
│   │       ├── motions/
│   │       └── expressions/
│   ├── sprites/
│   │   └── paimon/
│   │       ├── spritesheet.png     # From paimon-codex-pet
│   │       └── pet.json            # Sprite config
│   ├── sounds/
│   │   ├── tap.wav
│   │   ├── greeting.wav
│   │   └── notification.wav
│   └── icons/
│       ├── icon.ico                # Windows app icon
│       └── tray.ico                # System tray icon
│
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-05-03-paimon-pet-design.md
│
├── tests/
│   ├── src-tauri/                  # Rust tests
│   │   ├── audio_capture_test.rs
│   │   ├── process_manager_test.rs
│   │   └── settings_test.rs
│   └── src/                        # Frontend tests
│       ├── components/
│       │   ├── ChatBubble.test.tsx
│       │   └── StatusIndicator.test.tsx
│       ├── hooks/
│       │   ├── useWebSocket.test.ts
│       │   └── useAudio.test.ts
│       ├── services/
│       │   └── websocketService.test.ts
│       └── renderers/
│           └── SpriteRenderer.test.tsx
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── CLAUDE.md
└── README.md
```

---

## 6. Data Models

### 6.1 WebSocket Messages

```typescript
// Client → Server
type ClientMessage =
  | { type: "audio-input"; data: string }        // base64 PCM audio
  | { type: "text-input"; data: string }         // text message
  | { type: "interrupt" }                         // stop current response
  | { type: "set-expression"; data: string }     // manual expression
  | { type: "ping" };

// Server → Client
type ServerMessage =
  | { type: "text-output"; data: string }        // chat text
  | { type: "audio-output"; data: string }       // base64 audio
  | { type: "expression"; data: string }         // emotion tag
  | { type: "motion"; group: string; index: number }
  | { type: "state"; data: "listening" | "thinking" | "speaking" | "idle" }
  | { type: "error"; data: string }
  | { type: "pong" };
```

### 6.2 Settings Schema

```typescript
interface AppSettings {
  general: {
    language: "zh-CN" | "en";
    theme: "dark" | "light" | "system";
    autostart: boolean;
  };
  pet: {
    visualMode: "live2d" | "sprite";
    scale: number;           // 0.5 - 2.0
    x: number;               // window position
    y: number;
    animationSpeed: number;  // 0.5 - 2.0
    alwaysOnTop: boolean;
    clickThrough: boolean;
  };
  voice: {
    inputDevice: string;
    outputDevice: string;
    inputVolume: number;     // 0 - 100
    outputVolume: number;    // 0 - 100
    pushToTalkKey: string;   // hotkey string
    continuousListening: boolean;
  };
  ai: {
    provider: "openclaw" | "openai" | "ollama";
    apiEndpoint: string;
    model: string;
    temperature: number;
    maxTokens: number;
    personaPrompt: string;
  };
  tts: {
    provider: "vits" | "edge-tts";
    vitsServerUrl: string;
    language: string;
    speaker: string;
  };
  advanced: {
    debugMode: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
    backendPort: number;
    dataDirectory: string;
  };
}
```

### 6.3 Pet State

```typescript
type PetState = "idle" | "listening" | "thinking" | "speaking" | "dragging";

interface PetVisualState {
  mode: "live2d" | "sprite";
  currentAnimation: string;
  currentExpression: string;
  scale: number;
  position: { x: number; y: number };
  isLipSyncing: boolean;
}
```

---

## 7. Dependencies

### 7.1 Rust (Cargo)

| Crate | Purpose | Version |
|-------|---------|---------|
| tauri | Desktop framework | 2.x |
| tauri-plugin-autostart | Boot autostart | latest |
| tauri-plugin-store | Settings persistence | latest |
| tauri-plugin-single-instance | Single instance | latest |
| cpal | Audio capture | 0.15 |
| tokio | Async runtime | 1.x |
| tokio-tungstenite | WebSocket client | 0.21 |
| serde / serde_json | Serialization | 1.x |
| tracing | Logging | 0.1 |
| anyhow | Error handling | 1.x |

### 7.2 Frontend (npm)

| Package | Purpose | Version |
|---------|---------|---------|
| react | UI framework | 18.x |
| typescript | Type system | 5.x |
| @tauri-apps/api | Tauri bridge | 2.x |
| pixi.js | WebGL renderer | 7.x |
| pixi-live2d-display | Live2D in PIXI | 0.4.x |
| zustand | State management | 4.x |
| vite | Build tool | 5.x |
| @mantine/core | UI components (settings) | 7.x |
| vitest | Testing | latest |
| @testing-library/react | Component testing | latest |

### 7.3 Python Backend

| Package | Purpose |
|---------|---------|
| open-llm-vtuber | AI companion backend |
| fastapi | HTTP server |
| torch | VITS inference |
| sherpa-onnx | ASR engine |
| soundfile | Audio I/O |

---

## 8. Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Backend not running | Show notification, offer to start, fall back to limited mode (no AI) |
| VITS server unavailable | Fall back to Edge TTS |
| Microphone not found | Show error, disable voice input, text-only mode |
| WebSocket disconnected | Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s) |
| LLM API error | Show error in chat bubble, offer retry |
| ASR recognition empty | Show "didn't catch that" message |
| Live2D model not found | Fall back to sprite mode |
| Settings corrupted | Reset to defaults, log warning |

---

## 9. Testing Strategy

### 9.1 Rust Backend Tests

| Test | Type | Description |
|------|------|-------------|
| audio_capture_format | Unit | Verify cpal captures 16kHz mono 16-bit PCM |
| settings_load_save | Unit | Settings serialization roundtrip |
| settings_defaults | Unit | Default values are correct |
| process_health_check | Integration | Health check against live backend |
| process_lifecycle | Integration | Start/stop backend process |

### 9.2 Frontend Tests

| Test | Type | Description |
|------|------|-------------|
| ChatBubble render | Component | Renders messages correctly |
| ChatBubble animation | Component | Fade-in/out transitions work |
| StatusIndicator states | Component | Shows correct state icons |
| useWebSocket connect | Hook | Establishes connection |
| useWebSocket reconnect | Hook | Reconnects on disconnect |
| useWebSocket messages | Hook | Parses incoming messages correctly |
| useAudio playback | Hook | Decodes and plays base64 audio |
| settingsStore defaults | Store | Initial state is correct |
| settingsStore update | Store | Settings update persists |
| websocketService parse | Service | Message parsing edge cases |

### 9.3 Integration Tests

| Test | Description |
|------|-------------|
| Full voice pipeline | Mic → ASR → LLM → TTS → Speaker |
| Text chat flow | Input → LLM → Response → Display |
| Expression sync | LLM emotion tags → Live2D expressions |
| Mode switching | Live2D ↔ Sprite without crash |
| Window management | Transparency, always-on-top, click-through |
| Process lifecycle | Backend start/stop/restart |

---

## 10. Performance Requirements

| Metric | Target |
|--------|--------|
| App startup time | < 3 seconds (excluding backend) |
| Memory usage (idle) | < 150MB (Tauri + WebView) |
| Memory usage (speaking) | < 300MB |
| Audio latency (mic → ASR) | < 500ms |
| LLM response time (first token) | < 2 seconds |
| TTS synthesis time | < 300ms per sentence |
| Frame rate (Live2D) | 60 FPS |
| Frame rate (Sprite) | 30 FPS |
| CPU usage (idle) | < 2% |
| Install size | < 50MB (excluding Python backend and models) |

---

## 11. Security Considerations

- API keys stored in local config, never sent to external services (except designated API endpoints)
- VITS model files validated on load
- WebSocket connections only to localhost
- No telemetry or data collection
- Python backend runs with user permissions only
- Settings file permissions restricted to current user

---

## 12. Milestones

| Phase | Scope | Duration |
|-------|-------|----------|
| Phase 1: Skeleton | Tauri project setup, transparent window, system tray, basic React frontend | 1-2 days |
| Phase 2: Visual | Live2D renderer, sprite renderer, animation system, pet interactions | 2-3 days |
| Phase 3: Voice & Chat | Microphone capture, WebSocket connection, text chat, audio playback | 2-3 days |
| Phase 4: AI Integration | Open-LLM-VTuber backend integration, expression sync, lip sync | 2-3 days |
| Phase 5: Settings & Polish | Settings panel, configuration persistence, error handling, UX polish | 1-2 days |
| Phase 6: Testing & Release | Full test suite, bug fixes, packaging, documentation | 1-2 days |

---

## 13. Open Questions

1. ~~Framework choice~~ → Decided: Tauri v2 + React
2. ~~Visual mode~~ → Decided: Dual (Live2D + Sprite)
3. ~~AI backend~~ → Decided: Open-LLM-VTuber integration
4. ~~Platform~~ → Decided: Windows only (v1)
5. Paimon Live2D model source — need to confirm licensing and availability
6. VITS paimon.pth model packaging strategy — bundle or separate download
7. Open-LLM-VTuber version pinning — which commit/tag to target
