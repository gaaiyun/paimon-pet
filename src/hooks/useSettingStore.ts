import { create } from "zustand";

/**
 * Settings store using Zustand.
 * Provides pet interaction and appearance settings for the Phaser scene.
 */
interface SettingsState {
    /** Allow pet to respond to mouse interactions */
    allowPetInteraction: boolean;
    /** Allow pet to move above the taskbar */
    allowPetAboveTaskbar: boolean;
    /** Override default pet scale with custom value */
    allowOverridePetScale: boolean;
    /** Custom pet scale value */
    petScale: number;
    /** Allow pet to climb screen edges */
    allowPetClimbing: boolean;

    // Actions
    setAllowPetInteraction: (value: boolean) => void;
    setAllowPetAboveTaskbar: (value: boolean) => void;
    setAllowOverridePetScale: (value: boolean) => void;
    setPetScale: (value: number) => void;
    setAllowPetClimbing: (value: boolean) => void;
}

/**
 * Default settings matching the original defaultSettings.json
 */
const defaultSettings = {
    allowPetInteraction: true,
    allowPetAboveTaskbar: true,
    allowOverridePetScale: false,
    petScale: 1.0,
    allowPetClimbing: true,
};

export const useSettingStore = create<SettingsState>((set) => ({
    ...defaultSettings,

    setAllowPetInteraction: (value) => set({ allowPetInteraction: value }),
    setAllowPetAboveTaskbar: (value) => set({ allowPetAboveTaskbar: value }),
    setAllowOverridePetScale: (value) => set({ allowOverridePetScale: value }),
    setPetScale: (value) => set({ petScale: value }),
    setAllowPetClimbing: (value) => set({ allowPetClimbing: value }),
}));