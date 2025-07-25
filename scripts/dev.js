#!/usr/bin/env node

const { execSync } = require('child_process');
const { colors } = require('./interactive-select');

// Get app name from command line
const appName = process.argv[2];

if (!appName) {
  console.error(`${colors.red}❌ Please specify an app name${colors.reset}`);
  console.log(`Usage: pnpm dev <app-name>`);
  process.exit(1);
}

console.log(`${colors.blue}🏗️  Building packages...${colors.reset}`);

try {
  // Build core and ui packages
  execSync('pnpm --filter @tiko/core build', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  execSync('pnpm --filter @tiko/ui build', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log(`${colors.green}✅ Packages built successfully${colors.reset}\n`);
  
  // Now run the serve script with the app name
  execSync(`pnpm run serve ${appName}`, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  if (error.status !== 130) { // 130 is Ctrl+C
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}