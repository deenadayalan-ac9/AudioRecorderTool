#!/bin/bash

# Kill any existing uvicorn processes
pkill -f "uvicorn" || true

# Start the FastAPI server
python -m uvicorn server.app:app --host 0.0.0.0 --port 5000 --reload