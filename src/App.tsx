import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";
import { useSettingsStore } from "./stores/settingsStore";
import { useChatStore } from "./stores/chatStore";
import { usePetStore } from "./stores/petStore";
import { useAudio } from "./hooks/useAudio";
import { useWebSocket } from "./hooks/useWebSocket";
import { SettingsPanel } from "./settings/SettingsPanel";
import { webmBlobToFloat32 } from "./services/audioEncoder";

const PhaserWrapper = lazy(() => import("./PhaserWrapper"));

type BackendStatus = "checking" | "online" | "offline";

interface ServicesStatus {
  openclaw: boolean;
  vits: boolean;
  vtuber: boolean;
}

interface DetectedPaths {
  ai_paimon_dir: string;
  open_llm_vtuber_dir: string;
  vits_model_path: string;
}

function App() {
  const settings = useSettingsStore((s) => s.settings);
  const updateGeneral = useSettingsStore((s) => s.updateGeneral);
  const updateBackendPaths = useSettingsStore((s) => s.updateBackendPaths);
  const backendPort = settings.advanced.backendPort;
  const paths = settings.backendPaths;
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const addMessage = useChatStore((s) => s.addMessage);
  const setPetState = usePetStore((s) => s.setState);
  const { playBase64Audio, stop } = useAudio();

  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [servicesStatus, setServicesStatus] = useState<ServicesStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [startMessage, setStartMessage] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [clickThrough, setClickThrough] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const autoStartDone = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const websocketUrl = useMemo(() => "ws://127.0.0.1:" + backendPort + "/client-ws", [backendPort]);
  const websocketOptions = useMemo(() => ({
    onAudioOutput: async (base64: string) => {
      if (settings.general.muted) return;
      setPetState("speaking");
      try {
        await playBase64Audio(base64);
      } finally {
        setPetState("idle");
      }
    },
  }), [playBase64Audio, setPetState, settings.general.muted]);
  const { connectionState, sendText, sendAudioFloat32, interrupt } = useWebSocket(websocketUrl, websocketOptions);

  // Wire always-on-top setting
  useEffect(() => {
    getCurrentWindow().setAlwaysOnTop(settings.pet.alwaysOnTop).catch(() => {});
  }, [settings.pet.alwaysOnTop]);

  // Click-through mode — only activate when user explicitly enables it AND no panels open
  useEffect(() => {
    if (clickThrough && !chatOpen && !showSettings) {
      // PhaserWrapper handles hover-based toggle via polling
    } else {
      getCurrentWindow().setIgnoreCursorEvents(false).catch(() => {});
    }
  }, [clickThrough, chatOpen, showSettings]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-hide chat after idle
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setChatOpen(false);
    }, 15000);
  }, []);

  // Auto-detect paths on first load
  useEffect(() => {
    if (paths.aiPaimonDir && paths.openLlmVtuberDir) return;
    invoke<DetectedPaths | null>("detect_project_paths").then((detected) => {
      if (detected) {
        updateBackendPaths({
          aiPaimonDir: detected.ai_paimon_dir,
          openLlmVtuberDir: detected.open_llm_vtuber_dir,
          vitsModelPath: detected.vits_model_path,
        });
      }
    }).catch(() => {});
  }, []);

  const checkServices = async () => {
    try {
      const status = await invoke<ServicesStatus>("check_all_services");
      setServicesStatus(status);
      return status;
    } catch {
      setServicesStatus(null);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const healthy = await invoke<boolean>("check_backend_health", { port: backendPort });
        if (!cancelled) setBackendStatus(healthy ? "online" : "offline");
      } catch {
        if (!cancelled) setBackendStatus("offline");
      }
    }

    checkHealth();
    checkServices();
    const interval = setInterval(() => {
      checkHealth();
      checkServices();
    }, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [backendPort]);

  useEffect(() => {
    let unlisteners: (() => void)[] = [];

    void (async () => {
      unlisteners.push(
        await listen("show-chat-controls", () => {
          setChatOpen(true);
          resetIdleTimer();
        })
      );
      unlisteners.push(
        await listen("toggle-mute", () => {
          updateGeneral({ muted: !settings.general.muted });
        })
      );
      unlisteners.push(
        await listen("toggle-clickthrough", () => {
          setClickThrough((v) => !v);
        })
      );
    })();

    return () => {
      unlisteners.forEach((fn) => fn());
    };
  }, [settings.general.muted, updateGeneral, resetIdleTimer]);

  const handleStartAll = async () => {
    if (!paths.aiPaimonDir || !paths.openLlmVtuberDir) {
      setStartMessage("请先在设置里配置 ai-paimon 和 Open-LLM-VTuber 路径。");
      setShowSettings(true);
      return;
    }

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
      await checkServices();
      const healthy = await invoke<boolean>("check_backend_health", { port: backendPort });
      setBackendStatus(healthy ? "online" : "offline");
    } catch (error) {
      setStartMessage(String(error));
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (autoStartDone.current) return;
    if (!paths.aiPaimonDir || !paths.openLlmVtuberDir) return;
    if (backendStatus === "online") return;

    autoStartDone.current = true;
    setTimeout(() => {
      void handleStartAll();
    }, 2000);
  }, []);

  const handleSendText = () => {
    const text = inputText.trim();
    if (!text) return;

    addMessage("user", text);
    setPetState("thinking");
    sendText(text);
    setInputText("");
    resetIdleTimer();
  };

  const startRecording = async () => {
    if (recording) return;

    const constraints: MediaStreamConstraints = { audio: true };
    if (settings.voice.inputDevice) {
      constraints.audio = { deviceId: { exact: settings.voice.inputDevice } };
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
      try {
        const float32 = await webmBlobToFloat32(blob);
        setPetState("thinking");
        sendAudioFloat32(float32);
      } catch (err) {
        console.error("[Audio] Failed to encode audio:", err);
        setPetState("idle");
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setPetState("listening");
    resetIdleTimer();
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recording || !recorder) return;

    recorder.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const handleInterrupt = () => {
    stop();
    interrupt();
    setPetState("idle");
  };

  const openChat = () => {
    setChatOpen(true);
    resetIdleTimer();
  };

  const latestAssistantMessages = messages.filter((m) => m.role === "assistant").slice(-2);
  const hasPathsConfigured = paths.aiPaimonDir !== "" && paths.openLlmVtuberDir !== "";
  const allServicesDown = servicesStatus && (!servicesStatus.vits || !servicesStatus.vtuber);

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    getCurrentWindow().startResizeDragging("SouthEast").catch(() => {});
  };

  return (
    <div className="app-container">
      <Suspense fallback={null}>
        <PhaserWrapper
          onClick={openChat}
          clickThrough={clickThrough && !chatOpen && !showSettings}
        />
      </Suspense>

      {/* Speech bubbles - always visible above pet */}
      {latestAssistantMessages.length > 0 && !chatOpen && (
        <div className="speech-bubbles">
          {latestAssistantMessages.map((message) => (
            <div key={message.id} className="speech-bubble">
              {message.text}
            </div>
          ))}
        </div>
      )}

      {/* Full chat panel - only when chat is open */}
      {chatOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-title">派蒙</span>
            <span className={`connection-dot ${connectionState}`} />
            <div className="chat-header-buttons">
              {backendStatus !== "online" && (
                <button className="icon-btn" onClick={handleStartAll} disabled={starting} title="启动服务">
                  {starting ? "..." : "启动"}
                </button>
              )}
              <button className="icon-btn" onClick={() => setShowSettings(true)} title="设置">
                设置
              </button>
              <button className="icon-btn" onClick={() => setChatOpen(false)} title="关闭">
                收起
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={"chat-message chat-message-" + message.role}>
                {message.text}
              </div>
            ))}
            {isTyping && <div className="chat-message chat-message-assistant typing">派蒙正在想...</div>}
            <div ref={chatEndRef} />
          </div>

          {!hasPathsConfigured && (
            <div className="chat-warning">请先在设置中配置服务路径</div>
          )}
          {allServicesDown && (
            <div className="chat-warning">服务未启动</div>
          )}
          {startMessage && (
            <div className="chat-info">{startMessage}</div>
          )}

          <div className="chat-input-bar">
            <input
              value={inputText}
              onChange={(e) => { setInputText(e.currentTarget.value); resetIdleTimer(); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSendText(); }}
              placeholder="和派蒙说点什么..."
              autoFocus
            />
            <button onClick={handleSendText} title="发送">发送</button>
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={recording ? "recording" : ""}
              title="按住说话"
            >
              {recording ? "松开" : "语音"}
            </button>
            <button onClick={handleInterrupt} title="打断">打断</button>
          </div>
        </div>
      )}

      {/* Resize handle - bottom-right corner, only when chat is open */}
      {chatOpen && (
        <div className="resize-handle" onPointerDown={handleResizePointerDown} />
      )}

      {/* Settings overlay */}
      {showSettings && (
        <div className="settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
