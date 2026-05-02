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
