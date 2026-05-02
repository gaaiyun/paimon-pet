#![allow(dead_code)]

use serde::{Deserialize, Serialize};

/// Top-level application settings, aggregating all sub-settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub general: GeneralSettings,
    pub pet: PetSettings,
    pub voice: VoiceSettings,
    pub ai: AiSettings,
    pub tts: TtsSettings,
    pub advanced: AdvancedSettings,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            general: GeneralSettings::default(),
            pet: PetSettings::default(),
            voice: VoiceSettings::default(),
            ai: AiSettings::default(),
            tts: TtsSettings::default(),
            advanced: AdvancedSettings::default(),
        }
    }
}

/// General application settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralSettings {
    pub language: String,
    pub theme: String,
}

impl Default for GeneralSettings {
    fn default() -> Self {
        Self {
            language: "zh-CN".to_string(),
            theme: "dark".to_string(),
        }
    }
}

/// Pet display settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetSettings {
    pub visual_mode: String,
    pub scale: f64,
}

impl Default for PetSettings {
    fn default() -> Self {
        Self {
            visual_mode: "live2d".to_string(),
            scale: 1.0,
        }
    }
}

/// Voice input settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceSettings {
    pub enabled: bool,
    pub auto_detect: bool,
}

impl Default for VoiceSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            auto_detect: true,
        }
    }
}

/// AI provider settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiSettings {
    pub provider: String,
    pub api_endpoint: String,
    pub model: String,
    pub temperature: f64,
}

impl Default for AiSettings {
    fn default() -> Self {
        Self {
            provider: "openclaw".to_string(),
            api_endpoint: "http://127.0.0.1:18789/v1".to_string(),
            model: "openclaw:main".to_string(),
            temperature: 0.7,
        }
    }
}

/// Text-to-speech settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TtsSettings {
    pub provider: String,
    pub vits_server_url: String,
}

impl Default for TtsSettings {
    fn default() -> Self {
        Self {
            provider: "vits".to_string(),
            vits_server_url: "http://127.0.0.1:8020".to_string(),
        }
    }
}

/// Advanced settings for power users.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvancedSettings {
    pub backend_port: u16,
}

impl Default for AdvancedSettings {
    fn default() -> Self {
        Self {
            backend_port: 12393,
        }
    }
}
