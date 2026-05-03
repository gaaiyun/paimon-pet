import { useCallback, useEffect, useState } from "react";
import { Button, Stack, TextInput, Text, Group } from "@mantine/core";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../stores/settingsStore";

/** Status returned by the backend check_all_services command. */
interface ServicesStatus {
  openclaw: boolean;
  vits: boolean;
  vtuber: boolean;
}

/**
 * BackendSettings provides controls for configuring backend service paths
 * and a one-click launcher that starts all required services.
 */
export function BackendSettings() {
  const paths = useSettingsStore((s) => s.settings.backendPaths);
  const updatePaths = useSettingsStore((s) => s.updateBackendPaths);

  const [status, setStatus] = useState<ServicesStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /** Poll service status on mount and every 10 seconds. */
  const refreshStatus = useCallback(async () => {
    try {
      const s = await invoke<ServicesStatus>("check_all_services");
      setStatus(s);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 10_000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  /** Start all services via the Tauri command. */
  const handleStartAll = async () => {
    if (!paths.aiPaimonDir) {
      setMessage("Error: ai-paimon dir not set");
      return;
    }
    if (!paths.openLlmVtuberDir) {
      setMessage("Error: Open-LLM-VTuber dir not set");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await invoke<string>("start_all_services", {
        pythonPath: paths.pythonPath,
        aiPaimonDir: paths.aiPaimonDir,
        vitsModelPath: paths.vitsModelPath,
        vtuberDir: paths.openLlmVtuberDir,
      });
      setMessage(result);
      await refreshStatus();
    } catch (e) {
      setMessage(String(e));
    } finally {
      setLoading(false);
    }
  };

  /** Stop all managed services. */
  const handleStopAll = async () => {
    setLoading(true);
    try {
      await invoke("stop_all_services");
      setMessage("All managed services stopped.");
      await refreshStatus();
    } catch (e) {
      setMessage(String(e));
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (running: boolean | undefined) => {
    if (running === undefined) return "?";
    return running ? "[OK]" : "[X]";
  };

  return (
    <Stack gap="md">
      <Text size="sm" fw={600} style={{ color: "#ffd700" }}>
        Backend Services
      </Text>

      <TextInput
        label="Python path"
        placeholder="python"
        value={paths.pythonPath}
        onChange={(e) => updatePaths({ pythonPath: e.currentTarget.value })}
      />

      <TextInput
        label="ai-paimon directory"
        placeholder="C:/path/to/ai-paimon"
        value={paths.aiPaimonDir}
        onChange={(e) => updatePaths({ aiPaimonDir: e.currentTarget.value })}
      />

      <TextInput
        label="VITS model path"
        placeholder="./paimon.pth"
        value={paths.vitsModelPath}
        onChange={(e) => updatePaths({ vitsModelPath: e.currentTarget.value })}
      />

      <TextInput
        label="Open-LLM-VTuber directory"
        placeholder="C:/path/to/Open-LLM-VTuber"
        value={paths.openLlmVtuberDir}
        onChange={(e) => updatePaths({ openLlmVtuberDir: e.currentTarget.value })}
      />

      {/* Service status display */}
      <Text size="sm" fw={600} style={{ color: "#ffd700", marginTop: 8 }}>
        Service Status
      </Text>
      <Group gap="xs">
        <Text size="sm">OpenClaw: {statusIcon(status?.openclaw)}</Text>
        <Text size="sm">VITS: {statusIcon(status?.vits)}</Text>
        <Text size="sm">VTuber: {statusIcon(status?.vtuber)}</Text>
      </Group>

      {/* Action buttons */}
      <Group gap="sm">
        <Button
          onClick={handleStartAll}
          loading={loading}
          disabled={loading}
          color="violet"
        >
          Start All Services
        </Button>
        <Button
          onClick={handleStopAll}
          variant="outline"
          color="gray"
          disabled={loading}
        >
          Stop All
        </Button>
      </Group>

      {/* Result message */}
      {message && (
        <Text
          size="xs"
          style={{
            color: message.startsWith("Error") || message.includes("not running")
              ? "#ff6b6b"
              : "#69db7c",
            whiteSpace: "pre-wrap",
          }}
        >
          {message}
        </Text>
      )}
    </Stack>
  );
}
