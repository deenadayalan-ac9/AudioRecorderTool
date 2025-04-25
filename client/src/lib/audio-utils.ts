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

/**
 * Convert audio blob to downloadable WAV format.
 * This is necessary because browsers often record in webm format, and
 * simply changing the extension and mimetype doesn't create a valid WAV file.
 * 
 * This creates a basic (but valid) WAV header for the audio data.
 */
export function createWavBlobFromAudioBlob(audioBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    console.log('Creating WAV blob from audio data');
    
    // First, create an audio element to decode the original audio
    const audioElement = new Audio();
    audioElement.src = URL.createObjectURL(audioBlob);
    
    // Create an audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    // When the audio loads, decode it
    audioElement.onloadedmetadata = async () => {
      console.log('Audio metadata loaded, decoding audio data');
      
      try {
        // Convert blob to array buffer
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        // Decode the audio data
        const audioData = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get audio sample data
        const numberOfChannels = audioData.numberOfChannels;
        const sampleRate = audioData.sampleRate;
        const length = audioData.length;
        
        console.log(`Audio details: channels=${numberOfChannels}, sampleRate=${sampleRate}, length=${length}`);
        
        // Create a buffer for the WAV file
        const wavBuffer = createWavBuffer(audioData);
        
        // Create a blob from the buffer
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        console.log(`WAV blob created, size: ${wavBlob.size} bytes`);
        
        resolve(wavBlob);
      } catch (error) {
        console.error('Error creating WAV blob:', error);
        // If we can't convert properly, just return the original blob with WAV mime type
        // It might not be a valid WAV, but it's better than nothing
        resolve(new Blob([audioBlob], { type: 'audio/wav' }));
      } finally {
        // Clean up
        URL.revokeObjectURL(audioElement.src);
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      }
    };
    
    audioElement.onerror = () => {
      console.error('Error loading audio data');
      URL.revokeObjectURL(audioElement.src);
      // Return original blob with WAV mime type as fallback
      resolve(new Blob([audioBlob], { type: 'audio/wav' }));
    };
  });
}

/**
 * Create a WAV buffer from AudioBuffer
 * This creates a proper WAV file with header
 */
function createWavBuffer(audioData: AudioBuffer): ArrayBuffer {
  const numberOfChannels = audioData.numberOfChannels;
  const sampleRate = audioData.sampleRate;
  const length = audioData.length;
  
  // Calculate file size
  // 44 bytes for the header + (2 bytes per sample * number of samples * number of channels)
  const fileSize = 44 + (2 * length * numberOfChannels);
  
  // Create the buffer for the WAV file
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2 * numberOfChannels, true); // byte rate
  view.setUint16(32, numberOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length * 2 * numberOfChannels, true);
  
  // Write the audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioData.getChannelData(channel)[i];
      // Convert float to 16-bit PCM
      const pcm = Math.max(-1, Math.min(1, sample));
      const value = pcm < 0 ? pcm * 0x8000 : pcm * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += 2;
    }
  }
  
  return buffer;
}

/**
 * Helper function to write a string to a DataView
 */
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
