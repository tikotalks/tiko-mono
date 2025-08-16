// Temporary fix for audio URL construction
export function fixAudioUrl(audioUrl: string | undefined): string | undefined {
  if (!audioUrl) return undefined;
  
  const workerUrl = import.meta.env.VITE_TTS_WORKER_URL || '';
  
  // If audioUrl is already a full URL, return it as is
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    return audioUrl;
  }
  
  // If audioUrl starts with /, it's a path
  if (audioUrl.startsWith('/')) {
    // If workerUrl ends with /, remove the duplicate
    if (workerUrl.endsWith('/')) {
      return workerUrl.slice(0, -1) + audioUrl;
    }
    return workerUrl + audioUrl;
  }
  
  // Otherwise, ensure proper path joining
  return workerUrl.endsWith('/') ? workerUrl + audioUrl : workerUrl + '/' + audioUrl;
}