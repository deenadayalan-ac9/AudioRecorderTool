import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  data: Uint8Array | null;
}

export function AudioVisualizer({ data }: AudioVisualizerProps) {
  const visualizerRef = useRef<HTMLDivElement>(null);
  
  // Create visualizer bars
  useEffect(() => {
    const visualizer = visualizerRef.current;
    if (!visualizer) return;

    // Clear existing bars
    visualizer.innerHTML = '';
    
    // Create new bars
    for (let i = 0; i < 20; i++) {
      const bar = document.createElement('div');
      bar.className = 'visualizer-bar';
      bar.style.height = '5px';
      visualizer.appendChild(bar);
    }
  }, []);
  
  // Update visualizer with audio data
  useEffect(() => {
    if (!data || !visualizerRef.current) return;
    
    const bars = visualizerRef.current.querySelectorAll('.visualizer-bar');
    for (let i = 0; i < bars.length && i < data.length / 2; i++) {
      const barHeight = Math.max(5, data[i * 2] / 255 * 40);
      (bars[i] as HTMLElement).style.height = `${barHeight}px`;
    }
  }, [data]);
  
  return (
    <div 
      ref={visualizerRef}
      className="mb-6 h-10 w-full max-w-[300px] flex items-center justify-between"
    >
      {/* Bars will be dynamically generated in useEffect */}
    </div>
  );
}

// Add styles for visualizer bars
const styles = document.createElement('style');
styles.innerHTML = `
  .visualizer-bar {
    width: 3px;
    background-color: hsl(var(--primary));
    border-radius: 1px;
    transition: height 0.1s ease;
  }
`;
document.head.appendChild(styles);
