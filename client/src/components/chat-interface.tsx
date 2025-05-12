import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Mic, StopCircle, Trash, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '../hooks/use-audio-recorder';
import { createWavBlobFromAudioBlob } from '../lib/audio-utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  audioUrl?: string; // For audio messages
  processingState?: 'sending' | 'processing' | 'error' | 'complete';
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I can process both text and audio messages. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Audio recording setup
  const { 
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    statusMessage,
    statusType
  } = useAudioRecorder();
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    
    const newMessage: Message = {
      id: generateId(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsProcessing(true);
    
    try {
      const response = await axios.post('/api/text', null, {
        params: { text: inputText.trim() }
      });
      
      // Create AI response - API now returns a string directly
      const aiResponse: Message = {
        id: generateId(),
        text: typeof response.data === 'string' ? response.data : "I processed your message, but I don't have a specific response.",
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error processing text:', error);
      
      // Create error message
      const errorMessage: Message = {
        id: generateId(),
        text: 'Sorry, I had trouble processing your message. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      // Focus the input field after sending
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };
  
  const handleStartRecording = async () => {
    resetRecording();
    await startRecording();
  };
  
  const handleStopRecording = async () => {
    stopRecording();
    
    // Need to wait a bit for the audio blob to be available
    setTimeout(async () => {
      if (!audioBlob) {
        console.error('No audio blob available after recording');
        return;
      }
      
      console.log('Audio recording stopped, blob size:', audioBlob.size);
      
      // Create a unique ID for this message to track it through the process
      const messageId = generateId();
      
      try {
        // Create a URL for the audio file
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create a message for the audio
        const audioMessage: Message = {
          id: messageId,
          text: 'Voice message',
          sender: 'user',
          timestamp: new Date(),
          audioUrl: audioUrl,
          processingState: 'sending'
        };
        
        // Add the audio message to the chat
        setMessages(prev => [...prev, audioMessage]);
        setIsProcessing(true);
        
        // Convert audio to WAV format for API
        try {
          console.log('Converting audio to WAV format...');
          const wavBlob = await createWavBlobFromAudioBlob(audioBlob);
          console.log('WAV conversion complete, size:', wavBlob.size);
          
          // Update message state to processing
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? {...msg, processingState: 'processing'} 
              : msg
          ));
          
          // Create form data for API request
          const formData = new FormData();
          formData.append('audio', wavBlob, `recording_${Date.now()}.wav`);
          
          // Send to API
          console.log('Sending audio to API...');
          const response = await axios.post('/api/audio', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('API response:', response.data);
          
          // Update message state to complete
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? {...msg, processingState: 'complete'} 
              : msg
          ));
          
          // Get the response from the API 
          // The API now returns a string directly, or via a response field
          const responseText = typeof response.data === 'string' ? response.data : 
                               response.data?.response || 
                               "I processed your audio message.";
          
          // Create AI response message
          const aiResponse: Message = {
            id: generateId(),
            text: responseText,
            sender: 'ai',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, aiResponse]);
          
        } catch (error) {
          console.error('Error processing audio:', error);
          
          // Update message state to error
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? {...msg, processingState: 'error'} 
              : msg
          ));
          
          // Add error message
          const errorMessage: Message = {
            id: generateId(),
            text: 'Sorry, I had trouble processing your audio. Please try again.',
            sender: 'ai',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error('Error creating audio message:', error);
      } finally {
        setIsProcessing(false);
        resetRecording();
      }
    }, 500);
  };
  
  const clearChat = () => {
    setMessages([{
      id: '1',
      text: 'Chat cleared. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Chat header */}
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
        <button 
          onClick={clearChat} 
          className="p-2 rounded-full hover:bg-primary-dark"
          title="Clear chat"
        >
          <Trash size={18} />
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`p-3 rounded-lg max-w-[80%] ${
                message.sender === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-gray-200 text-gray-800 rounded-tl-none'
              }`}
            >
              {message.audioUrl ? (
                <div className="flex flex-col w-full">
                  <p className="whitespace-pre-wrap break-words mb-2">Voice message</p>
                  <audio 
                    src={message.audioUrl} 
                    controls 
                    className="my-1 w-full max-w-[250px]"
                    preload="metadata"
                    controlsList="nodownload" 
                  />
                  <span className="text-xs opacity-75">
                    {message.processingState === 'sending' && 'Sending audio...'}
                    {message.processingState === 'processing' && 'Processing audio...'}
                    {message.processingState === 'error' && 'Error processing audio'}
                    {message.processingState === 'complete' && 'Audio processed'}
                  </span>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
              )}
              <span className="text-xs opacity-75 block mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-tl-none flex items-center">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              <p>Processing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Recording status indicator */}
      {isRecording && (
        <div className="bg-red-50 text-red-500 p-2 text-center font-medium flex justify-center items-center">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500 mr-2 animate-pulse"></span>
          Recording... Press the stop button when finished.
        </div>
      )}
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendText} className="flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isProcessing || isRecording}
          />
          <button
            type="submit"
            className="bg-primary text-white p-2 rounded-r-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inputText.trim() || isProcessing || isRecording}
          >
            <Send size={20} />
          </button>
          
          {!isRecording ? (
            <button
              type="button"
              onClick={handleStartRecording}
              className="ml-2 bg-secondary text-white p-2 rounded-md hover:bg-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
              title="Record audio message"
            >
              <Mic size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopRecording}
              className="ml-2 bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
              title="Stop recording"
            >
              <StopCircle size={20} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}