import type { ClientMessage, ServerMessage } from "../types/messages";

/** Connection state reported by WebSocketService */
export type ConnectionState = "disconnected" | "connecting" | "connected";

/**
 * Parses a raw JSON string into a ServerMessage, or returns null on failure.
 * This is a pure utility function (no side effects).
 */
export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.type === "string") {
      return parsed as ServerMessage;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * WebSocketService encapsulates a WebSocket connection with:
 *  - Automatic reconnection with exponential backoff (1 s initial, 2x each retry, max 30 s)
 *  - Typed message sending / receiving
 *  - State change callbacks
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = "";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;

  // Exponential backoff parameters
  private static readonly INITIAL_DELAY = 1000;
  private static readonly MAX_DELAY = 30000;
  private static readonly BACKOFF_FACTOR = 2;

  // Callbacks
  private messageHandler: ((msg: ServerMessage) => void) | null = null;
  private stateChangeHandler: ((state: ConnectionState) => void) | null = null;

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Open a WebSocket connection to `url`. Closes any existing connection first. */
  connect(url: string): void {
    this.url = url;
    this.disconnect();

    this.setConnectionState("connecting");

    try {
      this.ws = new WebSocket(url);
    } catch {
      // Invalid URL or environment without WebSocket support
      this.setConnectionState("disconnected");
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnectionState("connected");
    };

    this.ws.onclose = () => {
      this.setConnectionState("disconnected");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, so reconnect logic lives there
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const msg = parseServerMessage(String(event.data));
      if (msg && this.messageHandler) {
        this.messageHandler(msg);
      }
    };
  }

  /** Close the connection and cancel any pending reconnect. */
  disconnect(): void {
    this.clearReconnectTimer();
    if (this.ws) {
      // Remove listeners to prevent the onclose handler from triggering reconnect
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

  /** Register a handler for incoming ServerMessages. */
  onMessage(handler: (msg: ServerMessage) => void): void {
    this.messageHandler = handler;
  }

  /** Register a handler for connection state changes. */
  onStateChange(handler: (state: ConnectionState) => void): void {
    this.stateChangeHandler = handler;
  }

  /** Whether the socket is currently open. */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /** Send a typed ClientMessage over the wire as JSON. */
  send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /** Convenience: send a text-input message. */
  sendText(text: string): void {
    this.send({ type: "text-input", data: text });
  }

  /** Convenience: send an audio-input message (base64 encoded). */
  sendAudio(base64: string): void {
    this.send({ type: "audio-input", data: base64 });
  }

  /** Send an interrupt message to the server. */
  interrupt(): void {
    this.send({ type: "interrupt" });
  }

  /** Send a ping keep-alive. */
  ping(): void {
    this.send({ type: "ping" });
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

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
