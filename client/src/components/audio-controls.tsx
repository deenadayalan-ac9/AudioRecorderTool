import { useState } from 'react';
import { X, Upload, Download, AlertTriangle } from 'lucide-react';
import axios from 'axios';

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
  
  const handleDownload = () => {
    if (!audioBlob) return;
    
    const fileName = `recording_${new Date().toISOString().slice(0,19).replace(/[-:T]/g, '')}.wav`;
    const a = document.createElement('a');
    a.href = audioURL as string;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleAudioPlayStateChange = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setIsPlaying(!e.currentTarget.paused);
  };
  
  const handleSendToFastAPI = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      // Create form data with the audio blob
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording_${Date.now()}.wav`);
      
      // Send to our Express backend which will forward to FastAPI
      const response = await axios.post('/api/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadStatus({
        success: true,
        message: 'Audio sent to API successfully'
      });
      
      console.log('API response:', response.data);
      
    } catch (error) {
      console.error('Error sending audio to API:', error);
      
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
