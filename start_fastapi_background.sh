#!/bin/bash

# Kill any previously running servers using their PIDs (if they exist)
if [ -f fastapi_main.pid ]; then
  kill -9 $(cat fastapi_main.pid) 2>/dev/null || true
  rm fastapi_main.pid
fi

if [ -f fastapi_processor.pid ]; then
  kill -9 $(cat fastapi_processor.pid) 2>/dev/null || true
  rm fastapi_processor.pid
fi

# Start the main FastAPI server
cd server && python app.py > ../fastapi_main.log 2>&1 &
echo $! > ../fastapi_main.pid

# Start the audio processor FastAPI server
cd server && python fastapi_audio_processor.py > ../fastapi_processor.log 2>&1 &
echo $! > ../fastapi_processor.pid

echo "FastAPI servers started in background:"
echo "- Main server: http://0.0.0.0:8080"
echo "- Audio processor: http://0.0.0.0:8090"
echo "Logs available in fastapi_main.log and fastapi_processor.log"