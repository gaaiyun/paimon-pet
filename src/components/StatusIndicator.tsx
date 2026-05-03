import type { PetState } from "../types/pet";

interface StatusIndicatorProps {
  state: PetState;
}

/** Status text map: only listening, thinking, and speaking show a label */
const STATUS_TEXT: Record<PetState, string | null> = {
  idle: null,
  listening: "聆听中...",
  thinking: "思考中...",
  speaking: "说话中...",
  dragging: null,
};

/**
 * StatusIndicator displays a small overlay label when the pet
 * is in listening / thinking / speaking states.
 */
export function StatusIndicator({ state }: StatusIndicatorProps) {
  const text = STATUS_TEXT[state];
  if (!text) return null;

  return (
    <div className="status-indicator">
      {text}
    </div>
  );
}
