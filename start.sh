#!/bin/bash
# This script starts the FastAPI server

# Change to the server directory
cd "$(dirname "$0")"

# Kill any existing instances
pkill -f "uvicorn server.app:app" || true

# Start the FastAPI server
exec python -m uvicorn server.app:app --host 0.0.0.0 --port 5000 --reload