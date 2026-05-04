import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppSettings,
  GeneralSettings,
  PetSettings,
  VoiceSettings,
  AiSettings,
  TtsSettings,
  AdvancedSettings,
  BackendPathsSettings,
} from "../types/settings";

const defaultSettings: AppSettings = {
  general: {
    language: "zh-CN",
    theme: "dark",
    autostart: false,
    muted: false,
  },
  pet: {
    visualMode: "sprite",
    scale: 0.7,
    animationSpeed: 1.0,
    alwaysOnTop: true,
    clickThrough: false,
  },
  voice: {
    inputDevice: "",
    outputDevice: "",
    inputVolume: 80,
    outputVolume: 80,
    pushToTalkKey: "Alt+Space",
    continuousListening: false,
  },
  ai: {
    provider: "openclaw",
    apiEndpoint: "http://127.0.0.1:18789/v1",
    model: "openclaw:main",
    temperature: 0.7,
    maxTokens: 1024,
    personaPrompt: "你是派蒙（Paimon），来自提瓦特大陆的神秘小精灵，是旅行者最忠实的向导和同伴。\n你的性格活泼可爱、话很多、有点贪吃、偶尔犯迷糊，但关键时刻非常靠谱。\n你说话时经常自称\"派蒙\"而不是\"我\"，喜欢用\"欸嘿\"、\"哼\"、\"喂！\"等语气词。\n你对美食有着极大的热情，尤其喜欢甜甜花酿鸡和烤蘑菇披萨。\n你会帮旅行者整理信息、提供建议，偶尔也会吐槽几句。\n注意：用简短自然的口语风格说话，不要太书面化，回答要简洁。",
  },
  tts: {
    provider: "vits",
    vitsServerUrl: "http://127.0.0.1:8020",
    language: "zh",
    speaker: "female",
  },
  advanced: {
    debugMode: false,
    logLevel: "info",
    backendPort: 12393,
    dataDirectory: "",
  },
  backendPaths: {
    openclawPath: "openclaw",
    aiPaimonDir: "",
    vitsModelPath: "",
    openLlmVtuberDir: "",
    pythonPath: "python",
  },
};

interface SettingsStore {
  settings: AppSettings;

  updateGeneral: (partial: Partial<GeneralSettings>) => void;
  updatePetSettings: (partial: Partial<PetSettings>) => void;
  updateVoiceSettings: (partial: Partial<VoiceSettings>) => void;
  updateAiSettings: (partial: Partial<AiSettings>) => void;
  updateTtsSettings: (partial: Partial<TtsSettings>) => void;
  updateAdvancedSettings: (partial: Partial<AdvancedSettings>) => void;
  updateBackendPaths: (partial: Partial<BackendPathsSettings>) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: { ...defaultSettings },

      updateGeneral: (partial) =>
        set((prev) => ({
          settings: { ...prev.settings, general: { ...prev.settings.general, ...partial } },
        })),

      updatePetSettings: (partial) =>
        set((prev) => ({
          settings: { ...prev.settings, pet: { ...prev.settings.pet, ...partial } },
        })),

      updateVoiceSettings: (partial) =>
        set((prev) => ({
          settings: { ...prev.settings, voice: { ...prev.settings.voice, ...partial } },
        })),

      updateAiSettings: (partial) =>
        set((prev) => ({
          settings: { ...prev.settings, ai: { ...prev.settings.ai, ...partial } },
        })),

      updateTtsSettings: (partial) =>
        set((prev) => ({
          settings: { ...prev.settings, tts: { ...prev.settings.tts, ...partial } },
        })),

      updateAdvancedSettings: (partial) =>
        set((prev) => ({
          settings: { ...prev.settings, advanced: { ...prev.settings.advanced, ...partial } },
        })),

      updateBackendPaths: (partial) =>
        set((prev) => ({
          settings: { ...prev.settings, backendPaths: { ...prev.settings.backendPaths, ...partial } },
        })),

      resetToDefaults: () => set({ settings: { ...defaultSettings } }),
    }),
    {
      name: "paimon-pet-settings",
      storage: createJSONStorage(() => {
        // Use Tauri Store in production, localStorage in browser/test
        if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
          // Tauri environment — localStorage still works for persist middleware
          return localStorage;
        }
        return localStorage;
      }),
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);
