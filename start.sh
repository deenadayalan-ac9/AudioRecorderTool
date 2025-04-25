#!/bin/bash

# Start the FastAPI servers
echo "Starting FastAPI servers..."
python server/app.py > fastapi_main.log 2>&1 &
MAIN_PID=$!
echo "Main FastAPI server started with PID: $MAIN_PID"

python server/fastapi_audio_processor.py > fastapi_processor.log 2>&1 &
PROCESSOR_PID=$!
echo "Audio processor started with PID: $PROCESSOR_PID"

# Start the Express server
echo "Starting Express server..."
npm run dev

# When Express server exits, kill the FastAPI servers
kill $MAIN_PID
kill $PROCESSOR_PID