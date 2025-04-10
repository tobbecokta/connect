// This script kills any process using port 5179
import { execSync } from 'child_process';

const PORT = 5179;

try {
  // Find PID using port on Windows
  const findCommand = `netstat -ano | findstr :${PORT}`;
  console.log(`Looking for processes using port ${PORT}...`);
  
  const output = execSync(findCommand, { encoding: 'utf8' });
  
  // Parse the output to get PIDs
  const lines = output.split('\n').filter(line => line.includes(`${PORT}`));
  
  if (lines.length === 0) {
    console.log(`No process is using port ${PORT}`);
    process.exit(0);
  }
  
  // Extract PIDs
  const pids = new Set();
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 5) {
      pids.add(parts[4]);
    }
  });
  
  // Kill each PID
  pids.forEach(pid => {
    try {
      console.log(`Killing process ${pid} using port ${PORT}...`);
      execSync(`taskkill /F /PID ${pid}`);
    } catch (error) {
      console.error(`Failed to kill process ${pid}: ${error.message}`);
    }
  });
  
  console.log(`Successfully killed processes using port ${PORT}`);
} catch (error) {
  // If the command fails or no process is found, just continue
  console.log(`No process found using port ${PORT} or error occurred: ${error.message}`);
} 