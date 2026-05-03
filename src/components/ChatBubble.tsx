interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
}

/**
 * ChatBubble renders a single chat message.
 * Assistant messages show a "派蒙" name label above the bubble.
 */
export function ChatBubble({ role, text }: ChatBubbleProps) {
  return (
    <div className={`chat-bubble chat-bubble-${role}`}>
      {role === "assistant" && <span className="chat-name">派蒙</span>}
      <p className="chat-text">{text}</p>
    </div>
  );
}
