/**
 * Convert a WebM/Opus audio blob (from MediaRecorder) to mono 16kHz Float32Array PCM.
 * Uses Web Audio API's decodeAudioData for proper container decoding and resampling.
 */
export async function webmBlobToFloat32(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new OfflineAudioContext(1, 1, 16000);
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Get mono channel data (downmix if stereo)
  const channelData = audioBuffer.getChannelData(0);

  // If already at target sample rate, return as-is
  if (audioBuffer.sampleRate === 16000) {
    return channelData;
  }

  // Resample to 16kHz
  const ratio = 16000 / audioBuffer.sampleRate;
  const newLength = Math.round(channelData.length * ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i / ratio;
    const srcFloor = Math.floor(srcIndex);
    const srcCeil = Math.min(srcFloor + 1, channelData.length - 1);
    const frac = srcIndex - srcFloor;
    result[i] = channelData[srcFloor] * (1 - frac) + channelData[srcCeil] * frac;
  }

  return result;
}
