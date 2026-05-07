/**
 * Convert a WebM/Opus audio blob (from MediaRecorder) to mono 16kHz Float32Array PCM.
 * Uses OfflineAudioContext with the target sample rate so the browser handles
 * high-quality resampling internally.
 */
export async function webmBlobToFloat32(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();

  // Decode at original rate first to determine duration
  const probeContext = new OfflineAudioContext(1, 1, 16000);
  const probeBuffer = await probeContext.decodeAudioData(arrayBuffer);

  // If already 16kHz mono, return directly
  if (probeBuffer.sampleRate === 16000 && probeBuffer.numberOfChannels === 1) {
    return probeBuffer.getChannelData(0);
  }

  // Calculate target sample count from duration
  const duration = probeBuffer.length / probeBuffer.sampleRate;
  const targetSamples = Math.ceil(duration * 16000);

  // Re-decode with OfflineAudioContext at target rate for native resampling
  const context = new OfflineAudioContext(1, targetSamples, 16000);
  const source = context.createBufferSource();
  source.buffer = probeBuffer;
  source.connect(context.destination);
  source.start();

  const audioBuffer = await context.startRendering();
  return audioBuffer.getChannelData(0);
}
