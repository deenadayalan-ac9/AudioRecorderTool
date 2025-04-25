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

@app.post("/api/audio")
async def process_audio(audio: UploadFile = File(...)):
    """
    This endpoint processes the audio file forwarded from the main server.
    It could perform various audio analysis, manipulation, or AI processing.
    """
    bytes = await audio.read()
    import requests
    res = requests.post("http://localhost:8888/inference", files={"file": bytes}, data={
        "temperature": "0.0", 
        "temperature_inc": "0.2", 
        "response_format": "json",
    })
    text = res.json()["text"]
    print(text)

from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="AudioRecorderTool/dist/public/", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_audio_processor:app", host="0.0.0.0", port=8090, reload=True)