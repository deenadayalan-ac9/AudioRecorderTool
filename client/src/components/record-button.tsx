import { useEffect, useRef } from 'react';

interface RecordButtonProps {
  isRecording: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
}

export function RecordButton({ isRecording, onPressStart, onPressEnd }: RecordButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Handle touch/mouse events
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    
    const handlePressStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      onPressStart();
    };
    
    const handlePressEnd = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      onPressEnd();
    };
    
    button.addEventListener('touchstart', handlePressStart);
    button.addEventListener('mousedown', handlePressStart);
    button.addEventListener('touchend', handlePressEnd);
    button.addEventListener('mouseup', handlePressEnd);
    button.addEventListener('mouseleave', handlePressEnd);
    
    return () => {
      button.removeEventListener('touchstart', handlePressStart);
      button.removeEventListener('mousedown', handlePressStart);
      button.removeEventListener('touchend', handlePressEnd);
      button.removeEventListener('mouseup', handlePressEnd);
      button.removeEventListener('mouseleave', handlePressEnd);
    };
  }, [onPressStart, onPressEnd]);
  
  return (
    <>
      <div className={`absolute inset-0 bg-primary rounded-full ${isRecording ? 'opacity-70 recording-ring' : 'opacity-0'} transition-opacity duration-200`}></div>
      <button 
        ref={buttonRef}
        className="relative w-24 h-24 bg-primary rounded-full focus:outline-none shadow-lg transform transition-transform duration-200 active:scale-95"
        aria-label="Press and hold to record audio"
      />
    </>
  );
}
