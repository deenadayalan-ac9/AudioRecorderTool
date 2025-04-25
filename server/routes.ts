import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { log } from "./vite";

// Add type for multer request
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Create uploads directory if it doesn't exist
// Use import.meta.url instead of __dirname for ES modules
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({ dest: uploadDir });

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // API endpoint to forward the audio to FastAPI
  app.post('/api/audio', upload.single('audio'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      // Get FastAPI URL from environment or use default
      const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8080/api/audio';
      
      log(`Received audio file: ${req.file.filename}`);
      
      try {
        // Create form data to send to FastAPI
        const formData = new FormData();
        const fileStream = fs.createReadStream(req.file.path);
        // Important: The parameter name must match what FastAPI expects (audio)
        formData.append('audio', fileStream, { filename: req.file.originalname || req.file.filename });
        
        // Send to FastAPI
        const response = await axios.post(fastApiUrl, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
        
        // Return the FastAPI response
        res.status(200).json({ 
          message: 'Audio forwarded to FastAPI successfully',
          fastApiResponse: response.data 
        });
        
      } catch (error) {
        if (axios.isAxiosError(error)) {
          log(`Error forwarding to FastAPI: ${error.message}`);
          if (error.response) {
            return res.status(error.response.status).json({ 
              error: `FastAPI error: ${error.response.statusText}`,
              details: error.response.data
            });
          }
          return res.status(500).json({ error: `Network error: ${error.message}` });
        }
        throw error;
      }
      
    } catch (error) {
      log(`Server error processing audio: ${error}`);
      res.status(500).json({ error: 'Failed to process audio file' });
    } finally {
      // Optionally clean up the file after processing
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          log(`Error removing temp file: ${err}`);
        }
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
