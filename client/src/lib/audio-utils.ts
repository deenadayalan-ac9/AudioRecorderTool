/**
 * Format milliseconds to mm:ss time format
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Check if the browser supports audio recording
 */
export function checkAudioRecordingSupport(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Generate a filename for the recording with timestamp
 */
export function generateRecordingFilename(): string {
  return `recording_${new Date().toISOString().slice(0,19).replace(/[-:T]/g, '')}.wav`;
}
