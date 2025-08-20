const { exec } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'scripts/generate-app-icons-node.js');

console.log('Running icon generation for cards app...');
console.log('Script path:', scriptPath);
console.log('Working directory:', __dirname);

exec(`node "${scriptPath}" cards`, { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
  }
  if (stderr) {
    console.error('Stderr:', stderr);
  }
  if (stdout) {
    console.log('Output:', stdout);
  }
});