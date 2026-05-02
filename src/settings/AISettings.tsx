import { Select, TextInput, Slider, NumberInput, Stack } from "@mantine/core";
import { useSettingsStore } from "../stores/settingsStore";

/** LLM provider options */
const LLM_PROVIDER_OPTIONS = [
  { value: "openclaw", label: "OpenClaw" },
  { value: "openai", label: "OpenAI" },
  { value: "ollama", label: "Ollama" },
];

/** TTS provider options */
const TTS_PROVIDER_OPTIONS = [
  { value: "vits", label: "VITS" },
  { value: "edge-tts", label: "Edge TTS" },
];

/**
 * AISettings provides controls for LLM provider, API endpoint, model,
 * temperature, max tokens, TTS provider, and VITS server URL.
 * All values are read from and written to the settings store.
 */
export function AISettings() {
  const ai = useSettingsStore((s) => s.settings.ai);
  const tts = useSettingsStore((s) => s.settings.tts);
  const updateAi = useSettingsStore((s) => s.updateAiSettings);
  const updateTts = useSettingsStore((s) => s.updateTtsSettings);

  return (
    <Stack gap="md">
      <Select
        label="LLM 提供商 / LLM Provider"
        data={LLM_PROVIDER_OPTIONS}
        value={ai.provider}
        onChange={(value) =>
          updateAi({ provider: (value as "openclaw" | "openai" | "ollama") ?? ai.provider })
        }
      />

      <TextInput
        label="API 端点 / API Endpoint"
        placeholder="http://127.0.0.1:18789/v1"
        value={ai.apiEndpoint}
        onChange={(event) =>
          updateAi({ apiEndpoint: event.currentTarget.value })
        }
      />

      <TextInput
        label="模型 / Model"
        placeholder="openclaw:main"
        value={ai.model}
        onChange={(event) =>
          updateAi({ model: event.currentTarget.value })
        }
      />

      <Slider
        label="温度 / Temperature"
        min={0}
        max={2}
        step={0.1}
        value={ai.temperature}
        onChange={(value) => updateAi({ temperature: value })}
        marks={[
          { value: 0, label: "0" },
          { value: 1, label: "1" },
          { value: 2, label: "2" },
        ]}
      />

      <NumberInput
        label="最大 Token 数 / Max Tokens"
        min={1}
        max={65536}
        step={256}
        value={ai.maxTokens}
        onChange={(value) => updateAi({ maxTokens: Number(value) || 2048 })}
      />

      <Select
        label="TTS 提供商 / TTS Provider"
        data={TTS_PROVIDER_OPTIONS}
        value={tts.provider}
        onChange={(value) =>
          updateTts({ provider: (value as "vits" | "edge-tts") ?? tts.provider })
        }
      />

      <TextInput
        label="VITS 服务器 / VITS Server URL"
        placeholder="http://127.0.0.1:8020"
        value={tts.vitsServerUrl}
        onChange={(event) =>
          updateTts({ vitsServerUrl: event.currentTarget.value })
        }
      />
    </Stack>
  );
}
