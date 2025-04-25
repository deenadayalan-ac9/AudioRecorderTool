#!/bin/bash

# Run the FastAPI services from Procfile
python server/app.py > fastapi_main.log 2>&1 &
MAIN_PID=$!
echo "FastAPI main server running on port 8080 with PID $MAIN_PID"

python server/fastapi_audio_processor.py > fastapi_processor.log 2>&1 &
PROCESSOR_PID=$!
echo "FastAPI audio processor running on port 8090 with PID $PROCESSOR_PID"

# Store the PIDs to a file for later cleanup
echo "$MAIN_PID $PROCESSOR_PID" > fastapi.pid

echo "FastAPI servers are running in the background"
echo "Check logs in fastapi_main.log and fastapi_processor.log"