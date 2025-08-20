const fs = require('fs');
const path = require('path');

// Just test if we can read the config
const configPath = path.join(__dirname, 'apps/cards/tiko.config.ts');
console.log('Checking config at:', configPath);

if (fs.existsSync(configPath)) {
  const content = fs.readFileSync(configPath, 'utf-8');
  console.log('Config exists!');
  
  const appIconMatch = content.match(/appIcon:\s*['"]([^'"]+)['"]/);
  const primaryColorMatch = content.match(/primary:\s*['"]([^'"]+)['"]/);
  
  console.log('App Icon:', appIconMatch ? appIconMatch[1] : 'not found');
  console.log('Primary Color:', primaryColorMatch ? primaryColorMatch[1] : 'not found');
} else {
  console.log('Config not found');
}