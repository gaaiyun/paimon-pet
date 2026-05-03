import { useState, type FormEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  visible: boolean;
}

/**
 * ChatInput provides a text field and send button for user input.
 * Returns null when the chat panel is not visible.
 */
export function ChatInput({ onSend, visible }: ChatInputProps) {
  const [input, setInput] = useState("");

  if (!visible) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <input
        className="chat-input"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="和派蒙说话..."
        autoFocus
      />
      <button className="chat-send-btn" type="submit">
        发送
      </button>
    </form>
  );
}
