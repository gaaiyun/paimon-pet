import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocketService, parseServerMessage } from "../../../src/services/websocketService";

describe("parseServerMessage", () => {
  it("parses a valid full-text message", () => {
    const raw = JSON.stringify({ type: "full-text", text: "hello" });
    const msg = parseServerMessage(raw);
    expect(msg).toEqual({ type: "full-text", text: "hello" });
  });

  it("parses a valid audio message", () => {
    const raw = JSON.stringify({ type: "audio", audio: "base64data", display_text: { text: "hi" } });
    const msg = parseServerMessage(raw);
    expect(msg).toEqual({ type: "audio", audio: "base64data", display_text: { text: "hi" } });
  });

  it("parses a heartbeat-ack message", () => {
    const raw = JSON.stringify({ type: "heartbeat-ack" });
    const msg = parseServerMessage(raw);
    expect(msg).toEqual({ type: "heartbeat-ack" });
  });

  it("parses a control message", () => {
    const raw = JSON.stringify({ type: "control", text: "conversation-chain-start" });
    const msg = parseServerMessage(raw);
    expect(msg).toEqual({ type: "control", text: "conversation-chain-start" });
  });

  it("returns null for invalid JSON", () => {
    expect(parseServerMessage("not json")).toBeNull();
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

    mockWs = {
      readyState: 0,
      send: vi.fn(),
      close: vi.fn(function (this: typeof mockWs) {
        this.readyState = 3;
        if (this.onclose) this.onclose({});
      }),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
    };

    function MockWS() {
      return mockWs;
    }
    MockWS.CONNECTING = 0;
    MockWS.OPEN = 1;
    MockWS.CLOSING = 2;
    MockWS.CLOSED = 3;

    vi.stubGlobal("WebSocket", MockWS);
    vi.useFakeTimers();
  });

  afterEach(() => {
    service.disconnect();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("sendText", () => {
    it("sends text-input message with text field", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = 1;
      mockWs.onopen!();

      service.sendText("hello paimon");

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "text-input", text: "hello paimon" }),
      );
    });
  });

  describe("sendAudioFloat32", () => {
    it("sends mic-audio-data followed by mic-audio-end", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = 1;
      mockWs.onopen!();

      const samples = new Float32Array([0.1, 0.2, 0.3]);
      service.sendAudioFloat32(samples);

      expect(mockWs.send).toHaveBeenCalledTimes(2);
      // First call: mic-audio-data with float32 values
      const firstCall = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      expect(firstCall.type).toBe("mic-audio-data");
      expect(firstCall.audio).toHaveLength(3);
      expect(firstCall.audio[0]).toBeCloseTo(0.1);
      expect(firstCall.audio[1]).toBeCloseTo(0.2);
      expect(firstCall.audio[2]).toBeCloseTo(0.3);
      // Second call: mic-audio-end
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "mic-audio-end" }),
      );
    });
  });

  describe("interrupt", () => {
    it("sends interrupt-signal message", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = 1;
      mockWs.onopen!();

      service.interrupt();

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "interrupt-signal", text: "" }),
      );
    });
  });

  describe("heartbeat", () => {
    it("sends heartbeat at regular intervals after connecting", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = 1;
      mockWs.onopen!();

      // Advance past the heartbeat interval
      vi.advanceTimersByTime(30_000);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "heartbeat" }),
      );
    });

    it("stops heartbeat on disconnect", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = 1;
      mockWs.onopen!();

      service.disconnect();

      const sendCount = mockWs.send.mock.calls.length;
      vi.advanceTimersByTime(60_000);

      // No additional sends after disconnect
      expect(mockWs.send.mock.calls.length).toBe(sendCount);
    });
  });

  describe("connection failure", () => {
    it("handles connection failure gracefully", () => {
      vi.stubGlobal(
        "WebSocket",
        vi.fn(() => {
          throw new Error("Connection refused");
        }),
      );

      const stateSpy = vi.fn();
      service.onStateChange(stateSpy);

      expect(() => service.connect("ws://bad-host:9999")).not.toThrow();
      expect(stateSpy).toHaveBeenCalledWith("connecting");
      expect(stateSpy).toHaveBeenCalledWith("disconnected");
    });
  });

  describe("isConnected", () => {
    it("returns false before connection", () => {
      expect(service.isConnected()).toBe(false);
    });

    it("returns true after successful connection", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = 1;
      mockWs.onopen!();
      expect(service.isConnected()).toBe(true);
    });

    it("returns false after disconnect", () => {
      service.connect("ws://localhost:1234");
      mockWs.readyState = 1;
      mockWs.onopen!();
      service.disconnect();
      expect(service.isConnected()).toBe(false);
    });
  });

  describe("onMessage", () => {
    it("dispatches parsed messages to the handler", () => {
      const handler = vi.fn();
      service.onMessage(handler);

      service.connect("ws://localhost:1234");
      mockWs.readyState = 1;
      mockWs.onopen!();

      mockWs.onmessage!({ data: JSON.stringify({ type: "full-text", text: "hi" }) });

      expect(handler).toHaveBeenCalledWith({ type: "full-text", text: "hi" });
    });

    it("ignores malformed messages", () => {
      const handler = vi.fn();
      service.onMessage(handler);

      service.connect("ws://localhost:1234");
      mockWs.readyState = 1;
      mockWs.onopen!();

      mockWs.onmessage!({ data: "not-json" });
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
