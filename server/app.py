import os
import json
import time
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse

# Initialize FastAPI app
app = FastAPI(title="Audio Processing Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Create uploads directory if it doesn't exist
uploads_dir = Path("uploads")
if not uploads_dir.exists():
    uploads_dir.mkdir(parents=True)

# API endpoints
@app.get("/")
async def root():
    """Root endpoint that redirects to API docs"""
    return RedirectResponse(url="/docs")

@app.get("/api/health")
async def health_check():
    """API endpoint for health check"""
    return {"status": "ok", "timestamp": time.time()}

@app.post("/api/audio")
async def process_audio(audio: UploadFile = File(...)):
    """
    Process uploaded audio file.
    This endpoint processes the audio file and returns a response.
    """
    try:
        # Generate a unique filename
        file_id = str(int(time.time() * 1000))
        file_extension = ".wav"
        filename = f"{file_id}{file_extension}"
        file_path = uploads_dir / filename
        
        # Save the file
        with open(file_path, "wb") as f:
            f.write(await audio.read())
        
        # Here you would typically process the audio with some AI or analysis tool
        # For now, we'll just return a simple response
        processed_text = "I received your audio message. This is where audio processing would happen."
        
        return {
            "status": "success",
            "filename": filename,
            "size": os.path.getsize(file_path),
            "response": processed_text
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.post("/api/text")
async def process_text(text: str = Query(...)):
    """
    Process text input.
    This endpoint processes the text string and returns a response.
    """
    try:
        # Here you would typically process the text with some AI or NLP model
        # For now, we'll just return a simple response based on the text
        
        text = text.lower()
        
        # Simple keyword detection for demo purposes
        if "hello" in text or "hi" in text:
            response = "Hello there! How can I help you today?"
        elif "how are you" in text:
            response = "I'm just a program, but I'm functioning well. Thanks for asking!"
        elif "bye" in text or "goodbye" in text:
            response = "Goodbye! Feel free to come back if you have more questions."
        elif "help" in text:
            response = "I can process your text and audio messages. Try recording an audio message or asking me a question!"
        elif "time" in text:
            response = f"The current server time is {time.strftime('%H:%M:%S')}"
        elif "thank" in text:
            response = "You're welcome!"
        else:
            response = "I received your message: '" + text + "'. How can I assist you further?"
        
        return {
            "status": "success",
            "response": response
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/api/uploads/{filename}")
async def get_upload(filename: str):
    """Get a specific uploaded file"""
    file_path = uploads_dir / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@app.get("/api/uploads")
async def list_uploads():
    """List all uploaded audio files"""
    files = []
    for file_path in uploads_dir.glob("*"):
        if file_path.is_file():
            files.append({
                "filename": file_path.name,
                "size": file_path.stat().st_size,
                "created": file_path.stat().st_ctime
            })
    return {"files": files}

# Handle serving the React app
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # If API request, it will be caught by the above routes
    # This is the catch-all for serving the React app
    
    # The path to the built React app
    client_build_dir = Path("client/dist")
    
    # Check if the path is to a file with extension (static asset)
    if "." in full_path:
        requested_file = client_build_dir / full_path
        if requested_file.exists():
            return FileResponse(requested_file)
    
    # Otherwise return the index.html for client-side routing
    return FileResponse(client_build_dir / "index.html")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Run at startup to ensure directories exist"""
    # Create uploads directory if it doesn't exist
    if not uploads_dir.exists():
        uploads_dir.mkdir(parents=True)
    
    print("FastAPI server started successfully")

# Run the server
if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)