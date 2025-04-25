import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function FastApiTest() {
  const [apiStatus, setApiStatus] = useState('Unknown');
  const [uploads, setUploads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Test direct connection to FastAPI 
  const testFastApiHealth = async () => {
    setLoading(true);
    try {
      // Try direct connection to FastAPI server
      const response = await fetch('/api/health');
      const data = await response.json();
      setApiStatus(data.status === 'ok' ? 'Connected' : 'Error');
      toast({
        title: 'FastAPI Connection Test',
        description: `Status: ${data.status || 'error'}`,
        variant: data.status === 'ok' ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('FastAPI connection error:', error);
      setApiStatus('Failed to connect');
      toast({
        title: 'FastAPI Connection Failed',
        description: 'Could not connect to FastAPI server directly.',
        variant: 'destructive',
      });
      
      // Fallback to Express proxy
      try {
        const fallbackResponse = await fetch('/api/health');
        const fallbackData = await fallbackResponse.json();
        setApiStatus(`Express Fallback: ${fallbackData.status || 'unknown'}`);
        toast({
          title: 'Express Fallback',
          description: `Status via Express: ${fallbackData.status || 'unknown'}`,
          variant: 'default',
        });
      } catch (fallbackError) {
        console.error('Express fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get list of uploads from API
  const getUploads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/uploads');
      if (response.ok) {
        const data = await response.json();
        setUploads(data || []);
        toast({
          title: 'Uploads Retrieved',
          description: `Found ${data.length} uploads`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Failed to Get Uploads',
          description: `Server returned ${response.status}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to get uploads:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch uploads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle>FastAPI Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Current API Status:</p>
          <div className={`px-3 py-2 rounded-md ${
            apiStatus === 'Connected' ? 'bg-green-100 text-green-800' : 
            apiStatus === 'Unknown' ? 'bg-gray-100 text-gray-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {apiStatus}
          </div>
        </div>

        {uploads.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-1">Uploaded Files:</p>
            <ul className="text-sm space-y-1">
              {uploads.map((filename, index) => (
                <li key={index} className="bg-gray-50 px-2 py-1 rounded">
                  {filename}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex space-x-2">
        <Button 
          onClick={testFastApiHealth} 
          disabled={loading}
          variant="default"
        >
          Test FastAPI Connection
        </Button>
        <Button 
          onClick={getUploads} 
          disabled={loading}
          variant="outline"
        >
          Get Uploads
        </Button>
      </CardFooter>
    </Card>
  );
}