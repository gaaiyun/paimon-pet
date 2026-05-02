export interface AppSettings {
  general: GeneralSettings;
  pet: PetSettings;
  voice: VoiceSettings;
  ai: AiSettings;
  tts: TtsSettings;
  advanced: AdvancedSettings;
}

export interface GeneralSettings {
  language: "zh-CN" | "en";
  theme: "dark" | "light" | "system";
  autostart: boolean;
}

export interface PetSettings {
  visualMode: "live2d" | "sprite";
  scale: number;
  x: number;
  y: number;
  animationSpeed: number;
  alwaysOnTop: boolean;
  clickThrough: boolean;
}

export interface VoiceSettings {
  inputDevice: string;
  outputDevice: string;
  inputVolume: number;
  outputVolume: number;
  pushToTalkKey: string;
  continuousListening: boolean;
}

export interface AiSettings {
  provider: "openclaw" | "openai" | "ollama";
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  personaPrompt: string;
}

export interface TtsSettings {
  provider: "vits" | "edge-tts";
  vitsServerUrl: string;
  language: string;
  speaker: string;
}

export interface AdvancedSettings {
  debugMode: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
  backendPort: number;
  dataDirectory: string;
}
