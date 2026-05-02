import { create } from "zustand";
import type {
  AppSettings,
  GeneralSettings,
  PetSettings,
  VoiceSettings,
  AiSettings,
  TtsSettings,
  AdvancedSettings,
} from "../types/settings";

const defaultSettings: AppSettings = {
  general: {
    language: "zh-CN",
    theme: "dark",
    autostart: false,
  },
  pet: {
    visualMode: "live2d",
    scale: 1.0,
    x: 0,
    y: 0,
    animationSpeed: 1.0,
    alwaysOnTop: true,
    clickThrough: false,
  },
  voice: {
    inputDevice: "default",
    outputDevice: "default",
    inputVolume: 1.0,
    outputVolume: 1.0,
    pushToTalkKey: "",
    continuousListening: false,
  },
  ai: {
    provider: "openclaw",
    apiEndpoint: "",
    model: "",
    temperature: 0.7,
    maxTokens: 2048,
  },
  tts: {
    provider: "vits",
    vitsServerUrl: "",
    language: "zh-CN",
    speaker: "paimon",
  },
  advanced: {
    debugMode: false,
    logLevel: "info",
    backendPort: 21520,
    dataDirectory: "",
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
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
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

  resetToDefaults: () => set({ settings: { ...defaultSettings } }),
}));
