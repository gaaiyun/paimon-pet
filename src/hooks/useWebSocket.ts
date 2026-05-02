import { useEffect, useRef, useCallback } from "react";
import { WebSocketService } from "../services/websocketService";
import { useChatStore } from "../stores/chatStore";
import { usePetStore } from "../stores/petStore";
import type { ServerMessage } from "../types/messages";

interface UseWebSocketOptions {
  /** Called with base64 audio data when the server sends an audio-output message */
  onAudioOutput?: (base64: string) => void;
}

/**
 * Hook that manages a WebSocketService lifecycle:
 *  - Connects on mount, disconnects on unmount
 *  - Dispatches incoming messages to the appropriate Zustand stores
 *  - Returns convenience send functions
 */
export function useWebSocket(url: string, options?: UseWebSocketOptions) {
  const serviceRef = useRef<WebSocketService | null>(null);

  // Store actions (pulled once — they are stable references from zustand)
  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const setExpression = usePetStore((s) => s.setExpression);
  const setAnimation = usePetStore((s) => s.setAnimation);
  const setState = usePetStore((s) => s.setState);

  useEffect(() => {
    const ws = new WebSocketService();
    serviceRef.current = ws;

    // Route incoming server messages to stores
    ws.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case "text-output":
          addMessage("assistant", msg.data);
          break;
        case "expression":
          setExpression(msg.data);
          break;
        case "motion":
          setAnimation(`${msg.group}-${msg.index}`);
          break;
        case "state":
          setState(msg.data);
          // When the pet transitions to "thinking" or "speaking", show typing indicator
          setTyping(msg.data === "thinking" || msg.data === "speaking");
          break;
        case "audio-output":
          options?.onAudioOutput?.(msg.data);
          break;
        case "error":
          console.error("[WebSocket] server error:", msg.data);
          break;
        case "pong":
          // Keep-alive response — nothing to do
          break;
      }
    });

    ws.connect(url);

    return () => {
      ws.disconnect();
      serviceRef.current = null;
    };
  }, [url, options, addMessage, setTyping, setExpression, setAnimation, setState]);

  const sendText = useCallback((text: string) => {
    serviceRef.current?.sendText(text);
  }, []);

  const sendAudio = useCallback((base64: string) => {
    serviceRef.current?.sendAudio(base64);
  }, []);

  const interrupt = useCallback(() => {
    serviceRef.current?.interrupt();
  }, []);

  return { sendText, sendAudio, interrupt };
}
