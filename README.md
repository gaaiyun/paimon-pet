# PaimonPet

PaimonPet is a desktop pet application featuring the Paimon character from Genshin Impact with AI voice conversation capabilities. It sits on your desktop as an animated character (Live2D or sprite-based) that you can chat with using voice or text.

## Features

- **Animated Desktop Pet** - Paimon lives on your desktop as a Live2D model or sprite animation
- **AI Voice Chat** - Have conversations with Paimon using voice input and she responds in her own voice
- **Text Chat** - Type messages to interact with Paimon
- **Settings Panel** - Configure language, theme, pet behavior, voice devices, and AI provider
- **System Tray** - Runs quietly in the system tray with right-click menu

## Architecture

```
paimon-pet/
├── src/                      # Frontend (React + TypeScript)
│   ├── components/           # UI components (PetWindow, ChatBubble, StatusIndicator)
│   ├── settings/             # Mantine UI settings panels
│   ├── renderers/            # Live2D and Sprite renderers
│   ├── stores/               # Zustand state stores
│   ├── hooks/                # React hooks (WebSocket, Audio)
│   ├── services/             # WebSocket and Audio services
│   └── types/                # TypeScript type definitions
├── src-tauri/                # Tauri v2 backend (Rust)
│   └── src/
│       ├── audio/            # Audio capture
│       ├── backend/          # Backend process management
│       ├── commands/         # Tauri commands
│       ├── config/           # Configuration
│       └── window/           # Window and tray management
└── backend/                  # Python backend launcher
    ├── start.py              # Open-LLM-VTuber launcher
    └── conf.yaml             # Paimon character configuration
```

- **Tauri v2 (Rust)** - Desktop shell providing transparent always-on-top window, system tray, audio capture, and backend process management
- **React + TypeScript** - Frontend with Live2D and sprite rendering, chat UI, and settings panel using Mantine UI
- **Open-LLM-VTuber (Python)** - AI backend providing LLM, ASR (SenseVoice), TTS (VITS/Edge TTS), and VAD (Silero)
- **VITS Server** - Paimon voice synthesis server

## Setup

### Prerequisites

- Node.js 18+
- Rust toolchain (rustup)
- Python 3.10+
- [Open-LLM-VTuber](https://github.com/t41372/Open-LLM-VTuber) installed
- VITS paimon.pth model for Paimon voice

### Install and Run

```bash
# Install frontend dependencies
npm install

# Development mode
npx tauri dev

# Build for production
npx tauri build
```

### Backend Setup

Set the `OPEN_LLM_VTUBER_DIR` environment variable to point to your Open-LLM-VTuber installation, then run:

```bash
python backend/start.py
```

## Testing

```bash
# Frontend tests
npx vitest run

# Rust backend tests
cd src-tauri && cargo test
```

## Configuration

Settings can be configured through the settings panel (accessible via system tray) or by modifying the store defaults in `src/stores/settingsStore.ts`.

Key configuration options:
- **Language**: Chinese (zh-CN) or English
- **Visual Mode**: Live2D model or sprite animation
- **AI Provider**: OpenClaw, OpenAI, or Ollama
- **TTS Provider**: VITS or Edge TTS
- **Backend Port**: Default 12393 for Open-LLM-VTuber
