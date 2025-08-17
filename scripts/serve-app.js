#!/usr/bin/env node

const { execSync } = require('child_process');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const { interactiveSelect, colors } = require('./interactive-select');

// Get all apps from the apps, tools, and websites directories
function getApps() {
  const apps = [];
  
  // Get apps from apps directory
  const appsDir = join(process.cwd(), 'apps');
  if (existsSync(appsDir)) {
    const appItems = readdirSync(appsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({ name: dirent.name, type: 'app', dir: 'apps' }))
      .filter(item => {
        const packagePath = join(appsDir, item.name, 'package.json');
        if (existsSync(packagePath)) {
          try {
            const pkg = require(packagePath);
            return pkg.scripts && (pkg.scripts.dev || pkg.scripts.serve);
          } catch (e) {
            return false;
          }
        }
        return false;
      });
    apps.push(...appItems);
  }
  
  // Get tools from tools directory
  const toolsDir = join(process.cwd(), 'tools');
  if (existsSync(toolsDir)) {
    const toolItems = readdirSync(toolsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({ name: dirent.name, type: 'tool', dir: 'tools' }))
      .filter(item => {
        const packagePath = join(toolsDir, item.name, 'package.json');
        if (existsSync(packagePath)) {
          try {
            const pkg = require(packagePath);
            return pkg.scripts && (pkg.scripts.dev || pkg.scripts.serve);
          } catch (e) {
            return false;
          }
        }
        return false;
      });
    apps.push(...toolItems);
  }
  
  // Get websites from websites directory
  const websitesDir = join(process.cwd(), 'websites');
  if (existsSync(websitesDir)) {
    const websiteItems = readdirSync(websitesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({ name: dirent.name, type: 'website', dir: 'websites' }))
      .filter(item => {
        const packagePath = join(websitesDir, item.name, 'package.json');
        if (existsSync(packagePath)) {
          try {
            const pkg = require(packagePath);
            return pkg.scripts && (pkg.scripts.dev || pkg.scripts.serve);
          } catch (e) {
            return false;
          }
        }
        return false;
      });
    apps.push(...websiteItems);
  }
  
  return apps.sort((a, b) => a.name.localeCompare(b.name));
}

// Get app info for display
function getAppInfo(app) {
  const packagePath = join(process.cwd(), app.dir || 'apps', app.name || app, 'package.json');
  try {
    const pkg = require(packagePath);
    const name = app.name || app;
    let displayName = name;
    if (app.type === 'tool') {
      displayName = `${name} (tool)`;
    } else if (app.type === 'website') {
      displayName = `${name} (website)`;
    }
    return {
      name: displayName,
      description: pkg.description || '',
      version: pkg.version || '0.0.0',
      type: app.type || 'app'
    };
  } catch (e) {
    const name = app.name || app;
    return {
      name: name,
      description: '',
      version: '0.0.0',
      type: app.type || 'app'
    };
  }
}

// Run the specified app
function runApp(app) {
  const appName = app.name || app;
  // For tools and websites, check package.json for the real name
  let packageName;
  if (app.type === 'tool' || app.type === 'website') {
    // Check the actual package.json for the real name
    const packagePath = join(process.cwd(), app.dir || app.type === 'tool' ? 'tools' : 'websites', appName, 'package.json');
    try {
      const pkg = require(packagePath);
      packageName = pkg.name;
    } catch (e) {
      // Fallback to adding @tiko prefix for tools
      packageName = app.type === 'tool' ? `@tiko/${appName}` : appName;
    }
  } else {
    packageName = appName;
  }
  
  console.log(`\n${colors.blue}🏃 Starting ${colors.green}${appName}${colors.blue}...${colors.reset}\n`);
  
  // Set terminal tab name
  process.stdout.write(`\x1b]0;Tiko - ${appName}\x07`);
  
  // Run the selected app
  try {
    // Clear any cached vite config files before running
    execSync(`find . -name "*.timestamp-*.mjs" -type f -delete 2>/dev/null || true`, { 
      stdio: 'ignore',
      cwd: process.cwd()
    });
    
    // Use nx serve for all projects
    execSync(`npx nx serve ${appName}`, { 
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
    const matchingApp = apps.find(app => {
      const appName = app.name || app;
      return appName.toLowerCase() === normalizedArg ||
        appName.toLowerCase().replace('-', '') === normalizedArg.replace('-', '') ||
        appName === appArg; // exact match
    });
    
    if (matchingApp) {
      runApp(matchingApp);
      return;
    } else {
      console.log(`${colors.red}❌ App "${appArg}" not found${colors.reset}`);
      console.log(`${colors.yellow}Available apps: ${apps.map(a => a.name || a).join(', ')}${colors.reset}`);
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
      value: app.name ? app : { name: app, type: 'app' }
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