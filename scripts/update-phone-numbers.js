import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Compiling and running phone number update script...');

try {
  // Determine the path to the TypeScript script
  const scriptPath = path.resolve(__dirname, '../src/scripts/updatePhoneNumbers.ts');
  
  // Execute the script using ts-node
  console.log('Executing script...');
  execSync(`npx ts-node --esm ${scriptPath}`, { stdio: 'inherit' });
  
  console.log('Phone number update completed successfully!');
} catch (error) {
  console.error('Error running update script:', error.message);
  process.exit(1);
} 