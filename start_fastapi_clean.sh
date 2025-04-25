#!/bin/bash

# Stop any existing Node.js or Express server
pkill -f "node\\|tsx" || true

# Kill any existing uvicorn processes
pkill -f "uvicorn" || true

# A brief pause to ensure ports are released
sleep 1

# Build the frontend assets if needed
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "Building frontend assets..."
    npm run build
fi

# Start the FastAPI server
echo "Starting FastAPI server on port 8080..."
cd "$(dirname "$0")"
exec python -m uvicorn server.app:app --host 0.0.0.0 --port 8080 --reload