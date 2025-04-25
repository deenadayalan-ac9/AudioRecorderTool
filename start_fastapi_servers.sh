#!/bin/bash

# Start the FastAPI servers in the background
echo "Starting FastAPI servers..."

# Main server
cd server && python app.py > ../fastapi_main.log 2>&1 &
echo $! > ../fastapi_main.pid
echo "Main server started on port 8080"

# Audio processor
cd server && python fastapi_audio_processor.py > ../fastapi_processor.log 2>&1 &
echo $! > ../fastapi_processor.pid
echo "Audio processor started on port 8090"

echo "FastAPI servers started successfully!"