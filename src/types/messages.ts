import type { PetState } from "./pet";

// Client → Server messages (matching Open-LLM-VTuber /client-ws protocol)
export type ClientMessage =
  | { type: "text-input"; text: string }
  | { type: "mic-audio-data"; audio: number[] }
  | { type: "mic-audio-end" }
  | { type: "interrupt-signal"; text: string }
  | { type: "heartbeat" };

// Server → Client messages (matching Open-LLM-VTuber responses)
export type ServerMessage =
  | { type: "full-text"; text: string }
  | { type: "audio"; audio: string; display_text?: { text: string; name?: string } }
  | { type: "expression"; data: string }
  | { type: "motion"; group: string; index: number }
  | { type: "state"; data: PetState }
  | { type: "control"; text: string }
  | { type: "heartbeat-ack" }
  | { type: "backend-synth-complete" }
  | { type: "error"; data: string; message?: string };

export type { PetState };
