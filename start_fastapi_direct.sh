#!/bin/bash

# Kill any existing FastAPI processes
echo "Stopping any existing FastAPI processes..."
pkill -f "python.*uvicorn" || true
sleep 1

# Make sure we're in the correct directory
cd "$(dirname "$0")"

# Check if the frontend needs to be built
if [ ! -d "client/dist" ] || [ -z "$(ls -A client/dist)" ]; then
    echo "Building frontend assets..."
    npm run build
fi

# Start FastAPI directly from server directory
echo "Starting FastAPI server on port 5000..."
cd server
exec python -m uvicorn app:app --host 0.0.0.0 --port 5000