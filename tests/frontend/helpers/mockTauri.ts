import { vi } from "vitest";

const mockInvoke = vi.fn().mockResolvedValue(undefined);
const mockGetCurrentWindow = vi.fn().mockReturnValue({
  setAlwaysOnTop: vi.fn().mockResolvedValue(undefined),
  setIgnoreCursorEvents: vi.fn().mockResolvedValue(undefined),
  startDragging: vi.fn().mockResolvedValue(undefined),
  show: vi.fn().mockResolvedValue(undefined),
  hide: vi.fn().mockResolvedValue(undefined),
  setFocus: vi.fn().mockResolvedValue(undefined),
});

const mockListen = vi.fn().mockResolvedValue(vi.fn());
const mockEmit = vi.fn().mockResolvedValue(undefined);

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: mockGetCurrentWindow,
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: mockListen,
  emit: mockEmit,
}));

export { mockInvoke, mockGetCurrentWindow, mockListen, mockEmit };
