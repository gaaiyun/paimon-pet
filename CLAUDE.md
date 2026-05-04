# PaimonPet

Paimon desktop pet with AI voice conversation.

## Architecture
- **Tauri v2** (Rust) — transparent desktop window, tray menu, process management
- **React + TypeScript** — frontend UI with CSS sprite animation, chat panel, settings
- **Open-LLM-VTuber** (Python) — AI backend providing LLM, ASR, TTS via WebSocket
- **ClawBot Bridge** (Python) — OpenClaw Gateway v3 WebSocket → OpenAI-compatible REST bridge
- **VITS server** — Paimon voice synthesis

## Key Directories
```
paimon-pet/
  src/              # Frontend React code
    hooks/          # useWebSocket, useAudio
    services/       # websocketService, audioEncoder
    stores/         # Zustand stores (chat, pet, settings)
    settings/       # Settings panel component
    types/          # TypeScript type definitions
  src-tauri/        # Rust backend
    src/
      backend/      # Process management (start/stop services)
      window/       # Tray menu, window setup
  public/sprites/paimon/  # Sprite sheet + frame data
```

## Development
```bash
npm install && npx tauri dev
```

## Prerequisites
- Node.js 18+, Rust toolchain, Python 3.10+
- Open-LLM-VTuber installed with VITS paimon.pth model
- OpenClaw Gateway running (for ClawBot bridge)

## Testing
```bash
npx vitest run          # Frontend unit tests
cd src-tauri && cargo test  # Rust tests
```

## Build
```bash
npx tauri build
```

## Message Protocol
The frontend communicates with Open-LLM-VTuber via WebSocket (`/client-ws`):

**Client → Server:**
- `text-input` — text chat message
- `mic-audio-data` + `mic-audio-end` — voice input (Float32 PCM)
- `interrupt-signal` — cancel current response
- `heartbeat` — keep-alive ping
- `frontend-playback-complete` — acknowledge audio playback finished

**Server → Client:**
- `full-text` — complete text reply
- `audio` — TTS audio segment with `display_text`
- `user-input-transcription` — ASR transcription of voice input
- `control` — conversation chain signals (start/end)
- `backend-synth-complete` — all TTS done
- `state` — pet state change (thinking, speaking, idle)

## Window Configuration
- Transparent, borderless, always-on-top window (340×560 default)
- Resizable via bottom-right drag handle (min 280×400)
- `shadow: false` to eliminate Windows DWM border shadow
- Click pet sprite to toggle chat panel
- Drag pet sprite to move window
