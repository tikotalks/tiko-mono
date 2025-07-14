#!/usr/bin/env node

const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');

// ANSI color codes for simple coloring
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

// Get all apps from the apps directory
function getApps() {
  const appsDir = join(process.cwd(), 'apps');
  const apps = readdirSync(appsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => {
      // Check if it has a package.json with a dev script
      const packagePath = join(appsDir, name, 'package.json');
      if (existsSync(packagePath)) {
        try {
          const pkg = require(packagePath);
          return pkg.scripts && (pkg.scripts.dev || pkg.scripts.serve);
        } catch (e) {
          return false;
        }
      }
      return false;
    })
    .sort();
  
  return apps;
}

// Get app info for display
function getAppInfo(appName) {
  const packagePath = join(process.cwd(), 'apps', appName, 'package.json');
  try {
    const pkg = require(packagePath);
    return {
      name: appName,
      description: pkg.description || 'No description',
      version: pkg.version || '0.0.0'
    };
  } catch (e) {
    return {
      name: appName,
      description: 'No description',
      version: '0.0.0'
    };
  }
}

// Simple prompt without external dependencies
async function selectApp(apps) {
  console.log(`${colors.blue}${colors.bright}\n🚀 Tiko App Launcher${colors.reset}\n`);
  console.log('Available apps:\n');
  
  apps.forEach((app, index) => {
    const info = getAppInfo(app);
    console.log(`  ${colors.bright}${index + 1})${colors.reset} ${colors.green}${info.name}${colors.reset} ${colors.gray}v${info.version} - ${info.description}${colors.reset}`);
  });
  
  console.log(`\n  ${colors.bright}0)${colors.reset} ${colors.red}Exit${colors.reset}`);
  
  return new Promise((resolve) => {
    process.stdout.write(`\n${colors.yellow}Select an app (0-${apps.length}): ${colors.reset}`);
    
    process.stdin.once('data', (data) => {
      const input = data.toString().trim();
      const choice = parseInt(input);
      
      if (choice === 0) {
        console.log(`${colors.yellow}\n👋 Goodbye!\n${colors.reset}`);
        process.exit(0);
      }
      
      if (choice >= 1 && choice <= apps.length) {
        resolve(apps[choice - 1]);
      } else {
        console.log(`${colors.red}\nInvalid choice. Please try again.${colors.reset}`);
        selectApp(apps).then(resolve);
      }
    });
  });
}

async function main() {
  const apps = getApps();
  
  if (apps.length === 0) {
    console.log(`${colors.red}No apps found with dev/serve scripts!${colors.reset}`);
    process.exit(1);
  }

  // Enable raw mode for stdin if in TTY
  const isTTY = process.stdin.isTTY;
  
  if (isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  const selectedApp = await selectApp(apps);
  
  // Disable raw mode
  if (isTTY) {
    process.stdin.setRawMode(false);
  }
  
  console.log(`\n${colors.blue}🏃 Starting ${colors.green}${selectedApp}${colors.blue}...${colors.reset}\n`);
  
  // Set terminal tab name
  process.stdout.write(`\x1b]0;Tiko - ${selectedApp}\x07`);
  
  // Run the selected app
  try {
    execSync(`pnpm --filter ${selectedApp} dev`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    if (error.status !== 130) { // 130 is Ctrl+C
      console.error(`${colors.red}\n❌ Error:${colors.reset}`, error.message);
      process.exit(1);
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(`${colors.yellow}\n\n👋 Shutting down...\n${colors.reset}`);
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error(`${colors.red}\n❌ Error:${colors.reset}`, error.message);
  process.exit(1);
});