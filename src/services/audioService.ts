/**
 * AudioService handles playback of audio data (base64-encoded or file-based)
 * using the Web Audio API. AudioContext is lazily initialised on first use.
 */
export class AudioService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Get (or lazily create) the AudioContext and GainNode. */
  getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
    return this.audioContext;
  }

  /** Get the current volume (0-1). */
  get volume(): number {
    if (!this.gainNode) return 1;
    return this.gainNode.gain.value;
  }

  /** Set the volume, clamped to [0, 1]. */
  set volume(value: number) {
    const ctx = this.getAudioContext();
    // getAudioContext initialises gainNode as well
    void ctx; // just to satisfy linter that ctx is used
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  /**
   * Decode a base64-encoded audio buffer and play it through the gain node.
   * Returns a Promise that resolves when playback finishes.
   */
  async playBase64Audio(base64: string): Promise<void> {
    const ctx = this.getAudioContext();

    // Resume context if it was suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    // Decode base64 string to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode audio data
    const audioBuffer = await ctx.decodeAudioData(bytes.buffer);

    // Stop any currently playing source
    this.stop();

    // Create and play new source
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode!);
    this.currentSource = source;

    return new Promise<void>((resolve) => {
      source.onended = () => {
        this.currentSource = null;
        resolve();
      };
      source.start();
    });
  }

  /** Stop the currently playing audio, if any. */
  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped — ignore
      }
      this.currentSource = null;
    }
  }

  /**
   * Play a sound file by URL/path using an HTMLAudioElement piped through
   * the AudioContext gain node.
   */
  async playSoundFile(path: string): Promise<void> {
    const ctx = this.getAudioContext();

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    this.stop();

    const audio = new Audio(path);
    const source = ctx.createMediaElementSource(audio);
    source.connect(this.gainNode!);

    return new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error(`Failed to play sound file: ${path}`));
      audio.play().catch(reject);
    });
  }
}
