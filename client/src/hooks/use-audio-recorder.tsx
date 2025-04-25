import { useState, useRef, useEffect, useCallback } from 'react';
import { formatTime } from '@/lib/audio-utils';

interface UseAudioRecorderProps {
  onPermissionDenied?: () => void;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingTime: string;
  audioBlob: Blob | null;
  audioURL: string | null;
  statusMessage: string;
  statusType: 'info' | 'recording' | 'error';
  visualizerData: Uint8Array | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  showControls: boolean;
}

export function useAudioRecorder({ 
  onPermissionDenied 
}: UseAudioRecorderProps = {}): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Press and hold to record');
  const [statusType, setStatusType] = useState<'info' | 'recording' | 'error'>('info');
  const [showControls, setShowControls] = useState(false);
  const [visualizerData, setVisualizerData] = useState<Uint8Array | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualizerIntervalRef = useRef<number | null>(null);
  
  // Update recording time
  const updateRecordingTime = useCallback(() => {
    if (!startTimeRef.current) return;
    
    const elapsedTime = Date.now() - startTimeRef.current;
    setRecordingTime(formatTime(elapsedTime));
  }, []);
  
  // Update visualizer
  const updateVisualizer = useCallback(() => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    setVisualizerData(dataArray);
  }, []);
  
  // Clean up resources
  const cleanupResources = useCallback(() => {
    // Clear intervals
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (visualizerIntervalRef.current) {
      clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = null;
    }
    
    // Stop and close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);
  
  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Don't start if already recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') return;
      
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatusMessage('Recording not supported in this browser');
        setStatusType('error');
        return;
      }
      
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio context and analyser for visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start visualizer interval
      visualizerIntervalRef.current = window.setInterval(updateVisualizer, 100);
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      // Add event listeners
      mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data);
      });
      
      mediaRecorderRef.current.addEventListener('stop', () => {
        // Process audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Create URL for playback
        if (audioURL) URL.revokeObjectURL(audioURL);
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Update UI
        setIsRecording(false);
        setShowControls(true);
        setStatusMessage('Press and hold to record');
        setStatusType('info');
        
        // Clean up
        cleanupResources();
      });
      
      // Start recording
      mediaRecorderRef.current.start();
      
      // Update state and UI
      setIsRecording(true);
      startTimeRef.current = Date.now();
      recordingIntervalRef.current = window.setInterval(updateRecordingTime, 1000);
      
      setStatusMessage('Recording...');
      setStatusType('recording');
      
    } catch (error) {
      // Handle errors
      console.error('Recording error:', error);
      
      if ((error as Error).name === 'NotAllowedError' || (error as Error).name === 'PermissionDeniedError') {
        if (onPermissionDenied) onPermissionDenied();
      } else {
        setStatusMessage(`Error: ${(error as Error).message}`);
        setStatusType('error');
      }
      
      cleanupResources();
    }
  }, [cleanupResources, updateRecordingTime, updateVisualizer, audioURL, onPermissionDenied]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);
  
  // Reset recording
  const resetRecording = useCallback(() => {
    // Clean up audio resources
    stopRecording();
    cleanupResources();
    
    // Reset state
    setIsRecording(false);
    setRecordingTime('00:00');
    setShowControls(false);
    setStatusMessage('Press and hold to record');
    setStatusType('info');
    
    // Clean up audio blob URL
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
    
    setAudioBlob(null);
    audioChunksRef.current = [];
    startTimeRef.current = null;
  }, [stopRecording, cleanupResources, audioURL]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupResources();
      
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [cleanupResources, audioURL]);
  
  return {
    isRecording,
    recordingTime,
    audioBlob,
    audioURL,
    statusMessage,
    statusType,
    visualizerData,
    startRecording,
    stopRecording,
    resetRecording,
    showControls,
  };
}
