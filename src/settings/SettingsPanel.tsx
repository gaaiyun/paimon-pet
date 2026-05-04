import { Tabs, Text, Stack, Switch, Select, NumberInput, TextInput, Divider } from "@mantine/core";
import { GeneralSettings } from "./GeneralSettings";
import { PetSettings } from "./PetSettings";
import { VoiceSettings } from "./VoiceSettings";
import { AISettings } from "./AISettings";
import { BackendSettings } from "./BackendSettings";
import { useSettingsStore } from "../stores/settingsStore";

function AdvancedSettings() {
  const advanced = useSettingsStore((s) => s.settings.advanced);
  const update = useSettingsStore((s) => s.updateAdvancedSettings);

  return (
    <Stack>
      <Switch
        label="调试模式"
        checked={advanced.debugMode}
        onChange={(e) => update({ debugMode: e.currentTarget.checked })}
      />
      <Select
        label="日志级别"
        value={advanced.logLevel}
        onChange={(v) => update({ logLevel: v as "debug" | "info" | "warn" | "error" })}
        data={[
          { value: "debug", label: "Debug" },
          { value: "info", label: "Info" },
          { value: "warn", label: "Warn" },
          { value: "error", label: "Error" },
        ]}
      />
      <NumberInput
        label="后端端口"
        value={advanced.backendPort}
        onChange={(v) => update({ backendPort: v as number })}
        min={1024}
        max={65535}
      />
      <TextInput
        label="数据目录"
        value={advanced.dataDirectory}
        onChange={(e) => update({ dataDirectory: e.currentTarget.value })}
        placeholder="默认路径"
      />
    </Stack>
  );
}

function AboutTab() {
  return (
    <Stack align="center" pt="xl">
      <Text size="xl" fw={700} style={{ color: "#ffd700" }}>PaimonPet</Text>
      <Text size="sm" c="dimmed">v0.1.0</Text>
      <Divider my="md" style={{ width: "100%" }} />
      <Text size="sm" style={{ textAlign: "center", lineHeight: 1.8 }}>
        原神派蒙桌面宠物
        <br />
        AI 语音对话 · Live2D 动画 · Open-LLM-VTuber
      </Text>
      <Divider my="md" style={{ width: "100%" }} />
      <Text size="xs" c="dimmed" style={{ textAlign: "center" }}>
        本项目为粉丝创作，与米哈游/HoYoverse无关。
        <br />
        仅供个人使用，请勿用于商业目的。
      </Text>
    </Stack>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top: 12,
        right: 14,
        border: 0,
        borderRadius: 999,
        padding: "4px 10px",
        background: "rgba(255,255,255,0.08)",
        color: "#aaa",
        fontSize: 12,
        cursor: "pointer",
        lineHeight: 1,
      }}
    >
      关闭
    </button>
  );
}

export function SettingsPanel({ onClose }: { onClose?: () => void }) {
  return (
    <div
      style={{
        background: "#1a1a2e",
        padding: "20px",
        borderRadius: "12px",
        minHeight: "500px",
        width: "420px",
        color: "#e0e0e0",
        position: "relative",
      }}
    >
      {onClose && <CloseButton onClick={onClose} />}
      <Text
        size="xl"
        fw={700}
        style={{ color: "#ffd700", marginBottom: "16px", textAlign: "center" }}
      >
        PaimonPet 设置
      </Text>

      <Tabs defaultValue="general" color="violet">
        <Tabs.List>
          <Tabs.Tab value="general" style={{ color: "#e0e0e0" }}>通用</Tabs.Tab>
          <Tabs.Tab value="pet" style={{ color: "#e0e0e0" }}>宠物</Tabs.Tab>
          <Tabs.Tab value="voice" style={{ color: "#e0e0e0" }}>语音</Tabs.Tab>
          <Tabs.Tab value="ai" style={{ color: "#e0e0e0" }}>AI</Tabs.Tab>
          <Tabs.Tab value="backend" style={{ color: "#e0e0e0" }}>后端</Tabs.Tab>
          <Tabs.Tab value="advanced" style={{ color: "#e0e0e0" }}>高级</Tabs.Tab>
          <Tabs.Tab value="about" style={{ color: "#e0e0e0" }}>关于</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="md"><GeneralSettings /></Tabs.Panel>
        <Tabs.Panel value="pet" pt="md"><PetSettings /></Tabs.Panel>
        <Tabs.Panel value="voice" pt="md"><VoiceSettings /></Tabs.Panel>
        <Tabs.Panel value="ai" pt="md"><AISettings /></Tabs.Panel>
        <Tabs.Panel value="backend" pt="md"><BackendSettings /></Tabs.Panel>
        <Tabs.Panel value="advanced" pt="md"><AdvancedSettings /></Tabs.Panel>
        <Tabs.Panel value="about" pt="md"><AboutTab /></Tabs.Panel>
      </Tabs>
    </div>
  );
}
