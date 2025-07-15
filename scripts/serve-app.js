#!/usr/bin/env node

const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const { interactiveSelect, colors } = require('./interactive-select');

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
      description: pkg.description || '',
      version: pkg.version || '0.0.0'
    };
  } catch (e) {
    return {
      name: appName,
      description: '',
      version: '0.0.0'
    };
  }
}

// Run the specified app
function runApp(appName) {
  console.log(`\n${colors.blue}🏃 Starting ${colors.green}${appName}${colors.blue}...${colors.reset}\n`);
  
  // Set terminal tab name
  process.stdout.write(`\x1b]0;Tiko - ${appName}\x07`);
  
  // Run the selected app
  try {
    execSync(`pnpm --filter ${appName} dev`, { 
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

async function main() {
  // Check if app name was provided as argument
  const appArg = process.argv[2];
  
  if (appArg) {
    // Direct serve mode
    const apps = getApps();
    
    // Find matching app (handle various formats)
    const normalizedArg = appArg.toLowerCase().replace('_', '-');
    const matchingApp = apps.find(app => 
      app.toLowerCase() === normalizedArg ||
      app.toLowerCase().replace('-', '') === normalizedArg.replace('-', '') ||
      app === appArg // exact match
    );
    
    if (matchingApp) {
      runApp(matchingApp);
      return;
    } else {
      console.log(`${colors.red}❌ App "${appArg}" not found${colors.reset}`);
      console.log(`${colors.yellow}Available apps: ${apps.join(', ')}${colors.reset}`);
      process.exit(1);
    }
  }
  
  // Interactive mode
  const apps = getApps();
  
  if (apps.length === 0) {
    console.log(`${colors.red}No apps found with dev/serve scripts!${colors.reset}`);
    process.exit(1);
  }

  // Prepare options for interactive selection
  const options = apps.map(app => {
    const info = getAppInfo(app);
    return {
      name: `${info.name} ${colors.gray}v${info.version}${colors.reset}`,
      description: info.description,
      value: app
    };
  });

  const selectedApp = await interactiveSelect('🚀 Select an app to serve:', options);
  runApp(selectedApp);
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