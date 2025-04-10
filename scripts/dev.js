import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';

// Function to find an available port
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve);
    });
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
}

// Kill any processes using the specified port
async function killProcessOnPort(port) {
  try {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
      const lines = output.split('\n');
      
      lines.forEach(line => {
        const match = line.match(/\s+(\d+)$/);
        if (match) {
          const pid = match[1];
          try {
            console.log(`Killing process ${pid} using port ${port}`);
            execSync(`taskkill /F /PID ${pid}`);
          } catch (err) {
            // Ignore error if process was already killed
          }
        }
      });
    } else {
      // Linux/macOS
      try {
        execSync(`lsof -ti:${port} | xargs kill -9`, { encoding: 'utf-8' });
      } catch (err) {
        // Ignore error if no process was found
      }
    }
  } catch (err) {
    // Ignore errors, might mean no process is using the port
  }
}

// Main function to start the development server
async function startDevServer() {
  const MAX_RESTART_ATTEMPTS = 5;
  let restartCount = 0;
  const PORT = 5179; // Fixed port to avoid changing on restart
  
  // Kill any existing processes on this port
  await killProcessOnPort(PORT);
  
  // Function to start the server
  function startServer() {
    console.log(`Starting Vite server (attempt ${restartCount + 1}/${MAX_RESTART_ATTEMPTS})...`);
    
    // Start Vite with the port and watch mode
    const vite = spawn('npx', ['vite', '--port', PORT, '--host'], {
      stdio: 'inherit',
      shell: true
    });

    // Handle process exit
    vite.on('exit', (code, signal) => {
      if (code !== 0 && restartCount < MAX_RESTART_ATTEMPTS) {
        console.log(`Vite server exited with code ${code}. Restarting in 2 seconds...`);
        restartCount++;
        setTimeout(startServer, 2000); // Restart after 2 seconds
      } else if (code !== 0) {
        console.error(`Vite server failed to start after ${MAX_RESTART_ATTEMPTS} attempts.`);
        process.exit(1);
      }
    });

    // Handle errors
    vite.on('error', (err) => {
      console.error('Error running Vite:', err);
      if (restartCount < MAX_RESTART_ATTEMPTS) {
        console.log('Restarting Vite server...');
        restartCount++;
        setTimeout(startServer, 2000);
      } else {
        console.error(`Vite server failed to start after ${MAX_RESTART_ATTEMPTS} attempts.`);
        process.exit(1);
      }
    });

    // Handle process termination
    process.on('SIGINT', () => {
      vite.kill();
      process.exit();
    });
  }
  
  // Start the server
  startServer();
}

startDevServer(); 