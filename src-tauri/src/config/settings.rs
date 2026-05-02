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
    pub autostart: bool,
}

impl Default for GeneralSettings {
    fn default() -> Self {
        Self {
            language: "zh-CN".to_string(),
            theme: "dark".to_string(),
            autostart: false,
        }
    }
}

/// Pet display settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetSettings {
    pub visual_mode: String,
    pub scale: f64,
    pub x: i32,
    pub y: i32,
    pub animation_speed: f64,
    pub always_on_top: bool,
    pub click_through: bool,
}

impl Default for PetSettings {
    fn default() -> Self {
        Self {
            visual_mode: "live2d".to_string(),
            scale: 1.0,
            x: 0,
            y: 0,
            animation_speed: 1.0,
            always_on_top: true,
            click_through: false,
        }
    }
}

/// Voice input/output settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceSettings {
    pub input_device: String,
    pub output_device: String,
    pub input_volume: u8,
    pub output_volume: u8,
    pub push_to_talk_key: String,
    pub continuous_listening: bool,
}

impl Default for VoiceSettings {
    fn default() -> Self {
        Self {
            input_device: String::new(),
            output_device: String::new(),
            input_volume: 80,
            output_volume: 80,
            push_to_talk_key: "Alt+Space".to_string(),
            continuous_listening: false,
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
    pub max_tokens: u32,
}

impl Default for AiSettings {
    fn default() -> Self {
        Self {
            provider: "openclaw".to_string(),
            api_endpoint: "http://127.0.0.1:18789/v1".to_string(),
            model: "openclaw:main".to_string(),
            temperature: 0.7,
            max_tokens: 1024,
        }
    }
}

/// Text-to-speech settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TtsSettings {
    pub provider: String,
    pub vits_server_url: String,
    pub language: String,
    pub speaker: String,
}

impl Default for TtsSettings {
    fn default() -> Self {
        Self {
            provider: "vits".to_string(),
            vits_server_url: "http://127.0.0.1:8020".to_string(),
            language: "zh".to_string(),
            speaker: "female".to_string(),
        }
    }
}

/// Advanced settings for power users.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvancedSettings {
    pub debug_mode: bool,
    pub log_level: String,
    pub backend_port: u16,
    pub data_directory: String,
}

impl Default for AdvancedSettings {
    fn default() -> Self {
        Self {
            debug_mode: false,
            log_level: "info".to_string(),
            backend_port: 12393,
            data_directory: String::new(),
        }
    }
}
