import { useState } from "react";
import { StatusBar } from "./status-bar";
import { RecordButton } from "./record-button";
import { AudioControls } from "./audio-controls";
import { PermissionModal } from "./permission-modal";
import { AudioVisualizer } from "./audio-visualizer";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { X } from "lucide-react";

export function AudioRecorder() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  const {
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
  } = useAudioRecorder({
    onPermissionDenied: () => setShowPermissionModal(true)
  });

  const handleAllowPermission = () => {
    setShowPermissionModal(false);
    startRecording();
  };

  const handleCancelPermission = () => {
    setShowPermissionModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <StatusBar />
      
      {/* Close button in top right */}
      <button 
        onClick={resetRecording}
        className="absolute right-4 top-14 bg-white rounded-full p-2 shadow-md z-10"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Status message area */}
      <div className={`mb-8 text-center transition-opacity duration-300 ease-in-out ${statusType === 'recording' ? 'text-primary font-medium' : statusType === 'error' ? 'text-destructive' : 'text-foreground'}`}>
        <p className="text-lg font-medium">{statusMessage}</p>
        {isRecording && (
          <p className="text-sm mt-1">{recordingTime}</p>
        )}
      </div>

      {/* Audio visualizer */}
      {isRecording && <AudioVisualizer data={visualizerData} />}

      {/* Record button area */}
      <div className="relative mb-20">
        <RecordButton 
          isRecording={isRecording}
          onPressStart={startRecording}
          onPressEnd={stopRecording}
        />
      </div>

      {/* Bottom text prompt */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center">
        <div className="bg-white py-3 px-6 rounded-full shadow-md">
          <p className="text-center text-foreground">Would you like to schedule a course?</p>
        </div>
      </div>

      {/* Audio controls */}
      <AudioControls 
        show={showControls}
        audioURL={audioURL}
        audioBlob={audioBlob}
        onClose={resetRecording}
        onRetry={resetRecording}
      />

      {/* Permission modal */}
      <PermissionModal 
        show={showPermissionModal}
        onAllow={handleAllowPermission}
        onCancel={handleCancelPermission}
      />
    </div>
  );
}
