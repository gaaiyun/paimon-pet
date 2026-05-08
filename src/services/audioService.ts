/**
 * AudioService handles playback of audio data (base64-encoded or file-based)
 * using the Web Audio API with a FIFO queue so that rapid audio segments
 * are played sequentially without interrupting each other.
 */
export class AudioService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  /** Currently playing AudioBufferSourceNode, or null when idle. */
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private audioQueue: string[] = [];
  private currentResolve: (() => void) | null = null;
  /**
   * Number of milliseconds to wait after each audio segment finishes
   * before starting the next. This creates a natural pause between
   * sentences so they don't feel rushed or concatenated.
   */
  private pauseBetweenSegments_ms = 250;

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
    this.getAudioContext();
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  /**
   * Enqueue a base64 audio string for sequential playback.
   * Each audio segment plays to completion before the next one starts.
   */
  async playBase64Audio(base64: string): Promise<void> {
    // Add to queue; if something is already playing, just queue it
    this.audioQueue.push(base64);
    return this._drainQueue();
  }

  /**
   * Drain the queue: play the next item, wait for it to finish, pause,
   * then recursively drain until the queue is empty.
   * Concurrent calls share the same queue and are handled safely.
   */
  private async _drainQueue(): Promise<void> {
    if (this.audioQueue.length === 0) return;

    // Wait for the previous audio to finish before starting the next
    if (this.isPlaying) {
      await new Promise<void>((resolve) => {
        this.currentResolve = resolve;
      });
      if (this.audioQueue.length === 0) return;
    }

    const base64 = this.audioQueue.shift()!;
    await this._playAudio(base64);

    // After this audio finishes, pause briefly so the next sentence
    // doesn't feel rushed — creates natural rhythm between segments
    if (this.audioQueue.length > 0) {
      await this._delay(this.pauseBetweenSegments_ms);
      return this._drainQueue();
    }
  }

  /** Resolves after `ms` milliseconds. */
  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Play a single base64 audio string to completion.
   */
  private async _playAudio(base64: string): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioBuffer = await ctx.decodeAudioData(bytes.buffer);

    // Stop any previously playing source (shouldn't happen since we track isPlaying)
    this._stopCurrent();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode!);
    this.currentSource = source;
    this.isPlaying = true;

    return new Promise<void>((resolve) => {
      source.onended = () => {
        this.currentSource = null;
        this.isPlaying = false;
        resolve();
        // Unblock _drainQueue if it is waiting
        if (this.currentResolve) {
          this.currentResolve();
          this.currentResolve = null;
        }
      };
      source.start();
    });
  }

  /** Immediately stop all playback and clear the queue. */
  stop(): void {
    this.audioQueue = [];
    this._stopCurrent();
    this.isPlaying = false;
    if (this.currentResolve) {
      this.currentResolve();
      this.currentResolve = null;
    }
  }

  private _stopCurrent(): void {
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
