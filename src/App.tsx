import { lazy, Suspense, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Lazy load PhaserWrapper for code splitting
const PhaserWrapper = lazy(() => import("./PhaserWrapper"));

/** Backend connection states */
type BackendStatus = "checking" | "online" | "offline";

/** Status returned by check_all_services. */
interface ServicesStatus {
  openclaw: boolean;
  vits: boolean;
  vtuber: boolean;
}

/**
 * Root application component.
 *
 * On mount it checks backend service health via the Tauri command,
 * then renders the PhaserWrapper for the desktop pet.
 * If the user has configured backend paths, a one-click start button
 * is shown when services are offline.
 */
function App() {
  const backendPort = useState(() => {
    // Get from settings store or use default
    return 8000;
  })[0];
  // Paths configuration for backend services (placeholder for now)
  const paths = {
    aiPaimonDir: "",
    openLlmVtuberDir: "",
    pythonPath: "",
    vitsModelPath: "",
  };
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [servicesStatus, setServicesStatus] = useState<ServicesStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [startMessage, setStartMessage] = useState<string | null>(null);

  /** Check all three backend services. */
  const checkServices = async () => {
    try {
      const s = await invoke<ServicesStatus>("check_all_services");
      setServicesStatus(s);
      return s;
    } catch {
      setServicesStatus(null);
      return null;
    }
  };

  /** Check backend health on mount. */
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

    // Check both the specific backend and all services
    checkHealth();
    checkServices();

    // Re-check periodically every 10 seconds while status is offline
    const interval = setInterval(() => {
      checkHealth();
      checkServices();
    }, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [backendPort]);

  /** One-click start all backend services. */
  const handleStartAll = async () => {
    if (!paths.aiPaimonDir || !paths.openLlmVtuberDir) return;

    setStarting(true);
    setStartMessage(null);
    try {
      const result = await invoke<string>("start_all_services", {
        pythonPath: paths.pythonPath,
        aiPaimonDir: paths.aiPaimonDir,
        vitsModelPath: paths.vitsModelPath,
        vtuberDir: paths.openLlmVtuberDir,
      });
      setStartMessage(result);

      // Re-check services after starting
      await checkServices();

      // Also re-check the specific backend
      const healthy = await invoke<boolean>("check_backend_health", {
        port: backendPort,
      });
      setBackendStatus(healthy ? "online" : "offline");
    } catch (e) {
      setStartMessage(String(e));
    } finally {
      setStarting(false);
    }
  };

  // Determine whether the one-click start button should be shown
  const hasPathsConfigured = paths.aiPaimonDir !== "" && paths.openLlmVtuberDir !== "";
  const allServicesDown = servicesStatus
    && (!servicesStatus.openclaw || !servicesStatus.vits || !servicesStatus.vtuber);

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

      {/* One-click start button when paths are configured and services are down */}
      {hasPathsConfigured && allServicesDown && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={handleStartAll}
            disabled={starting}
            style={{
              background: starting ? "#555" : "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 16px",
              fontSize: 13,
              cursor: starting ? "wait" : "pointer",
            }}
          >
            {starting ? "启动中..." : "一键启动"}
          </button>
          {startMessage && (
            <div
              style={{
                fontSize: 11,
                marginTop: 4,
                color: startMessage.includes("Error") || startMessage.includes("not running")
                  ? "#ff6b6b"
                  : "#69db7c",
                whiteSpace: "pre-wrap",
              }}
            >
              {startMessage}
            </div>
          )}
        </div>
      )}

      {/* Main pet display using PhaserWrapper */}
      <Suspense fallback={<div style={{ color: "#ffd700" }}>加载中...</div>}>
        <PhaserWrapper />
      </Suspense>
    </div>
  );
}

export default App;