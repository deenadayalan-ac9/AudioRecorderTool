import os
import shutil
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Audio Processing Service")

# Add CORS middleware to allow requests from the main server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Audio Processing Service is running"}

@app.post("/upload-audio")
async def process_audio(file: UploadFile = File(...)):
    """
    This endpoint processes the audio file forwarded from the main server.
    It could perform various audio analysis, manipulation, or AI processing.
    """
    try:
        # Create a unique filename
        filename = f"processed_{file.filename}"
        file_path = UPLOAD_DIR / filename
        
        print(f"Processing audio file: {filename}")
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Here you would add your audio processing logic
        # For example: speech-to-text, audio analysis, etc.
        processed_info = {
            "duration": "00:00:10",  # This would be calculated from the actual audio
            "format": "wav",
            "channels": 1,
            "sample_rate": 44100,
            # Add more audio analysis results here
        }
        
        return {
            "message": "Audio processed successfully",
            "filename": filename,
            "file_size": os.path.getsize(file_path),
            "audio_info": processed_info
        }
    
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        return {"error": f"Failed to process audio file: {str(e)}"}
    
    finally:
        # Close the file
        file.file.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_audio_processor:app", host="0.0.0.0", port=8090, reload=True)