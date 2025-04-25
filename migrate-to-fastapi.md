# Migration from Express.js to FastAPI

This document outlines the steps required to fully migrate the application from Express.js to FastAPI.

## Prerequisites

Ensure the following Python packages are installed:
- fastapi
- uvicorn
- python-multipart

These can be installed with:
```
pip install fastapi uvicorn python-multipart
```

## Migration Steps

### 1. Update package.json

Replace the current scripts in package.json with FastAPI-focused scripts:

```json
"scripts": {
  "dev": "./start_fastapi_direct.sh",
  "build": "vite build",
  "start": "cd server && python -m uvicorn app:app --host=0.0.0.0 --port=$PORT",
  "check": "tsc",
  "db:push": "drizzle-kit push --force --config=./drizzle.config.ts",
  "db:seed": "tsx db/seed.ts"
}
```

### 2. Create a FastAPI Direct Runner Script

Create a file named `start_fastapi_direct.sh` with the following content:

```bash
#!/bin/bash

# Kill any existing FastAPI processes
echo "Stopping any existing FastAPI processes..."
pkill -f "python.*uvicorn" || true
sleep 1

# Make sure we're in the correct directory
cd "$(dirname "$0")"

# Check if the frontend needs to be built
if [ ! -d "client/dist" ] || [ -z "$(ls -A client/dist)" ]; then
    echo "Building frontend assets..."
    npm run build
fi

# Start FastAPI directly from server directory
echo "Starting FastAPI server on port 5000..."
cd server
exec python -m uvicorn app:app --host 0.0.0.0 --port 5000
```

Make it executable:
```bash
chmod +x start_fastapi_direct.sh
```

### 3. Update Replit Workflow

Update the `.replit` file to use FastAPI directly:

```
[[workflows.workflow]]
name = "Start application"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "./start_fastapi_direct.sh"
waitForPort = 5000
```

### 4. Remove Express.js Dependencies

After confirming FastAPI works correctly, the following dependencies can be removed:
- express
- express-session
- connect-pg-simple
- passport
- passport-local
- multer
- http-proxy-middleware
- @types/express
- @types/express-session
- @types/passport
- @types/passport-local
- @types/multer

### 5. Remove Express Files

After the migration is complete, the following files are no longer needed:
- server/index.ts
- server/routes.ts
- server/vite.ts
- server/python-manager.ts

### 6. Final Cleanup

- Update API URLs in any frontend components to point directly to FastAPI endpoints
- Adjust any utility scripts that reference Express.js