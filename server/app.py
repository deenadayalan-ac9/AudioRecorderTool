import os
import shutil
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Audio Processing API")

# Add CORS middleware to allow requests from the client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """API endpoint for health check"""
    return {"status": "ok"}

@app.post("/api/audio")
async def upload_audio(audio: UploadFile = File(...)):
    """
    Endpoint for receiving audio files from the client.
    """
    if not audio:
        return {"error": "No audio file provided"}, 400
    
    try:
        # Create a unique filename
        filename = f"{audio.filename}"
        file_path = UPLOAD_DIR / filename
        
        print(f"Received audio file: {filename}")
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        
        # Process the audio file
        # This is where you would add your audio processing logic
        
        return {
            "message": "Audio received successfully",
            "filename": filename,
            "file_size": os.path.getsize(file_path)
        }
    
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        return {"error": f"Failed to process audio file: {str(e)}"}, 500
    
    finally:
        # Close the file
        audio.file.close()

# Serve static files
try:
    app.mount("/", StaticFiles(directory="./dist", html=True), name="static")
except:
    print("Warning: Static files directory not found. Only API will be available.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)