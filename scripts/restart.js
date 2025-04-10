// Script to kill any process on port 5179 and restart the Vite server
import { execSync, spawn } from 'child_process';

// Kill any processes using the port
function killProcessOnPort(port) {
  try {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows
      try {
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
      } catch (err) {
        // Ignore error if no process is found
        console.log(`No process found using port ${port}`);
      }
    } else {
      // Linux/macOS
      try {
        execSync(`lsof -ti:${port} | xargs kill -9`, { encoding: 'utf-8' });
        console.log(`Killed processes using port ${port}`);
      } catch (err) {
        console.log(`No process found using port ${port}`);
      }
    }
  } catch (err) {
    console.error('Error killing process:', err);
  }
}

// Function to start the server
function startServer(port) {
  console.log(`Starting Vite server on port ${port}...`);
  
  // Start Vite with the port and host flag
  const vite = spawn('npx', ['vite', '--port', port, '--host'], {
    stdio: 'inherit',
    shell: true
  });

  // Handle errors
  vite.on('error', (err) => {
    console.error('Failed to start Vite:', err);
    process.exit(1);
  });

  // Handle exit
  vite.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Vite exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    vite.kill();
    process.exit(0);
  });
}

// Main function
function main() {
  const PORT = 5179;
  console.log('Restarting Vite server...');
  
  // Kill any existing processes on this port
  killProcessOnPort(PORT);
  
  // Wait a moment for processes to be fully killed
  setTimeout(() => {
    // Start the server
    startServer(PORT);
  }, 1000);
}

main(); 