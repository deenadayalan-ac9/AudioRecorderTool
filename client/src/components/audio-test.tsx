import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { toast } from '@/hooks/use-toast';

export function AudioTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  // Function to generate a test audio blob (1 second of silence)
  const generateTestAudioBlob = async (): Promise<Blob> => {
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect oscillator to gain node and gain node to destination
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set frequency and volume
    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = 0.5; // Half volume
    
    // Start and stop the oscillator (1 second)
    oscillator.start();
    
    // Record the audio using MediaRecorder
    const stream = audioContext.createMediaStreamDestination().stream;
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        resolve(blob);
      };
      
      mediaRecorder.start();
      
      // Stop the oscillator and recorder after 1 second
      setTimeout(() => {
        oscillator.stop();
        mediaRecorder.stop();
      }, 1000);
    });
  };

  const testAudioUpload = async () => {
    setIsLoading(true);
    try {
      // Generate a test audio blob
      const audioBlob = await generateTestAudioBlob();

      // Create a form data and append the audio blob
      const formData = new FormData();
      formData.append('audio', audioBlob, 'test-audio.wav');

      // Send to server
      const response = await axios.post('/api/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResponse(response.data);
      toast({
        title: 'Success',
        description: 'Audio test completed successfully',
      });
    } catch (error) {
      console.error('Error testing audio upload:', error);
      toast({
        title: 'Error',
        description: 'Failed to test audio upload',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Audio API Test</CardTitle>
        <CardDescription>Test the audio upload endpoint</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testAudioUpload} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Run Test'}
        </Button>

        {response && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-medium mb-2">Server Response:</h3>
            <pre className="text-xs overflow-auto max-h-32">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        This will generate a test audio file and send it to the server.
      </CardFooter>
    </Card>
  );
}