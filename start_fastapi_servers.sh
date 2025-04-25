#!/bin/bash

# Start the main FastAPI server
cd server && python app.py &

# Start the audio processor FastAPI server
cd server && python fastapi_audio_processor.py &

# Wait for both servers to be ready
sleep 5

echo "FastAPI servers are running:"
echo "- Main server: http://0.0.0.0:8080"
echo "- Audio processor: http://0.0.0.0:8090"
echo ""
echo "Press Ctrl+C to stop the servers"

# Keep the script running
tail -f /dev/null