import { useState } from 'react';
import { X, Upload, Download, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { createWavBlobFromAudioBlob, generateRecordingFilename } from '../lib/audio-utils';

interface AudioControlsProps {
  show: boolean;
  audioURL: string | null;
  audioBlob: Blob | null;
  onClose: () => void;
  onRetry: () => void;
}

export function AudioControls({ 
  show, 
  audioURL, 
  audioBlob,
  onClose, 
  onRetry 
}: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  const handleDownload = async () => {
    if (!audioBlob) return;
    
    try {
      // Create a filename with timestamp
      const fileName = generateRecordingFilename();
      
      // Use our WAV converter to create a proper WAV file
      console.log('Converting audio to WAV format for download...');
      const wavBlob = await createWavBlobFromAudioBlob(audioBlob);
      console.log(`WAV conversion complete. File size: ${wavBlob.size} bytes`);
      
      // Create a download URL
      const downloadUrl = URL.createObjectURL(wavBlob);
      
      // Create and trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl); // Prevent memory leaks
    } catch (error) {
      console.error('Error creating WAV file for download:', error);
      // Fallback to basic download if conversion fails
      const fileName = generateRecordingFilename();
      const fallbackBlob = new Blob([audioBlob], { type: 'audio/wav' });
      const downloadUrl = URL.createObjectURL(fallbackBlob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    }
  };
  
  const handleAudioPlayStateChange = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setIsPlaying(!e.currentTarget.paused);
  };
  
  const handleSendToFastAPI = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      // Use our WAV converter to create a proper WAV file
      console.log('Converting audio to WAV format for API upload...');
      const wavBlob = await createWavBlobFromAudioBlob(audioBlob);
      
      // Generate filename with timestamp
      const timestamp = Date.now();
      const filename = `recording_${timestamp}.wav`;
      console.log(`API upload preparation complete. WAV file size: ${wavBlob.size} bytes`);
      
      // Create form data with the audio blob
      const formData = new FormData();
      formData.append('audio', wavBlob, filename);
      
      // Send to our Express backend which will forward to FastAPI
      console.log('Sending audio file to API...');
      const response = await axios.post('/api/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('API response received:', response.data);
      setUploadStatus({
        success: true,
        message: 'Audio sent to API successfully'
      });
      
    } catch (error) {
      console.error('Error sending audio to API:', error);
      
      // If WAV conversion failed, try with the original blob as fallback
      if (error.message?.includes('WAV')) {
        try {
          console.log('WAV conversion failed, trying with original audio format');
          const fallbackBlob = new Blob([audioBlob], { type: 'audio/wav' });
          const filename = `recording_fallback_${Date.now()}.wav`;
          
          const formData = new FormData();
          formData.append('audio', fallbackBlob, filename);
          
          const response = await axios.post('/api/audio', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          console.log('API response with fallback format:', response.data);
          setUploadStatus({
            success: true,
            message: 'Audio sent to API successfully (fallback format)'
          });
          return;
        } catch (fallbackError) {
          console.error('Fallback upload also failed:', fallbackError);
        }
      }
      
      setUploadStatus({
        success: false,
        message: axios.isAxiosError(error) 
          ? `Error: ${error.response?.data?.error || error.message}`
          : 'Failed to send audio to API'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div 
      className={`fixed bottom-32 left-0 right-0 bg-white rounded-lg mx-6 p-4 shadow-lg transform transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Recording Complete</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <audio 
          src={audioURL || undefined} 
          controls 
          className="w-full" 
          onPlay={handleAudioPlayStateChange}
          onPause={handleAudioPlayStateChange}
        />
        
        {uploadStatus && (
          <div className={`text-sm p-2 rounded ${uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center`}>
            {!uploadStatus.success && <AlertTriangle className="h-4 w-4 mr-1" />}
            {uploadStatus.message}
          </div>
        )}
        
        <div className="flex space-x-2">
          <button 
            onClick={onRetry} 
            className="flex-1 py-2 px-4 bg-gray-200 rounded-md font-medium"
          >
            Record Again
          </button>
          <button 
            onClick={handleDownload} 
            className="flex-1 py-2 px-4 bg-primary text-white rounded-md font-medium flex items-center justify-center"
            disabled={!audioBlob}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </button>
        </div>
        
        <button 
          onClick={handleSendToFastAPI}
          disabled={!audioBlob || isUploading}
          className={`w-full py-2 px-4 rounded-md font-medium flex items-center justify-center ${
            isUploading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
          }`}
        >
          <Upload className="h-4 w-4 mr-1" />
          {isUploading ? 'Sending...' : 'Send to API'}
        </button>
      </div>
    </div>
  );
}
