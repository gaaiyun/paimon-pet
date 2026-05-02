# PaimonPet

Paimon desktop pet with AI voice conversation.

## Architecture
- Tauri v2 (Rust) for desktop shell
- React + TypeScript for frontend (Live2D + Sprite rendering)
- Open-LLM-VTuber (Python) for AI backend (LLM/ASR/TTS)
- VITS server for Paimon voice synthesis

## Development
npm install && npx tauri dev

## Prerequisites
- Node.js 18+, Rust toolchain, Python 3.10+
- Open-LLM-VTuber installed, VITS paimon.pth model

## Testing
npx vitest run
cd src-tauri && cargo test
