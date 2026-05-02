import { Tabs, Text } from "@mantine/core";
import { GeneralSettings } from "./GeneralSettings";
import { PetSettings } from "./PetSettings";
import { VoiceSettings } from "./VoiceSettings";
import { AISettings } from "./AISettings";

/**
 * SettingsPanel is a tab container that organizes all setting categories.
 * Uses Mantine Tabs with a dark theme and gold title.
 */
export function SettingsPanel() {
  return (
    <div
      style={{
        background: "#1a1a2e",
        padding: "20px",
        borderRadius: "12px",
        minHeight: "500px",
        width: "420px",
        color: "#e0e0e0",
      }}
    >
      <Text
        size="xl"
        fw={700}
        style={{ color: "#ffd700", marginBottom: "16px", textAlign: "center" }}
      >
        PaimonPet 设置
      </Text>

      <Tabs defaultValue="general" color="violet">
        <Tabs.List>
          <Tabs.Tab value="general" style={{ color: "#e0e0e0" }}>
            通用
          </Tabs.Tab>
          <Tabs.Tab value="pet" style={{ color: "#e0e0e0" }}>
            宠物
          </Tabs.Tab>
          <Tabs.Tab value="voice" style={{ color: "#e0e0e0" }}>
            语音
          </Tabs.Tab>
          <Tabs.Tab value="ai" style={{ color: "#e0e0e0" }}>
            AI
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="md">
          <GeneralSettings />
        </Tabs.Panel>

        <Tabs.Panel value="pet" pt="md">
          <PetSettings />
        </Tabs.Panel>

        <Tabs.Panel value="voice" pt="md">
          <VoiceSettings />
        </Tabs.Panel>

        <Tabs.Panel value="ai" pt="md">
          <AISettings />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
