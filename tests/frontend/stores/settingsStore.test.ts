import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../../../src/stores/settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getInitialState());
  });

  it("has correct default values", () => {
    const state = useSettingsStore.getState();
    expect(state.settings.pet.visualMode).toBe("sprite");
    expect(state.settings.pet.scale).toBe(0.7);
    expect(state.settings.ai.provider).toBe("openclaw");
    expect(state.settings.tts.provider).toBe("vits");
    expect(state.settings.general.language).toBe("zh-CN");
    expect(state.settings.general.muted).toBe(false);
  });

  it("updates pet settings", () => {
    useSettingsStore.getState().updatePetSettings({ scale: 1.5 });
    const state = useSettingsStore.getState();
    expect(state.settings.pet.scale).toBe(1.5);
    expect(state.settings.pet.visualMode).toBe("sprite");
  });

  it("updates AI settings", () => {
    useSettingsStore.getState().updateAiSettings({ provider: "ollama" });
    expect(useSettingsStore.getState().settings.ai.provider).toBe("ollama");
  });

  it("toggles muted", () => {
    useSettingsStore.getState().updateGeneral({ muted: true });
    expect(useSettingsStore.getState().settings.general.muted).toBe(true);
  });

  it("resets to defaults", () => {
    useSettingsStore.getState().updatePetSettings({ scale: 2.0 });
    useSettingsStore.getState().resetToDefaults();
    expect(useSettingsStore.getState().settings.pet.scale).toBe(0.7);
  });

  it("has empty default backend paths", () => {
    const state = useSettingsStore.getState();
    expect(state.settings.backendPaths.aiPaimonDir).toBe("");
    expect(state.settings.backendPaths.openLlmVtuberDir).toBe("");
    expect(state.settings.backendPaths.vitsModelPath).toBe("");
  });
});
