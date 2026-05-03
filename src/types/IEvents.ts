/**
 * Event types for communication between window and pet overlay.
 */
export enum EventType {
    /** Setting changed from window to pet overlay */
    SettingWindowToPetOverlay = "setting-window-to-pet-overlay",
}

/**
 * Dispatch types for setting changes.
 */
export enum DispatchType {
    /** Toggle pet interaction */
    SwitchAllowPetInteraction = "switch-allow-pet-interaction",
    /** Toggle pet above taskbar */
    SwitchPetAboveTaskbar = "switch-pet-above-taskbar",
    /** Override pet scale with custom value */
    OverridePetScale = "override-pet-scale",
    /** Toggle pet climbing ability */
    SwitchAllowPetClimbing = "switch-allow-pet-climbing",
    /** Change pet scale */
    ChangePetScale = "change-pet-scale",
}

/**
 * Payload for setting change events.
 */
export interface IDispatchPayload {
    /** The dispatch type indicating what setting changed */
    dispatchType: DispatchType;
    /** The new value for the setting */
    value: string | number | boolean;
}

/**
 * Event listener type for Tauri event payloads.
 */
export interface TRenderEventListener {
    /** Event payload containing dispatch information */
    payload: IDispatchPayload;
}