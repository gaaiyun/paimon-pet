import { Select, Switch, Stack } from "@mantine/core";
import { useSettingsStore } from "../stores/settingsStore";

/** Language options for the general settings */
const LANGUAGE_OPTIONS = [
  { value: "zh-CN", label: "中文" },
  { value: "en", label: "English" },
];

/** Theme options for the general settings */
const THEME_OPTIONS = [
  { value: "dark", label: "深色" },
  { value: "light", label: "浅色" },
  { value: "system", label: "跟随系统" },
];

/**
 * GeneralSettings provides language, theme, and autostart controls.
 * All values are read from and written to the settings store.
 */
export function GeneralSettings() {
  const general = useSettingsStore((s) => s.settings.general);
  const updateGeneral = useSettingsStore((s) => s.updateGeneral);

  return (
    <Stack gap="md">
      <Select
        label="语言 / Language"
        data={LANGUAGE_OPTIONS}
        value={general.language}
        onChange={(value) =>
          updateGeneral({ language: (value as "zh-CN" | "en") ?? general.language })
        }
      />

      <Select
        label="主题 / Theme"
        data={THEME_OPTIONS}
        value={general.theme}
        onChange={(value) =>
          updateGeneral({ theme: (value as "dark" | "light" | "system") ?? general.theme })
        }
      />

      <Switch
        label="开机自启 / Autostart"
        checked={general.autostart}
        onChange={(event) =>
          updateGeneral({ autostart: event.currentTarget.checked })
        }
      />

      <Switch
        label="静音 / Mute"
        checked={general.muted}
        onChange={(event) =>
          updateGeneral({ muted: event.currentTarget.checked })
        }
      />
    </Stack>
  );
}
