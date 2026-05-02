import { useState } from "react";
import { usePetStore } from "../stores/petStore";
import { useChatStore } from "../stores/chatStore";
import { StatusIndicator } from "./StatusIndicator";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { SpriteRenderer } from "../renderers/SpriteRenderer";
import { Live2DRenderer } from "../renderers/Live2DRenderer";

/** Maximum number of chat bubbles to display */
const MAX_VISIBLE_MESSAGES = 6;

interface PetWindowProps {
  onSend: (text: string) => void;
}

/**
 * PetWindow is the main desktop pet container.
 * It renders the character (Live2D or sprite), a status indicator,
 * a scrolling chat bubble list, and an input field.
 * Clicking the pet area toggles chat visibility.
 */
export function PetWindow({ onSend }: PetWindowProps) {
  const petState = usePetStore((s) => s.state);
  const visual = usePetStore((s) => s.visual);
  const messages = useChatStore((s) => s.messages);

  const [chatVisible, setChatVisible] = useState(false);

  // Show only the last N messages
  const visibleMessages = messages.slice(-MAX_VISIBLE_MESSAGES);

  return (
    <div className="pet-window">
      <StatusIndicator state={petState} />

      {/* Pet renderer area — click toggles chat */}
      <div
        className="pet-renderer"
        onClick={() => setChatVisible((prev) => !prev)}
      >
        {visual.mode === "live2d" ? (
          <Live2DRenderer
            scale={visual.scale}
            expression={visual.currentExpression}
          />
        ) : (
          <SpriteRenderer
            scale={visual.scale}
            animation={visual.currentAnimation}
          />
        )}
      </div>

      {/* Chat overlay */}
      {chatVisible && (
        <div className="chat-bubbles">
          {visibleMessages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} text={msg.text} />
          ))}
        </div>
      )}

      <ChatInput onSend={onSend} visible={chatVisible} />
    </div>
  );
}
