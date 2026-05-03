import { useEffect, useRef, useCallback } from "react";
import { AudioService } from "../services/audioService";
import { useSettingsStore } from "../stores/settingsStore";

/**
 * Hook that manages an AudioService instance:
 *  - Syncs volume from the settings store
 *  - Wraps playBase64Audio with lipSyncing state toggling
 *  - Returns { playBase64Audio, playSound, stop }
 */
export function useAudio() {
  const serviceRef = useRef<AudioService>(new AudioService());

  const outputVolume = useSettingsStore((s) => s.settings.voice.outputVolume);

  // Keep the service volume in sync with settings
  useEffect(() => {
    serviceRef.current.volume = outputVolume;
  }, [outputVolume]);

  const playBase64Audio = useCallback(async (base64: string) => {
    await serviceRef.current.playBase64Audio(base64);
  }, []);

  const playSound = useCallback((path: string) => {
    return serviceRef.current.playSoundFile(path);
  }, []);

  const stop = useCallback(() => {
    serviceRef.current.stop();
  }, []);

  return { playBase64Audio, playSound, stop };
}
