/** Connection state reported by WebSocketService */
export type ConnectionState = "disconnected" | "connecting" | "connected";

/**
 * Parses a raw JSON string into a ServerMessage, or returns null on failure.
 */
export function parseServerMessage(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.type === "string") {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * WebSocketService encapsulates a WebSocket connection with:
 *  - Automatic reconnection with exponential backoff
 *  - Typed message sending / receiving
 *  - Heartbeat keep-alive
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = "";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private static readonly INITIAL_DELAY = 1000;
  private static readonly MAX_DELAY = 30000;
  private static readonly BACKOFF_FACTOR = 2;
  private static readonly HEARTBEAT_INTERVAL = 30_000;

  private messageHandler: ((msg: Record<string, unknown>) => void) | null = null;
  private stateChangeHandler: ((state: ConnectionState) => void) | null = null;

  connect(url: string): void {
    this.url = url;
    this.disconnect();

    this.setConnectionState("connecting");

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      console.error("[WebSocket] Failed to create WebSocket:", err);
      this.setConnectionState("disconnected");
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnectionState("connected");
      this.startHeartbeat();
    };

    this.ws.onclose = () => {
      this.setConnectionState("disconnected");
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      console.error("[WebSocket] Error occurred");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const msg = parseServerMessage(String(event.data));
      if (msg && this.messageHandler) {
        this.messageHandler(msg);
      }
    };
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.setConnectionState("disconnected");
  }

  onMessage(handler: (msg: Record<string, unknown>) => void): void {
    this.messageHandler = handler;
  }

  onStateChange(handler: (state: ConnectionState) => void): void {
    this.stateChangeHandler = handler;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /** Send a text message through the unified protocol. */
  sendText(text: string): void {
    this.sendRaw({ type: "text-input", text });
  }

  /** Send Float32 PCM audio data followed by an end signal. */
  sendAudioFloat32(samples: Float32Array): void {
    this.sendRaw({ type: "mic-audio-data", audio: Array.from(samples) });
    this.sendRaw({ type: "mic-audio-end" });
  }

  /** Send an interrupt signal. */
  interrupt(): void {
    this.sendRaw({ type: "interrupt-signal", text: "" });
  }

  /** Acknowledge playback completion so the backend can finalize the turn. */
  sendPlaybackComplete(): void {
    this.sendRaw({ type: "frontend-playback-complete" });
  }

  /** Send heartbeat keep-alive. */
  ping(): void {
    this.sendRaw({ type: "heartbeat" });
  }

  private sendRaw(payload: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.ping();
    }, WebSocketService.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.stateChangeHandler) {
      this.stateChangeHandler(state);
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    const delay = Math.min(
      WebSocketService.INITIAL_DELAY * Math.pow(WebSocketService.BACKOFF_FACTOR, this.reconnectAttempts),
      WebSocketService.MAX_DELAY,
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      if (this.url) {
        this.connect(this.url);
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
