export type PetState = "idle" | "listening" | "thinking" | "speaking" | "dragging";

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
