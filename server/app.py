import os
import shutil
import time
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Define app
app = FastAPI(title="Audio Processing API")

# Add CORS middleware to allow requests from the client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create development environment variable
DEBUG = os.getenv("NODE_ENV", "development") == "development"

@app.get("/api/health")
async def health_check():
    """API endpoint for health check"""
    return {"status": "ok", "timestamp": time.time()}

@app.post("/api/audio")
async def upload_audio(audio: UploadFile = File(...)):
    """
    Endpoint for receiving audio files from the client.
    """
    if not audio:
        raise HTTPException(status_code=400, detail="No audio file provided")
    
    try:
        # Create a unique filename
        timestamp = int(time.time())
        original_filename = audio.filename or f"recording_{timestamp}.wav"
        # Ensure .wav extension
        if not original_filename.endswith('.wav'):
            original_filename = f"{original_filename.rsplit('.', 1)[0]}.wav"
            
        filename = f"{timestamp}_{original_filename}"
        file_path = UPLOAD_DIR / filename
        
        print(f"Received audio file: {filename}")
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        
        # Process the audio file
        # This is where you would add your audio processing logic
        
        # Forward to audio processor service if needed
        # For now, just return success
        return {
            "message": "Audio received successfully",
            "filename": filename,
            "file_size": os.path.getsize(file_path),
            "timestamp": timestamp
        }
    
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process audio file: {str(e)}")
    
    finally:
        # Close the file
        audio.file.close()

@app.get("/api/uploads/{filename}")
async def get_upload(filename: str):
    """Get a specific uploaded file"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

@app.get("/api/uploads")
async def list_uploads():
    """List all uploaded audio files"""
    files = []
    for file_path in UPLOAD_DIR.glob("*.wav"):
        files.append({
            "filename": file_path.name,
            "size": file_path.stat().st_size,
            "created": file_path.stat().st_ctime
        })
    return {"files": files}

# Middleware to serve React app for any non-API routes
@app.middleware("http")
async def serve_react_app(request: Request, call_next):
    response = await call_next(request)
    
    # If the request path doesn't start with /api and returns 404,
    # serve the index.html to support React routing
    if not request.url.path.startswith("/api") and response.status_code == 404:
        # Check if index.html exists
        index_path = Path("dist/index.html")
        if index_path.exists():
            with open(index_path) as f:
                content = f.read()
            return HTMLResponse(content=content)
    
    return response

# Serve static files
@app.on_event("startup")
async def startup_event():
    """Run build process when starting up if needed"""
    dist_dir = Path("dist")
    
    # Only build if dist directory doesn't exist or is empty
    if not dist_dir.exists() or not any(dist_dir.iterdir()):
        print("Building frontend assets...")
        try:
            # Run npm build command to create production build
            subprocess.run(["npm", "run", "build"], check=True)
            print("Frontend built successfully")
        except Exception as e:
            print(f"Error building frontend: {str(e)}")
    
    # Serve static files from the dist directory
    try:
        app.mount("/", StaticFiles(directory="dist", html=True), name="static")
        print("Static files mounted successfully")
    except Exception as e:
        print(f"Warning: Could not mount static files: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.app:app", host="0.0.0.0", port=8080, reload=True)