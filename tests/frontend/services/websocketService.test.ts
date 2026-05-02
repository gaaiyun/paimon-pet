import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebSocketService, parseServerMessage } from "../../../src/services/websocketService";
import type { ServerMessage } from "../../../src/types/messages";

// ---------------------------------------------------------------------------
// parseServerMessage (pure function — no mocking needed)
// ---------------------------------------------------------------------------

describe("parseServerMessage", () => {
  it("parses a valid text-output message", () => {
    const raw = JSON.stringify({ type: "text-output", data: "hello" });
    const msg = parseServerMessage(raw);
    expect(msg).toEqual({ type: "text-output", data: "hello" });
  });

  it("parses a valid expression message", () => {
    const raw = JSON.stringify({ type: "expression", data: "joy" });
    const msg = parseServerMessage(raw);
    expect(msg).toEqual({ type: "expression", data: "joy" });
  });

  it("parses a valid motion message", () => {
    const raw = JSON.stringify({ type: "motion", group: "tap", index: 3 });
    const msg = parseServerMessage(raw);
    expect(msg).toEqual({ type: "motion", group: "tap", index: 3 });
  });

  it("parses a valid state message", () => {
    const raw = JSON.stringify({ type: "state", data: "thinking" });
    const msg = parseServerMessage(raw);
    expect(msg).toEqual({ type: "state", data: "thinking" });
  });

  it("parses a pong message", () => {
    const raw = JSON.stringify({ type: "pong" });
    const msg = parseServerMessage(raw);
    expect(msg).toEqual({ type: "pong" });
  });

  it("returns null for invalid JSON", () => {
    expect(parseServerMessage("not json")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseServerMessage("")).toBeNull();
  });

  it("returns null for JSON without a type field", () => {
    expect(parseServerMessage('{"data":"hello"}')).toBeNull();
  });

  it("returns null for non-object JSON", () => {
    expect(parseServerMessage("42")).toBeNull();
    expect(parseServerMessage('"hello"')).toBeNull();
    expect(parseServerMessage("null")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// WebSocketService (mocked WebSocket)
// ---------------------------------------------------------------------------

describe("WebSocketService", () => {
  let service: WebSocketService;
  let mockWs: {
    readyState: number;
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onopen: (() => void) | null;
    onclose: ((ev: unknown) => void) | null;
    onerror: ((ev: unknown) => void) | null;
    onmessage: ((ev: { data: string }) => void) | null;
  };

  beforeEach(() => {
    service = new WebSocketService();

    // Build a mock that will be the exact object returned by the constructor.
    // Because the constructor returns this object explicitly, the service's
    // internal `this.ws` reference IS `mockWs` — no property-copying gap.
    mockWs = {
      readyState: 0, // CONNECTING
      send: vi.fn(),
      close: vi.fn(function (this: typeof mockWs) {
        this.readyState = 3; // CLOSED
        if (this.onclose) this.onclose({});
      }),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
    };

    // Constructor that returns the shared mockWs object directly.
    // When a constructor returns an object, `new Constructor()` uses that object.
    function MockWS() {
      return mockWs;
    }
    // Attach readyState constants (service reads WebSocket.OPEN, etc.)
    MockWS.CONNECTING = 0;
    MockWS.OPEN = 1;
    MockWS.CLOSING = 2;
    MockWS.CLOSED = 3;

    vi.stubGlobal("WebSocket", MockWS);
  });

  // After each test, clean up stubs and disconnect the service to avoid
  // lingering reconnect timers.
  afterEach(() => {
    service.disconnect();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // --- sendText -----------------------------------------------------------

  describe("sendText", () => {
    it("produces correct JSON for a text-input message", () => {
      service.connect("ws://localhost:1234");
      // Simulate successful connection
      mockWs.readyState = WebSocket.OPEN;
      mockWs.onopen!();

      service.sendText("hello paimon");

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "text-input", data: "hello paimon" }),
      );
    });
  });

  // --- interrupt ----------------------------------------------------------

  describe("interrupt", () => {
    it("produces correct JSON for an interrupt message", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = WebSocket.OPEN;
      mockWs.onopen!();

      service.interrupt();

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "interrupt" }),
      );
    });
  });

  // --- Connection failure handling ----------------------------------------

  describe("connection failure", () => {
    it("handles connection failure gracefully (constructor throws)", () => {
      // Make the WebSocket constructor throw
      vi.stubGlobal(
        "WebSocket",
        vi.fn(() => {
          throw new Error("Connection refused");
        }),
      );

      const stateSpy = vi.fn();
      service.onStateChange(stateSpy);

      // Should not throw
      expect(() => service.connect("ws://bad-host:9999")).not.toThrow();

      // State should have transitioned to disconnected
      expect(stateSpy).toHaveBeenCalledWith("connecting");
      expect(stateSpy).toHaveBeenCalledWith("disconnected");
    });
  });

  // --- isConnected --------------------------------------------------------

  describe("isConnected", () => {
    it("returns false before connection", () => {
      expect(service.isConnected()).toBe(false);
    });

    it("returns true after successful connection", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = WebSocket.OPEN;
      mockWs.onopen!();
      expect(service.isConnected()).toBe(true);
    });

    it("returns false after disconnect", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = WebSocket.OPEN;
      mockWs.onopen!();
      service.disconnect();
      expect(service.isConnected()).toBe(false);
    });
  });

  // --- Message handling ---------------------------------------------------

  describe("onMessage", () => {
    it("dispatches parsed messages to the handler", () => {
      const handler = vi.fn();
      service.onMessage(handler);

      service.connect("ws://localhost:1234");
      mockWs.readyState = WebSocket.OPEN;
      mockWs.onopen!();

      const serverMsg: ServerMessage = { type: "text-output", data: "hi" };
      mockWs.onmessage!({ data: JSON.stringify(serverMsg) });

      expect(handler).toHaveBeenCalledWith(serverMsg);
    });

    it("ignores malformed messages", () => {
      const handler = vi.fn();
      service.onMessage(handler);

      service.connect("ws://localhost:1234");
      mockWs.readyState = WebSocket.OPEN;
      mockWs.onopen!();

      mockWs.onmessage!({ data: "not-json" });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // --- State changes ------------------------------------------------------

  describe("onStateChange", () => {
    it("notifies state changes through the handler", () => {
      const states: string[] = [];
      service.onStateChange((s) => states.push(s));

      service.connect("ws://localhost:1234");
      mockWs.readyState = 1; // OPEN
      mockWs.onopen!();

      // connect() calls disconnect() first (disconnected), then connecting,
      // then the mock onopen fires (connected).
      expect(states).toContain("connecting");
      expect(states).toContain("connected");
    });
  });

  // --- sendAudio / ping ---------------------------------------------------

  describe("sendAudio", () => {
    it("sends an audio-input message", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = WebSocket.OPEN;
      mockWs.onopen!();

      service.sendAudio("base64data");

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "audio-input", data: "base64data" }),
      );
    });
  });

  describe("ping", () => {
    it("sends a ping message", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = WebSocket.OPEN;
      mockWs.onopen!();

      service.ping();

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "ping" }),
      );
    });
  });
});
