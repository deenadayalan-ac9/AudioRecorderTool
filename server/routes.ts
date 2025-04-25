import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // The audio recording functionality is handled client-side
  // using the Web Audio API and doesn't require server endpoints
  // as the recording is downloaded directly by the browser

  const httpServer = createServer(app);

  return httpServer;
}
