import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { PetWindow } from "./components/PetWindow";
import { useWebSocket } from "./hooks/useWebSocket";
import { useAudio } from "./hooks/useAudio";
import { useSettingsStore } from "./stores/settingsStore";

/** Backend connection states */
type BackendStatus = "checking" | "online" | "offline";

/**
 * Root application component.
 *
 * On mount it checks the Python backend health via the Tauri command,
 * then connects a WebSocket to the backend and renders PetWindow.
 */
function App() {
  const backendPort = useSettingsStore((s) => s.settings.advanced.backendPort);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");

  // Build the WebSocket URL from the configured backend port
  const wsUrl = useMemo(
    () => `ws://localhost:${backendPort}/client-ws`,
    [backendPort],
  );

  // Check backend health on mount
  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const healthy = await invoke<boolean>("check_backend_health", {
          port: backendPort,
        });
        if (!cancelled) {
          setBackendStatus(healthy ? "online" : "offline");
        }
      } catch {
        if (!cancelled) {
          setBackendStatus("offline");
        }
      }
    }

    checkHealth();

    // Re-check periodically every 10 seconds while status is offline
    const interval = setInterval(() => {
      if (backendStatus !== "online") {
        checkHealth();
      }
    }, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [backendPort, backendStatus]);

  const { playBase64Audio } = useAudio();

  // Stable callback ref so useWebSocket can invoke it on audio-output messages
  const handleAudioOutput = useCallback(
    (base64: string) => {
      playBase64Audio(base64);
    },
    [playBase64Audio],
  );

  const { sendText } = useWebSocket(wsUrl, { onAudioOutput: handleAudioOutput });

  return (
    <div className="app-container">
      {backendStatus === "checking" && (
        <div style={{ color: "#ffd700", fontSize: "14px" }}>
          正在连接后端...
        </div>
      )}
      {backendStatus === "offline" && (
        <div style={{ color: "#ff6b6b", fontSize: "14px" }}>
          后端离线 - 请启动 Open-LLM-VTuber
        </div>
      )}
      <PetWindow onSend={sendText} />
    </div>
  );
}

export default App;
