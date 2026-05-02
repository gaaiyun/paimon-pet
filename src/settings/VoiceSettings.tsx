import { TextInput, Slider, Switch, Stack } from "@mantine/core";
import { useSettingsStore } from "../stores/settingsStore";

/**
 * VoiceSettings provides controls for audio input/output devices,
 * volume levels, push-to-talk key, and continuous listening.
 * All values are read from and written to the settings store.
 */
export function VoiceSettings() {
  const voice = useSettingsStore((s) => s.settings.voice);
  const updateVoice = useSettingsStore((s) => s.updateVoiceSettings);

  return (
    <Stack gap="md">
      <TextInput
        label="输入设备 / Input Device"
        placeholder="default"
        value={voice.inputDevice}
        onChange={(event) =>
          updateVoice({ inputDevice: event.currentTarget.value })
        }
      />

      <TextInput
        label="输出设备 / Output Device"
        placeholder="default"
        value={voice.outputDevice}
        onChange={(event) =>
          updateVoice({ outputDevice: event.currentTarget.value })
        }
      />

      <Slider
        label="输入音量 / Input Volume"
        min={0}
        max={100}
        step={1}
        value={Math.round(voice.inputVolume * 100)}
        onChange={(value) => updateVoice({ inputVolume: value / 100 })}
        marks={[
          { value: 0, label: "0" },
          { value: 50, label: "50" },
          { value: 100, label: "100" },
        ]}
      />

      <Slider
        label="输出音量 / Output Volume"
        min={0}
        max={100}
        step={1}
        value={Math.round(voice.outputVolume * 100)}
        onChange={(value) => updateVoice({ outputVolume: value / 100 })}
        marks={[
          { value: 0, label: "0" },
          { value: 50, label: "50" },
          { value: 100, label: "100" },
        ]}
      />

      <TextInput
        label="按键说话 / Push-to-Talk Key"
        placeholder="e.g. Space, F2"
        value={voice.pushToTalkKey}
        onChange={(event) =>
          updateVoice({ pushToTalkKey: event.currentTarget.value })
        }
      />

      <Switch
        label="持续聆听 / Continuous Listening"
        checked={voice.continuousListening}
        onChange={(event) =>
          updateVoice({ continuousListening: event.currentTarget.checked })
        }
      />
    </Stack>
  );
}
