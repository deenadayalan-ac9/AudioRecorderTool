import { useState } from 'react';
import { X } from 'lucide-react';

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
        
        <div className="flex space-x-2">
          <button 
            onClick={onRetry} 
            className="flex-1 py-2 px-4 bg-gray-200 rounded-md font-medium"
          >
            Record Again
          </button>
          <button 
            onClick={handleDownload} 
            className="flex-1 py-2 px-4 bg-primary text-white rounded-md font-medium"
            disabled={!audioBlob}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
