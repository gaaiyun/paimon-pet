import { Select, Slider, Switch, Stack } from "@mantine/core";
import { useSettingsStore } from "../stores/settingsStore";

/** Visual mode options */
const VISUAL_MODE_OPTIONS = [
  { value: "live2d", label: "Live2D" },
  { value: "sprite", label: "精灵图" },
];

/**
 * PetSettings provides controls for visual mode, scale, animation speed,
 * always-on-top, and click-through behavior.
 * All values are read from and written to the settings store.
 */
export function PetSettings() {
  const pet = useSettingsStore((s) => s.settings.pet);
  const updatePet = useSettingsStore((s) => s.updatePetSettings);

  return (
    <Stack gap="md">
      <Select
        label="显示模式 / Visual Mode"
        data={VISUAL_MODE_OPTIONS}
        value={pet.visualMode}
        onChange={(value) =>
          updatePet({ visualMode: (value as "live2d" | "sprite") ?? pet.visualMode })
        }
      />

      <Slider
        label="缩放 / Scale"
        min={0.5}
        max={2.0}
        step={0.1}
        value={pet.scale}
        onChange={(value) => updatePet({ scale: value })}
        marks={[
          { value: 0.5, label: "0.5x" },
          { value: 1.0, label: "1.0x" },
          { value: 1.5, label: "1.5x" },
          { value: 2.0, label: "2.0x" },
        ]}
      />

      <Slider
        label="动画速度 / Animation Speed"
        min={0.5}
        max={2.0}
        step={0.1}
        value={pet.animationSpeed}
        onChange={(value) => updatePet({ animationSpeed: value })}
        marks={[
          { value: 0.5, label: "0.5x" },
          { value: 1.0, label: "1.0x" },
          { value: 2.0, label: "2.0x" },
        ]}
      />

      <Switch
        label="置顶 / Always on Top"
        checked={pet.alwaysOnTop}
        onChange={(event) =>
          updatePet({ alwaysOnTop: event.currentTarget.checked })
        }
      />

      <Switch
        label="点击穿透 / Click Through"
        checked={pet.clickThrough}
        onChange={(event) =>
          updatePet({ clickThrough: event.currentTarget.checked })
        }
      />
    </Stack>
  );
}
