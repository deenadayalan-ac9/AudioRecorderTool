import { useState, useEffect, useRef, useCallback } from 'react';

interface RecordButtonProps {
  isRecording: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
}

export function RecordButton({ isRecording, onPressStart, onPressEnd }: RecordButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  
  // Handle press start
  const handlePressStart = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onPressStart();
  }, [onPressStart]);
  
  // Handle press end
  const handlePressEnd = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (isPressed) {
      setIsPressed(false);
      onPressEnd();
    }
  }, [isPressed, onPressEnd]);
  
  // Handle touch/mouse events
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    
    // Handle global events to ensure we catch all end events
    const handleGlobalEnd = (e: MouseEvent | TouchEvent) => {
      if (isPressed) {
        setIsPressed(false);
        onPressEnd();
      }
    };
    
    // Add event listeners
    button.addEventListener('touchstart', handlePressStart, { passive: false });
    button.addEventListener('mousedown', handlePressStart);
    
    // Use both local and global end events for better reliability
    button.addEventListener('touchend', handlePressEnd, { passive: false });
    button.addEventListener('mouseup', handlePressEnd);
    
    // Global events to catch mouse/touch ending outside the button
    window.addEventListener('touchend', handleGlobalEnd, { passive: false });
    window.addEventListener('mouseup', handleGlobalEnd);
    
    // Also handle mouse leaving the button
    button.addEventListener('mouseleave', handlePressEnd);
    
    return () => {
      // Remove all event listeners on cleanup
      button.removeEventListener('touchstart', handlePressStart);
      button.removeEventListener('mousedown', handlePressStart);
      button.removeEventListener('touchend', handlePressEnd);
      button.removeEventListener('mouseup', handlePressEnd);
      button.removeEventListener('mouseleave', handlePressEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [handlePressStart, handlePressEnd, isPressed, onPressEnd]);
  
  return (
    <>
      <div className={`absolute inset-0 bg-primary rounded-full ${isRecording ? 'opacity-70 recording-ring' : 'opacity-0'} transition-opacity duration-200`}></div>
      <button 
        ref={buttonRef}
        className="relative w-24 h-24 bg-primary rounded-full focus:outline-none shadow-lg transform transition-transform duration-200 active:scale-95"
        aria-label="Press and hold to record audio"
        onTouchStart={(e) => e.preventDefault()} // Prevent default for mobile devices
      />
    </>
  );
}
