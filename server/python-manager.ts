import { exec, spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { log } from './vite';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const SERVER_DIR = __dirname;

let pythonProcess: any = null;

export function startPythonServer() {
  if (pythonProcess) {
    log('Python FastAPI server is already running', 'python-manager');
    return;
  }

  log('Starting Python FastAPI server...', 'python-manager');
  
  try {
    // Start the FastAPI server as a child process
    pythonProcess = spawn('python', [join(SERVER_DIR, 'app.py')], {
      cwd: SERVER_DIR,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Log output
    pythonProcess.stdout.on('data', (data: Buffer) => {
      log(`FastAPI: ${data.toString().trim()}`, 'python-manager');
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      log(`FastAPI ERR: ${data.toString().trim()}`, 'python-manager');
    });

    pythonProcess.on('close', (code: number) => {
      log(`FastAPI server exited with code ${code}`, 'python-manager');
      pythonProcess = null;
    });

    log('Python FastAPI server started successfully', 'python-manager');
  } catch (error) {
    log(`Failed to start Python FastAPI server: ${error}`, 'python-manager');
    pythonProcess = null;
  }
}

export function stopPythonServer() {
  if (pythonProcess) {
    log('Stopping Python FastAPI server...', 'python-manager');
    pythonProcess.kill();
    pythonProcess = null;
    log('Python FastAPI server stopped', 'python-manager');
  }
}

// Handle process exit
process.on('exit', () => {
  stopPythonServer();
});

process.on('SIGINT', () => {
  stopPythonServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopPythonServer();
  process.exit(0);
});