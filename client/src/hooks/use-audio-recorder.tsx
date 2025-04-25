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
      if (isRecording || (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording')) {
        console.log('Already recording, ignoring start request');
        return;
      }
      
      console.log('Starting audio recording...');
      
      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Recording not supported in this browser');
        setStatusMessage('Recording not supported in this browser');
        setStatusType('error');
        return;
      }
      
      // Get audio stream with explicit constraints for better compatibility
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      console.log('Audio stream acquired successfully');
      streamRef.current = stream;
      
      // Set up audio context and analyser for visualization
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start visualizer interval
      visualizerIntervalRef.current = window.setInterval(updateVisualizer, 100);
      
      // Set up media recorder with explicit mime type for better compatibility
      const options = { mimeType: 'audio/webm' };
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        console.log('MediaRecorder created with options:', options);
      } catch (e) {
        console.warn('Failed to create MediaRecorder with specified options, trying default', e);
        mediaRecorderRef.current = new MediaRecorder(stream);
      }
      
      audioChunksRef.current = [];
      
      // Add event listeners
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Data available from recorder:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        console.log('MediaRecorder stopped, processing audio...');
        
        // Ensure we have data to process
        if (audioChunksRef.current.length === 0) {
          console.warn('No audio data collected');
          setStatusMessage('No audio recorded. Please try again.');
          setStatusType('error');
          cleanupResources();
          return;
        }
        
        // Process audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created, size:', audioBlob.size, 'bytes');
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
      };
      
      // Request data every 1 second to ensure we get data even for short recordings
      mediaRecorderRef.current.start(1000);
      console.log('MediaRecorder started');
      
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
        console.warn('Microphone permission denied');
        if (onPermissionDenied) onPermissionDenied();
      } else {
        setStatusMessage(`Error: ${(error as Error).message}`);
        setStatusType('error');
      }
      
      cleanupResources();
    }
  }, [cleanupResources, updateRecordingTime, updateVisualizer, audioURL, onPermissionDenied, isRecording]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    
    if (!isRecording) {
      console.log('Not currently recording, nothing to stop');
      return;
    }
    
    if (mediaRecorderRef.current) {
      try {
        // Check if we're actually recording before trying to stop
        if (mediaRecorderRef.current.state === 'recording') {
          console.log('MediaRecorder is in recording state, stopping it');
          mediaRecorderRef.current.stop();
        } else {
          console.log('MediaRecorder is not in recording state:', mediaRecorderRef.current.state);
          // Force the recording to end if MediaRecorder is in an unexpected state
          if (audioChunksRef.current.length > 0) {
            console.log('Processing existing audio chunks');
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setAudioBlob(audioBlob);
            
            // Create URL for playback
            if (audioURL) URL.revokeObjectURL(audioURL);
            const url = URL.createObjectURL(audioBlob);
            setAudioURL(url);
            
            // Update UI
            setShowControls(true);
          }
          
          setIsRecording(false);
          setStatusMessage('Press and hold to record');
          setStatusType('info');
          cleanupResources();
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        // Force cleanup on error
        setIsRecording(false);
        cleanupResources();
      }
    } else {
      console.log('MediaRecorder not available, cleaning up');
      // Force cleanup if mediaRecorder is not available
      setIsRecording(false);
      cleanupResources();
    }
  }, [isRecording, audioURL, cleanupResources]);
  
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
