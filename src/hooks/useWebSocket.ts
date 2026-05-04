import { useEffect, useRef, useCallback, useState } from "react";
import { WebSocketService, type ConnectionState } from "../services/websocketService";
import { useChatStore } from "../stores/chatStore";
import { usePetStore } from "../stores/petStore";
import type { PetState } from "../types/pet";

interface UseWebSocketOptions {
  onAudioOutput?: (base64: string) => void;
}

export function useWebSocket(url: string, options?: UseWebSocketOptions) {
  const serviceRef = useRef<WebSocketService | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const inChainRef = useRef(false);

  const addMessage = useChatStore((s) => s.addMessage);
  const appendToLastAssistant = useChatStore((s) => s.appendToLastAssistant);
  const setTyping = useChatStore((s) => s.setTyping);
  const setState = usePetStore((s) => s.setState);

  // Keep options ref stable to avoid reconnection loops
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const ws = new WebSocketService();
    serviceRef.current = ws;

    ws.onStateChange(setConnectionState);

    ws.onMessage((msg: Record<string, unknown>) => {
      const msgType = msg.type as string;

      switch (msgType) {
        case "full-text":
          if (typeof msg.text === "string") {
            const t = msg.text;
            // Skip internal "Thinking..." or "Connection established" messages
            if (t === "Thinking..." || t === "Connection established") break;
            if (inChainRef.current) {
              appendToLastAssistant(t);
            } else {
              addMessage("assistant", t);
            }
          }
          break;
        case "user-input-transcription":
          if (typeof msg.text === "string" && msg.text.trim()) {
            addMessage("user", msg.text);
          }
          break;
        case "state":
          if (typeof msg.data === "string") {
            setState(msg.data as PetState);
            setTyping(msg.data === "thinking" || msg.data === "speaking");
          }
          break;
        case "audio":
          if (typeof msg.audio === "string") {
            optionsRef.current?.onAudioOutput?.(msg.audio);
            // Only show display_text when there is actual TTS audio
            if (msg.display_text && typeof (msg.display_text as Record<string, unknown>).text === "string") {
              const raw = (msg.display_text as { text: string }).text;
              // Strip emotion tags like [joy], [smirk], etc.
              const cleaned = raw.replace(/\[[\w]+\]\s*/g, "").trim();
              if (cleaned) {
                if (inChainRef.current) {
                  appendToLastAssistant(cleaned);
                } else {
                  addMessage("assistant", cleaned);
                }
              }
            }
          }
          break;
        case "expression":
        case "motion":
          break;
        case "error":
          console.error("[WebSocket] server error:", msg.data || msg.message);
          setState("idle");
          setTyping(false);
          inChainRef.current = false;
          break;
        case "heartbeat-ack":
          break;
        case "backend-synth-complete":
          setState("idle");
          setTyping(false);
          inChainRef.current = false;
          ws.sendPlaybackComplete();
          break;
        case "control":
          if (typeof msg.text === "string") {
            if (msg.text === "conversation-chain-start") {
              inChainRef.current = true;
              setTyping(true);
            } else if (msg.text === "conversation-chain-end") {
              inChainRef.current = false;
              setState("idle");
              setTyping(false);
            }
          }
          break;
        case "force-new-message":
          inChainRef.current = false;
          break;
      }
    });

    ws.connect(url);

    return () => {
      ws.disconnect();
      serviceRef.current = null;
    };
  }, [url, addMessage, appendToLastAssistant, setTyping, setState]);

  const sendText = useCallback((text: string) => {
    serviceRef.current?.sendText(text);
  }, []);

  const sendAudioFloat32 = useCallback((samples: Float32Array) => {
    serviceRef.current?.sendAudioFloat32(samples);
  }, []);

  const interrupt = useCallback(() => {
    serviceRef.current?.interrupt();
  }, []);

  return { connectionState, sendText, sendAudioFloat32, interrupt };
}
